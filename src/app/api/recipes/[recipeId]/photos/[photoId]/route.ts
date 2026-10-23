import { z } from "zod";

import { getCurrentMembership } from "@/lib/auth/membership";
import { PHOTO_BUCKET } from "@/lib/photos/limits";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const idSchema = z.uuid();

const notFound = () =>
  new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

/**
 * Serves one recipe photo to a signed-in member of the cookbook. Access is decided by the
 * member's own session (membership and the photo row are read under RLS); only then is the file
 * fetched with the service role, because members have no direct read access to the bucket. The
 * bucket stays private and no URL works without a session (D-24).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recipeId: string; photoId: string }> },
) {
  const { recipeId, photoId } = await params;
  if (!idSchema.safeParse(recipeId).success || !idSchema.safeParse(photoId).success) {
    return notFound();
  }

  const membership = await getCurrentMembership();
  if (!membership) {
    return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("recipe_photos")
    .select("object_path")
    .eq("id", photoId)
    .eq("recipe_id", recipeId)
    .maybeSingle();
  if (error) return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!row) return notFound();

  const { data: file, error: downloadError } = await createAdminClient()
    .storage.from(PHOTO_BUCKET)
    .download(row.object_path);
  if (downloadError || !file) return notFound();

  return new Response(await file.arrayBuffer(), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  });
}
