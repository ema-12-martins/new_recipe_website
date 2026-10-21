# Project Research Summary

**Project:** Family Recipe Cookbook  
**Domain:** Phone-first, private shared family cookbook with handwritten-recipe capture  
**Researched:** 2026-10-20  
**Confidence:** LOW

> **Research limitation — read before using these recommendations:** The researchers report that web-search credentials/providers and some research tools were unavailable. Stack and feature research are explicitly low confidence; competitor claims are limited to vendor-published pages, and findings have not been independently reverified during this synthesis. Treat citations and access-date package versions below as inherited report references, not newly checked facts. In particular, no OCR provider has been benchmarked on this family's recipes, and no stack choice is user-approved. Use the research to frame validation and roadmap decisions, not to lock vendors or versions.

## Executive Summary

This is a greenfield phone-first online cookbook for one family: people need to add, edit, and find shared recipes, including by photographing handwritten originals. The defining accuracy constraint is that recognition must create an editable, visibly unconfirmed draft; a person compares and corrects title, ingredient lines, and instructions before explicitly saving. Name, ingredient, and category search, private family sharing, and a comfortable phone experience are requirements from `.planning/PROJECT.md`, not optional enhancements. Meal planning, shopping lists, and public/community features are out of scope for the initial product.

The reports converge on a small, layered application with a family-scoped recipe model, private source-image storage, an editable draft/review lifecycle, and search derived from canonical recipe data. The stack report recommends Expo/React Native, Supabase/Postgres, and a server-side Google Cloud OCR/structured-extraction path, but this is a proposal only. Architecture research also considers a responsive PWA, Firebase, and simpler monolith-first approaches; the mobile distribution model, account model, OCR provider, offline behavior, and retention policy remain unsettled. Decide these through product clarification and focused validation before committing implementation.

The highest risk is plausible OCR error—especially quantities, fractions, units, temperatures, and field ordering—combined with the possibility of losing or exposing the original image. Benchmark representative, permissioned family samples and keep a manual-entry path, source-image comparison, explicit human review, and private access controls. Establish the family access, recipe schema, locale/source-text handling, and image-retention policy early; defer offline conflict machinery and operational complexity until their actual need is established.

## Key Findings

### Recommended Stack

The detailed stack proposal is in [STACK.md](STACK.md). **None of these recommendations has been selected or approved by the project owner.** It proposes:

- **Expo + React Native + TypeScript and Expo Router/ImagePicker** for phone-oriented capture and cross-platform screens; its cited registry versions are snapshots, not compatibility guarantees. Expo's own package installer/check should resolve the SDK-compatible versions if this route is chosen.
- **Supabase Auth, PostgreSQL, and private Storage** for family-scoped identity, relational recipes/ingredients/categories, and image assets. Apply RLS and Storage policies at the data boundary; never ship privileged service credentials in the client.
- **PostgreSQL full-text search plus `pg_trgm`** as a plausible starting point for title/ingredient search, category filtering, and optional typo tolerance, rather than adding a standalone search service before need is measured. Confirm extensions, text configuration, language/diacritic behavior, and deployed database version.
- **A server-side OCR/extraction service**; the proposed combination is Cloud Run with Document AI and Vertex AI structured output. Keep provider credentials server-side and use extraction only to propose fields, not to certify their correctness or save final recipes.

There is a material provider uncertainty: STACK.md recommends Google Document AI as the handwriting OCR candidate, whereas PITFALLS.md cites Google Cloud Vision documentation for OCR structure, handwriting detection, and image limits. Neither provider has been evaluated on the family's source material. The stack report itself allows switching based on benchmark results. Compare candidates and any appropriate alternatives on actual handwriting, languages/scripts, field-critical errors, latency, cost, privacy terms, and region before selecting one. Likewise, decide native app versus PWA only after clarifying app-install tolerance and testing camera behavior on target phones.

### Expected Features

