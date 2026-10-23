# Phase 2: Handwritten Recipe Capture - Context

**Gathered:** 2026-10-23
**Status:** Ready for planning

<domain>
## Phase Boundary

A family member photographs or picks one or more handwritten recipe pages. Recognition produces an editable, unconfirmed draft (title, ingredient lines, ordered steps). The member reviews and edits it and must explicitly save. Original photos are retained with the saved recipe. Manual entry is always available when recognition is unavailable or unusable.

Covers CAPT-01, CAPT-02, CAPT-03, CAPT-04, RECP-02. Search and categories belong to Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Photo capture flow
- **D-01:** A single "Add photos" button uses the native browser picker (camera or gallery on phones, file upload on desktop). No separate camera UI.
- **D-02:** A recipe may have several pages. Photos can be added several at once or one at a time and appear as thumbnails with reorder (up/down) and remove. The order is the page order.
- **D-03:** Maximum 6 photos per recipe. Resize and compress in the browser before upload (long edge about 2000 px). Accept JPEG, PNG and HEIC (iPhone).
- **D-04:** After photos are chosen, show a preview with an explicit "Read recipe" button. Recognition starts only when it is pressed, never automatically.

### Draft review
- **D-05:** The draft is shown in the existing recipe form (`src/components/recipe-form.tsx`), pre-filled with the recognised title, ingredient lines and ordered steps, under a clear "Draft - not saved yet" banner.
- **D-06:** The review screen is text-only; photos are not shown while reviewing (consistent with D-14 of Phase 1).
- **D-07:** No per-line confidence flagging. The banner asks the member to check everything. The design stays provider-independent.
- **D-08:** A single "Save recipe" button is the explicit confirmation. Nothing is saved until it is pressed, and a draft with an empty title cannot be saved.
- **D-09:** Leaving the draft without saving discards it, after a "Leave without saving?" warning. No draft is persisted and photos are not stored until the member saves.

### Recognition failure and manual fallback
- **D-10:** Recognition counts as unusable when the provider errors, times out or returns an empty result, and also when the result looks low-quality (for example very little text). The low-quality threshold cannot be set yet; it must be derived from the provider benchmark (D-16). Unusable results are never saved silently.
- **D-11:** While recognition runs, show a progress state ("Reading your recipe...") with the photos visible, a Cancel button, and a timeout of about 60 seconds after which it counts as failed.
- **D-12:** The failure screen shows a clear message with "Try again" and "Enter it manually". If the member goes manual, the photos stay attached to the new recipe.
- **D-13:** Manual entry is reachable from the failure screen and also from a visible "Skip - type it myself" option on the capture screen. The existing manual "New recipe" form is unchanged.
- **D-14:** On the draft screen, a member can choose "Discard and try again" or "Enter manually" with the photos kept. (User left this unanswered; the recommended option was applied.)

### Provider benchmark and privacy
- **D-15:** The benchmark uses about 15-20 real family recipe pages supplied with the family's permission, covering the different handwriting styles, languages (Portuguese and English) and layouts.
- **D-16:** A provider is judged by correction effort: the number of fields (title, ingredient lines, steps) a member must fix. Recipe-critical items are quantities, fractions, units, temperatures and step order. The acceptance target is set jointly after seeing the first results.
- **D-17:** Any provider must process in the EU, must not retain photos beyond the request, and must not train on them. A provider that cannot meet this is rejected. — **Reversibility:** costly — the provider integration, its credentials and its data-processing terms are built into the capture pipeline.
- **D-18:** The first plan of Phase 2 is the benchmark and decision record. No provider integration is built until a provider is approved. Capture, review and photo-storage work does not need a provider and can proceed in parallel.
- **D-19:** The benchmarked candidates are those from earlier research (for example Google Document AI with Gemini structured extraction) plus any others the user names. All are unapproved candidates.

### Source photos after saving
- **D-20:** A saved imported recipe shows an "Original photos" section at the bottom of the recipe page: tap-to-enlarge thumbnails in page order. Manual recipes without photos have no such section.
- **D-21:** In the edit form a member can add or remove photos. Removing asks for confirmation, and the recipe works without photos. Editing never re-runs recognition or overwrites corrected text.
- **D-22:** A manual recipe can also get photos later through the same add-photos control; they are attached only, with no recognition.
- **D-23:** Photos are cached offline only for recipes the member has opened, together with the recipe, and are purged on sign-out (Phase 1 D-37, D-38, D-04).
- **D-24:** Any signed-in member of the cookbook can see the photos, enforced by Supabase Storage access rules. Files are never publicly reachable, and a removed member loses access (Phase 1 D-28, D-09).

### the agent's Discretion
- Exact visual layout, copy and Portuguese/English wording of the new screens.
- Storage bucket layout, file naming and image-processing library.
- How the recognition request is routed server-side, once a provider is approved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` (Phase 2 section) - goal, success criteria and the OCR decision gate.
- `.planning/REQUIREMENTS.md` - CAPT-01 to CAPT-04 and RECP-02.
- `.planning/STATE.md` - current status; production Supabase setup and device UAT still pending for Phase 1.

### Prior decisions that still apply
- `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md` - D-11 to D-14 (recipe wording, ingredient lines, ordered steps, photo retention), D-28 (Supabase and Storage), D-35 (EU region), D-37/D-38/D-04 (offline reading and purge), D-09 (member access).
- `.planning/phases/01-decisions-and-shared-cookbook/01-RESEARCH.md` and `01-PATTERNS.md` - stack and code patterns from Phase 1.

### Code
- `src/components/recipe-form.tsx` - existing recipe form to reuse for draft review.
- `src/app/[locale]/(app)/recipes/` - recipe pages and server actions.
- `src/lib/recipes/` - recipe schema, queries and creation.
- `src/lib/offline/` - offline store; photo caching extends it.
- `src/lib/supabase/` - server and admin clients.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `recipe-form.tsx`: the manual recipe form, reused with pre-filled values for draft review.
- `src/components/ui/` (button, input, label, textarea): shadcn/ui primitives for the new screens.
- `src/lib/recipes/schema.ts` and `create-recipe.ts`: recipe validation and creation, reused when a draft is saved.
- `src/lib/offline/store.ts` and the `remember-recipe-offline` component: offline caching, extended for photos.

### Established Patterns
- Every `(app)` page calls `requireMembership(locale)`; `tests/unit/app-pages-guard.test.ts` fails if one does not.
- Client forms wrap fields in `<fieldset disabled={!hydrated}>` so WebKit does not lose text typed before hydration.
- Choices that must survive a failed form action are held in controlled state.
- Text is available in Portuguese and English via `src/i18n/messages/{pt,en}.json`.
- Supabase access is enforced with Row Level Security; the service-role key stays server-only (`check:secrets`).

### Integration Points
- A new capture route under `src/app/[locale]/(app)/recipes/`, leading to the pre-filled form.
- A Supabase Storage bucket for recipe photos, with member-only policies and a migration in `supabase/`.
- A server-side recognition endpoint, wired in only after a provider is approved.
- The recipe view and edit pages gain the "Original photos" section and photo controls.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decisions above - open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Handwritten Recipe Capture*
*Context gathered: 2026-10-23*
