---
quick_id: 261023-m2i
status: complete
commit: 0ec15e2
key-files:
  created:
    - src/lib/recipes/missing.ts
    - tests/unit/recipe-missing.test.ts
  modified:
    - src/components/recipe-form.tsx
    - src/app/[locale]/(app)/recipes/actions.ts
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json
    - tests/e2e/recipes.spec.ts
---

# Quick 261023-m2i Summary: A visible warning when a recipe is incomplete

## What changed

- Tapping Save on an incomplete recipe now shows, right above the button: **"Não é possível guardar
  uma receita sem título, ingredientes e passos."** followed by what is missing ("Escreva um título." /
  "Adicione pelo menos um ingrediente." / "Adicione pelo menos um passo."). The same messages also
  appear next to each field. English equivalents exist.
- The check runs in the browser before anything is sent, so photos are no longer uploaded for a save
  that cannot succeed. The server repeats the check (same helper) and returns the same warning;
  the database constraint from 261023-lti remains the last backstop.
- Typed text stays in the form.

## Verification

- `npm run typecheck`, eslint on changed files, `vitest run tests/unit`: 18 files / 128 tests pass.
- Browser: `playwright test -c _pw-isolated.config.ts -g "is not saved"` passed on desktop-chromium
  and phone-chromium (warning visible, lists ingredients + steps, URL unchanged, title kept, 0 rows).
- Pushed to `main`; Vercel deploys from it.
