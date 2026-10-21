# Stack Research

**Domain:** Phone-first, private shared family cookbook with handwritten-recipe capture  
**Researched:** 2026-10-20  
**Confidence:** LOW

> **Confidence note:** Official documentation and package registry pages were reachable and inspected directly, but the configured web-search provider was unavailable and the research seam classifies direct web-fetch findings as LOW even when verified. The version numbers below are snapshots observed on the access date, not a promise that they remain latest or a substitute for the Expo compatibility check during implementation. Architecture choices are recommendations, not project decisions.

## Scope and Decision Status

`.planning/STATE.md` was not present. The active scope is taken from `.planning/PROJECT.md`: shared online recipes, phone-friendly use, handwritten-image import into an editable draft, and search by recipe name, ingredient, and category. The project has not selected an implementation stack.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo + React Native + React | Expo `58.0.16`; React Native `0.88.0`; React `19.3.1` | Cross-platform mobile app, with a possible web entry point | Expo documents one platform for native iOS, Android, and web. A native camera/photo workflow is central here; Expo's SDK-managed dependencies reduce native setup. These are registry versions observed 2026-10-20, not an independent compatibility certification. Use `npx expo install` and `npx expo install --check` rather than independently upgrading React Native packages. |
| Expo Router | `58.0.24` | App navigation and deep links | A natural routing option within the Expo stack; align it with the Expo SDK rather than treating the registry's latest release as automatically compatible. |
| Expo ImagePicker | `58.0.10` | Open the camera or photo library for a recipe image | The current Expo API exposes both `launchCameraAsync()` and `launchImageLibraryAsync()`. Start with the system camera/library flows rather than building a custom camera view; add `expo-camera` only if framing, retake, or guided capture proves necessary. |
| Supabase | `@supabase/supabase-js 2.118.0`; managed PostgreSQL | User sign-in, recipe database, private image storage, and optional change notifications | This small shared collection is naturally relational: users belong to a family, recipes belong to that family, ingredients are searchable records, and categories can be linked to recipes. Supabase documents PostgreSQL full-text search and policy-controlled Storage, avoiding a separate search service for the stated scope. Choose the database major offered for the selected Supabase project/region; PostgreSQL 18 is the current stable upstream major at research time, but this research did not verify that every Supabase plan/region provisions it. |
| Google Cloud Document AI Enterprise Document OCR | Processor/API version is managed by Google; Node client `@google-cloud/documentai 10.2.0` | Handwriting and printed-text OCR from uploaded images | Google's processor documentation says its OCR processor extracts printed and handwritten text in more than 200 languages and includes document-readability quality assessment. This is a better first benchmark than assuming generic OCR or on-device text recognition will handle family handwriting. Actual accuracy on this family's recipes is unverified. |
| Vertex AI Gemini structured output | Model: select after a regional/quality/cost test; Node SDK `@google/genai 2.30.0` | Convert OCR text into a recipe-shaped draft | Vertex AI documents JSON-schema-constrained structured output. Use it to map OCR text into title, ingredient lines, and instruction steps; schema compliance does not prove that an ingredient, amount, or instruction was read correctly. Keep human review mandatory and preserve the OCR text for correction. |
| Google Cloud Run | Managed service; Node.js `24.3+` recommended if supported by the selected runtime | Private OCR/extraction orchestration API | Run Document AI and Gemini calls server-side using a Cloud Run service identity. The current Expo/React Native package metadata requires Node `24.3+` for those package versions, and the current Document AI client requires Node `22+`; Node 24 meets those declared engine ranges. Confirm the selected Cloud Run runtime is available before deployment. Do not put provider credentials or privileged Supabase keys in the app. |
| PostgreSQL full-text search + `pg_trgm` | PostgreSQL's installed extensions; PostgreSQL 18 upstream docs | Search title, ingredients, categories, and tolerate typing variation | Use a weighted `tsvector`/GIN index for token search and exact category filters; add trigram similarity for misspellings and partial title/ingredient matches. This covers the specified family-scale search without operating a second index or paying for a search vendor. Confirm extension availability and language configuration on the provisioned database. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `expo-secure-store` | `58.0.2` | Secure local storage for sensitive session material | Use for a native app's persisted auth tokens when configuring Supabase Auth's storage adapter. Do not treat local token storage as the authorization boundary; enforce family access in server/database policies. |
| `@google-cloud/documentai` | `10.2.0` | Node client for the Document AI API | Use only in the server-side extraction service. Package metadata declares Node `>=22`; it should not be bundled in the mobile client. |
| `@google/genai` | `2.30.0` | Gemini SDK, including Vertex AI use | Use server-side with Vertex AI and Cloud Run identity. Keep model selection configurable; test actual recipe samples and regional availability before fixing a model ID. |
| `@supabase/supabase-js` | `2.118.0` | Supabase Auth, PostgREST, Storage, and Realtime client | Use in the app with the public/anon project key and the signed-in user's session. The service-role key bypasses RLS and must never ship in an app bundle. |
| TypeScript | `7.0.2` | Shared application and service type checking | Recommended for recipe/schema types shared between client and API. This is the latest npm release observed at access time; validate the toolchain and lint/type-check plugins before adopting a newly released major. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Expo CLI (`npx expo`) | Run, build, and validate the native app | Install SDK-compatible native packages with `npx expo install`; run `npx expo install --check` after dependency changes. Test camera permissions and image upload on actual iOS and Android devices. |
| Supabase CLI and local development stack | Versioned SQL migrations, local database, and RLS tests | Keep schema, search indexes, and membership/storage policies in migrations. Include tests that prove a user outside a family cannot read its recipes or source images. |
| Google Cloud CLI | Provision Cloud Run, Document AI, Vertex AI, identities, and observability | Use least-privilege service identities and separate development/production projects. Select and test a region that supports both AI services and the data-residency needs of the family. |

