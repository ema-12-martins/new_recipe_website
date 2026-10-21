# Roadmap: Family Recipe Cookbook

## Phases

- [ ] **Phase 1: Decisions and Shared Cookbook** - Resolve high-risk product/platform decisions, then deliver private accounts, family sharing, and manual recipe management in a browser-based web app.
- [ ] **Phase 2: Handwritten Recipe Capture** - Turn one or more recipe photos into a reviewed, explicitly saved recipe while retaining the source images.
- [ ] **Phase 3: Search and Categories** - Help family members find shared recipes by name, ingredient, and family-managed category.

## Phase Details

### Phase 1: Decisions and Shared Cookbook
**Goal**: As a family member, I want to privately access our shared cookbook in a web browser on my devices and manually create, view, and edit recipes, so that my family can preserve and use our recipes together.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, RECP-01, RECP-03
**Success Criteria** (what must be TRUE):
  1. A family member can create and use an individual account; the cookbook owner can invite family members and remove their access.
  2. An invited member can join through an owner-shared one-time invite link (single use, expires 7 days after it is created, revocable by the owner; no email is sent or verified, and the email is only an unverified sign-in identifier) and can view, add, and edit recipes in the same private family cookbook.
  3. Members can manually create, view, and edit recipes with a title, flexible ingredient lines, and ordered instructions while preserving Portuguese or English wording and units.
  4. Members can access the same saved cookbook in responsive web browsers across desktop, tablet, and phone screen sizes; Phase 1 includes no native app, app-store distribution, or installable PWA.
**Decision gate (resolved 2026-10-21)**: The production stack was selected and explicitly approved in `/gsd-discuss-phase 1` (01-CONTEXT.md D-24..D-41): Next.js + TypeScript + Tailwind/shadcn, Supabase (Postgres + Auth + RLS), Vercel + Supabase Cloud (EU, free tiers), no emails in v1, service-worker offline reading of opened recipes (no installable PWA). No interim validation spike is required; real-browser checks across desktop, tablet, and phone viewports are part of the production plans' own verification.
**Delivery status**: Phase 1 is planned and ready to execute. Historical Plan 01-01 is completed decision/provenance work only. Plan 01-08 (interim responsive validation) is superseded by user decision on 2026-10-21 and will not be executed.
**Plans:** 11 plans (Plan 01-01 is retained as history; Plan 01-08 is superseded, retired, and not counted)

Plans (sequential, one per wave):
- [ ] 01-09-PLAN.md — Wave 1: package legitimacy gate (human), Next.js scaffold, /pt and /en locale routing, Playwright — AUTH-04
- [ ] 01-15-PLAN.md — Wave 2: Supabase DEV/PROD setup (human), first migration, RLS, public sign-up refused — AUTH-01, AUTH-03
- [ ] 01-16-PLAN.md — Wave 3: first person sets up the cookbook as the single owner (idempotent, race-safe) — AUTH-01
- [ ] 01-17-PLAN.md — Wave 4: Vercel link (human), production deploy on vercel.app backed by EU production database — AUTH-01
- [ ] 01-10-PLAN.md — Wave 5: manual recipes — create, view, list, edit, reorder steps, byte-faithful text, conflict-safe saves — RECP-01, RECP-03, AUTH-03
- [ ] 01-11-PLAN.md — Wave 6: sign-in/out on any device, same cookbook across devices, remembered interface language — AUTH-01, AUTH-04
- [ ] 01-12-PLAN.md — Wave 7: one-time invite links (7-day, revocable, single use) and guided join — AUTH-02, AUTH-03
- [ ] 01-13-PLAN.md — Wave 8: owner removes a member via keep/remove recipe review; email freed for re-invite (DEV only, ships with 01-19) — AUTH-02
- [ ] 01-19-PLAN.md — Wave 9: no-access guard on every page and "server unavailable" state; ships 01-13 + 01-19 — AUTH-02
- [ ] 01-14-PLAN.md — Wave 10: offline reading of opened recipes (service worker + IndexedDB, no PWA; not shipped alone) — AUTH-04
- [ ] 01-18-PLAN.md — Wave 11: purge offline cache on sign-out/account switch, reauthorize on reconnect; ships 01-14 + 01-18 — AUTH-04
**UI hint**: yes

### Phase 2: Handwritten Recipe Capture
**Goal**: Family members can preserve handwritten recipes from photos without treating recognition output as a confirmed recipe.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CAPT-01, CAPT-02, CAPT-03, CAPT-04, RECP-02
**Success Criteria** (what must be TRUE):
  1. A member can capture or select one or more photos for a handwritten recipe.
  2. Recognition produces an editable, unconfirmed draft containing the recipe title, ingredients, and ordered instructions; unusable or failed recognition does not silently become a saved recipe.
  3. A member can review and edit the extracted draft and must explicitly confirm before it is saved.
  4. The saved imported recipe retains its original source photo or photos.
  5. A member can enter the recipe manually when recognition is unavailable or unusable.
**Decision gate before choosing an OCR provider**: Run a focused spike on permissioned examples of the family's actual handwriting, including representative pages, layouts, image quality, languages, quantities, fractions, units, temperatures, and instruction order. Compare candidate recognition and field-extraction paths using recipe-critical accuracy and expected human correction effort; also resolve privacy/data-processing terms, region, retention, quotas, cost, and latency for the viable options. Set acceptance criteria and record the decision before selecting or locking a provider. The existing reports' differing provider references are candidates only; handwriting has not been benchmarked on family material, and no provider is approved.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Search and Categories
**Goal**: Family members can retrieve shared recipes using the names, ingredients, and categories they recognize.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: SRCH-01, SRCH-02, SRCH-03
**Success Criteria** (what must be TRUE):
  1. A member can find saved recipes by recipe name and ingredient.
  2. A member can browse and find saved recipes by category.
  3. Family members can rename suggested categories and add their own categories, and the resulting organization is reflected in shared cookbook browsing.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Decisions and Shared Cookbook | 0 / 11 | Planned — ready to execute | - |
| 2. Handwritten Recipe Capture | 0 / TBD | Not started | - |
| 3. Search and Categories | 0 / TBD | Not started | - |
