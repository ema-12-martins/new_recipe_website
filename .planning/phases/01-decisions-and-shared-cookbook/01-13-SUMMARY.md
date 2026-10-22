---
phase: 01-decisions-and-shared-cookbook
plan: 13
subsystem: auth
tags: [supabase, auth, members, rls, security-definer, nextjs, server-actions, playwright, vitest]

requires:
  - 01-15 (cookbooks/memberships boundary, is_owner(), current_cookbook_id(), memberships.user_id ON DELETE CASCADE, test helpers)
  - 01-10 (recipes with no client delete policy; recipe_creators owner-only, created_by ON DELETE SET NULL; injected-client pattern)
  - 01-12 (Members page, invites.used_by ON DELETE SET NULL, redeemInvite for the re-invite)
  - 01-16 ((app) layout membership guard that sends non-members to sign-in)
provides:
  - public.delete_member_recipes(uuid, uuid[]) — owner only, never self, member targets only, deletes only reviewed ids the member created
  - getMembershipStatus(client?) -> member | none | unavailable (src/lib/auth/membership.ts); getCurrentMembership() is now a wrapper with an unchanged contract
  - listMembers / getMember / listMemberRecipesForReview (src/lib/members/queries.ts) — the only creator-metadata read in the app
  - removeMember(input, deps?) and RemoveMemberResult (src/lib/members/remove-member.ts)
  - /{locale}/members/{userId}/remove owner-only review page and removeMemberAction
  - MemberRemovalForm (keep/remove per recipe, keep preselected)
  - Members page Remove links, forgotten-password note (D-31), removed notice
affects: [01-19, 01-14, 01-18]

actuals:
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Three-state access check: member | none | unavailable; network failures, 5xx and failed membership queries are an outage, never lost access"
    - "Injectable server seams: deps.client (whose own session is the caller identity) and deps.createAdmin, so Vitest can run server logic without a Next.js request"
    - "Destructive owner actions: user-scoped security-definer RPC first (authorization in SQL), service-role call last; a failed last step leaves a retryable state"

key-files:
  created:
    - supabase/migrations/20261021120400_member_removal.sql
    - src/lib/members/queries.ts
    - src/lib/members/remove-member.ts
    - src/app/[locale]/(app)/members/[userId]/remove/page.tsx
    - src/app/[locale]/(app)/members/[userId]/remove/actions.ts
    - src/components/member-removal-form.tsx
    - tests/integration/member-removal.test.ts
    - tests/e2e/member-removal.spec.ts
  modified:
    - src/lib/auth/membership.ts
    - src/app/[locale]/(app)/members/page.tsx
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json

key-decisions:
  - "Removal runs delete_member_recipes through the owner's own client, then deletes the auth account with the service role. Deleting the account cascades the membership, nulls recipe creators and invites.used_by for kept data (D-17) and frees the email (D-31)."
  - "delete_member_recipes also scopes deletion to the owner's cookbook and requires the target to be a current member, raising not_owner, cannot_remove_self or not_a_member."
  - "removeMember has no caller-id parameter: the caller is whoever owns the injected client's session (T-01-45). removeMemberAction passes no deps."
  - "Repeats are safe: no membership row gives already_removed; a concurrent removal whose deleteUser returns 404 counts as done; a retry after cleanup_failed only deletes still-existing recipes marked remove."
  - "getMembershipStatus treats a Supabase outage as unavailable, not as removed access (D-34): AuthRetryableFetchError (status 0 network, 500, 503) and any membership-query error give unavailable; AuthSessionMissingError and a deleted user give none."
  - "The keep/remove radios are controlled, so a failed attempt keeps the owner's choices for the retry (React resets uncontrolled fields after a form action)."
  - "Production ship is deferred to 01-19: this plan pushed its migration to DEV only and committed locally without pushing main."
  - "User decision during execution: git.allow_default_branch_commits: true, keeping plan commits on main as in 01-09..01-12."

patterns-established:
  - "Owner-only detail pages: membership redirect, notFound() for non-owners, invalid ids, the owner themself and non-members"

requirements-completed: [AUTH-02]

