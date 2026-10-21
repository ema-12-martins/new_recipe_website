# Pitfalls Research

**Domain:** Phone-first shared family cookbook with handwriting OCR and human-reviewed recipe drafts  
**Researched:** 2026-10-20  
**Confidence:** MEDIUM

## Scope and Evidence Notes

The project is greenfield and no application stack, OCR provider, family role model, or jurisdiction has been selected. `.planning/STATE.md` was not present; the active scope is therefore grounded in `.planning/PROJECT.md` and the project description. Phase names below are proposed roadmap groupings, not existing phase commitments.

**Evidence vs. recommendations:** Statements labeled **Evidence** summarize current official documentation or standards, cited by URL below. **Recommendation** is project-specific engineering guidance inferred from those facts; it is not a claim that a particular vendor or implementation is required. OCR quality on this family's handwriting, total costs, legal obligations, and concurrency needs cannot be established from vendor documentation alone and need validation with representative recipes.

## Critical Pitfalls

### Pitfall 1: Plausible OCR errors from handwriting and poor source photos

**What goes wrong:** A blurry, skewed, shadowed, low-contrast, cropped, or unusually written card yields a believable but incorrect ingredient, quantity, temperature, or instruction. A single digit, fraction bar, unit abbreviation, or negation can change a recipe materially. A successful OCR response is not evidence that the transcription is correct.

**Why it happens:** Handwriting varies by person; recipe cards may be stained, faded, cramped, or photographed at an angle. OCR engines recognize visual text, not the intended cooking meaning. Image processing that downsizes or crops too aggressively can discard distinguishing marks.

**How to avoid:**
- **Evidence:** Google Cloud Vision documents a dense-document OCR mode with page/block/paragraph/word/break structure and a separate handwriting-detection guide; its supported-files guidance recommends minimum image dimensions for best operation and cautions that larger images can reduce throughput without much accuracy gain. These are provider-specific operating notes, not a guarantee for this family's cards. [1][2][3]
- **Recommendation:** Make the original image available beside the draft, with an easy zoom/rotate/retake path. Detect obvious capture problems (blur, glare, clipping, very small text) where feasible and explain how to improve the photo; do not silently “repair” it and hide the result.
- Maintain an image set representative of actual family cards and handwriting. Evaluate character/word error as well as recipe-critical field errors (amounts, units, temperatures, timing); record misses rather than optimizing only average OCR score.
- Preserve image quality enough for recognition and human comparison, while resizing/compressing within the selected service's documented limits. Keep a manual transcription route if OCR fails or is unavailable.

**Warning signs:**
- Test images are clean printed documents rather than the family's handwritten cards.
- OCR looks fluent but has no way for a reviewer to compare each quantity/instruction with the source.
- Retaking a photo does not improve recognition, or preprocessing removes faint strokes/fraction marks.
- The team reports only “OCR success rate” and has no measurement for ingredient/quantity corrections.

**Phase to address:** **Phase 2 — Phone capture and OCR-assisted draft.** Establish the test corpus and capture-quality guidance before accepting OCR as a primary workflow; keep the comparison and correction path in scope through launch.

---

### Pitfall 2: Treating OCR reading order as recipe structure

**What goes wrong:** Text is transcribed but assigned to the wrong field: a note becomes an instruction, an ingredient continuation becomes a new ingredient, headings merge into recipe names, or two columns/sections are read in the wrong order. Amounts and units can become detached from their ingredient.

**Why it happens:** OCR's visual hierarchy is not a recipe schema. A recognizer may expose blocks, lines, words, or symbols and their geometry, but that does not reliably identify “title,” “ingredients,” “method,” or recipe-specific section boundaries. Handwritten cards often use arrows, marginalia, abbreviations, and irregular layouts.

