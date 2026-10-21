# Phase 1 Multi-Source Coverage Audit

Audit scope: approved Phase 1 ROADMAP goal, all Phase 1 requirement IDs, applicable Phase 1 research features/constraints, and every locked decision D-01 through D-21. Deferred and other-phase items are called out as boundaries, not silently omitted.

## Goal and requirements

| Source | ID | Item | Plan | Status / evidence target |
|---|---|---|---|---|
| GOAL | — | Family members privately access one shared cookbook and manually create, view, and edit recipes across devices using a phone-first app. | 01-03 through 01-07 | COVERED; end-to-end tracer, family-scoped tests, recipe, and offline/device acceptance. |
| REQ | AUTH-01 | Individual account creation/use. | 01-03, 01-06 | COVERED; email/password account and session behavior. |
| REQ | AUTH-02 | Owner invites family members and removes access. | 01-04 | COVERED; invite lifecycle and D-10 removal review. |
| REQ | AUTH-03 | Invited members view, add, and edit shared recipes. | 01-03, 01-04, 01-05 | COVERED; family membership applies to all members. |
| REQ | AUTH-04 | Same shared recipes accessible across devices. | 01-03, 01-07 | COVERED; canonical server state, second-device refresh, offline cache semantics. |
| REQ | RECP-01 | Manually create/view/edit title, ingredients, ordered instructions. | 01-03, 01-05 | COVERED; full recipe workflow and persistence. |
| REQ | RECP-03 | Any family member edits any saved recipe. | 01-05 | COVERED; authorization is family membership, not creator identity. |

## Research features and constraints

| Research item | Plan | Status / evidence target |
|---|---|---|
| LOW confidence; no framework, identity vendor, backend, store route, or OCR vendor selected | 01-01, 01-02, 01-03 | COVERED; provisional spike then explicit final decision; no candidate treated as approved. |
| Installable on both iOS and Android; actual build/install/store-track evidence required | 01-01, 01-02, 01-07 | COVERED; physical iPhone and Android evidence recorded separately; no completion claims without evidence. |
| Email/password identity, first signup becomes cookbook owner; no shared family credential | 01-03 | COVERED. |
| Invitation identity must match verified invited email; expiry/resend/revocation; owner-only invite management | 01-04 | COVERED; seven-day expiry from D-19. |
| Family authorization enforced at backend/data boundary, not only by client UI | 01-03 through 01-06 | COVERED; negative cross-family, signed-out, removed-member, and owner-only authorization tests. |
| Account deletion distinct from owner member removal; regular-member retention/anonymization and store-required account-deletion paths | 01-06 | COVERED; D-17 policy; owner case remains a blocking decision checkpoint; current Apple/Google requirements rechecked before release. |
| Read-only offline cache, account scoping, sign-out purge, reconnect authorization; no offline write queue; accepted stale cache interval | 01-07 | COVERED; D-03, D-04, D-18. |
| Recipe text losslessness; free-text ingredient lines; ordered, rearrangeable steps; non-drag accessible reordering | 01-05 | COVERED; D-11, D-12, D-13, D-20. |
| Private original-creator metadata solely for D-10 workflow; no normal contributor attribution | 01-04, 01-06 | COVERED; D-10, D-21. |
| Concurrent first-owner bootstrap and stale edit handling need explicit behavior | 01-03, 01-06 | COVERED; atomic owner creation and revision-aware conflict handling are tested. |
| No privileged backend credentials in the mobile binary; supported identity/crypto/secure transport; server-side authorization | 01-02 through 01-07 | COVERED in task actions and STRIDE mitigations. |
| No framework/vendor package install before a package legitimacy audit; `[ASSUMED]`/`[SUS]` need a blocking human registry check; `[SLOP]` forbidden | 01-02 | COVERED; refresh the research audit after the candidate is chosen and before installation. |
| Source-photo preservation applies when Phase 2 imports a recipe; no Phase 1 OCR/photo implementation | Phase 2 boundary | EXCLUDED from Phase 1 scope, not dropped: D-14 and RECP-02 are assigned to Phase 2. |
| Search/categories are Phase 3 | Phase 3 boundary | EXCLUDED from Phase 1 scope, not dropped: requirements SRCH-01..03 are assigned to Phase 3. |
| Account deletion versus shared recipes, offline revocation, invitation lifecycle, UI language, member-removal creator rule | 01-04, 01-05, 01-06, 01-07 | RESOLVED by D-17 through D-21 in CONTEXT; owner-account deletion remains an execution checkpoint. |