## Recommended Request/Data Flow

1. The signed-in app captures or selects an image and uploads it to a **private** Supabase Storage bucket. The image is associated with a family-scoped draft/import record.
2. The app requests extraction from the backend. The backend authenticates the caller and verifies family membership before accessing the image.
3. Cloud Run calls Document AI OCR, then asks Vertex AI Gemini to return only the defined recipe fields in a JSON-schema-constrained response. Keep the raw OCR text and any available quality signals with the draft; do not allow the model to write a final recipe directly.
4. The app displays the title, ingredient lines, and instructions in editable fields. The user corrects and explicitly saves. The final recipe and ingredient/category rows are stored in Postgres; the original photo remains private and can be retained or deleted according to a later product decision.
5. Browse/search queries use Postgres indexes and RLS. Refresh from the database on app focus; add Supabase Realtime notifications only if the family needs immediate cross-device updates. The database remains the source of truth.

## Search and Data Modeling Guidance

- Store recipes in a family-scoped table; represent ingredients as ordered recipe-ingredient rows and instructions as ordered steps. Store categories as controlled values or a recipe/category join rather than an unindexed blob if they must be filtered.
- Build a weighted search document with title highest, then ingredient names, then category labels. Index it with GIN. Use trigram indexes for tolerant name matching; use exact category filtering in SQL.
- Do not assume English stemming. Choose the text-search configuration after confirming recipe language(s); PostgreSQL's `simple` configuration is a reasonable multilingual baseline, while language-specific stemming may improve search if the cookbook is predominantly in one language. Test accents/diacritics and add `unaccent` only if needed.
- Scope every recipe and image operation by authenticated family membership with RLS/storage policies. A random or opaque family ID is not access control.
- Keep draft/import status distinct from saved recipes. Store edits as user-authored values; do not silently overwrite corrections by rerunning extraction.

## Verified Official Facts vs. Recommendations

**Facts checked directly in official documentation or package metadata on 2026-10-20:**

- Expo describes its platform as supporting universal native iOS, Android, and web apps; its ImagePicker docs list camera and library launch methods.
- Google Cloud's Document AI processor documentation describes OCR for handwritten and printed text across 200+ languages and a readability-quality assessment. This establishes feature support, **not** accuracy for these particular handwriting samples.
- Google Vertex AI documentation describes JSON-schema-constrained model output. It constrains output shape; it does not establish that extracted content is true.
- Supabase documents weighted PostgreSQL full-text search and `websearch_to_tsquery`; its Storage docs state uploads require policies on `storage.objects` and warn that service keys bypass RLS.
- PostgreSQL 18 documentation was the current stable documentation page observed; `pg_trgm` documents trigram similarity and index support.
- Package versions in the tables were read from the npm registry's `latest` tags on the access date. They may move independently; Expo itself recommends installing SDK-compatible packages through its CLI.

**Recommendations (not decisions already made by the project):**

