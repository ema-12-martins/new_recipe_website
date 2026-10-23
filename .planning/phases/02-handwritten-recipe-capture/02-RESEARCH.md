# Phase 2: Handwritten Recipe Capture - Research

**Researched:** 2026-10-23
**Domain:** Browser photo capture and resizing, private photo storage, offline photo caching, OCR/extraction provider integration on Next.js 16 + Supabase + Vercel
**Confidence:** MEDIUM (repo and Next.js docs verified from disk; Vercel and browser behaviours marked ASSUMED must be confirmed in the plan that depends on them)

Research was done inline by the orchestrator (no researcher subagent was available). Findings tagged [VERIFIED] were read from this repository or from `node_modules/next/dist/docs/`; [ASSUMED] comes from prior knowledge and must be checked before it is relied on.

## Summary

Phase 2 needs no new infrastructure beyond one private Supabase Storage bucket, one table, and a recognition endpoint whose provider is still undecided. The existing patterns carry most of the work: the server-issued recipe id (new-recipe page), RLS helpers `is_member()` / `current_cookbook_id()`, the IndexedDB offline store, and `recipe-form.tsx`.

Three decisions shape the plans:

1. **Photos go browser -> Supabase Storage directly, at Save time**, keyed by the server-issued recipe id. This avoids the Server Action body limit and honours D-09 (nothing stored before the member saves).
2. **Photos are shown through a same-origin route handler and cached for offline in IndexedDB**, not through signed cross-origin URLs, so the existing sign-out purge (D-04) and removed-member re-authorisation (D-18) keep working.
3. **Recognition sits behind a provider-neutral adapter with a deterministic stub.** The benchmark plan (D-18) decides the real provider; nothing in the capture, storage or review work depends on it.

## Findings

### F1. Upload size limits [VERIFIED + ASSUMED]
- Server Actions accept 1 MB request bodies by default (`serverActions.bodySizeLimit`, doc `05-config/01-next-config-js/serverActions.md`). Six resized photos will exceed that. [VERIFIED]
- `src/proxy.ts` exists, so Next.js buffers request bodies up to `proxyClientMaxBodySize` (10 MB default); beyond it the body is silently truncated and the request still proceeds (doc `proxyClientMaxBodySize.md`). A route handler that reads a photo upload would see a partial body without an error. [VERIFIED]
- Vercel Functions cap request bodies at about 4.5 MB. [ASSUMED - confirm in the recognition plan before sizing the client compression budget]
- **Design consequence:** never send photos through a Server Action. Save-time uploads use the Supabase Storage client from the browser. Recognition requests go to a route handler with a client-enforced total budget (target <= 3.5 MB across all photos) and the handler rejects over-budget bodies explicitly rather than trusting the proxy.

### F2. Save flow and idempotency [VERIFIED]
- The new-recipe page already issues the recipe id on the server (`new/page.tsx`, `randomUUID`), and `createRecipe` treats a primary-key duplicate (23505) as "already created". `recipes` grants `insert (id, ...)` to `authenticated`.
- **Design consequence:** the photo storage path can be `{cookbook_id}/{recipe_id}/{photo_id}.jpg`, fully known before the recipe row exists. Save order: (1) browser uploads objects; (2) save action inserts the recipe (idempotent); (3) the action inserts `recipe_photos` rows with client-issued ids (idempotent via primary key, `on conflict do nothing`). A retry after a partial failure converges to the right state. Objects are uploaded only when the member presses Save, so there are no orphan uploads from abandoned drafts (D-09); a failure mid-save leaves at most a few orphan objects, removed best-effort by the client.

### F3. Storage bucket and policies [VERIFIED for the helpers, ASSUMED for Storage API details]
- `supabase/config.toml` allows 50 MiB files; the hosted project is on the free tier (D-33, D-34).
- Create a **private** bucket `recipe-photos` (public = false), `allowed_mime_types = image/jpeg`, `file_size_limit` of about 2 MB, via migration.
- Policies on `storage.objects` for that bucket, TO authenticated: select, insert and delete using `bucket_id = 'recipe-photos' and public.is_member() and (storage.foldername(name))[1] = public.current_cookbook_id()::text`. No update policy (photos are replaced by delete + insert). A removed member loses every policy at once (D-09, D-24).
- `recipe_photos` table: `id uuid pk`, `recipe_id uuid references recipes on delete cascade`, `cookbook_id uuid`, `position int`, `object_path text unique`, `created_at`. RLS mirrors `recipes` (member of the same cookbook). Photo removal is allowed for members (D-21); recipe deletion remains impossible (Phase 1 D-15), so the cascade is only reachable by the operator.
- Storage object content type is client-declared, so a bucket mime filter is only a first line of defence. Severity is low because only authenticated members can upload and the files are never served to the public.

### F4. Serving photos [VERIFIED for offline design, ASSUMED for bandwidth]
- `public/sw.js` handles only same-origin GETs (static assets and navigations). Supabase signed URLs are cross-origin and expire, so they would bypass the service worker and could not be purged by the existing logic.
- **Design consequence:** add a same-origin route handler (for example `GET /api/recipes/[recipeId]/photos/[photoId]`) that checks membership with the user-scoped client, downloads from Storage, and streams the bytes with `Cache-Control: private, no-store`. The recipe page uses it for thumbnails and the viewer.
- Offline copies are Blobs in a new IndexedDB `photos` store written when a recipe is opened (D-38), cleared in the same transaction as recipes when ownership changes or on sign-out (D-04, D-18).

