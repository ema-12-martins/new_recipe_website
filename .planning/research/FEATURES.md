# Feature Research

**Domain:** Phone-first personal/family recipe management and shared digital cookbook  
**Researched:** 2026-10-20  
**Confidence:** LOW

## Feature Landscape

The project brief is the strongest evidence for this product’s non-negotiable features: a shared family cookbook, phone-friendly capture and use, editable handwritten-photo recognition before save, and search by name, ingredient, and category. The competitor evidence below is limited to vendors’ own current product pages. Recipe Keeper advertises handwritten-recipe scanning/OCR, editing, category browsing, and name/ingredient/directions search; Paprika advertises cloud sync, recipe organization, interactive cooking tools, scaling, meal planning, and grocery lists. These pages establish advertised examples, not independent quality or universal market expectations. Search-provider access was unavailable, so claims about broad user expectations remain provisional.

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Phone-friendly recipe creation, viewing, and editing | The project’s primary workflows are capturing and using recipes on phones; personal cookbook products support recipe entry and cross-device access. | MEDIUM | Make the common read/edit tasks comfortable on a small screen. Keep manual entry available as a reliable fallback. |
| A practical recipe structure | Recipes need to keep a title, ingredients, and instructions intelligible and editable; these fields are explicit project requirements. | MEDIUM | Start with a title, ingredient entries, and ordered instruction steps. Preserve flexible original wording such as “to taste” rather than requiring every quantity to parse. Optional sections/notes can help retain family formats. |
| Shared online family cookbook | The central product promise is one collection that family members can view and update across devices. Comparable products advertise syncing and sharing, although their pages do not establish that multiple family accounts edit one shared library. | HIGH | Treat membership, permissions, and sync as core product capability; do not equate sending a recipe by email with a shared cookbook. |
| Search by recipe name, ingredient, and category | Explicit project requirement; Recipe Keeper also advertises lookup by name and ingredient and browsing by category. | MEDIUM | Index ingredient text as well as title. Category browsing/filtering is a useful complement to typed search. |
| Organized browsing and basic recipe metadata | Recipe Keeper advertises course/category browsing, favorites, and ratings; recipes become hard to navigate as a family collection grows. | LOW–MEDIUM | Provide a small, understandable category vocabulary and favorites if inexpensive. Don’t make rating or an elaborate taxonomy a prerequisite for saving. |
| Clear save and correction flow | An OCR draft must not be mistaken for a verified recipe; the project explicitly requires human review and editing before save. | MEDIUM | Keep draft and saved states visually distinct and make the save action explicit. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Handwritten-photo intake that creates an editable draft | Directly addresses the family’s existing recipe format and differentiates the project from general organizers. Recipe Keeper publicly advertises handwritten scanning and OCR, so this capability exists in at least one comparable product; its actual accuracy is not independently verified here. | HIGH | This is a project-critical v1 capability, not merely an optional later enhancement. Capture with the phone camera or choose an existing image; expect recognition quality to vary. |
| Source-image-first review and correction | Keeps the original family artifact available while someone checks title, ingredients, and instructions against recognized text. Reduces the chance that an OCR mistake becomes the only surviving version. | MEDIUM–HIGH | Show the photo alongside editable fields or provide an easy image/text toggle. Keep the image attached to its draft/saved recipe. Do not imply an automatic confidence score is reliable unless tested. |
| Structure-aware recognition review | Helps reviewers correct content in the field where it belongs instead of editing one opaque OCR blob. | HIGH | Separate extracted title, ingredient lines, and ordered steps; allow manual correction and reordering. For ambiguous handwriting, favor user confirmation over aggressive parsing. |
| Family provenance and shared contribution | Preserves who contributed a recipe and, where family members choose to record it, its original author or story. | LOW–MEDIUM | A lightweight “added by” attribution and optional note are enough to start. Avoid forcing sensitive or unknown historical details. |
| Family-friendly categories and optional tags | Lets a household organize recipes in its own language and find items beyond a fixed course taxonomy. | LOW–MEDIUM | Required category search should work with a small default set; optional editable tags can follow after observing how the family actually organizes. |
| Reliable shared edits with clear ownership | Makes this more than an individual cookbook that happens to sync between devices. | HIGH | Start with straightforward shared access and clear attribution. Defer simultaneous live co-editing; it is not necessary for the described use case. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|--------------|-----------------|-------------|
| Meal planning and shopping lists in the initial release | They are commonly bundled into recipe apps; both Recipe Keeper and Paprika advertise them. | The project explicitly puts them out of scope, and they add separate planning, ingredient aggregation, and list-management workflows before recipe preservation is validated. | Keep v1 focused on capture, correction, shared storage, and retrieval; revisit only if family use shows a clear need. |
| Public publishing, social feed, or broad community features | Sharing recipes publicly can sound like an easy way to spread family recipes. | It conflicts with the private family-cookbook intent and adds privacy, moderation, and discovery concerns without supporting the core value. | Keep the collection private to invited family members; consider deliberate export/sharing only if requested. |
| Automatic save of unreviewed recognition output | It removes a step and appears convenient. | Handwriting recognition can misread quantities, names, and instructions; silent errors undermine the cookbook’s accuracy goal. | Save the OCR result as a draft, require human review/editing, then explicitly save. |
| Rigid ingredient parsing or automatic normalization as a prerequisite | Structured quantities can enable scaling, unit conversion, and shopping lists. | Family recipes often use approximate or nonstandard expressions; forced parsing can lose meaning and increases OCR review complexity. | Preserve editable ingredient wording first. Add structured quantity/unit support only when it can coexist with the original text. |
| Real-time simultaneous editing and extensive revision history at launch | It promises polished collaboration and conflict avoidance. | It adds substantial synchronization and conflict-resolution complexity beyond the stated add/edit/view need. | Begin with clear shared access, save/update behavior, and contributor attribution; assess conflict cases before building live co-editing. |
| Full meal-planning, nutrition, calorie, or recommendation suite | These appear in broader cooking products and may look like product completeness. | They expand the product into separate domains, raise data-quality expectations, and distract from preserving and finding family recipes. | Defer; validate the core cookbook before adding unrelated workflows. |

