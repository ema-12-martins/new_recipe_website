# Walking Skeleton — Family Recipe Cookbook

**Phase:** 1  
**Generated:** 2026-10-20

## Capability Proven End-to-End

**As a** family cookbook owner, **I want to** create an individual account and save and reopen a recipe on my phone, **so that** the shared cookbook has a real authenticated, persistent foundation.

This capability is planned, not yet proven. The end-to-end evidence must come from the Phase 1 tracer and its verification.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Not selected at planning time; resolve only after the Phase 1 platform spike and user decision checkpoint. | D-05; research confidence is LOW and the iPhone/Android store path must be tested. |
| Data layer | Not selected at planning time; choose a family-scoped persistent backend after the platform, authorization, and data-security spike. | No vendor or schema is approved. |
| Auth | Product contract is individual email/password accounts; provider and session implementation remain unselected until the gate. | D-08; use a supported identity implementation and server/data-boundary authorization. |
| Deployment target | Not selected at planning time; record the tested local full-stack run path and the separate iOS and Android store/test-track routes after the spike. | D-01 and D-16; do not claim either path passed until evidence is recorded. |
| Directory layout | No application tree exists. The selected architecture must define exact repository-rooted paths before implementation; record them here and keep app, backend, and tests discoverable. | Greenfield workspace; avoid assuming framework-specific paths. |

### Decision Record to Complete at the Gate

The executing agent must replace each “Not selected” entry only after the evidence and human decision checkpoint. Record the chosen option, concise rationale, tested alternatives, evidence links/log paths, and any remaining limitations. Do not treat candidate examples in `01-RESEARCH.md` as approved choices.

## Stack Touched in Phase 1

- [ ] Project scaffold (framework, build, lint, test runner)
- [ ] Routing — at least one real route
- [ ] Database — at least one real read AND one real write
- [ ] UI — at least one interactive element wired to the API
- [ ] Deployment — running on dev environment OR documented local full-stack run command

The selected test and full-stack run commands must be added below once the architecture gate is completed:

- Full-stack local run command: pending gate
- Automated phase test command: pending gate
- iOS device/build and store-test evidence: pending platform spike
- Android device/build and store-test evidence: pending platform spike

## Out of Scope (Deferred to Later Slices)

- Handwritten-image OCR/import and source-photo storage: Phase 2; D-14 remains a future-phase retention constraint.
- Search and category browsing/management: Phase 3.
- General recipe delete, restore, and trash controls: excluded from Phase 1 by D-15.
- Owner account deletion behavior is not presumed by this skeleton; the execution plan requires a focused decision checkpoint before that flow is implemented.

## Subsequent Slice Plan

Each later phase extends this architecture without silently replacing a choice settled by the Phase 1 gate:

- Phase 2: capture handwritten recipe photos, produce editable drafts, and retain source images with confirmed saved recipes.
- Phase 3: find shared recipes by name, ingredient, and family-managed categories.
