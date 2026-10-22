import "server-only";

import { createClient } from "@/lib/supabase/server";

export type MemberRow = {
  user_id: string;
  email: string;
  role: "owner" | "member";
  joined_at: string;
};

export type ReviewRecipe = { id: string; title: string; updatedAt: string };

/** Everyone with access, oldest first. Owner RLS returns all rows; a member sees only self. */
export async function listMembers(): Promise<MemberRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, email, role, joined_at")
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return data as MemberRow[];
}

/** One person with access, or null when the id has no membership visible to the caller. */
export async function getMember(userId: string): Promise<MemberRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, email, role, joined_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as MemberRow | null;
}

/**
 * Recipes the member originally created, including ones others edited later (D-21).
 * Creator metadata is owner-only under RLS, and this removal review is the only place
 * in the app that reads it (D-10).
 */
export async function listMemberRecipesForReview(memberId: string): Promise<ReviewRecipe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipe_creators")
    .select("recipes(id, title, updated_at)")
    .eq("created_by", memberId);
  if (error) throw error;

  const rows = data as unknown as {
    recipes: { id: string; title: string; updated_at: string } | null;
  }[];
  return rows
    .flatMap((row) => (row.recipes ? [row.recipes] : []))
    .map((recipe) => ({ id: recipe.id, title: recipe.title, updatedAt: recipe.updated_at }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