- Use Expo native capture, Supabase for the family data plane, and Cloud Run + Document AI + Vertex AI for extraction because this combination keeps mobile capture, shared relational search, and credentialed AI work in components suited to each job.
- Require explicit review before save; OCR and structured output cannot guarantee recipe correctness.
- Start with built-in Postgres search; defer a dedicated search engine, offline-first synchronization, custom camera UI, and background queues until measured requirements justify their operational cost.
- Benchmark a representative set of handwritten pages, including poor lighting, cursive, stains, multiple recipes per page, and non-English text, before treating OCR quality or latency as acceptable.

## Installation

Separate the mobile app from the server so Google Cloud credentials and AI clients never enter the client bundle.

```bash
# Mobile app (Expo SDK-managed packages)
npx expo install expo-router expo-image-picker expo-secure-store
npm install @supabase/supabase-js@2.118.0
npm install -D typescript@7.0.2
npx expo install --check

# Server service (Node.js 24.3+)
npm install @google-cloud/documentai@10.2.0 @google/genai@2.30.0 @supabase/supabase-js@2.118.0
```

Treat these as access-date pins for planning, not an instruction to skip dependency compatibility checks. Use Expo's installer to select SDK-matched versions, and validate all Node 24 runtime/library combinations in a minimal deployment before building product features.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Expo / React Native native-first app | Next.js responsive PWA | Choose a PWA if opening a family link with no app installation is the highest priority and browser camera behavior is acceptable after testing on target phones. The project has not specified app-install tolerance; validate this before committing to distribution. |
| Supabase Postgres, Auth, and Storage | Firebase Auth + Firestore + Cloud Storage | Choose Firebase if effortless realtime/offline synchronization is more important than relational modeling and in-database full-text search. Plan a separate search service or a narrower search feature if using Firestore. |
| Google Document AI OCR | Google Cloud Vision OCR or an OCR provider with a better evaluated language/handwriting result | Switch only after benchmarking the family's actual recipes for accuracy, latency, region, privacy terms, and per-page cost. Do not assume generic printed-text OCR is equivalent to handwriting OCR. |
| Vertex AI Gemini schema-constrained extraction | Deterministic parser or Document AI custom extractor | Prefer deterministic/custom extraction if recipe layouts become standardized or the model invents/omits fields too often; these add setup/training and still require review. |
| PostgreSQL full-text + `pg_trgm` | Algolia, Typesense, or another hosted search index | Add a separate index only when measured search quality/latency or dataset size exceeds what indexed Postgres handles; it creates synchronization and privacy-policy work. |
| Cloud Run server-side orchestration | Supabase Edge Function | Use an Edge Function if it can securely call the selected Google services in the desired region and the team's operational preference favors one platform. Cloud Run is recommended here for native Google Cloud service identity and direct Document AI/Vertex AI integration. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| OCR or Gemini API credentials embedded in the mobile app | A distributed app bundle cannot keep provider credentials secret; a leaked key permits unauthorized usage. | Authenticated server endpoint on Cloud Run with a service identity and server-side secrets. |
| Supabase `service_role` key in the app or unguarded service-side database calls | Supabase documents that service keys bypass RLS; family records and photos could become accessible beyond membership boundaries. | App-side anon key with user session plus RLS; server validates user/family membership before privileged operations. |
| Auto-saving generated recipe text | A valid JSON object can still contain a wrong amount, ingredient, or instruction; OCR quality varies with handwriting and photo conditions. | Persist a draft, show it for editing, and require an explicit user save. |
| Tesseract.js/on-device OCR as the initial handwriting solution | It is not established by this research as accurate for the family's handwriting; selecting it without a representative benchmark risks making the core capture flow fail. | Benchmark Document AI OCR first; compare alternatives using the same labeled recipe photos. |
| Firestore as the default database for the current search requirement | It would require a separate search mechanism to deliver robust full-text/fuzzy ingredient search. | PostgreSQL full-text and trigram search in the shared data store. |
| A dedicated search cluster, vector database, or custom camera interface in the MVP | These add components, operating cost, and synchronization work not justified by the current family-scale requirements. | Start with indexed PostgreSQL and Expo ImagePicker; revisit only against measured user needs. |

## Stack Patterns by Variant

**If all family members accept installing an iOS/Android app:**
- Use Expo native-first for the capture/review experience, with Expo ImagePicker and a shared Supabase backend.
- Offer web support as a convenience, but test capture behavior in each mobile browser separately.