**How to avoid:**
- **Evidence:** Google Cloud Vision's dense-text response includes page, block, paragraph, word, and break information; ML Kit documents text segmentation and confidence at multiple text levels. Those are useful signals, not semantic recipe-field guarantees. [1][4]
- **Recommendation:** Treat field extraction as a separate, fallible parsing step after recognition. Present title, ingredient lines, and instruction text in editable fields; retain unassigned text in a visible “other notes / needs review” area rather than dropping it.
- Keep ingredient records editable as complete source lines initially. If structured quantity/unit/name fields are introduced, show the original line and allow correction of each parsed part; never silently normalize or discard unparsed text.
- Evaluate multi-line and multi-section examples (including cards with notes, crossed-out text, tables, and multiple pages) before deciding the parser is reliable enough to prefill fields.

**Warning signs:**
- Parsed drafts omit OCR-recognized text or move it into a different section without an explicit reviewer signal.
- Ingredients are split or merged inconsistently; amounts become orphaned.
- One “happy-path” card layout is used as the acceptance test.
- The system saves only the interpreted fields and cannot show the recognized source text.

**Phase to address:** **Phase 2 — Phone capture and OCR-assisted draft**, with the recipe-field model agreed in **Phase 1 — Shared cookbook foundation** so capture does not lock in a lossy schema.

---

### Pitfall 3: Confidence scores mistaken for correctness or used to hide review

**What goes wrong:** High-confidence OCR is auto-saved or shown as verified, while a low-confidence score is rendered as a vague warning that users cannot act on. Users overlook a wrong but plausible amount, or correct a value without the system retaining which parts needed review.

**Why it happens:** Confidence values are model/provider-specific signals, not calibrated probabilities that a whole recipe is correct. A score for a symbol or word does not capture field-level meaning or whether “1/2” was understood as “1 2.” Thresholds that work on printed text may fail on family handwriting.

**How to avoid:**
- **Evidence:** ML Kit states that its text recognizer returns confidence scores together with recognized text and geometric/structural information for detected elements. It does not establish a universal threshold or guarantee recipe-level correctness. [4]
- **Recommendation:** Require a deliberate human save/confirmation step for every OCR draft, as the project specifies. Use confidence only to prioritize review (for example, visually flag uncertain spans), not to mark the recipe “correct.”
- Make correction local: let a person tap/edit the affected ingredient or instruction while seeing its source region. Keep the entire draft editable and avoid forcing a restart when one field is wrong.
- Record source image, raw OCR output, edited final text, and review status as distinct data where retention policy permits. Measure correction rates per field and tune flags on a representative set; do not invent universal confidence cutoffs.

**Warning signs:**
- Low-confidence text is hidden, removed, or automatically replaced with a “best guess.”
- The UI says “verified” merely because OCR returned a result.
- Reviewers must retype a whole recipe to fix a small transcription error.
- No data exists about how often people correct OCR or which fields are risky.

**Phase to address:** **Phase 2 — Phone capture and OCR-assisted draft.** Human review is a product acceptance criterion, not a later polish item.

---

### Pitfall 4: Recipe duplicates confused with legitimate family variants

