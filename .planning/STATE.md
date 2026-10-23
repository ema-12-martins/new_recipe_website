---
gsd_state_version: "1.0"
status: executing
stopped_at: Phase 2 plans complete (02-01..02-04); Read recipe live with self-hosted Tesseract; phase verification and UAT pending
last_updated: "2026-10-23T15:23:11.100Z"
last_activity: 2026-10-23
last_activity_desc: "Completed quick task 261023-mof: Add a search bar at the top of the recipe list page"
state_head: 177ce07e503570a6cccda51546554c21e84f65ab
progress:
  total_phases: 3
  completed_phases: 0
  # Counts mirror GSD tooling: Plan 01-08 is superseded and excluded; the historical 01-01 summary has no plan file and is not counted.
  total_plans: 15
  completed_plans: 15
  percent: 0
current_phase_name: Decisions and Shared Cookbook
---

# Project State

## Project Reference

- **Project:** Family Recipe Cookbook
- **Core value:** Make family recipes easy to preserve accurately and find again when they are needed.
- **Project mode:** MVP (vertical end-to-end user-value slices)
- **Roadmap granularity:** Coarse; three requirement-driven phases.
- **Scope:** A phone-friendly private online cookbook for one family, including manually entered and photo-imported recipes, shared editing, and recipe retrieval.
- **Current delivery status:** Phase 1 implementation is complete (11 / 11 plans executed): 01-09 web shell, 01-15 hosted Supabase data boundary, 01-16 first owner setup, 01-17 live on newrecipewebsite.vercel.app backed by DEV, 01-10 manual recipes, 01-11 sign-in/out per device and remembered language, 01-12 one-time invite links and guided join, 01-13 owner removes a member via keep/remove recipe review, 01-19 no-access guard, 01-14 offline reading, and 01-18 offline privacy/reconnect authorization. Offline plans 01-14 + 01-18 shipped together at b206cb4. Phase verification and real-device UAT remain. Historical Plan 01-01 is decision/provenance work only; Plan 01-08 was superseded on 2026-10-21 by user decision.

## Current Position

- **Milestone:** Initial v1
- **Phase:** 1 — Decisions and Shared Cookbook; executing (Plan 01-01 is completed historical decision/provenance work only).
- **Plan:** All 11 delivery plans are complete in sequence (09→15→16→17→10→11→12→13→19→14→18). Plans 01-09, 01-15, 01-16, 01-17, 01-10, 01-11, 01-12, 01-13, 01-19, 01-14, and 01-18 are complete. Plan 01-08 is superseded.
- **Status:** Phase 1 implementation has shipped; initial verification reports `human_needed`. Offline privacy work shipped together at b206cb4 and is deployed on Vercel. The live site https://newrecipewebsite.vercel.app runs on the DEV Supabase project as a temporary demo (user decision); tests wipe its data. Migration 20261021120400 is on DEV and must be pushed to production once a production project exists. Finish production setup and physical-device UAT before marking Phase 1 verified complete.
- **Progress:** 0 / 3 phases verified complete; Phase 1 plans 11 / 11; Phase 2 plans 4 / 4 (02-01 decision: self-hosted Tesseract; 02-04 Read recipe live 2026-10-23)

## Performance Metrics

- Phases complete: 0 / 3
- Production plans complete: 11 / 11 (Phase 1; phase verification and human UAT pending)
- Phase 1 plan artifacts: 01-01 is historical decision/provenance work only; 01-08 is superseded and excluded from plan counts. Neither is production-delivery progress.
- v1 requirements mapped: 14 / 14 requirement IDs present in REQUIREMENTS.md
- v1 requirements completed: 6 (RECP-01, RECP-03, AUTH-01, AUTH-02, AUTH-03, AUTH-04); phase-level verification and human UAT remain pending