### F5. Offline database versioning hazard [VERIFIED]
- `src/lib/offline/constants.ts` and the static reader `public/offline.js` each hard-code `OFFLINE_DB_VERSION = 1` and the store names; `public/offline.js` cannot import modules. Adding a `photos` store means bumping the version to 2 in both files and in `store.ts` `onupgradeneeded`. An old cached `offline.js` opening a v2 database would fail with a version error.
- **Mitigation:** bump `STATIC_CACHE` (for example `cookbook-static-v2`) in both `sw.js` and `constants.ts` so the new reader replaces the cached one on activation, and extend `tests/unit/offline-assets.test.ts` to assert the two version constants and the store names match. The offline reader should also show a recipe's photos from the `photos` store, falling back to the "not available offline" placeholder.

### F6. Browser resizing and HEIC [ASSUMED]
- JPEG and PNG can be resized with `createImageBitmap(file, { imageOrientation: "from-image" })` and a canvas `toBlob("image/jpeg", 0.82)`, with the long edge capped at 2000 px; no library is needed.
- iOS Safari commonly converts HEIC to JPEG when a file input has `accept="image/*"`, and Safari can decode HEIC itself. Desktop Chrome and Firefox cannot decode HEIC. The only converters on npm are `heic-to` (LGPL-3.0) and `heic2any` (MIT, 0.0.4, effectively unmaintained). Adding either is a new dependency and a licence or maintenance decision.
- **Recommendation:** add no HEIC library in this phase. If `createImageBitmap` fails, show the "unsupported file" message from the UI-SPEC. This accepts HEIC wherever the browser can decode it (the family's iPhones) and is a stated limitation on desktop Chrome and Firefox. Flag it to the user at the plan checkpoint.

### F7. Recognition provider and hosting [ASSUMED]
- Candidates carried from earlier research: Google Document AI (Enterprise Document OCR; EU processor location) and Vertex AI Gemini structured output (EU region). Client packages checked on npm today: `@google-cloud/documentai` 10.2.0 (Apache-2.0), `@google/genai` 2.31.0 (Apache-2.0). Both stay uninstalled until a provider is approved (supply-chain gate).
- Hosting constraint: D-33 limits hosting to Vercel and Supabase free tiers, while the earlier stack research assumed Cloud Run. Calling Google from a Vercel route handler needs a service-account key (or workload identity federation) stored as a Vercel environment variable, plus a billed Google Cloud project. This is a cost and secret-handling decision for the user at the benchmark checkpoint, not something to assume.
- The Vercel function duration limit on the free plan decides whether the 60 s timeout in D-11 is achievable (`export const maxDuration`, doc `03-file-conventions/02-route-segment-config/maxDuration.md`). Confirm in the recognition plan.
- **Design consequence:** define a `RecognitionProvider` interface (input: ordered JPEG buffers and a language hint; output: `{ title, ingredients[], steps[] }` or a typed failure). Ship a deterministic `stub` provider (selected by an environment variable) for tests and local runs; the real provider is added after the benchmark.

### F8. Test infrastructure [VERIFIED]
- Unit (vitest `tests/unit`), integration against the DEV Supabase project with `tests/helpers/supabase-admin.ts`, and Playwright projects (desktop-chromium, tablet-webkit, phone-chromium, phone-webkit) with an owner `storageState`. Photo e2e tests need small fixture JPEGs (generated or committed under `tests/fixtures/`). Recognition e2e uses the stub provider only.
- Pitfalls from `.continue-here.md` that apply: PowerShell wildcard paths for `[locale]` routes (use `-LiteralPath`), `fieldset disabled={!hydrated}` for new client forms, `getByRole("alert")` ambiguity, and keeping `requireMembership(locale)` on every new `(app)` page (`tests/unit/app-pages-guard.test.ts`).

## Open Questions for the User (carried into the plans)

1. **Samples for the benchmark** (blocking for plan 02-01): 15-20 permissioned family recipe pages. The benchmark cannot finish without them.
2. **Google Cloud account and billing** (or another provider's) for the benchmark and for production recognition, and where its credentials will live.
3. **HEIC on desktop Chrome and Firefox** is unsupported in this phase (F6). Accept, or approve a converter dependency.
4. **Recognition and function limits** on the Vercel free plan (F1, F7) are unconfirmed.

## Security Domain (ASVS level 1)

| Concern | Control |
|---------|---------|
| Access to photos | Private bucket, RLS-style Storage policies on cookbook folder plus `is_member()`; no public URLs; same-origin proxy route re-checks membership |
| Removed member | Policies depend on `is_member()`, so access ends immediately; cached blobs are purged on reconnect per D-18 |
| Upload abuse | Bucket size and mime limits, client-side count limit (6), server-side validation of count and size in the save action |
| Provider credentials | Server-side environment variables only; `check:secrets` bundle scan must still pass |
| Untrusted recognition output | Treated as draft text only, validated with the existing recipe schema, never saved without the member's explicit action (D-08) |
| Supply chain | No new packages in plans 02-02 and 02-03; provider SDKs are added only after the benchmark approval |

## Sources

- Repository files read: `supabase/migrations/20261021120100_recipes.sql`, `src/lib/recipes/*`, `src/app/[locale]/(app)/recipes/actions.ts`, `src/lib/offline/*`, `public/sw.js`, `public/offline.js`, `components.json`, `.planning/phases/01-decisions-and-shared-cookbook/.continue-here.md`.
- Next.js 16.4.2 docs on disk: `serverActions.md`, `proxyClientMaxBodySize.md`, `maxDuration.md`.
- npm registry (versions and licences): `heic-to`, `browser-image-compression`, `heic2any`, `@google-cloud/documentai`, `@google/genai`.
