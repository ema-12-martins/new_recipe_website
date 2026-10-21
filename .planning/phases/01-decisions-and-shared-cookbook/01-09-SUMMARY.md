---
phase: 01-decisions-and-shared-cookbook
plan: 09
subsystem: infra
tags: [nextjs, react, tailwind, i18n, proxy, playwright, package-audit]

requires: []
provides:
  - Next.js 16.4.2 App Router web shell with Tailwind 4 (PostCSS) and all approved Phase 1 packages installed
  - Locale-in-URL routing via src/proxy.ts (NEXT_LOCALE cookie, then Accept-Language q-weights, then Portuguese)
  - "[locale] root layout with html lang, localized title, and security headers (no web manifest)"
  - pt/en message files with shared namespaces and getDictionary(locale)
  - Playwright harness on a production build (port 3100) with setup + desktop/tablet/phone viewport projects
affects: [01-15, 01-16, 01-17, 01-10, 01-11, 01-12, 01-13, 01-19, 01-14, 01-18]

actuals:
  tokens: 5800
  tasks: 3
  commits: 3

tech-stack:
  added:
    - next 16.4.2
    - react / react-dom 19.3.0
    - typescript 5.9.3
    - tailwindcss / @tailwindcss/postcss 4.3.3
    - eslint 9.39.5 + eslint-config-next 16.4.2
    - "@supabase/supabase-js 2.118.0"
    - "@supabase/ssr 0.12.7"
    - server-only 0.0.1
    - zod 4.6.7
    - class-variance-authority 0.7.1
    - clsx 2.1.1
    - tailwind-merge 3.7.0
    - lucide-react 1.61.0
    - radix-ui 1.8.1
    - tw-animate-css 1.4.0 (dev)
    - shadcn 4.22.1 (dev)
    - vitest 5.0.5 (dev)
    - "@playwright/test 1.64.1 (dev)"
    - supabase CLI 2.121.0 (dev)
    - "@types/node 24.19.2, @types/react 19.3.0, @types/react-dom 19.3.0 (dev)"
  patterns:
    - "All routes live under src/app/[locale]/; src/app/[locale]/layout.tsx is the root layout"
    - "UI strings only in src/i18n/messages/{pt,en}.json, one namespace per feature, identical key sets"
    - "Request interception uses the Next 16 convention: src/proxy.ts exporting function proxy"
    - "Route component props typed explicitly (not the generated LayoutProps/PageProps globals) so tsc --noEmit works on a fresh clone"

key-files:
  created:
    - src/proxy.ts
    - src/i18n/config.ts
    - src/i18n/dictionaries.ts
    - src/i18n/messages/pt.json
    - src/i18n/messages/en.json
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx
    - src/app/globals.css
    - next.config.ts
    - postcss.config.mjs
    - playwright.config.ts
    - tests/e2e/locale.spec.ts
    - package.json
    - package-lock.json
    - tsconfig.json
    - eslint.config.mjs
    - .gitignore
  modified: []

key-decisions:
  - "Package legitimacy approved by the human with one change: use clsx + tailwind-merge instead of the `cn` package; `cn` must never be installed."
  - "The current shadcn registry (new-york-v4) imports { cn } from the npm package `cn`; plans 01-15/01-16/01-10 must rewrite shadcn component imports to @/lib/utils (clsx + tailwind-merge) and must not let shadcn install `cn`."
  - "Next.js 16.4.2 uses src/proxy.ts (export function proxy); no middleware.ts fallback needed."
  - "TypeScript stays on 5.x (typescript-eslint requires <6.1) and ESLint on 9.x (eslint-plugin-react/import/jsx-a11y cap at 9) instead of the newest TypeScript 7 / ESLint 10."
  - "shadcn is a devDependency now because the shadcn v4 style imports shadcn/tailwind.css; later shadcn init/add therefore needs no install."

patterns-established:
  - "Locale redirect: same-origin new URL('/' + locale + path + search, request.url), 307"
  - "E2E specs run against npm run build && npm run start on port 3100 in four viewport projects"

requirements-completed: [AUTH-04]

