---
phase: 01-decisions-and-shared-cookbook
plan: 12
subsystem: auth
tags: [supabase, auth, invites, rls, security-definer, nextjs, server-actions, playwright]

requires:
  - 01-15 (cookbooks/memberships boundary, is_owner(), current_cookbook_id(), test helpers)
  - 01-16 (createUser + rpc + compensating deleteUser pattern, owner storageState for e2e)
  - 01-17 (live Vercel deploy, check:secrets, test:e2e:prod ship loop)
  - 01-10 (recipe pages and hydration-guarded forms)
  - 01-11 (sign-in, AppHeader, LanguageSwitcher, per-device sign-out)
provides:
  - public.invites table (hashed tokens, 7-day expiry, used/revoked markers, owner-only select/insert RLS)
  - public.redeem_invite(text, uuid, text, text) — service_role only, atomic single-use redemption + member membership
  - public.revoke_invite(uuid) — owner only, idempotent, unused invites only
  - generateInviteToken / hashInviteToken / isInviteTokenFormat (src/lib/invites/token.ts)
  - joinSchema / createInviteSchema (src/lib/invites/schemas.ts)
  - redeemInvite / getInviteState (src/lib/invites/redeem.ts)
  - /{locale}/members owner page (create invite, link shown once, invite list with status and Revoke, people with access)
  - createInviteAction / revokeInviteAction (members/actions.ts)
  - /{locale}/join/{token} guided join (joinAction, signOutForInviteAction)
  - owner-only Members link in AppHeader
affects: [01-13, 01-19, 01-14, 01-18]

actuals:
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Single-use secrets: store only SHA-256 of a 256-bit base64url token; look up by hash; return the plain value once in action state"
    - "Race-safe consume: one conditional UPDATE ... WHERE used_at IS NULL ... RETURNING inside a security-definer function; the caller compensates (deleteUser) when it raises"
    - "Owner-only mutations on rows without client update policies go through narrow security-definer RPCs that check is_owner()"
    - "Absolute links built server-side from x-forwarded-host / x-forwarded-proto (http only for localhost)"

key-files:
  created:
    - supabase/migrations/20261021120300_invites.sql
    - src/lib/invites/token.ts
    - src/lib/invites/schemas.ts
    - src/lib/invites/redeem.ts
    - src/app/[locale]/(app)/members/page.tsx
    - src/app/[locale]/(app)/members/actions.ts
    - src/app/[locale]/join/[token]/page.tsx
    - src/app/[locale]/join/[token]/actions.ts
    - src/components/create-invite-form.tsx
    - src/components/invite-link-panel.tsx
    - src/components/join-form.tsx
    - src/components/revoke-invite-button.tsx
    - tests/unit/invite-token.test.ts
    - tests/integration/invites.test.ts
    - tests/e2e/invites.spec.ts
  modified:
    - src/components/app-header.tsx
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json

key-decisions:
  - "Invite tokens are 32 random bytes as base64url (43 chars); only SHA-256 hex is stored; malformed tokens are rejected before any database call."
  - "redeemInvite checks the invite is usable before creating the auth user, so dead links never create orphaned accounts; redeem_invite stays the authority and a losing race deletes the user it created."
  - "revoke_invite only touches unused invites of the owner's cookbook and keeps the first revoked_at (coalesce), so repeats change nothing."
  - "The link scheme comes from x-forwarded-proto, falling back to http only for localhost; the plan's hard-coded https would have broken local e2e."
  - "A signed-in visitor on a join link signs out through signOutForInviteAction, which returns to the same invite instead of the sign-in page, so the person does not lose the link."
  - "joinAction also refuses to join while any session exists on the device (server-side backstop to the page check)."
  - "Invite statuses are computed in a data loader outside render (React purity lint rule)."
  - "Ship loop used db:push:dev/db:status:dev instead of db:*:prod, following the 01-17 user decision."

patterns-established:
  - "Owner-only pages call notFound() for members, after the usual membership redirect for signed-out visitors"

requirements-completed: [AUTH-02, AUTH-03]