The detailed feature landscape is in [FEATURES.md](FEATURES.md). The project brief is stronger evidence for launch scope than the low-confidence competitor-derived “table stakes” claims.

**Must have (project requirements and launch-critical workflow):**
- Shared online family collection with members able to add, view, and edit recipes; define membership and permissions rather than treating sharing as a public link.
- Phone-friendly manual recipe entry, detail, and editing, with a forgiving structure for title, ingredient lines, and ordered instructions.
- Phone camera/photo-library intake for a handwritten recipe that produces an editable draft.
- Source image available during review; clearly distinguish OCR candidate from saved recipe and require human correction/review plus explicit save.
- Search and browsing by recipe name, ingredient, and category; model these fields so each is actually searchable.
- Manual transcription and recovery when photo capture, OCR, or connectivity fails.

**Should have / differentiators, based on need and validation:**
- A source-image-first review experience, legible small-screen controls, and actionable correction/retake/crop/rotate paths.
- Basic, family-friendly categories and lightweight contributor attribution; optional tags/favorites only if inexpensive and useful to the family.
- Reliable shared updates with clear save/sync state. Robust retry/idempotency and recoverable edits matter; simultaneous collaborative editing does not appear necessary for the stated scope.

**Defer (v2+ or until demonstrated need):**
- Meal planning, shopping lists, public publishing/community feed, nutrition/recommendations, and extensive cooking tools.
- Rigid quantity parsing, automatic unit conversion, or recipe scaling as a prerequisite to capture; preserve original wording first.
- Real-time co-editing, comprehensive offline-first editing/conflict resolution, a dedicated search vendor, and extensive revision-history UI until usage or user decisions justify the cost.
- Automatic destructive duplicate merging. At most, consider reversible, user-reviewed duplicate suggestions after real family use.

### Architecture Approach

Architecture research ([ARCHITECTURE.md](ARCHITECTURE.md)) recommends clear boundaries, not a settled implementation topology: a phone client, authenticated application/API boundary, family/recipe domain, image object storage, relational recipe persistence, OCR/extraction workflow, review lifecycle, and searchable projection. Keep image bytes separate from canonical recipe records. Treat saved, human-confirmed recipe data as the source of truth; OCR output and raw recognized text are draft/provenance, never an overwrite of user corrections. Make import/retry and any indexing operations idempotent and recoverable.

**Major components:**
1. **Phone client:** capture/select images; manual recipe CRUD; browse/search; present editable OCR review fields and source image; show meaningful save or processing status.
2. **Identity and family authorization:** authenticated member identity and explicit family membership/permissions, enforced on every recipe, search, API, and image operation—not solely in UI logic.
3. **Recipe and draft domain:** family-scoped records, ordered ingredient lines and instructions, categories, source references, creator/reviewer and clear draft-to-confirmed transitions; preserve original wording and relevant provenance.
4. **Image ingestion and extraction:** validate/store private image assets; submit bounded, retry-safe OCR work; retain failures as recoverable drafts; keep OCR and any structured parsing separate from final recipe approval.
5. **Persistence, search, and synchronization:** relational source of truth and searchable title/ingredient/category fields; refresh or notify family devices. Add local queues/conflict resolution only after defining the offline requirement and chosen store semantics.

**Patterns to follow:** separate OCR text recognition from recipe-field mapping; make draft review an explicit state transition; preserve source image/raw extraction alongside edits subject to an agreed retention policy; authorize at each backend/storage boundary; test create/edit/delete/retry search consistency; avoid irreversible deduplication. Architecture prose favors background OCR jobs and offline queues, while STACK.md recommends deferring queues and offline-first work until justified. Reconcile this by designing an asynchronous/recoverable draft state, but choose the simplest execution mode that meets measured latency and reliability needs.

### Critical Pitfalls

Top concerns from [PITFALLS.md](PITFALLS.md), prioritized for this project:

1. **Plausible handwriting/photo OCR errors and bad field mapping** — amounts and instructions can be wrong while output looks fluent. Benchmark a representative, permissioned family corpus; test critical-field corrections, not just OCR success; show the source beside editable fields; retain unassigned text visibly and provide manual entry.
2. **Auto-save or misplaced trust in confidence scores** — structured output or a score is not correctness. Keep every OCR import in an unconfirmed state until a person reviews and explicitly saves it; use confidence only as a review cue if validated.
3. **Family privacy and image retention** — guessed IDs, permissive storage, logs, or indefinite retention can expose private images/recipes. Decide membership, permissions, provider/data region and image lifecycle; enforce access server-side and in storage; test cross-family access and deletion paths.
4. **Recipe fidelity and data loss** — locale-sensitive quantities, duplicate family variants, or offline edits can silently alter or overwrite a recipe. Preserve source ingredient wording and attribution, keep variants distinct by default, make retries idempotent, and explicitly define whether offline editing/concurrent edits are in MVP.
5. **Unreliable search and capture operations** — title-only/stale indexes, permission denial, slow OCR, upload limits, and unbounded retries undermine the core experience. Test name/ingredient/category create-edit-delete behavior, real phone capture states, visible progress/recovery, and bounded retries/cost.

## Implications for Roadmap

Suggested roadmap grouping (not a commitment to phase count or sequencing):

### Phase 1: Shared cookbook foundation and product decisions
**Rationale:** OCR field mapping, search, and sharing all depend on a stable schema and access boundary; real family data should not be loaded before privacy and membership are clear.  
**Delivers:** Resolve app delivery choice (native vs PWA), member/account and invite/edit permissions, initial locales, source-image retention, and online/offline expectations. Establish recipe/draft schema and family authorization; implement the minimal phone-friendly manual add/view/edit shared cookbook path. Keep a simple modular implementation and avoid premature service decomposition.  
**Addresses:** Shared online cookbook, phone-friendly CRUD, basic recipe structure, manual fallback, attribution sufficient for access/audit. Make title, ingredient, and category fields explicit in the model from the start.  
**Avoids:** Client-only authorization; lossy quantity normalization; unexamined image retention; choosing a platform without understanding install expectations; silently overwriting concurrent changes.  
**Research flag:** **Needs focused validation** for user decisions and stack/PWA/native trade-offs. Do not adopt the STACK.md combination or version pins as approved facts.

### Phase 2: Phone photo intake and human-reviewed OCR draft
**Rationale:** Handwriting recognition is a core user need but the least validated and highest technical/product risk. The recipe shape and access controls from Phase 1 give OCR safe destinations and boundaries.  
**Delivers:** Camera/library intake, private image upload, processing and failure states, a draft with extracted title/ingredients/instructions, and a phone-usable editor that compares against the source image. No final recipe is created until deliberate user review and save; manual entry remains available.  
**Addresses:** Handwritten-image capture, source-image-first correction, structure-aware review, explicit save, robust retake/retry paths.  
**Avoids:** Auto-saving generated fields, mistaking OCR confidence for truth, losing unmapped text, processing images without retention/provider decisions, uncontrolled billable retries.  
**Research flag:** **Must research/spike during planning**: compare OCR providers (including the differing Vision vs Document AI suggestions) on representative images and relevant languages; assess field-critical accuracy, model/parser behavior, cost, latency, privacy terms, region, and quotas. Validate any image resizing using recognition quality. Vendor documentation cannot establish family-specific accuracy.

