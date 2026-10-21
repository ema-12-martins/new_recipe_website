# Family Recipe Cookbook

## What This Is

A phone-friendly shared cookbook for preserving and finding family recipes. Family members can photograph handwritten recipes, review and correct the extracted recipe text before saving, and browse the same online collection from their phones.

## Core Value

Make family recipes easy to preserve accurately and find again when they are needed.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Family members use individual accounts and invitations to access one private shared online cookbook; invited members can view, add, and edit recipes.
- [ ] A family member can create and edit recipes with a title, ingredients, and ordered instructions, either manually or by importing photos of a handwritten recipe.
- [ ] Image recognition creates an editable draft that a family member reviews and explicitly saves; original handwritten photo(s) remain with the saved recipe.
- [ ] Family members can find recipes by name, ingredient, and category, including categories the family can rename or add.
- [ ] The cookbook works well on phones and keeps the shared collection available across family members' devices.

### Out of Scope

- Meal planning and shopping lists — the initial goal is preserving and finding recipes.
- Public recipe publishing or a community feed — the cookbook is for the family.

## Context

- This is a greenfield project; the workspace has no existing application code.
- The primary use case is a family cookbook accessed from phones.
- Existing recipes may be handwritten. Image-based text extraction should produce a draft for a person to verify, not silently save uncertain results.
- A handwritten recipe may span more than one photo or page.
- Manual recipe entry remains available when recognition is unavailable or unusable.
- OCR review does not need to display the source photo beside the extracted text; saved recipes retain the original photo(s).
- Every invited family member can edit any saved recipe in the shared cookbook.
- Search needs to support recipe names, ingredients, and categories.

## Constraints

- **Usability**: Recipe capture and browsing should work comfortably on phones — photographing and using recipes are the primary workflows.
- **Accuracy**: Extracted handwritten text must be reviewable and editable before a recipe is saved.
- **Sharing**: The family cookbook is online and shared across members' devices.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use one shared family cookbook | Family members should be able to view and add to the same collection | — Pending |
| Make handwritten-image import a primary capture path | The existing recipes include handwritten recipes | — Pending |
| Require review of extracted text before saving | Handwriting recognition may be imperfect; the saved recipe should be correct | — Pending |
| Prioritize phone use and name/ingredient/category search | Recipes need to be captured and found conveniently in everyday use | — Pending |
| Use individual accounts and family invitations | Avoid a shared family password and allow private membership | — Pending |
| Allow all invited members to edit recipes | Family members should be able to maintain the shared cookbook | — Pending |
| Support multiple source photos and retain them with saved recipes | A handwritten recipe can span pages, and the source is worth preserving | — Pending |
| Let the family rename suggested categories and add its own | Recipe organization should fit how the family describes its recipes | — Pending |
| Keep the source photo out of the OCR correction screen | The user prefers editable extracted text without a side-by-side image | — Pending |
| Defer stack and OCR vendor selection | Research findings are low-confidence and the OCR has not been tested on the family's handwriting | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-20 after initialization*