**If one-tap browser access without installation is essential:**
- Prefer a responsive Next.js PWA; verify camera input, photo orientation, permissions, and upload behavior on actual iOS Safari and Android Chrome before locking the stack.

**If the source recipes use one primary language:**
- Configure PostgreSQL search with a matching text-search dictionary and test diacritics; keep trigram matching for misspellings.

**If recipes are multilingual or language is unknown:**
- Begin with PostgreSQL's `simple` text-search configuration and explicit ingredient/category matching; defer language-specific stemming until sample queries are available.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Expo `58.0.16` | React Native `0.88.0`; Expo modules on SDK 58 | Registry snapshot indicates the SDK/package family. Let Expo CLI choose exact compatible module versions; verify with `expo install --check` and a device build. |
| React Native `0.88.0` | React `19.3.1` | The published React Native package metadata declares React `^19.3.0` as a peer range. |
| Expo SDK 58 packages | `expo-image-picker 58.0.10`, `expo-router 58.0.24`, `expo-secure-store 58.0.2` | Same SDK-major family in the registry snapshot; still resolve using Expo CLI rather than assuming arbitrary latest tags are aligned. |
| `@google-cloud/documentai 10.2.0` | Node.js `>=22` | Published package metadata declares this minimum; Node 24 satisfies it. |
| `@supabase/supabase-js 2.118.0` | Node.js `>=22` for its declared package engines | Published metadata; browser/native usage also depends on correct Supabase Auth persistence and client configuration. |
| `@google/genai 2.30.0` | Node.js `>=20` | Published metadata; configure its Vertex AI mode and server-side Google authentication, then verify structured output on the chosen model/region. |
| Supabase-managed PostgreSQL | PostgreSQL version offered for the selected project | Pin/record the actual database major only after creating the project; this research did not establish the version offered in every region/plan. |

## Sources

Official documentation and registry pages accessed 2026-10-20. Direct source inspection was available; the configured Brave search was unavailable (`BRAVE_API_KEY` not set), and Context7 was not available in this runtime.

- [Expo platform docs](https://docs.expo.dev/) — universal native iOS, Android, and web platform.
- [Expo ImagePicker API](https://docs.expo.dev/versions/latest/sdk/imagepicker/) — camera and library capture methods.
- [Expo CLI: installing compatible package versions](https://docs.expo.dev/more/expo-cli/#installing-compatible-package-versions) — use Expo's package-version resolution.
- [Expo SDK versions](https://docs.expo.dev/versions/latest/) — current SDK reference.
- [npm registry: Expo](https://registry.npmjs.org/expo/latest), [React Native](https://registry.npmjs.org/react-native/latest), [React](https://registry.npmjs.org/react/latest), [Expo Router](https://registry.npmjs.org/expo-router/latest), [Expo ImagePicker](https://registry.npmjs.org/expo-image-picker/latest), [Expo SecureStore](https://registry.npmjs.org/expo-secure-store/latest) — latest-tag version snapshots.
- [Supabase full-text search](https://supabase.com/docs/guides/database/full-text-search) — weighted search, query functions, and indexing.
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy-backed database access.
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control) — Storage policies and service-key warning.
- [npm registry: Supabase JS](https://registry.npmjs.org/%40supabase%2Fsupabase-js/latest) — version snapshot.
- [Document AI processor list](https://cloud.google.com/document-ai/docs/processors-list) — OCR processor handwriting/language support and quality assessment.
- [Enterprise Document OCR](https://cloud.google.com/document-ai/docs/enterprise-document-ocr) — OCR/layout processor capabilities.
- [Vertex AI structured output](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output) — JSON-schema-constrained model responses.
- [Google Gen AI SDK](https://github.com/googleapis/js-genai) — SDK repository and Vertex AI integration reference.
- [npm registry: Document AI Node client](https://registry.npmjs.org/%40google-cloud%2Fdocumentai/latest), [Google Gen AI SDK](https://registry.npmjs.org/%40google%2Fgenai/latest) — version and engine snapshots.
- [PostgreSQL 18 text search](https://www.postgresql.org/docs/18/textsearch.html) and [`pg_trgm`](https://www.postgresql.org/docs/18/pgtrgm.html) — full-text and trigram capabilities.

---
*Stack research for: Family Recipe Cookbook*  
*Researched: 2026-10-20*