coverage:
  - id: D1
    description: "The owner opens Members, creates an invite link with an optional label and sees the full link once with a copy button; a relative opens it, creates an account and lands signed in on the shared cookbook"
    requirement: AUTH-02
    verification:
      - kind: e2e
        ref: "tests/e2e/invites.spec.ts#the owner shares an invite link and a relative joins, adds and edits recipes (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D2
    description: "An invited member views the owner's recipes, adds a recipe and edits one of the owner's recipes"
    requirement: AUTH-03
    verification:
      - kind: e2e
        ref: "tests/e2e/invites.spec.ts#the owner shares an invite link and a relative joins, adds and edits recipes (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Invites are single use, expire after 7 days, can be revoked (idempotently), and two concurrent redemptions yield exactly one membership with the loser's email freed"
    requirement: AUTH-02
    verification:
      - kind: integration
        ref: "tests/integration/invites.test.ts (twice, concurrent, expired, revoked + repeat, used not revocable, malformed/unknown token, email_taken)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/invites.spec.ts#the owner revokes an active invite and its link stops working (4 viewport projects)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/invites.spec.ts#a used invite link shows the no-longer-valid message (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Only the owner can see Members and create, list or revoke invites; redeem_invite is callable by the service role only"
    requirement: AUTH-02
    verification:
      - kind: integration
        ref: "tests/integration/invites.test.ts#gives a member/none user no invite data and no way to create or revoke invites; lets only the service role call redeem_invite"
        status: pass
      - kind: e2e
        ref: "tests/e2e/invites.spec.ts#a member sees no Members link and cannot open the Members page (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Only a SHA-256 hash of each token is stored; tokens are 256-bit URL-safe random values"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "tests/unit/invite-token.test.ts (length 43, URL-safe alphabet, unique, deterministic 64-hex hash, format check)"
        status: pass
      - kind: command
        ref: "git grep randomBytes(32) / sha256 -- src/lib/invites/token.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "Opening an invite while signed in as another account asks to sign out first, then returns to the same invite"
    requirement: AUTH-02
    verification:
      - kind: e2e
        ref: "tests/e2e/invites.spec.ts#opening an invite while signed in asks to sign out first, then offers the invite (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D7
    description: "No email is sent anywhere: no reset, invite-by-email, OTP or mail provider in the code"
    requirement: AUTH-02
    verification:
      - kind: command
        ref: "git grep -i -e resetPasswordForEmail -e inviteUserByEmail -e signInWithOtp -e nodemailer -e smtp -e resend -- src package.json (no matches)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Real WhatsApp invite to a relative's phone: the relative joins and adds a recipe; no email arrives and Supabase Auth logs show no email sends"
    requirement: AUTH-02
    human_judgment: true
    rationale: "End-of-phase human check from the plan (human_verify_mode end-of-phase); needs a real phone, WhatsApp and the Supabase dashboard"
  - id: D9
    description: "Shipped: migration applied, Vercel deployed a879cb9, live smoke green, live invalid join link shows the no-longer-valid message"
    verification:
      - kind: command
        ref: "npm run db:status:dev (20261021120300 applied remotely)"
        status: pass
      - kind: command
        ref: "npm run test:e2e:prod (6 read-only smoke tests)"
        status: pass
    human_judgment: false

duration: 35 min
completed: 2026-10-22
---

# Phase 1 Plan 12: One-time invite links and guided join Summary

**The owner creates one-time invite links (256-bit token, only its SHA-256 stored, single use, 7-day expiry, revocable, no email) on an owner-only Members page; a relative opens the link, creates an account and joins in one flow, then views, adds and edits recipes. Redemption is one atomic, race-safe security-definer function, and a losing attempt deletes the account it created.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-10-22T08:23Z
- **Completed:** 2026-10-22T08:58Z
- **Tasks:** 2
- **Files:** 18 (15 created, 3 modified)

## Accomplishments

- The Members page (owner only; members get a 404) creates invite links with an optional label. It shows the full link once with a copy button and a note that it works once and expires after 7 days. It lists invites as Active, Used, Expired or Revoked, with a Revoke button on active ones, and lists the people with access.
- `/{locale}/join/{token}` lets a relative create an account (email + password, nothing sent) and lands them signed in on the shared cookbook in the invite page's language. Used, expired, revoked and unknown links show "this invite is no longer valid — ask the owner for a new link" and create no account.
- A visitor already signed in on that device is asked to sign out first. Signing out returns them to the same invite.
- Invited members see the owner's recipes, add recipes and edit the owner's recipes.
- `AppHeader` shows a Members link to the owner only.
- Live on https://newrecipewebsite.vercel.app (`a879cb9`).