coverage:
  - id: D1
    description: "Visiting / redirects to /pt or /en by NEXT_LOCALE cookie, then weighted Accept-Language, else Portuguese; unknown first segments are re-prefixed"
    requirement: AUTH-04
    verification:
      - kind: e2e
        ref: "tests/e2e/locale.spec.ts#locale routing"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pages under /pt and /en render with matching html lang and the app name/tagline from the locale's message file"
    requirement: AUTH-04
    verification:
      - kind: e2e
        ref: "tests/e2e/locale.spec.ts#home page"
        status: pass
    human_judgment: false
  - id: D3
    description: "Home page has no horizontal scroll in desktop-chromium, tablet-webkit, phone-chromium, phone-webkit"
    verification:
      - kind: e2e
        ref: "tests/e2e/locale.spec.ts#/pt shows the appName from pt.json and does not scroll horizontally"
        status: pass
    human_judgment: false
  - id: D4
    description: "Only human-approved packages installed; no web app manifest; .env*.local ignored while .env.example is committable"
    verification:
      - kind: other
        ref: "package.json approved-list diff; git check-ignore .env.local/.env.example; Test-Path manifest files"
        status: pass
    human_judgment: false

duration: 27min
completed: 2026-10-21
status: complete
---

# Phase 1 Plan 09: Web Shell and Locale Routing Summary

**Next.js 16.4.2 + Tailwind 4 shell where `/` redirects through `src/proxy.ts` to `/pt` or `/en` (cookie → Accept-Language q-weights → Portuguese) and the home page renders its name from pt/en message files, verified by 36 Playwright tests across desktop, tablet, and two phone projects.**

## Performance

- **Duration:** ~27 min (package gate ~5 min; Tasks 2–3 22 min)
- **Started:** 2026-10-21T11:55:00Z
- **Completed:** 2026-10-21T12:22:03Z
- **Tasks:** 3 / 3
- **Files modified:** 24 (plus package-lock.json)

## Accomplishments

- Approved package set installed once; production `npm audit` reports 0 vulnerabilities.
- Locale proxy with same-origin 307 redirects, cookie override (`NEXT_LOCALE`), q-weighted header parsing, and Portuguese fallback.
- `[locale]` root layout (html `lang`, localized `<title>`), security headers (nosniff, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, restrictive Permissions-Policy), and no manifest.
- pt/en message files with namespaces `common`, `auth`, `recipes`, `members`, `offline` and `getDictionary(locale)`.
- Playwright harness: production build on port 3100, `setup` slot plus four viewport projects; 36/36 tests pass.

## Package legitimacy

Human reply (verbatim, via checkpoint): **"approved, but use clsx + tailwind-merge instead of cn"**

Reviewed table: create-next-app, next, react, react-dom, typescript, @types/node, @types/react, @types/react-dom, tailwindcss, @tailwindcss/postcss, eslint, eslint-config-next, shadcn, class-variance-authority, cn (rejected), clsx, tailwind-merge, lucide-react, tw-animate-css, radix-ui, @supabase/supabase-js, @supabase/ssr, server-only, zod, vitest, @playwright/test, supabase. shadcn registry names were read with curl from `https://ui.shadcn.com/r/styles/new-york-v4/{button,input,label,textarea,index}.json` without executing package code: button/label → `cn`, `radix-ui`; input/textarea → `cn`; style → `class-variance-authority`, `cn`, `lucide-react`, `radix-ui`, dev `tw-animate-css`, `shadcn`.

## Installed versions

| Package | Version |
|---|---|
| next | 16.4.2 |
| react / react-dom | 19.3.0 |
| @supabase/ssr | 0.12.7 |
| @supabase/supabase-js | 2.118.0 |
| zod | 4.6.7 |
| vitest | 5.0.5 |
| @playwright/test | 1.64.1 (Chromium + WebKit browsers installed) |
| supabase (CLI) | 2.121.0 |
| typescript | 5.9.3 |
| eslint | 9.39.5 |
| tailwindcss / @tailwindcss/postcss | 4.3.3 |

**Interception-file convention:** Next.js 16.4.2 → `src/proxy.ts` exporting `function proxy` (confirmed in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). Proxy runs on the Node.js runtime by default.

## Task Commits

1. **Task 1: Package legitimacy gate:** no commit (verification only; approval recorded above)
2. **Task 2: Scaffold, install, locale proxy/layout, Playwright projects:** `1a5d7fa` (feat)
3. **Task 3: Message files and getDictionary (TDD):** `ef38449` (test, RED), `4b461e0` (feat, GREEN)

## Files Created/Modified

