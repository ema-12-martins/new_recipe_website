---
status: verifying
trigger: "Invite links demand sign-out when another account is open, then appear invalid even after signing out."
created: 2026-10-23
updated: 2026-10-23
---

# Invite link access

## Scope and symptoms

- Phase 1 invitation creation and guided join (AUTH-02/AUTH-03).
- Expected: Create a new invited email account while an existing session remains
  open, including from another tab; a fresh unused invite must work signed out.
- Actual: The join page blocks signed-in visitors and then reports an invalid link.
- Reported after manual testing of the deployed DEV-backed app.
- No exact failing URL or browser error was supplied; do not record raw tokens.
- Production separation and physical-device UAT remain existing phase blockers.

## Current Focus

hypothesis: Vercel's SUPABASE_SECRET_KEY is set but rejected by the DEV project (publishable key pasted as secret -> 42501, or a stale/rotated/other-project key -> "Invalid API key").
test: Read the "Invite availability lookup failed." log line (code/status) in Vercel runtime logs, correct SUPABASE_SECRET_KEY, redeploy, retry a fresh link.
expecting: After correcting the key, a fresh link shows the email form both signed out and signed in.
next_action: Operator opens Vercel > Settings > Environment Variables, replaces Production SUPABASE_SECRET_KEY with the DEV project's sb_secret_ key (no quotes), redeploys, then re-runs the well-formed-token live probe.

## Evidence

- JoinPage hides the form whenever getUser returns a user.
- joinAction independently rejects signed-in users.
- getInviteState collapses database lookup failures into the invalid state.
- Recent DEV invite metadata includes an active, unused, unexpired invite.
- Independently created a temporary invite through the existing test owner's
  user-scoped client. The admin lookup found it usable, while the deployed
  signed-out join page returned HTTP 200 with the invalid-link message and no
  email field. Deleted only that probe invite and signed out only its own
  session. This proves a live-only rejection, but does not establish the precise
  deployed backend/configuration failure.
- Added regression tests before the fix: three failed, proving the signed-in
  restriction, collapsed lookup errors, and unchecked session outages.
- After the fix, 17 targeted unit tests passed; modified TypeScript/TSX passed
  ESLint, TypeScript checking, and a production build. Client-bundle secret scan
  passed (23 files).
- Four Playwright checks passed against the local production build: the
  second-tab registration/session-preservation scenario and the
  signed-in-view -> sign-out -> redeem scenario, on desktop and phone Chromium.
  The invited account could sign in separately, and a used invite stayed invalid.
- Browser checks used an isolated session config with no setup project and no
  database reset. Only test accounts/invites carrying a unique probe marker were
  cleaned up; the owner's account, existing invites, and recipes were preserved.
- No subagent or ask-user tools are available in this runtime; investigate directly
  and use plain-text questions for any necessary user decisions.
- 2026-10-23 re-report: operator screenshot of the join page still shows the old
  "Termine a sessão para usar este convite." copy with a Sair button. That string
  no longer exists in the working tree (now "Pode criar outra conta aqui sem
  alterar a sessão atual."), confirming the tested app runs pre-fix code. Fix is
  still uncommitted. Re-ran targeted checks on the working tree: 8/8 unit tests in
  join-action/invite-state pass, tsc --noEmit clean, ESLint clean on join files.

- 2026-10-23: Re-ran targeted checks (58/58 unit, tsc, eslint, next build all
  pass) and shipped the fix as 27a5ce0; Vercel reported the deployment complete.
- 2026-10-23 live probe (signed out): inserted a temporary DEV invite via the
  local admin client, fetched its live join page: HTTP 200, no email field,
  "unavailable" message shown (not "invalid"). Probe invite deleted afterwards.
  So the deployed admin lookup returns an error, while the same query with the
  local DEV secret succeeds.
- A missing SUPABASE_SECRET_KEY would throw in createAdminClient (500 page), so
  the Vercel value is present but rejected. Local reproduction against DEV:
  publishable key -> 401 / 42501 permission denied; garbage sb_secret_ key ->
  401 "Invalid API key". A Vercel URL pointing at another project would give
  "invalid" (no row), not an error. Root cause is a wrong secret key on Vercel.
- Redeem (redeem_invite RPC) and auth.admin.createUser also use this key, so a
  code-only workaround cannot make joining work.

- 2026-10-23 08:35 re-probe after user chose "debug further": deployed app runs
  27a5ce0 (new copy). A temporary DEV invite (deleted afterwards) still gave HTTP 200
  with no email/password field on /pt and /en. A random, never-issued token returns
  "We could not check this invite right now" (unavailable) instead of "invalid", which
  only happens when the admin lookup errors. So Vercel's SUPABASE_SECRET_KEY is still
  not corrected/redeployed. No Vercel CLI or project link exists locally, so the
  variable cannot be changed from here.

- 2026-10-23 11:35 re-report with screenshots: owner creates a link in one tab,
  opens it in a second tab and sees "Não foi possível verificar este convite agora".
  Two tabs are not the cause: a well-formed, never-issued 43-char token also shows
  "unavailable" signed out. (A malformed probe token shows "invalid" without any
  query, so earlier probes must use the real token format.)
- Local `.env.local` stores SUPABASE_SECRET_KEY wrapped in double quotes (the only
  quoted value). Next.js strips them locally, but a hosting dashboard stores pasted
  values literally. Reproduced against DEV: unquoted key -> 200; key with literal
  quotes -> 401 "Invalid API key"; trailing space/newline -> 200. This matches the
  live-only lookup failure while the same key works locally.
- Fix: createAdminClient trims whitespace and one matching pair of surrounding
  quotes from SUPABASE_SECRET_KEY. Regression test tests/unit/supabase-admin.test.ts
  failed 5/6 before the fix; after it, 86/86 unit tests, tsc and ESLint pass.
- 2026-10-23 11:37 shipped as 873651e; GitHub shows "Vercel: Deployment has
  completed" at 10:37:31Z. Polling the live join page with fresh well-formed tokens
  until 11:43 still returns "unavailable". ELIMINATED: literal quotes are not (or not
  the only) problem. The hardening is kept as harmless. A fresh deployment reads the
  current Vercel variables, so the Production SUPABASE_SECRET_KEY is still a value
  the DEV project rejects (other project, publishable key, rotated/revoked key, or
  scoped only to Preview/Development).

## Resolution

root_cause: (1) Signed-in visitors were explicitly blocked by both the join page and server action (fixed in 27a5ce0, deployed). (2) On Vercel, SUPABASE_SECRET_KEY is present but rejected by the DEV project, so every invite lookup/redeem fails; previously this was mislabelled "invalid link". Requires an operator environment fix.
fix: Allow bearer-invite registration while signed in, preserving the current browser session and explaining how to use the new account separately. Keep signed-out auto-login. Distinguish unavailable validation from invalid links, provide retry, and log only backend status/code (never raw tokens or credentials). Update Portuguese/English copy, regression tests, and README guidance.
verification: Local production build and targeted unit/browser checks pass; code fix is deployed (27a5ce0). Live invite flow remains blocked until the Vercel secret is corrected and redeployed.

## Checkpoint

Code fix committed and deployed as 27a5ce0. Waiting on the operator to correct
Vercel's SUPABASE_SECRET_KEY, redeploy, and retry a fresh link. If it remains unavailable, inspect Vercel runtime logs for
the new diagnostic and verify the server-only Supabase secret belongs to the
same project as the public URL/key. Only request status/code, never key values.
The requested signed-in account-creation behavior intentionally replaces the
previous sign-out-first UX; separate identities in normal browser tabs remain
unsupported because those tabs share authentication cookies.
