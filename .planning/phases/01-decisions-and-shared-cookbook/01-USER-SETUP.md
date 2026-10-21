# Phase 1 — User Setup Required

**Status:** DEV complete (verified 2026-10-21); PRODUCTION deferred by user decision — needed before Plan 01-17's production deploy.

## Supabase (D-28, D-29, D-30, D-35)

Two free-plan projects in an EU region (e.g. Frankfurt `eu-central-1`): **DEV** (development + tests; tests reset it) and **PRODUCTION** (deployed app; never touched by tests). This uses the free tier's two-active-project allowance.

### Dashboard checklist (do in BOTH projects)

DEV: all items done and verified live via `GET /auth/v1/settings` (`disable_signup=true`, `mailer_autoconfirm=true`), which the data-boundary test now checks on every run. PRODUCTION: not yet created/configured; `SUPABASE_PROD_DB_URL` is empty in `.env.local`.

- [ ] Project created in an EU region
- [ ] Authentication → Sign In / Providers → Email: **Allow new users to sign up = OFF**
- [ ] **Confirm email = OFF**
- [ ] Minimum password length = **8**
- [ ] No SMTP / email provider configured

### `.env.local` (repo root, git-ignored — never commit or share values)

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | DEV → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | DEV → Project Settings → API Keys → publishable key (legacy `anon` also works) |
| `SUPABASE_SECRET_KEY` | DEV → API Keys → secret key (legacy `service_role` also works). **Server only — never `NEXT_PUBLIC_`.** |
| `SUPABASE_DEV_PROJECT_REF` | DEV project reference id (subdomain of the project URL) |
| `SUPABASE_DEV_DB_URL` | DEV → Connect → Session pooler connection string (IPv4), password filled in |
| `SUPABASE_PROD_DB_URL` | PRODUCTION → Connect → Session pooler connection string, password filled in |
| `OWNER_SETUP_CODE` | A long random code (20+ chars) you invent; use a **different** one in Vercel Production (Plan 01-17) |
| `ALLOW_TEST_DB_RESET` | `true` (in `.env.local` only) |

### Verification (run by the executor on resume — names only, never values)

- `.env.local` defines all eight names
- The hostname of `NEXT_PUBLIC_SUPABASE_URL` starts with `SUPABASE_DEV_PROJECT_REF`
- `git ls-files .env.local` prints nothing
- Plan 01-15's data-boundary integration test proves public sign-up is refused

## Vercel (Plan 01-17)

Added when Plan 01-17 is reached.