- `src/proxy.ts`: locale redirect for un-prefixed paths; matcher skips `_next/static`, `_next/image`, `/api`, `favicon.ico`, `sw.js`, `offline.html`, `offline.js`, and any path with a file extension
- `src/i18n/config.ts`: `locales`, `Locale`, `defaultLocale`, `isLocale`, `detectLocale`, `LOCALE_COOKIE`, `LOCALE_NAMES`
- `src/i18n/dictionaries.ts`, `src/i18n/messages/{pt,en}.json`: interface strings
- `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`: root layout and home page
- `next.config.ts`: security headers only
- `postcss.config.mjs`, `src/app/globals.css`: Tailwind via PostCSS
- `playwright.config.ts`, `tests/e2e/locale.spec.ts`: e2e harness and locale tests
- `.gitignore`: ignores `.env*` (re-includes `.env.example`), test reports, `/tests/e2e/.auth`, `/supabase/.temp`
- Scaffold extras kept as generated: `AGENTS.md` (Next.js agent rules), `README.md`, `public/*.svg`, `src/app/favicon.ico`

## Decisions Made

- `cn` rejected by the human; `clsx` + `tailwind-merge` installed instead (see key-decisions for the impact on later shadcn steps).
- `@types/node` aligned to the local Node 24 runtime (`^24`) because vitest 5 requires ≥22.
- Root-level `LayoutProps`/`PageProps` globals avoided so `tsc --noEmit` does not depend on `next typegen`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] create-next-app 16.4.2 scaffolded an unapproved Tailwind loader and extra Next flags**
- **Found during:** Task 2
- **Issue:** The template used `@tailwindcss/turbopack` (not approved) via `turbopack.rules`, and enabled `cacheComponents` + `partialPrefetching`. Those flags change rendering semantics for the cookie/session-reading layouts later plans add.
- **Fix:** Replaced with the approved `@tailwindcss/postcss` + `postcss.config.mjs` and rewrote `next.config.ts` to security headers only, as the plan specifies.
- **Files modified:** package.json, postcss.config.mjs, next.config.ts
- **Verification:** build + 36 Playwright tests pass; package.json contains only approved names.
- **Commit:** 1a5d7fa

**2. [Rule 3 - Blocking] Version compatibility within the approved package names**
- **Found during:** Task 2
- **Issue:** The newest TypeScript (7.0.2) and ESLint (10.x) fall outside the peer ranges of `typescript-eslint` (<6.1) and `eslint-plugin-react/import/jsx-a11y` (≤9). vitest 5 rejected the scaffold's `@types/node ^20`.
- **Fix:** Kept the scaffold's `typescript ^5` and `eslint ^9`, and set `@types/node ^24` to match Node 24.
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm run lint` and `tsc --noEmit` exit 0.
- **Commit:** 1a5d7fa

**3. [Rule 2 - Missing critical] Typecheck independence from generated route types**
- **Found during:** Task 2
- **Issue:** `LayoutProps`/`PageProps` exist only after `next typegen`/build, so `tsc --noEmit` would fail on a fresh clone.
- **Fix:** Typed `params` explicitly as `Promise<{ locale: string }>`.
- **Verification:** `tsc --noEmit` exits 0 after deleting `.next`.
- **Commit:** 1a5d7fa

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical). **Impact:** no scope change; all deviations keep the build on the approved package list and the plan's architecture contract.

## Issues Encountered

- Later shadcn steps (01-15, 01-16, 01-10): the registry's `import { cn } from "cn"` and `lib/utils.ts` (`export { cn } from "cn"`) must be rewritten to an `@/lib/utils` implementation using `clsx` + `tailwind-merge`. If `shadcn add` attempts to install `cn`, stop and copy the component source instead.
- The dev dependency tree (create-next-app scaffold) reported high-severity advisories during install; the production tree audit is clean. Not addressed here (`npm audit fix --force` would make breaking changes).

## Verification

- `npm.cmd run lint` → exit 0
- `npx.cmd tsc --noEmit` → exit 0
- `npx.cmd playwright test tests/e2e/locale.spec.ts` → 36 passed (desktop-chromium, tablet-webkit, phone-chromium, phone-webkit)

## Self-Check: PASSED

- Key files exist on disk; plan commits 1a5d7fa, ef38449, 4b461e0 are on this branch.
- Task 2 AC: `detectLocale` in src/proxy.ts ✓; `git check-ignore .env.local` prints it ✓, `.env.example` exit 1 ✓; no manifest files ✓; only approved packages, all required present ✓.
- Task 3 AC: `getDictionary` in page.tsx ✓; pt/en top-level key parity exits 0 ✓; tests pass in all four viewport projects ✓.

## Next Phase Readiness

Ready for 01-15 (hosted Supabase data boundary). That plan pauses for the human to create the Supabase DEV/PROD EU projects and `.env.local`.
