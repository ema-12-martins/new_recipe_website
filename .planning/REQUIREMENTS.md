# Requirements: Family Recipe Cookbook

**Defined:** 2026-10-20
**Core Value:** Make family recipes easy to preserve accurately and find again when they are needed.

## v1 Requirements

### Family Access

- [ ] **AUTH-01**: A family member can create and use an individual account to access the cookbook.
- [ ] **AUTH-02**: A cookbook owner can invite family members to the private shared cookbook and remove their access.
- [ ] **AUTH-03**: An invited family member can view, add, and edit recipes in the shared cookbook.
- [ ] **AUTH-04**: A family member can access the same shared cookbook and its saved recipes across their devices.

### Recipes

- [x] **RECP-01**: A family member can manually create, view, and edit a recipe with a title, ingredients, and ordered instructions.
- [ ] **RECP-02**: A family member can retain the original handwritten source photo or photos with a saved recipe.
- [x] **RECP-03**: A family member can edit any saved recipe in the shared cookbook.

### Recipe Capture

- [ ] **CAPT-01**: A family member can capture or choose one or more photos for a handwritten recipe.
- [ ] **CAPT-02**: The app can turn a handwritten recipe photo or set of photos into an editable draft of the title, ingredients, and instructions.
- [ ] **CAPT-03**: Before saving a photo-imported recipe, a family member can review and edit the extracted draft and explicitly confirm the save.
- [ ] **CAPT-04**: A family member can enter a recipe manually when image recognition is unavailable or produces an unusable draft.

### Search and Organization

- [ ] **SRCH-01**: A family member can find saved recipes by recipe name and ingredient.
- [ ] **SRCH-02**: A family member can browse and find recipes by category.
- [ ] **SRCH-03**: Family members can rename suggested recipe categories and add categories of their own.

## v2 Requirements

(None committed for v2 yet.)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Meal planning and shopping lists | The first release is focused on preserving, sharing, and finding recipes. |
| Public recipe publishing or a public community feed | The cookbook is intended for invited family members. |
| Favorites, recipe notes, and contributor attribution | The user chose to keep the first release focused on capture, sharing, and finding recipes. |
| Simultaneous live co-editing | Shared recipe editing is required, but live multi-user editing is not part of the stated need. |
| Automatic saving of unreviewed recognition output | Handwriting recognition can be wrong; a person must review and explicitly confirm the recipe first. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| RECP-01 | Phase 1 | Complete |
| RECP-02 | Phase 2 | Pending |
| RECP-03 | Phase 1 | Complete |
| CAPT-01 | Phase 2 | Pending |
| CAPT-02 | Phase 2 | Pending |
| CAPT-03 | Phase 2 | Pending |
| CAPT-04 | Phase 2 | Pending |
| SRCH-01 | Phase 3 | Pending |
| SRCH-02 | Phase 3 | Pending |
| SRCH-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 14 total (the original count of 13 was inconsistent with the 14 distinct IDs listed above)
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-10-20*
*Last updated: 2026-10-20 after roadmap creation*