## Feature Dependencies

```text
Recipe schema (title, ingredients, ordered instructions, category)
    ├──requires──> Manual recipe create/edit/view
    ├──requires──> Name / ingredient / category search
    └──requires──> OCR field mapping
                       └──requires──> Image capture/upload
                       └──requires──> Review and correction
                                          └──requires──> Explicit save as recipe

Shared cookbook membership and persistence
    ├──requires──> Shared view/add/edit access
    └──enhances──> Family attribution and shared use across devices

Categories ──enhance──> Browsing and search
Optional tags ──enhance──> Flexible household organization

Unreviewed auto-save ──conflicts──> Human-verified recipe accuracy
Public feed ──conflicts──> Private family-cookbook intent
```

### Dependency Notes

- **OCR draft requires the recipe schema:** Extraction needs destinations for title, ingredient text, and instructions. Settle a forgiving editable structure before mapping recognition output.
- **Review requires image retention and draft state:** Reviewers need the source image available while correcting extracted content; the draft should not become a saved recipe until confirmed.
- **Search depends on the fields and category model:** Name and ingredient search require those fields to be stored consistently. Category lookup requires categories to be assigned or edited.
- **Family sharing depends on shared persistence and membership:** A single household collection requires defining who can access it and how edits become visible on other devices. A profile/contact book or public social system is not implied.
- **Tags enhance but do not replace categories:** The brief specifically asks for category search; free-form tags can be added later without blocking the required search.
- **Scaling and shopping lists depend on more structured ingredients:** They should not drive v1’s data model at the expense of faithful handwritten transcription.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Phone-friendly create, view, and edit of a recipe — essential for both preserving and using recipes.
- [ ] Recipe fields for title, ingredients, and ordered instructions — required both by the project brief and by the recognition-review flow.
- [ ] Shared online family cookbook with members able to view and add/edit recipes — validates the shared-cookbook promise; use simple access rules rather than real-time co-editing.
- [ ] Search by name, ingredient, and category — directly satisfies the project’s stated retrieval need.
- [ ] Phone photo intake producing an OCR draft — targets the family’s handwritten source material.
- [ ] Human correction/review before an explicit save, with the source photo retained — protects the accuracy and preservation goals.
- [ ] Basic category assignment and browsing — makes the required category search usable without an elaborate taxonomy.

### Add After Validation (v1.x)

- [ ] Optional tags, favorites, and sorting — add if the family’s collection becomes difficult to browse; comparable products advertise favorites and category browsing.
- [ ] Contributor attribution and optional family-story/source notes — add if family members want provenance beyond the recipe itself.
- [ ] Duplicate warning or merge assistance — add only if repeated contributions become a real maintenance problem; avoid blocking a user who intentionally keeps variants.
- [ ] Improved OCR review affordances (field confidence cues, crop/rotate, multi-photo handling) — prioritize based on observed recognition errors and actual source-card formats.