**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P09 | 27 min | 3 tasks | 24 files |
| Phase 01 P15 | 25 min | 3 tasks | 17 files |
| Phase 01 P16 | 12 min | 2 tasks | 17 files |
| Phase 01 P17 | 45 min | 2 tasks | 8 files |
| Phase 01 P10 | 29 min | 3 tasks | 19 files |
| Phase 01 P11 | 26 min | 2 tasks | 15 files |
| Phase 01 P12 | 35 min | 2 tasks | 18 files |
| Phase 01 P13 | 21 min | 2 tasks | 12 files |
| Phase 01 P19 | 21 min | 3 tasks | 14 files |

## Accumulated Context

### Decisions and constraints

- Individual accounts and invitations provide access to one private shared family cookbook; invited members can view, add, and edit recipes.
- Handwritten recognition must create an editable, unconfirmed draft. A person reviews and explicitly saves it; saved photo-imported recipes retain the original photo(s).
- Manual entry remains available if recognition is unavailable or unusable.
- Search and browsing cover recipe names, ingredients, and categories; family members can rename suggested categories and add categories.
- Do not include public publishing/community features, meal planning, shopping lists, favorites, recipe notes, live co-editing, or offline-first assumptions in this MVP.
- Production web stack approved 2026-10-21 (01-CONTEXT.md D-24..D-41): Next.js (React + TypeScript), Tailwind + shadcn/ui, locale in URL (/pt, /en; Portuguese fallback); Supabase (Postgres + Auth + RLS, later Storage); Vercel + Supabase Cloud free tiers in an EU region on a vercel.app address; service-worker offline reading of opened recipes (no installable PWA). Exact package versions are recorded at install time. The OCR provider remains unapproved; family handwriting has not been benchmarked.
- No emails in v1: one-time invite links (7-day, revocable) shared by the owner; email + password sign-in with unverified email; no in-app password reset (members are removed and re-invited; the owner is reset by the operator in the Supabase dashboard); no in-app account self-deletion.
- Plan 01-01 is completed historical decision/provenance work, not production delivery. The Candidate A (Expo) spike approval is moot.
- The product target is one responsive browser-based web app across desktop, tablet, and phone, with no separate native app, app-store distribution, or installable PWA. Before selecting an OCR provider, benchmark permissioned family samples and compare field-critical quality, privacy, region, latency, quotas, and cost.
- The requirements source says “13 total,” but contains 14 distinct v1 requirement IDs. All 14 listed IDs are retained and mapped exactly once; the source coverage count is corrected to 14.

### Open decisions / next actions

- Complete the dedicated production Supabase/Vercel setup, then perform the deferred iPhone Safari and Android Chrome UAT for offline reading, sign-out purge, and the absence of an install-app prompt; re-verify Phase 1 afterward.
- Before real family use: create the Supabase PRODUCTION project (EU; sign-ups OFF, Confirm email OFF, min password 8), point Vercel Production env vars at it with a production-only OWNER_SETUP_CODE, fill `SUPABASE_PROD_DB_URL`, and run db:push:prod (includes 20261021120400_member_removal; run `node scripts/remove-incomplete-recipes.mjs` first if the project already holds recipes, because 20261023130000_recipe_required_lines fails on recipes without an ingredient or step).
- Phase 2: run the OCR harness on 5–10 real handwritten pages (the owner can copy made-up recipes by hand) and revisit the Tesseract decision and the D-10 threshold (02-PROVIDER-DECISION.md); then Phase 2 verification and phone UAT (camera/gallery, HEIC, Read recipe, offline photos).

### Blockers