### Phase 3: Search, categories, and shared retrieval
**Rationale:** Search quality depends on confirmed recipe fields and category choices. Build and verify it against the canonical model rather than retrofitting a free-text blob or operating a second index prematurely.  
**Delivers:** Recipe list/detail and useful category browsing; search by title, ingredient, and category; family-visible updates and consistent results after create, edit, recategorize, and delete. Add partial/fuzzy matching only if test queries show it helps.  
**Addresses:** Required retrieval, basic categories, shared use, and search integrity.  
**Avoids:** Title-only indexing, stale/deleted results, premature dedicated search infrastructure, and treating search failure as proof no recipe exists.  
**Research flag:** **Mostly standard patterns** once database and locale choices are made. Research language/diacritic behavior and test real family terms; deeper search-engine research is not indicated absent measured limits.

### Phase 4: Reliability, privacy, and release readiness
**Rationale:** Validate operational and device-level risks before inviting the family to rely on the archive; add complexity based on explicit requirements and test results.  
**Delivers:** Authorization and storage-negative tests, backup/deletion/retention checks, phone usability and permission testing on actual target devices, OCR failure/manual fallback, retry and cost monitoring, and defined synchronization semantics. Add offline queue/conflict handling only if offline use is confirmed as necessary.  
**Addresses:** Trustworthy shared access, kitchen usability, recovery, image lifecycle, family rollout readiness.  
**Avoids:** Public/long-lived image access, silent sync overwrite, duplicate imports after retries, hidden camera failures, and spending on unneeded offline/search infrastructure.  
**Research flag:** **Needs targeted research** only for selected provider terms/pricing/limits, actual offline store conflict semantics, jurisdiction/retention requirements, and release platform constraints. These decisions cannot be inferred from current reports.

### Phase Ordering Rationale

- Settle family membership, recipe schema, locale/source fidelity, and source-image handling before OCR; OCR drafts need explicit fields and a safe private lifecycle.
- Deliver useful manual recipe management and basic shared access without making the high-risk OCR provider a blocker for validating the core cookbook.
- OCR remains launch-critical according to the project context, so Phase 2 should be completed and validated before calling the initial product ready; it is not a v2 feature.
- Build search over the final recipe model and categories, then validate edits/deletions and family visibility. A native database search is the proposed simplest starting point, but depends on chosen persistence technology.
- Defer offline-first machinery, event choreography, live collaboration, broad feature suites, and standalone search until concrete requirements justify them. If project owners require offline capture in the first release, revisit this ordering and phase scope.

### Research Flags

**Likely needs deeper research or a spike during planning:**
- **Phase 1:** Native Expo app vs responsive PWA, app-install tolerance, account/membership model, locales, image retention, and online-only vs offline needs. Stack reports conflict on the app form and architecture report explicitly leaves it open.
- **Phase 2:** OCR provider/model choice and family-sample benchmark; Vision is referenced by PITFALLS while Document AI is proposed in STACK. Also validate structured extraction separately from OCR and confirm privacy, regional availability, quotas, cost, and latency.
- **Phase 4:** Chosen provider's current terms/limits and chosen persistence layer's exact sync/conflict behavior; clarify applicable privacy/legal requirements rather than treating research notes as legal advice.

**Likely standard patterns after decisions:**
- **Phase 1:** Basic recipe CRUD and family-scoped authorization are established design patterns; implementation-specific policy tests remain mandatory.
- **Phase 3:** Relational search indexes and category filters are established patterns. Validate actual language, accented terms, and family queries; no evidence supports a separate search vendor at this scale.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | LOW | STACK.md rates itself LOW. Search credentials/provider were unavailable; package versions are access-date snapshots and compatibility/deployment must be checked. Recommendations are not approved decisions. |
| Features | LOW | FEATURES.md rates itself LOW. Core scope is strongly grounded in the project brief; broader “expected” claims derive from limited vendor feature pages and cannot establish market-wide demand or product quality. |
| Architecture | MEDIUM (capped) | ARCHITECTURE.md rates itself MEDIUM and offers coherent component boundaries, but still lists unresolved PWA/native, identity, offline, and topology alternatives. The access limitations and lack of product decisions lower confidence for implementation choice. |
| Pitfalls | MEDIUM (capped) | PITFALLS.md rates itself MEDIUM; it distinguishes cited evidence from recommendations and identifies relevant failure modes. It does not benchmark this family's OCR, settle costs/legal obligations, or choose stack; researchers' search/tool limitations mean sources need checking at decision time. |