coverage:
  - id: D1
    description: "The owner opens a member's removal review from Members, sees every recipe that member originally created (including one the owner edited later) with keep preselected, marks one remove and confirms; the member disappears from Members, the kept recipe stays without attribution and the removed one is gone"
    requirement: AUTH-02
    verification:
      - kind: e2e
        ref: "tests/e2e/member-removal.spec.ts#the owner reviews a member's recipes, removes their access and can re-invite the same email (4 viewport projects)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Removal ends access immediately: the removed member's live session reads 0 recipes and a full page load leaves the app for sign-in"
    requirement: AUTH-02
    verification:
      - kind: integration
        ref: "tests/integration/member-removal.test.ts#removal deletes marked recipes, anonymizes kept ones and ends the member's access at once"
        status: pass
      - kind: e2e
        ref: "tests/e2e/member-removal.spec.ts (removed member's context reloads /pt/recipes and ends on /pt/sign-in)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Only the owner can remove members, never themself; crafted ids of recipes the member did not create delete nothing"
    requirement: AUTH-02
    verification:
      - kind: integration
        ref: "tests/integration/member-removal.test.ts (member rpc -> not_owner; owner on self -> cannot_remove_self; foreign ids ignored; removeMember with member client -> not_owner; owner self -> cannot_remove_self)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Repeating or retrying a removal completes it without deleting additional recipes"
    requirement: AUTH-02
    verification:
      - kind: integration
        ref: "tests/integration/member-removal.test.ts (repeat -> already_removed; simulated deleteUser failure -> cleanup_failed with membership kept, retry completes with 0 extra deletions)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Removal frees the email: the owner creates a new invite and the same email joins again"
    requirement: AUTH-02
    verification:
      - kind: integration
        ref: "tests/integration/member-removal.test.ts#after removal the same email can join again through a new invite"
        status: pass
      - kind: e2e
        ref: "tests/e2e/member-removal.spec.ts (owner creates a new invite, same email joins and lands on /pt/recipes)"
        status: pass
    human_judgment: false
  - id: D6
    description: "getMembershipStatus reports member, none, or unavailable; outages are never classified as none"
    requirement: AUTH-02
    verification:
      - kind: integration
        ref: "tests/integration/member-removal.test.ts#reports member, none for a signed-out or membership-less caller, and unavailable when Supabase cannot answer (network, auth 500, failed membership query)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Creator metadata is read only by the removal review; Members tells the owner that a member who forgot their password is removed and re-invited"
    requirement: AUTH-02
    verification:
      - kind: command
        ref: "git grep --untracked -l recipe_creators -- src (only src/lib/members/queries.ts)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/member-removal.spec.ts (forgotPasswordNote visible; kept recipe page shows no member identifier)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Real-device check: the owner removes a relative who joined over WhatsApp after the keep/remove review, then re-invites the same email"
    requirement: AUTH-02
    human_judgment: true
    rationale: "End-of-phase human check (human_verify_mode end-of-phase); runs after 01-19 ships removal to the live site"
  - id: D9
    description: "Not shipped: migration on DEV only, commits local, origin/main unchanged (01-19 ships both plans)"
    verification:
      - kind: command
        ref: "npm run db:status:dev (20261021120400 applied remotely); git log origin/main -1 differs from HEAD"
        status: pass
    human_judgment: false

duration: 21 min
completed: 2026-10-22
---

# Phase 1 Plan 13: Owner removes a member via keep/remove recipe review Summary

**The owner removes a member from the Members page after a one-time review that lists every recipe the member originally created, with keep or remove per recipe. Removal deletes the marked recipes through an owner-only security-definer function, then deletes the member's account: access ends at once, kept recipes lose their creator, and the email can be invited again. A new three-state getMembershipStatus (member | none | unavailable) never mistakes a Supabase outage for lost access. Committed locally and on DEV only; 01-19 ships it.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-10-22T09:10Z
- **Completed:** 2026-10-22T09:31Z
- **Tasks:** 2
- **Files:** 12 (8 created, 4 modified)

## Accomplishments

- Members lists each member with a "Remove access" link (none for the owner), and notes that a member who forgot their password is removed and re-invited (D-31). After a removal it shows "Access removed."
- `/{locale}/members/{userId}/remove` (owner only; 404 for members, invalid ids, the owner themself and non-members) shows the member's email, explains the list is shown only now, and lists each recipe they originally created with Keep / Remove radios (Keep preselected, one fieldset per recipe). A no-recipes message appears when there are none. The confirm button states that access ends immediately and removed recipes cannot be restored.
- `delete_member_recipes` deletes only ids that the target member created, in the owner's cookbook, and refuses non-owners, self-removal and non-members.
- `removeMember` checks the caller from the injected client's own session, deletes the marked recipes, then deletes the auth account. It is idempotent and retryable.
- `getMembershipStatus(client?)` is ready for 01-19's page-level guard. `getCurrentMembership()` keeps its member-or-null contract for every existing page.

## Task Commits