- Phase 1 plan execution is complete and deployed (01-13 + 01-19 live at 9c2f9f9; 01-14 + 01-18 live at b206cb4). The live site is a DEV-backed demo: no real family data until a PRODUCTION Supabase project exists (tests wipe DEV). Phase verification and physical-device UAT are still outstanding.
- Phase 2 reading uses self-hosted Tesseract approved without real handwritten samples (owner accepted the risk, 2026-10-23); expect cursive pages to fail the quality gate and fall back to typing.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 261021-fk2 | Reconcile Phase 1 status records without conflating historical/interim plans and production delivery | 2026-10-21 | aaecb08 | [261021-fk2-reconcile-stale-state-md-and-roadmap-pro](./quick/261021-fk2-reconcile-stale-state-md-and-roadmap-pro/) |
| 261021-g0i | Retire Plan 01-08 validation gate and record decision to replan Phase 1 as the real web app | 2026-10-21 | 1147967 | [261021-g0i-retire-plan-01-08-validation-gate-and-re](./quick/261021-g0i-retire-plan-01-08-validation-gate-and-re/) |
| 261023-h1n | Apply sketch 001 winner A (kraft paper) design to the website | 2026-10-23 | 5e139fd | [261023-h1n-apply-sketch-001-winner-a-kraft-paper-de](./quick/261023-h1n-apply-sketch-001-winner-a-kraft-paper-de/) |
| 261023-irw | Recipe page ticking and current step, list card counts and photo stamp, kraft style on remaining pages | 2026-10-23 | c351171 | [261023-irw-recipe-page-ticking-and-current-step-lis](./quick/261023-irw-recipe-page-ticking-and-current-step-lis/) |
| 261023-j6j | Apply Phase 1 UI review fixes: cookbook name, touch targets, error/not-found pages, typography and accent | 2026-10-23 | fa33954 | [261023-j6j-apply-ui-review-fixes-cookbook-name-touc](./quick/261023-j6j-apply-ui-review-fixes-cookbook-name-touc/) |
| 261023-l4j | Read recipe photos with Groq vision (free, no card) instead of Tesseract | 2026-10-23 | 1a2812f | [261023-l4j-use-groq-vision-qwen3-8-27b-to-read-reci](./quick/261023-l4j-use-groq-vision-qwen3-8-27b-to-read-reci/) |
| 261023-lhq | Move cookbook title and tagline from recipe list page top into the header | 2026-10-23 | cb5740e | [261023-lhq-move-cookbook-title-and-tagline-from-rec](./quick/261023-lhq-move-cookbook-title-and-tagline-from-rec/) |
| 261023-ln9 | Remove recipes without ingredients or steps (with photos) and require title, ingredient and step to save | 2026-10-23 | cd11f8e | [261023-ln9-remove-recipes-without-ingredients-or-st](./quick/261023-ln9-remove-recipes-without-ingredients-or-st/) |
| 261023-lti | Database rule: recipes need title, ingredient and step; publish to the site | 2026-10-23 | b285fcf | [261023-lti-database-rule-recipes-need-title-ingredi](./quick/261023-lti-database-rule-recipes-need-title-ingredi/) |
| 261023-m2i | Warn next to Save when a recipe lacks title, ingredients or steps | 2026-10-23 | 0ec15e2 | [261023-m2i-warn-next-to-save-when-a-recipe-lacks-ti](./quick/261023-m2i-warn-next-to-save-when-a-recipe-lacks-ti/) |
| 261023-m8a | Restyle back links as in-page buttons with an arrow icon on all pages | 2026-10-23 | 79deb8c | [261023-m8a-restyle-back-links-as-in-page-buttons-wi](./quick/261023-m8a-restyle-back-links-as-in-page-buttons-wi/) |
| 261023-mof | Add a search bar at the top of the recipe list page | 2026-10-23 | 177ce07 | [261023-mof-add-a-search-bar-at-the-top-of-the-recip](./quick/261023-mof-add-a-search-bar-at-the-top-of-the-recip/) |

### Roadmap Evolution