### Future Consideration (v2+)

- [ ] Serving-size scaling and unit conversion — Paprika and Recipe Keeper advertise these, but reliable conversion depends on structured quantities and is not required to preserve/find recipes.
- [ ] Meal planning and shopping lists — explicitly out of scope for initial release; reconsider only after the cookbook workflows are validated.
- [ ] Offline-first multi-device editing, real-time collaboration, or detailed version history — defer until family usage exposes a concrete sync/conflict need.
- [ ] Public/community sharing and web recipe import — not aligned with the private family-preservation goal.
- [ ] Printed cookbook generation or export — potentially valuable for archival, but not necessary to test phone-based capture and retrieval.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Phone-friendly recipe CRUD | HIGH | MEDIUM | P1 |
| Shared family cookbook and sync | HIGH | HIGH | P1 |
| Handwritten photo to reviewable OCR draft | HIGH | HIGH | P1 |
| Human correction before save; retain source photo | HIGH | MEDIUM–HIGH | P1 |
| Search by name, ingredient, and category | HIGH | MEDIUM | P1 |
| Basic categories and browse view | HIGH | LOW–MEDIUM | P1 |
| Optional tags and favorites | MEDIUM | LOW–MEDIUM | P2 |
| Contributor attribution and family notes | MEDIUM | LOW | P2 |
| Scaling, unit conversion, interactive cooking mode | LOW–MEDIUM | MEDIUM–HIGH | P3 |
| Meal planning, shopping lists, public sharing | LOW for stated goal | HIGH | P3 / defer |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Recipe Keeper (official site) | Paprika Recipe Manager (official site) | Our Approach |
|---------|-------------------------------|------------------------------------------|--------------|
| Handwritten/photo recipe intake | Advertises camera/photo/PDF scans and OCR for handwritten recipes. | The current feature page reviewed emphasizes web importing; no handwriting capability was established from that page. | Make handwritten-photo intake a core path, but always create an editable draft for review. |
| Recipe organization and retrieval | Advertises course/category/rating browsing and search by name, ingredient, or directions. | Describes organizing a recipe collection and saving recipes from the web. | Meet the project’s required name/ingredient/category search; keep categories simple and family-editable. |
| Cross-device/family use | Advertises syncing across devices and sharing recipes with friends/family; also mentions sharing meal plans. | Advertises cloud sync of recipes, grocery lists, and meal plans across devices. | Provide a shared family library, not just device sync or one-off sharing; precise multi-member permissions need product-owner decisions. |
| Cooking/planning extras | Advertises recipe scaling, meal planning, shopping lists, and printable cookbooks. | Advertises interactive recipe steps, timers, serving scaling, unit conversion, meal planning, and grocery lists. | Defer extras: the product’s initial value is preserving, reviewing, sharing, and finding family recipes. |

## Research Limits and Sources

The domain-specific web-search route returned unavailable because `BRAVE_API_KEY` was not configured, and no external search/MCP provider was available. I directly inspected official product pages instead. Findings below describe those vendors’ published feature claims; they do not validate recognition accuracy, customer expectations across the market, or the quality of household collaboration. The state file `.planning/STATE.md` was absent; scope was checked against `.planning/PROJECT.md`.

- Recipe Keeper, official product page: https://www.recipekeeperonline.com/ — accessed 2026-10-20. Advertises handwritten/photo/PDF scanning with OCR, editable recipes, categories, search, sharing, sync, meal planning, shopping lists, scaling, and cookbook printing.
- Paprika Recipe Manager, official product page: https://www.paprikaapp.com/ — accessed 2026-10-20. Advertises cloud sync, web importing, interactive recipe cooking, grocery lists, meal planning, serving scaling, and metric/imperial conversion.
- Samsung Food, https://samsungfood.com/ — access attempt returned HTTP 403 on 2026-10-20; excluded from feature claims.
- Apple Vision documentation, https://developer.apple.com/documentation/vision/recognizing-text-in-images — accessed 2026-10-20. The page title was available, but detailed documentation content did not render in the fetch; no OCR capability claims are based on it.
- Project context and explicit scope: `.planning/PROJECT.md`, read 2026-10-20.

---
*Feature research for: Family Recipe Cookbook*
*Researched: 2026-10-20*
