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
  2. An invited member can verify the invited email and view, add, and edit recipes in the same private family cookbook.
  3. Members can manually create, view, and edit recipes with a title, flexible ingredient lines, and ordered instructions while preserving Portuguese or English wording and units.
  4. Members can access the same saved cookbook in responsive web browsers across desktop, tablet, and phone screen sizes; Phase 1 includes no native app, app-store distribution, or installable PWA.
**Decision gate before production stack is locked**: Run a browser-only validation spike across representative browser engines and desktop, tablet, and phone viewport sizes, without native apps, app-store routes, or PWA installation. Validate responsive web access, private account and exact-email invitation behavior, member removal, bilingual manual recipe create/edit, and the existing read-only offline/cache semantics. Record exact browser/OS versions, viewport sizes, and evidence; distinguish automated viewport emulation from browser/device evidence and do not infer results from availability or compatibility tables. Physical iPhone/Android testing is not a prerequisite. After evidence is recorded, ask the user to approve the production web framework, backend/identity services, hosting/deployment, cache approach, and directory layout. Research candidates and version snapshots remain unapproved until then.
**Delivery status**: Phase 1 production delivery has not started. Historical Plan 01-01 is completed decision/provenance work only; interim responsive validation Plan 01-08 remains outstanding and does not complete the phase.
**Current evidence**: All browser targets and all 20 UAT cases remain NOT RUN. Validation covers representative desktop, tablet, and phone browser/viewport classes; physical iPhone/Android testing is not a prerequisite.
**Plans**: Replanning pending; retain Plan 01-01 as history and do not count either it or interim Plan 01-08 as completed production delivery.
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
| 1. Decisions and Shared Cookbook | 0 / 7 | Not started — interim responsive validation pending; production replanning pending | - |
| 2. Handwritten Recipe Capture | 0 / TBD | Not started | - |
| 3. Search and Categories | 0 / TBD | Not started | - |
