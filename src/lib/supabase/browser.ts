import { createBrowserClient } from "@supabase/ssr";

/** Browser client with the signed-in member's session; only the public project values are used. */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
