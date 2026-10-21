import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set (expected in .env.local)`);
  }
  return value;
}

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

export function adminClient(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    clientOptions,
  );
}

export function anonClient(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    clientOptions,
  );
}

export async function listAllUsers(admin: SupabaseClient = adminClient()): Promise<User[]> {
  const users: User[] = [];
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) return users;
  }
}

/** Throws unless resets are explicitly enabled and the configured project is the DEV project. */
export function assertDevDatabase(): void {
  if (process.env.ALLOW_TEST_DB_RESET !== "true") {
    throw new Error("Refusing to reset: ALLOW_TEST_DB_RESET is not 'true'");
  }
  const devRef = requireEnv("SUPABASE_DEV_PROJECT_REF");
  const host = new URL(requireEnv("NEXT_PUBLIC_SUPABASE_URL")).hostname;
  if (!host.startsWith(devRef)) {
    throw new Error("Refusing to reset: NEXT_PUBLIC_SUPABASE_URL is not the DEV project");
  }
}

/** Wipes all cookbook data (cascades from public.cookbooks) and every auth user on DEV. */
export async function resetDatabase(): Promise<void> {
  assertDevDatabase();
  const admin = adminClient();

  const { error } = await admin.from("cookbooks").delete().not("id", "is", null);
  if (error) throw error;

  for (const user of await listAllUsers(admin)) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
  }
}

export type TestRole = "owner" | "member" | "none";

export async function createTestUser({
  email,
  password,
  role,
  locale = "pt",
}: {
  email: string;
  password: string;
  role: TestRole;
  locale?: "pt" | "en";
}): Promise<User> {
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const user = data.user;

  if (role === "owner") {
    const { error: claimError } = await admin.rpc("claim_owner", {
      p_user_id: user.id,
      p_email: email,
      p_locale: locale,
    });
    if (claimError) throw claimError;
  } else if (role === "member") {
    const { data: cookbook, error: cookbookError } = await admin
      .from("cookbooks")
      .select("id")
      .single();
    if (cookbookError) throw cookbookError;
    const { error: memberError } = await admin.from("memberships").insert({
      user_id: user.id,
      cookbook_id: cookbook.id,
      role: "member",
      email,
      locale,
    });
    if (memberError) throw memberError;
  }

  return user;
}

export async function userClient(email: string, password: string): Promise<SupabaseClient> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}