## Locked decision traceability

| Decision | Planned coverage |
|---|---|
| D-01 | 01-01/02 platform spike and 01-07 dual-platform acceptance. |
| D-02 | 01-01/03/07 phone-only scope and acceptance. |
| D-03 | 01-07 signed-in cached-only read with notice, writes online-only. |
| D-04 | 01-07 cache purge before sign-out/account switch. |
| D-05 | 01-01/02 decision gate; SKELETON remains explicitly unselected until evidence. |
| D-06 | 01-03 atomic first-signup owner/cookbook bootstrap. |
| D-07 | 01-04 email-targeted guided invite acceptance and new-account join. |
| D-08 | 01-03 individual email/password identity. |
| D-09 | 01-03/04 owner manages access; all active members can view/add/edit. |
| D-10 | 01-04 one-time owner recipe list/keep-or-remove choice during access removal. |
| D-11 | 01-05 preserve Portuguese/English wording, quantities, and units without translation/conversion. |
| D-12 | 01-05 free-text ingredient lines. |
| D-13 | 01-05 separately stored ordered, rearrangeable instructions. |
| D-14 | Phase 2 boundary only; preserve source-photo retention obligation for imported saved recipes; no Phase 1 photo work. |
| D-15 | 01-04/06 explicit scope guard; no general delete/restore/trash. |
| D-16 | 01-02 uses available current phones and developer accounts; evidence is recorded, never assumed. |
| D-17 | 01-06 regular-member account deletion retains shared recipes and removes/anonymizes private creator data. |
| D-18 | 01-07 accepted disconnected-device stale-cache window and reauthorization behavior. |
| D-19 | 01-04 seven-day expiry, owner resend/revoke, verified matching email. |
| D-20 | 01-05 bilingual app interface and source-faithful recipe content. |
| D-21 | 01-04 uses original creator in the one-time removal list, even after another member edits; no ordinary attribution. |

## Spec-less edge-probe assumptions (unresolved; do not claim resolved)

The phase has no SPEC edge-coverage section. All nine supplied probes remain surfaced as flagged implementation assumptions pending observable contract tests; each must be considered in the named plan.

| Requirement | Probe category | Unresolved assumption to verify |
|---|---|---|
| AUTH-01 | idempotency | What happens if account creation runs twice on the same input? |
| AUTH-01 | concurrency | If account bootstrap is interrupted or run in parallel, what is guaranteed? |
| AUTH-02 | idempotency | What happens if an invitation or acceptance runs twice on the same input? |
| AUTH-02 | concurrency | If invitation/acceptance or removal is interrupted or run in parallel, what is guaranteed? |
| AUTH-03 | unclassified | Manually review the requirement for an unclassified edge case; preserve it as unresolved until a test/contract is chosen. |
| AUTH-04 | unclassified | Manually review the requirement for an unclassified edge case; preserve it as unresolved until a test/contract is chosen. |
| RECP-01 | idempotency | What happens if recipe create/update runs twice on the same input? |
| RECP-01 | concurrency | If recipe create/update is interrupted or run in parallel, what is guaranteed? |
| RECP-03 | unclassified | Manually review the requirement for an unclassified edge case; preserve it as unresolved until a test/contract is chosen. |

The implementation plans address retries, interrupted writes, atomic owner bootstrap, and concurrent edits with explicit behavior and automated tests. The three `unclassified` rows remain flagged for manual review in the relevant implementation plan rather than being labelled resolved by a generic test.

## Product prohibitions from user scope (separate from routine security/hygiene)

- Do not use a shared family login (D-08).
- Do not translate recipe text or automatically convert quantities/units (D-11).
- Do not show contributor attribution in ordinary recipe UI (D-10, D-21).
- Do not add general recipe delete, restore, or trash controls to Phase 1 (D-15).
- Do not enable offline recipe mutations; online connectivity is required to edit (D-03).
- Do not bring Phase 2 OCR/source-photo implementation or Phase 3 search/category features into Phase 1 (ROADMAP and D-14/D-15).

These are product decisions. Generic password, authorization, cache-isolation, transport, and input-safety concerns remain in the plans' security threat models and are not misclassified as additional values prohibitions.

## Open execution checkpoint

Before implementing cookbook-owner account deletion, obtain the owner's choice about shared recipe disposition, cookbook ownership/continuity, and private creator metadata. The settled D-17 rule applies to a regular member only and cannot answer that one-way owner-account case. Keep the account-deletion mechanism and platform compliance work in scope; do not omit them.