- Phase 1 edited: edited fields: goal, success_criteria, decision_gate, plan_list; replaced native/store target with mobile-browser-only web scope
- Phase 1 edited: edited fields: goal, success_criteria, decision_gate; broadened target from phone-only browser to responsive web across desktop, tablet, and phone
- Phase 1 edited: decision_gate, delivery status, plans, progress — Plan 01-08 interim validation gate superseded by user decision (2026-10-21); phase replans directly as the real web app

## Session Continuity

**Last session:** 2026-10-23T10:24:40.340Z
**Stopped at:** Phase 2 paused at 02-01 Task 3 (waiting on Google Cloud setup); 02-02 and 02-03 done
**Resume file:** .planning/phases/02-handwritten-recipe-capture/.continue-here.md

Plan 01-01 stays historical. Plan 01-08 is superseded and must not be executed. Plans 01-14 and 01-18 shipped together at b206cb4; 01-18's summary is committed at 4cb3cf4. Initial phase verification is recorded in 01-VERIFICATION.md with status `human_needed`. End-of-phase human checks already recorded: 01-10 phone recipe check; 01-11 phone + laptop remembered-language check; 01-12 real WhatsApp invite to a relative's phone (join, add a recipe, confirm no email was sent and Supabase Auth logs show no email sends); 01-13/01-19 the owner removes that relative after the keep/remove review (keep one recipe, remove another), the relative's phone tapping a recipe link lands on sign-in with the no-access message, then the owner re-invites the same email. Still outstanding: production Supabase setup and the 01-18 iPhone Safari/Android Chrome offline-read, sign-out purge, and no-install-prompt check.

## Decisions

- [Phase 1]: Deliver one general browser-based web app across desktop, tablet, and phone sizes; no separate phone app, native apps, app stores, or installable PWA.
- [Phase 1 / Plan 01-01]: Candidate A was approved only for a reversible feasibility spike (now moot).
- [Phase 1 / 2026-10-21]: Plan 01-08 superseded by user decision — only a single responsive web app (desktop/tablet/phone browsers); no native app, app store, installable PWA, or throwaway validation service; interim browser evidence is no longer a prerequisite; replan Phase 1 directly as the real web app after the production stack is approved.
- [Phase 1 / 2026-10-21 discuss]: Production stack approved — Next.js + TypeScript + Tailwind/shadcn, Supabase, Vercel + Supabase Cloud (EU, free tiers); no emails in v1 (invite links, no in-app password reset); service-worker offline reading of opened recipes; no in-app account self-deletion (resolves the owner-deletion blocker).

