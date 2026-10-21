# API Coverage — Supabase (Auth, PostgREST/RPC, CLI) and Vercel

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Replaces the stale Expo-era coverage file (2026-10-21 replan; plans 01-09..01-18, revised after plan check iterations 1 and 2; capability decisions unchanged in iteration 2 — auth getUser/session refresh now also classifies an unreachable Supabase as "unavailable" rather than "no membership"). Supabase is called only from server code; no browser Supabase client is created in Phase 1.

| capability | decision | reason |
|---|---|---|
| supabase-auth-sign-in-with-password | INTEGRATE | |
| supabase-auth-sign-out | INTEGRATE | |
| supabase-auth-session-refresh-get-user | INTEGRATE | |
| supabase-auth-admin-create-user | INTEGRATE | |
| supabase-auth-admin-delete-user | INTEGRATE | |
| supabase-auth-public-sign-up | OPT-OUT | explicitly out of scope — public sign-ups disabled; accounts are created only by the server for owner setup or a valid invite (D-06, D-29) |
| supabase-auth-reset-password-for-email | OPT-OUT | explicitly out of scope — no emails and no in-app password reset in v1 (D-29, D-31, D-32) |
| supabase-auth-otp-magic-link | OPT-OUT | explicitly out of scope — no emails in v1 (D-29) |
| supabase-auth-admin-invite-user-by-email | OPT-OUT | explicitly out of scope — invitations are owner-shared one-time links (D-29) |
| supabase-auth-email-verification | OPT-OUT | explicitly out of scope — email is an unverified login identifier; enabling later stays possible (D-30) |
| supabase-auth-update-user | OPT-OUT | not needed yet — no account self-service in v1 (D-31, D-39, D-40) |
| supabase-auth-oauth-sso | OPT-OUT | explicitly out of scope — email + password only (D-30) |
| supabase-auth-mfa | OPT-OUT | not needed yet — family app at ASVS L1 |
| supabase-postgrest-select-insert-update | INTEGRATE | |
| supabase-postgrest-delete | OPT-OUT | explicitly out of scope — no client deletes; recipe removal only through the owner's member-removal RPC (D-10, D-15) |
| supabase-rpc-functions | INTEGRATE | |
| supabase-row-level-security | INTEGRATE | |
| supabase-storage | OPT-OUT | not needed yet — source photos arrive in Phase 2 (D-14, D-28) |
| supabase-realtime | OPT-OUT | explicitly out of scope — no live co-editing in v1 |
| supabase-edge-functions | OPT-OUT | not needed — server logic runs in Next.js server actions on Vercel |
| supabase-cli-db-push-migration-list | INTEGRATE | |
| supabase-management-api-type-generation | OPT-OUT | not needed — zod validation at data boundaries instead of generated types |
| vercel-git-auto-deploy | INTEGRATE | |
| vercel-environment-variables | INTEGRATE | |
| vercel-function-region | INTEGRATE | |
| vercel-cron | OPT-OUT | explicitly out of scope — no keep-alive for the free-tier pause (D-34) |
| vercel-custom-domain | OPT-OUT | not needed yet — free vercel.app address for now (D-36) |
| vercel-cli-rest-api | OPT-OUT | not needed — dashboard plus Git integration cover deployment (D-33) |