**What goes wrong:** Repeated imports create confusing duplicates in search, or an automatic deduplicator merges two distinct versions (for example, a relative's altered quantity or a “holiday” variant) and destroys provenance. Conversely, a duplicate suggestion may be missed because titles differ.

**Why it happens:** Family recipes are commonly recopied, renamed, attributed to different relatives, or changed over time. Similar title and ingredients do not prove that two records are the same recipe. OCR noise makes exact-match checks unreliable.

**How to avoid:**
- **Recommendation:** Use a “possible duplicate” review, not destructive automatic merging. Compare normalized title plus ingredient/method similarity, but retain original text, author/source attribution, and variant relationship.
- Let users explicitly keep separate recipes, link a variant, or merge after reviewing both. Merges should be reversible or recoverable from history.
- Make duplicate checking idempotent across retries of the same photo/import so network retries do not create extra records; keep source-image/import identity separate from recipe identity.

**Warning signs:**
- A title match alone triggers deletion or merge.
- Two family members' edits disappear after deduplication.
- Re-uploading after a timeout creates a second recipe.
- Search results cannot distinguish original from a family variant.

**Phase to address:** **Phase 1 — Shared cookbook foundation** for identity, attribution, version/history and retry-safe creation; user-facing duplicate suggestions can follow in **Phase 3 — Find and maintain recipes**.

---

### Pitfall 5: Locale and measurement ambiguity silently changes recipe meaning

**What goes wrong:** Decimal commas/points, fraction notation, unit abbreviations, or regional names are interpreted incorrectly. An ingredient is converted, rounded, or displayed in a way that changes the family recipe; users in different locales see confusing or ambiguous quantities.

**Why it happens:** A string such as `1,5`, `1 1/2`, `1/2`, `oz`, `fl oz`, `c`, or `tsp` depends on context and locale. OCR compounds the ambiguity. Locale-aware display and parsing are not interchangeable with a safe conversion of a handwritten source.

**How to avoid:**
- **Evidence:** Unicode CLDR's number and unit guidance documents locale-specific number patterns and parsing considerations; it warns that ambiguous decimal/group separators can make parsing unreliable. [5]
- **Recommendation:** Store the original ingredient text verbatim and record the recipe's source locale/units when known. Treat normalized quantity, unit, and ingredient name as editable derived fields—not a replacement for the original.
- Do not convert units on import. If conversion is later added, make it explicit, reversible, and clear about volume-vs-weight assumptions; preserve the unconverted source and show the chosen locale.
- Test actual family formats, including mixed units and handwritten fractions. Ask the project owner which locales the initial family needs; the current project context does not specify one.

**Warning signs:**
- The database stores only a parsed numeric quantity and normalized unit.
- Decimal or fraction interpretation changes with device locale without being visible.
- Conversion is automatic and there is no way to return to the source amount.
- Test recipes cover only one measurement system.

**Phase to address:** **Phase 1 — Shared cookbook foundation** for preserving source values and locale metadata; test display/parsing in **Phase 3 — Find and maintain recipes**.

---

### Pitfall 6: Family sharing authorization is enforced only in the interface

**What goes wrong:** A signed-in user can access another household's recipe/image by changing an identifier or calling an endpoint directly; an invitation or shared link grants broader access than intended. A family cookbook unintentionally becomes public.

**Why it happens:** “Shared with family” is a tenant boundary, not just a shared screen. Client-side hiding of edit/delete buttons does not enforce access on the server or in storage rules. Permission expectations (view, add, edit, remove, invite) have not been explicitly decided.

**How to avoid:**
- **Evidence:** OWASP Authorization guidance recommends least privilege, deny-by-default, and permission checks on every request; it also warns that guessed/tampered identifiers must not bypass authorization. [6]
- **Recommendation:** Model an explicit cookbook/household membership and roles before building invitations. Enforce membership and allowed actions at every API/data-storage boundary, including original images and downloads. Do not rely on unguessable IDs as authorization.
- Write tests for cross-household reads, writes, deletes, search results, image URLs, stale invitations, and removed members. Default unauthenticated/unmatched access to denied.
- Keep the initial model deliberately small (for example, owner/member) unless project discovery confirms a need for more roles; document who can invite, edit, and delete.

**Warning signs:**
- All records are readable to any authenticated user, or “private” is achieved only by hiding links.
- A recipe ID or image URL can be reused while signed into a different account.
- No negative authorization tests exist.
- The product team cannot answer what happens when a family member is removed.

**Phase to address:** **Phase 1 — Shared cookbook foundation**, before real family data or sharing links are used.

---

### Pitfall 7: Concurrent edits or offline sync silently overwrite family work

**What goes wrong:** One person's update replaces another's newer correction; an offline device resurrects deleted text; a retry creates duplicate records; the UI appears synchronized when changes are still pending. This is especially damaging if one member is correcting an OCR draft while another edits it.

**Why it happens:** “Cloud synced” does not mean conflict-free. Data stores differ in offline, merge, and concurrency behavior, and a single recipe document may be overwritten as a whole even if two users edited different fields.

**How to avoid:**
- **Evidence:** Cloud Firestore's offline documentation explicitly says multiple changes to the same document resolve with “last write wins.” This is one vendor's behavior, not a universal database rule; it demonstrates why the selected store's semantics must be checked. [7]
- **Recommendation:** Define conflict behavior in the product before enabling offline edits. At minimum, show pending sync state and preserve a recoverable prior version. Consider field-level merge only where semantics are clear; otherwise detect concurrent edits and offer comparison/keep-both resolution rather than silent replacement.
- Make create/import operations retry-safe, distinguish deletion from stale offline updates, and test simultaneous edit, delete/edit, reconnect, and app restart scenarios on actual target devices.
- If offline editing is not required for MVP, state that clearly and avoid implying that unsynced changes are safely shared.

**Warning signs:**
- Editing works offline in a demo, but no conflict policy has been written down.
- Saving an old copy replaces a newer full recipe.
- No visible “saving / synced / failed” status or recovery path exists.
- Conflict behavior is assumed from the chosen vendor's marketing rather than its documented semantics.

**Phase to address:** **Phase 1 — Shared cookbook foundation** for data/versioning semantics and the minimum sync contract; validate with multi-device tests before family rollout.

---

### Pitfall 8: Original recipe photos are retained or exposed without a deliberate policy

**What goes wrong:** Images remain indefinitely after transcription, deletion from the cookbook does not remove the stored original, or images are exposed through logs, public object URLs, backups, or a third-party OCR service. A photo may contain names, annotations, or image metadata the family did not intend to share.

**Why it happens:** Image retention is treated as an implementation detail even though source images are necessary for review but may contain more information than the final recipe. Storage, OCR processing, backup, and deletion paths are often separate.

**How to avoid:**
- **Evidence:** The ICO's data-protection-principles guidance describes data minimization and storage limitation as principles under UK GDPR. Applicability depends on where the service and users are located; this research does not determine legal obligations for the project. Google Vision documents region-specific endpoints for certain data-locality needs. [8][1]
- **Recommendation:** Decide whether the original is retained after review, who can see it, how long it is kept, and how a user can remove it. Document what the OCR provider receives and its applicable processing/retention terms before choosing a service.
- Keep image access private and authorized like recipe access; use short-lived access mechanisms where appropriate. Avoid placing image contents, long-lived URLs, or personal annotations in application logs. Strip unnecessary metadata on upload if the product does not need it, while retaining the source image only under the chosen policy.
- Test deletion across recipe records, object storage, generated thumbnails, caches, and backup/retention behavior; explain any delay before backup expiry.

**Warning signs:**
- There is no answer to “is the original photo kept after I save the recipe?”
- Deleting a recipe leaves a retrievable image behind.
- OCR is performed by a provider whose data handling, region, and billing terms have not been reviewed.
- Production logs or analytics include full image URLs, recognized private notes, or recipe contents unnecessarily.

**Phase to address:** **Phase 1 — Shared cookbook foundation** for privacy/access/retention decisions; verify the actual end-to-end deletion path in **Phase 4 — Reliability and release readiness**.

---

### Pitfall 9: Search indexes omit or retain stale recipe content

**What goes wrong:** A newly saved ingredient is not searchable, an edited/deleted recipe remains in results, or search by ingredient/category works only for the title. Search behavior diverges from the saved recipe after asynchronous indexing or partial failures.

**Why it happens:** Search may be a derived index or denormalized representation. Updating the recipe and index are separate operations unless the chosen architecture maintains them together. Indexing only title/body text does not reliably provide meaningful ingredient/category filtering.

**How to avoid:**
- **Recommendation:** Decide which fields are searchable and model ingredient/category fields explicitly. Treat the saved recipe as the source of truth; make index updates/rebuilds repeatable and observable. For a small family collection, begin with the simplest native query/index capability that meets tested needs rather than adding a separate search service prematurely.
- Test create, edit, recategorize, delete, and retry paths against search results, including accented names, plural/variant ingredient terms, and common misspellings if fuzzy search is desired.
- Provide a fallback/error state if an index is delayed; never imply that “no results” means no saved recipe when indexing is unhealthy.
- **Evidence:** Database search documentation (for example, PostgreSQL's official full-text-search guide) illustrates that parsing, indexing, and index maintenance are explicit parts of a search design; it is an example, not a stack recommendation. [9]

**Warning signs:**
- Search is tested only immediately after adding data on one device.
- A recipe's title is indexed but ingredients or category are not.
- The search index cannot be rebuilt from canonical recipe records.
- Deleting a recipe hides it in the UI but it remains discoverable in search.

**Phase to address:** **Phase 3 — Find and maintain recipes**, after the recipe schema and shared access model are stable.

---

### Pitfall 10: OCR cost, latency, quotas, or connectivity break the capture flow

**What goes wrong:** A user waits without feedback, an image upload exceeds service limits, repeated retakes/retries trigger repeated billable requests, or a quota/network/provider failure leaves a half-created draft. The project learns the actual per-recipe cost only after launch.

**Why it happens:** OCR is an external dependency with request limits, pricing, payload constraints, and variable network/service latency. Camera images can be much larger than expected; blindly sending original-size images or retrying requests can multiply cost.

**How to avoid:**
- **Evidence:** Google Vision's current supported-files guide specifies image-size/request limits and recommends reducing file size to improve latency without degrading quality; its quotas and pricing are separate, provider-maintained pages. Exact limits/prices change and must be rechecked for the selected service and date. [2][10][11]
- **Recommendation:** Before provider selection, compare handwriting performance on the family corpus, supported scripts, data handling, expected latency, quotas, pricing, and mobile/offline options. Estimate cost using expected images and retry behavior rather than extrapolating a vendor headline.
- Show an explicit processing state, allow cancellation/retake, and preserve the captured image/draft when OCR times out. Offer retry and manual entry, with bounded backoff/idempotency so a double tap or network retry does not create duplicate charges/records.
- Resize only after quality validation. Instrument request count, duration, failures, image size, and estimated spend without logging recipe contents; configure provider budget/quota alerts where offered.

**Warning signs:**
- OCR call blocks the camera screen with no progress or cancellation.
- A retry reprocesses the same image repeatedly with no cap or status.
- The implementation assumes a fixed image limit or price without checking current vendor docs.
- No manual fallback exists for unsupported handwriting/scripts or an outage.

**Phase to address:** **Phase 2 — Phone capture and OCR-assisted draft** for provider spike, failure states, and budget estimate; monitor in **Phase 4 — Reliability and release readiness**.

---

### Pitfall 11: Phone capture is technically available but awkward in real kitchens

**What goes wrong:** Users cannot grant camera permission, capture with one hand, frame a full card, retake a blurry image, upload multiple pages, or recover after a call/network interruption. A desktop-oriented upload control makes the main phone workflow feel like a workaround.

**Why it happens:** Camera access and permissions vary by browser/device; kitchen use brings glare, low light, motion, small screens, and interruptions. The “take photo” happy path hides denial, cancellation, unsupported browser, and upload failure states.

**How to avoid:**
- **Evidence:** MDN documents that browser `getUserMedia()` requires a secure context and user permission. WCAG 2.2's target-size criterion sets a 24-by-24 CSS-pixel minimum subject to stated exceptions; this is an accessibility floor, not proof that controls are comfortable for one-handed capture. [12][13]
- **Recommendation:** Make capture and photo-library selection both viable on phones. Explain why camera access is needed, handle denial without trapping the user, support retake/crop/rotate, and keep a draft if the user leaves or the network fails.
- Use large, separated primary controls, legible contrast, and short-step review screens; validate on small iOS/Android devices with real family users, not only responsive desktop emulation.
- Consider multiple images/pages and a clear “add another page” step before OCR; do not assume every recipe fits one frame. Do not promise live camera scanning until performance and support are demonstrated.

**Warning signs:**
- Permission denial leaves a blank page or requires browser-settings expertise.
- The capture button is hard to reach/use one-handed or is near destructive controls.
- The user cannot tell whether the photo was taken, uploaded, or recognized.
- Review and correction fields require pinch-zoom or long unbroken text entry.

**Phase to address:** **Phase 2 — Phone capture and OCR-assisted draft**, with device and accessibility testing as acceptance criteria.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store only OCR-parsed fields; discard raw text/source association | Simpler model | Cannot audit/correct parsing loss or compare a disputed recipe with its source | Never for OCR imports; retain the minimum provenance allowed by the image-retention policy |
| Automatically merge recipes that look similar | Fewer apparent duplicates | Destroys family variants and source attribution | Never as an irreversible default; user-confirmed merge may be acceptable |
| Save one whole recipe document with last-write-wins and no version history | Fast implementation | Silent loss of edits and difficult recovery | Only if concurrent/offline editing is explicitly out of scope and a tested no-loss policy exists |
| Hard-code one locale or convert quantities during import | Simplifies initial display | Makes mixed family recipes ambiguous and source values unrecoverable | An explicit single-family locale may simplify display, but preserve the original text |
| Reprocess every retry as a new OCR job | Easy retry implementation | Duplicate charges, duplicate records, and confusing drafts | Never; use request/draft identity and idempotent behavior |
| Keep source images forever “just in case” | Easier support and later reprocessing | Unbounded exposure, storage, and unclear deletion expectations | Only with an explicit, reviewed retention purpose and access policy |
| Add a standalone search engine before measuring collection needs | Advanced search features | More sync/index failure modes and operating cost | Only when tested search needs outgrow the native/simple approach |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OCR service | Assume handwriting and recipe-field extraction are guaranteed by general OCR support | Benchmark on representative family cards; separate text recognition from recipe parsing; expose corrections |
| OCR service | Ignore quotas, image/request limits, scripts, or current pricing | Validate current official limits/pricing and data terms during provider spike; measure failed/retried calls |
| Camera/browser API | Assume camera is available without HTTPS or permission | Use secure deployment, permission explanation, denial handling, and photo-library/manual alternatives |
| Authentication/storage | Protect recipe screens but leave API, search, or image assets accessible by guessed IDs | Check household membership and action permissions at every request and storage boundary; test unauthorized cases |
| Offline/sync database | Assume local writes merge safely on reconnect | Read the selected store's exact conflict semantics; add visible sync state, version recovery, and concurrent-edit tests |
| Search/index service | Update canonical recipe but forget an asynchronous index/delete event | Define source of truth, retryable index update, deletion behavior, and a rebuild/consistency check |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Upload full camera-resolution images repeatedly | Slow capture, high data use, request rejection, unnecessary OCR cost | Validate safe resizing/compression against recognition quality; check current provider limits | Can affect the very first large phone image; provider-specific size and payload thresholds apply |
| Run OCR synchronously with no progress or cancellation | Capture screen appears frozen on weak network; abandoned imports | Make processing state explicit; preserve draft/image, allow cancel/retry/manual entry | Any slow service/network; no scale threshold required |
| Retry OCR or upload on every UI retry without idempotency | Repeated charges and multiple recipe drafts | Use an import/job identifier, bounded retry/backoff, and duplicate-safe save | Starts with double taps or flaky connections |
| Fetch every recipe and filter/search on the phone | Slow startup and excessive data as collection grows | Start with measured collection size; query/index by required fields and paginate if needed | Exact breakpoint depends on data shape/device; benchmark with realistic family data rather than assuming millions of users |
| Maintain a separate search index without update monitoring | Stale results after edit/delete | Make indexing observable and replayable; include create/edit/delete consistency tests | Any asynchronous index pipeline, including small collections |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Treat family membership as UI state only | Cross-household disclosure or unauthorized edits/deletes | Enforce least-privilege, deny-by-default authorization for every request and asset; test guessed identifiers [6] |
| Make original image URLs public or long-lived | A forwarded/guessed URL exposes private handwriting and annotations | Require authorization for image access or use short-lived access; protect thumbnails and backups too |
| Accept arbitrary image uploads without size/type/content checks | Resource exhaustion or unsafe file handling | Apply upload size limits, validate content rather than trusting filename/MIME alone, and store outside public paths; follow current upload-security guidance [14] |
| Log image URLs, OCR output, or full recipe text for debugging | Private family content persists in logs/analytics | Minimize and redact logs; use opaque request IDs and aggregate error/latency metrics |
| Never review OCR provider data terms or processing location | Unexpected third-party processing, retention, or data locality | Review current contract, retention, region, and applicable privacy obligations before service selection; jurisdiction remains unknown [1][8] |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Force perfect capture before allowing progress | Frustration for old/faded cards; abandoned digitization | Offer retake guidance but retain a manual edit path and visible “recognition needs review” state |
| Show a monolithic OCR transcript instead of editable recipe fields | Errors are hard to locate; recipe is not ready to cook from | Separate title, ingredient lines, and instructions; show source context and preserve unclassified text |
| Make “save” look like “OCR is correct” | Users may serve from an unchecked transcription | Require explicit review/confirmation and make edit status obvious |
| Hide sync status until a save fails | Users assume family members can see an offline change | Show pending/synced/failed state and recovery action |
| Use tiny controls or densely packed edit rows | Phone capture/review is error-prone, especially one-handed | Use generous touch targets and test on real devices; WCAG target-size is a minimum baseline, not the sole usability test [13] |
| Treat a missing search result as proof that a recipe was not saved | Re-entry creates duplicates and erodes trust | Distinguish “no match” from index/loading errors; allow browsing and retry |

## "Looks Done But Isn't" Checklist

- [ ] **OCR import:** Test real family handwriting, faded cards, fractions, glare, skew, multi-page recipes, and crossed-out corrections—not just clear printed samples.
- [ ] **Draft review:** Verify every extracted field is editable before save, the source remains available for comparison, and low-confidence spans are not silently accepted.
- [ ] **Ingredient structure:** Confirm that quantity/unit/name parsing errors can be corrected without losing the original ingredient line.
- [ ] **Units/locales:** Test decimal separators, common fractions, abbreviated and mixed units, accented ingredient/title searches, and preservation of source values.
- [ ] **Duplicates:** Verify repeat upload/retry is idempotent and that legitimate family variants are never automatically destroyed.
- [ ] **Sharing:** Test direct API/search/image access across two households, removed members, stale invitations, and unauthenticated requests.
- [ ] **Sync:** Exercise concurrent edits, edit-vs-delete, offline reconnect, failed writes, app restart, and visible pending/failed status.
- [ ] **Privacy:** Decide whether images are kept; test deletion from records, storage, thumbnails, caches, and applicable backup lifecycle; verify private image access.
- [ ] **Search:** Verify create/edit/category-change/delete consistency for title, ingredient, and category; test an index rebuild or recovery path.
- [ ] **Cost/latency:** Measure representative image sizes, processing time, failure/retry behavior, and expected usage against current provider limits and pricing.
- [ ] **Mobile:** Test camera permission denied, camera unavailable, photo-library selection, retake/rotate/crop, interruption, poor connectivity, and small-screen review.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| OCR or parsing errors discovered after saving | MEDIUM | Let members edit the saved recipe; keep source/provenance if policy allows; identify and recheck other drafts with the same error pattern; do not silently rewrite all recipes |
| Duplicate recipes or accidental merge | MEDIUM–HIGH | Restore from history/backup if available; recover attribution and variant text; add review-based duplicate handling before re-import |
| Lost edits from sync conflict | HIGH if no history | Restore prior version/backup, compare available device copies, communicate which version was retained; add versioning/conflict detection before further offline use |
| Cross-household access or exposed image | HIGH | Revoke links/tokens, close the authorization gap, audit access, remove exposed assets and cached copies where possible, and follow applicable incident obligations |
| Unbounded image retention or unexpected provider processing | MEDIUM–HIGH | Stop new processing/retention, review provider and backup deletion semantics, delete eligible stored copies, notify affected users as appropriate, then adopt a documented lifecycle |
| Stale or incomplete search results | LOW–MEDIUM | Rebuild index from canonical recipe data, repair failed update events, and add create/edit/delete consistency monitoring |
| OCR outage or unexpected cost | LOW–MEDIUM | Pause or rate-limit new OCR jobs, preserve captured drafts, provide manual entry, surface status, and resume only after limits/budget are understood |

## Pitfall-to-Phase Mapping

Suggested phase order follows dependencies; these labels are planning guidance, not an existing roadmap.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Data model loses original text, provenance, or locale | Phase 1 — Shared cookbook foundation | Round-trip original values and source attribution through create/edit; no import-only data is discarded |
| Household authorization/privacy boundary | Phase 1 — Shared cookbook foundation | Automated negative tests deny cross-household recipe, search, and image access |
| Sync conflicts and deletion behavior | Phase 1 — Shared cookbook foundation | Two-device concurrent edit/delete/reconnect scenarios preserve or explicitly resolve both versions |
| Capture failures and phone usability | Phase 2 — Phone capture and OCR-assisted draft | Real-device tests cover permissions, capture, retake, interruption, and one-handed review |
| Handwriting OCR, layout parsing, confidence, correction UX | Phase 2 — Phone capture and OCR-assisted draft | Representative family corpus is reviewed against the source; critical quantity/unit errors and correction rates are measured |
| OCR pricing, quotas, latency and failure handling | Phase 2 — Phone capture and OCR-assisted draft; monitor in Phase 4 | Repeated/failed requests are bounded and idempotent; budget, latency, and provider-limit assumptions are documented |
| Duplicate handling, units and locale | Phase 1 data-model decisions; Phase 3 — Find and maintain recipes | Variants remain distinct; parsing/display is reversible; representative locale tests pass |
| Search coverage and index consistency | Phase 3 — Find and maintain recipes | Create/edit/category-change/delete tests return current title, ingredient, and category matches |
| Image retention/deletion and release hardening | Phase 1 policy; Phase 4 — Reliability and release readiness verification | Retention is documented and end-to-end deletion/access checks pass |

## Sources

All sources below were accessed **2026-10-20**. Official documentation and standards establish the narrow facts noted above; the prevention advice is project-specific. Provider pricing, quotas, product behavior, and legal requirements can change, so re-check them when selecting a stack and before launch.

1. Google Cloud Vision, **Optical character recognition (OCR)** — dense document output structure and region-specific endpoints: https://cloud.google.com/vision/docs/ocr
2. Google Cloud Vision, **Handwriting detection**: https://cloud.google.com/vision/docs/handwriting
3. Google Cloud Vision, **Supported files** — image dimensions, request limits, and latency guidance: https://cloud.google.com/vision/docs/supported-files
4. Google for Developers, **ML Kit Text Recognition v2** — supported scripts and text structure/confidence fields: https://developers.google.com/ml-kit/vision/text-recognition/v2
5. Unicode Consortium, **UTS #35: Numbers** — locale-sensitive number and unit formatting/parsing: https://unicode.org/reports/tr35/tr35-numbers.html#Units
6. OWASP Cheat Sheet Series, **Authorization Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
7. Firebase, **Access data offline** — Firestore offline synchronization and same-document last-write-wins behavior: https://firebase.google.com/docs/firestore/manage-data/enable-offline
8. UK Information Commissioner's Office, **A guide to the data protection principles**: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/
9. PostgreSQL, **Chapter 12. Full Text Search** — parsing, indexes, and index-update mechanisms (example only; not a stack recommendation): https://www.postgresql.org/docs/current/textsearch.html
10. Google Cloud Vision, **Pricing** (dynamic; check at provider selection): https://cloud.google.com/vision/pricing
11. Google Cloud Vision, **Quotas and limits** (dynamic; check at provider selection): https://cloud.google.com/vision/quotas
12. MDN Web Docs, **MediaDevices.getUserMedia()** — secure-context and permission requirements: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
13. W3C WAI, **Understanding Success Criterion 2.5.8: Target Size (Minimum), WCAG 2.2**: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
14. OWASP Cheat Sheet Series, **File Upload Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html

## Uncertainty and Follow-up Research

- No OCR engine was selected or evaluated against the family's handwriting. Recognition accuracy and recipe-field extraction quality remain unverified; run a small provider/approach spike using representative, permissioned recipe images before committing to a service.
- The initial locale, scripts, and measurement systems are unspecified. Confirm them before defining quantity parsing or conversions.
- The family has not defined membership roles, invitation/revocation rules, or whether offline editing is required. Confirm these before selecting the persistence/sync model.
- Image retention duration, service jurisdiction, privacy jurisdiction, and provider terms are undecided. This document is engineering research, not legal advice.
- Expected cookbook size and simultaneous users appear modest from the family use case, but no numeric usage estimate is available. Avoid premature search infrastructure; measure with realistic data.

---
*Pitfalls research for: Family Recipe Cookbook*  
*Researched: 2026-10-20*