## Task Commits

1. **Task 1: Owner shares an invite link, relative joins and adds a recipe (tracer)**: `79e02d1` (feat). The migration was pushed to DEV.
2. **Task 2: Invite lifecycle guarantees and ship (TDD)**: `5ebf988` (test, RED: the revoke e2e failed in 4 of 4 projects), `a879cb9` (feat, GREEN). Shipped to `main` and deployed by Vercel.

## Files Created/Modified

See `key-files` in the frontmatter.

## Deviations from Plan

**1. [Rule 1 - Bug] The invite link scheme was hard-coded to https**
- **Found during:** Task 1, before the first e2e run
- **Issue:** The plan builds `https://HOST/...`. Local e2e runs on `http://localhost:3100`, where an https link would not open.
- **Fix:** The scheme comes from `x-forwarded-proto`, falling back to `http` only for localhost and `https` otherwise. The e2e test asserts the link starts with the test base URL.
- **Files modified:** src/app/[locale]/(app)/members/actions.ts
- **Commit:** `79e02d1`

**2. [Rule 2 - Missing critical UX] Signing out from a join link lost the invite**
- **Issue:** The plan reuses `SignOutButton`, which always redirects to sign-in, so a person on a shared device would lose the link after signing out.
- **Fix:** `signOutForInviteAction(locale, token)` signs out on this device only and redirects back to the same invite (to sign-in if the token is malformed). `joinAction` also refuses to join while any session exists.
- **Files modified:** src/app/[locale]/join/[token]/actions.ts, src/app/[locale]/join/[token]/page.tsx
- **Verification:** e2e "opening an invite while signed in asks to sign out first, then offers the invite" in 4 viewport projects
- **Commit:** `79e02d1`

**3. [Rule 3 - Blocking lint] `Date.now()` during render**
- **Issue:** The React purity lint rule rejects impure calls in a component body.
- **Fix:** The Members page loads its data and computes invite statuses in `loadMembersData()`, outside render.
- **Commit:** `79e02d1`

**4. [Additive] One extra component file and extra tests**
- `src/components/revoke-invite-button.tsx` (client confirmation + `useActionState`) is not in the plan's file list. `revokeInviteAction` takes `(inviteId, locale)` so its error message is localized.
- Extra integration checks: a used invite cannot be revoked, malformed or unknown tokens create no account, `email_taken` leaves the invite unused, and `redeem_invite` is denied to anon and authenticated clients. Extra e2e: a member gets 404 on Members, and a signed-in visitor signs out and returns to the invite.

**5. [User decision carried from 01-17] The ship loop used DEV**
- `db:push:prod` / `db:status:prod` ran as `db:push:dev` / `db:status:dev`, because no PRODUCTION Supabase project exists yet.

**Total deviations:** 1 bug fix, 1 missing-UX fix, 1 lint fix, 1 additive change, 1 carried user decision. **Impact:** none on scope.

## Issues Encountered

- In Task 2's RED step, the integration tests already passed, because Task 1's migration already contained `redeem_invite` and `revoke_invite`. Only the e2e revoke case failed (there was no Revoke control). The RED commit still has a failing test, and the SQL guarantees are covered.
- AUTH-02 stays pending in REQUIREMENTS.md because 01-13 also declares it (the member-removal half).
- Running integration or local e2e tests wipes the DEV database that the live demo uses (accepted in 01-17).

## User Setup Required

None.

## Next Phase Readiness

- Ready for 01-13 (the owner removes a member through a keep/remove recipe review). It can build on the Members page "People with access" list and `members` messages.
- End-of-phase human check to add: the owner sends a real invite link over WhatsApp to a relative's phone. The relative joins and adds a recipe. Confirm no email arrived and that the Supabase Auth logs show no email sends.

## Self-Check: PASSED

- Files exist: all 15 created files are present.
- Commits exist: `79e02d1`, `5ebf988`, `a879cb9` are on `main` and pushed.
- Verification: unit 31/31 (invite-token 5/5), integration 34/34 (invites 10/10), full local e2e 108/108 (invites 20/20 across 4 viewports), `test:e2e:prod` 6/6, migration `20261021120300` applied remotely.