1. **Task 1: Owner removes a member after reviewing their recipes, and can re-invite the same email (tracer)**: `53f46af` (feat). Migration `20261021120400` pushed to DEV. The tracer verify passed (e2e in 4 viewport projects, `db:status:dev`), so the work expanded without a checkpoint (human_verify_mode end-of-phase).
2. **Task 2: Removal guarantees (TDD)**: `9437245` (test). See Issues Encountered for why there is no RED commit.

Not pushed: `origin/main` stays at `5e3962c`; plan 01-19 ships both plans.

## Error shapes observed (D-34)

Probed against the DEV project with supabase-js 2.118.0:

| Situation | Error | Classified |
|-----------|-------|------------|
| Signed out | `AuthSessionMissingError`, status 400 | none |
| Network failure on Auth | `AuthRetryableFetchError`, status 0 | unavailable |
| Auth answers 500 | `AuthRetryableFetchError`, status 500 | unavailable |
| Auth answers 503 | `AuthRetryableFetchError`, status 503 | unavailable |
| Network failure on the membership query | PostgREST error, `code: ""`, response status 0, message `TypeError: fetch failed` | unavailable |
| Session of a deleted (removed) user | getUser error, not retryable | none |

## Files Created/Modified

See `key-files` in the frontmatter.

## Deviations from Plan

**1. [Additive] `getMember(userId)` in queries.ts; the Members page uses `listMembers()`**
- The review page needs one member's email and role. The Members page now reads people through `listMembers()` instead of its own inline query.
- **Commit:** `53f46af`

**2. [Rule 2 - Missing critical validation] Untrusted ids and concurrent removals**
- **Issue:** The member id and recipe ids come from the browser. A malformed uuid would make PostgREST error out, and two concurrent removals would see the second `deleteUser` return 404.
- **Fix:** `removeMember` rejects a malformed member id (error) and drops malformed recipe ids. The review page 404s for malformed ids. A 404 from `deleteUser` counts as already done. The SQL also scopes deletes to `current_cookbook_id()`.
- **Commit:** `53f46af`

**3. [Rule 2 - Missing critical UX] Choices lost after a failed attempt**
- **Issue:** React resets uncontrolled form fields after a form action, so after a `cleanup_failed` retry message every radio would silently return to Keep.
- **Fix:** The radios are controlled state in `MemberRemovalForm`.
- **Commit:** `53f46af`

**4. [Additive] Extra tests**
- The integration file has 10 tests (plan minimum 8): owner self-removal through `removeMember`, and `getMembershipStatus` classification under a network failure, an Auth 500 and a failed membership query.
- The e2e test also checks that the removed recipe's page returns 404, that the removal notice appears, and that the review lists the owner-edited title.

**5. [User decision] Commits on main**
- The executor commit guard refuses protected branches. The user chose to keep committing on `main` as in 01-09..01-12, and to record `git.allow_default_branch_commits: true` in `.planning/config.json`.

**Total deviations:** 1 validation fix, 1 UX fix, 2 additive changes, 1 user decision. **Impact:** none on scope.

## Issues Encountered

- **No RED commit for Task 2.** Task 1 (the tracer) already implemented every behaviour Task 2 tests, so the new tests passed on their first run. Instead, two temporary mutations proved the tests catch regressions: treating outages as none, and ignoring a failed `deleteUser`. Each made the matching test fail (2 failed, 8 passed); then the source was restored with an empty diff.
- AUTH-02 stays pending in REQUIREMENTS.md because 01-19 also declares it (shared-ID gate).
- Integration and local e2e runs wipe the DEV database the live demo uses (accepted in 01-17).

## User Setup Required

None.

## Next Phase Readiness

- Ready for 01-19. It can call `getMembershipStatus()` (no argument, cached per request) in `requireMembership`: `none` → no-access message, `unavailable` → `/{locale}/unavailable`. It extends `tests/e2e/member-removal.spec.ts` with the no-access message, the in-app link case and the no-cookie case. It then ships 01-13 + 01-19: full local e2e, push `main`, wait for Vercel, `test:e2e:prod`, with `db:*:dev` in place of `db:*:prod`.
- End-of-phase human check to add: after the 01-12 WhatsApp check, the owner removes that relative through the keep/remove review and then re-invites the same email.

## Self-Check: PASSED

- Files exist: all 8 created files are present.
- Commits exist: `53f46af`, `9437245` are on local `main` (not pushed, by design).
- Verification: unit 31/31, integration 44/44 (member-removal 10/10), full local e2e 112/112 (member-removal 4/4 across 4 viewports), migration `20261021120400` applied remotely on DEV, typecheck and eslint clean.
