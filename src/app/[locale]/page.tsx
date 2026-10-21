import { notFound, redirect } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getCurrentMembership } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";

/** Entry point: setup while no cookbook exists, the cookbook for members, sign-in for everyone else (D-06). */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const supabase = await createClient();
  const { data: cookbookExists } = await supabase.rpc("cookbook_exists");
  if (cookbookExists === false) redirect(`/${locale}/setup`);

  if (await getCurrentMembership()) redirect(`/${locale}/recipes`);

  redirect(`/${locale}/sign-in`);
}
