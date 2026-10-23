import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Hosting dashboards store values literally, so a key copied from a dotenv file can keep
 * its quotes; Supabase then rejects it as "Invalid API key".
 */
function readSecret(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  const unquoted = trimmed?.match(/^(["'])(.*)\1$/)?.[2] ?? trimmed;
  return unquoted?.trim() || undefined;
}

/**
 * Service-role client. Bypasses RLS: use only for auth admin operations and
 * service-role-only RPCs, never for ordinary member data access.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = readSecret(process.env.SUPABASE_SECRET_KEY);
  if (!url || !secret) {
    throw new Error("Supabase admin client is not configured");
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