Last activity: 2026-10-23 - Completed quick task 261023-mof: Add a search bar at the top of the recipe list page
- [Phase 01]: Plan 01-09: package legitimacy approved with clsx + tailwind-merge instead of cn; later shadcn steps must rewrite imports from 'cn' to @/lib/utils and never install cn — Human rejected the reassigned 'cn' npm package at the 01-09 gate
- [Phase 01]: Plan 01-15: Supabase PRODUCTION project deferred by user decision; it must be configured (same Auth settings) and SUPABASE_PROD_DB_URL filled before 01-17.
- [Phase 01]: Plan 01-15: shadcn init performed by hand from registry JSON (CLI would install the rejected 'cn' and defaults to Base UI); components import cn from @/lib/utils.
- [Phase 01]: Plan 01-15: the data-boundary test asserts live Auth settings (disable_signup, mailer_autoconfirm) before probing sign-up; DEV initially had sign-ups ON and was fixed by the user.
- [Phase 01]: Plan 01-16: Portuguese UI copy uses European Portuguese (palavra-passe); shadcn components are copied from registry JSON with cn from @/lib/utils, never via shadcn add.
- [Phase 01]: Plan 01-17 (user decision 2026-10-21): the Vercel live site runs on the DEV Supabase project as a temporary demo; tests wipe it, so no real family data until a PRODUCTION project exists. 01-17 uses DEV values in all Vercel scopes and db:*:dev instead of db:*:prod.
- [Phase 01]: Plan 01-17: live at https://newrecipewebsite.vercel.app (Vercel Hobby, fra1, auto-deploy from main confirmed); ship loop uses db:*:dev while the live site is a DEV-backed demo.
- [Phase 01]: Plan 01-10: client forms with controlled state stay disabled until hydrated (fieldset + useSyncExternalStore) — WebKit lost text typed before hydration; slow phones would too
- [Phase 01]: Plan 01-10: recipe deletion is impossible for clients - DELETE granted, no policy, so deletes affect 0 rows; writes limited to content columns by column grants — D-15 and T-01-13; RLS stays the row gate
- [Phase 01]: Plan 01-10: shadcn Textarea copied from registry JSON with cn from @/lib/utils (registry still depends on rejected 'cn') — T-01-SC; same approach as 01-15/01-16
- [Phase 01]: Plan 01-11: e2e "devices" opened with browser.newContext must pass storageState { cookies: [], origins: [] } — Playwright applies the project's owner storageState to new contexts
- [Phase 01]: Plan 01-11: per-member preferences go through narrow security-definer RPCs (set_my_locale); memberships keeps no client write policy — T-01-18
- [Phase 01]: Plan 01-11: sign-out is per device (scope local); there is no "sign out everywhere" control in Phase 1
- [Phase 01]: Plan 01-12: invite links carry a 256-bit base64url token; only its SHA-256 is stored; redeem_invite (service_role only) is one conditional UPDATE plus the membership insert, and a losing redemption deletes the auth user it created — T-01-20, T-01-21, T-01-24
- [Phase 01]: Plan 01-12: the invite link's scheme comes from x-forwarded-proto (http only for localhost), not a hard-coded https, so local e2e and Vercel both get working links
- [Phase 01]: Plan 01-12: a signed-in visitor on a join link signs out through a join-specific action that returns to the same invite, instead of the generic sign-out that lands on sign-in — T-01-25
- [Phase 01]: Plan 01-13: member removal = owner-only delete_member_recipes RPC (deletes only reviewed ids the member created) then admin deleteUser; the account deletion cascades the membership, nulls recipe creators and invites.used_by, and frees the email — D-10, D-17, D-21, D-31, T-01-26..T-01-30
- [Phase 01]: Plan 01-13: removeMember(input, deps?) derives the caller only from the injected client's own session (getMembershipStatus(client)); there is no caller-id parameter — T-01-45
- [Phase 01]: Plan 01-13: getMembershipStatus classifies AuthRetryableFetchError (network, 5xx incl. 500) and any membership-query error as unavailable, never none; AuthSessionMissingError and deleted users are none — D-34, consumed by 01-19
- [Phase 01]: Plan 01-13: user decision — git.allow_default_branch_commits: true in .planning/config.json, keeping plan commits on main as in 01-09..01-12
- [Phase 01]: Plan 01-19: requireMembership(locale) is the member-area guard on the (app) layout AND every (app) page (soft navigations skip the layout); none -> sign-in, with reason=no-access only when a non-empty sb-*-auth-token cookie is presented; unavailable -> /{locale}/unavailable (D-34) — T-01-43, T-01-44
- [Phase 01]: Plan 01-19: tests/unit/app-pages-guard.test.ts fails if any (app) page.tsx or the layout lacks requireMembership(; no staleTimes override in next.config.ts — T-01-43, T-01-48
- [Phase 01]: Plan 01-19: 01-13 + 01-19 shipped together at 9c2f9f9 with db:*:dev in place of db:*:prod; 20261021120400 still needs db:push:prod once a production project exists
- [Phase 01]: Plans 01-14 + 01-18 completed and shipped together at b206cb4; offline cache is limited to opened recipes and must be purged or reauthorized across account changes and reconnect.
- [Phase 01]: Desktop and phone Chromium E2E checks passed, including offline privacy and reconnect cases; physical iPhone Safari/Android Chrome UAT remains outstanding.