**Overall confidence:** LOW. Highest confidence is in the user-stated requirements and dependencies between them, not in vendor choices, competitor expectations, OCR performance, or operational assumptions.

### Gaps to Address

- **No project state file:** `.planning/STATE.md` was not present when reports were prepared; scope was taken from `.planning/PROJECT.md`. Reconfirm roadmap scope against current project state before phase planning.
- **No approved stack or distribution model:** Ask whether family members must install an app or use a web link; compare the proposed Expo/Supabase/Google route with a PWA or alternatives before selection.
- **No representative OCR benchmark:** Build a permissioned sample set spanning actual handwriting, layouts, image quality, languages, fractions, and units; score recipe-critical fields and human corrections.
- **No identity, role, invite, or removal policy:** Define who can view/add/edit/delete/invite and what happens when membership changes.
- **No locale and image lifecycle decision:** Clarify languages, measurement conventions, original-photo retention, deletion, provider processing, region, and who can view images.
- **No offline/concurrency or usage targets:** Confirm whether capture/edit must work offline and estimate device count, recipe volume, and concurrent use; this determines whether queues/conflict resolution or extra infrastructure are warranted.
- **No validated dynamic vendor facts:** Recheck current versions, regional service support, pricing, quotas, data-processing terms, and runtime compatibility only after candidate services are identified.

## Sources

This synthesis aggregates report citations without independently re-fetching or verifying them. URLs and specific claims are recorded in the source reports; in particular, the researchers noted that web-search credentials/tools were unavailable. Source claims should be rechecked during the flagged planning work.

### Project and research reports

- `.planning/PROJECT.md` — authoritative project context, active requirements, out-of-scope items, and pending decisions (read 2026-10-20).
- `.planning/research/STACK.md` — proposed technologies, version snapshots, and stack alternatives; LOW confidence.
- `.planning/research/FEATURES.md` — launch feature landscape, anti-features, competitor claims, and feature dependencies; LOW confidence.
- `.planning/research/ARCHITECTURE.md` — architecture options, component boundaries, build order, and cited vendor/platform documentation; MEDIUM confidence.
- `.planning/research/PITFALLS.md` — OCR, authorization, locale, sync, privacy, search, capture, and operational pitfalls; MEDIUM confidence.

### Primary and official references cited in reports

- Expo documentation and npm registry pages — platform, ImagePicker, SDK-compatible dependency installation, and version snapshots (STACK.md).
- Supabase documentation — PostgreSQL full-text search, Row Level Security, and Storage access policies; PostgreSQL full-text search and `pg_trgm` documentation (STACK.md, PITFALLS.md).
- Google Cloud Document AI, Cloud Vision OCR/handwriting/limits/pricing/quotas, Vertex AI structured output, and Google Gen AI SDK references (STACK.md, PITFALLS.md). These establish only the capabilities described in those reports, not recipe-specific accuracy.
- Recipe Keeper and Paprika official product pages — advertised product features, not independent evidence of market expectations or quality (FEATURES.md).
- OWASP Authorization and File Upload guidance; Unicode CLDR number/unit guidance; Firebase Firestore offline behavior; ICO data-protection principles; MDN camera permission documentation; W3C WCAG target-size guidance (PITFALLS.md).
- Google Cloud Vision, Azure AI Vision, AWS Textract/S3, Firebase Authentication, OpenID Connect, PostgreSQL, MDN PWA, Android storage, and Apple lifecycle documentation (ARCHITECTURE.md). Their inclusion documents architectural options; it does not imply a vendor selection.

---
*Research completed: 2026-10-20*  
*Ready for roadmap: yes, with the validation flags and unresolved decisions above*
