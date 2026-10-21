# Architecture Research

**Domain:** Family cookbook / recipe capture and sharing
**Researched:** 2026-10-20
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        Phone-first client layer                       │
├──────────────────────────────────────────────────────────────────────┤
│  Mobile app / PWA shell                                              │
│  - camera capture                                                     │
│  - offline draft queue                                                │
│  - recipe browsing/search                                             │
│  - review/edit of extracted draft                                     │
├──────────────────────────────────────────────────────────────────────┤
│                    API / application services layer                   │
│  API gateway / app server                                              │
│  - family membership & auth                                            │
│  - recipe CRUD + validation                                           │
│  - OCR job submission                                                  │
│  - sync orchestration                                                  │
├──────────────────────────────────────────────────────────────────────┤
│                    Domain and workflow services                       │
│  - recipe ingestion service                                            │
│  - OCR extraction service                                              │
│  - recipe review service                                               │
│  - search indexing service                                            │
│  - event / sync service                                                │
├──────────────────────────────────────────────────────────────────────┤
│                        Data and storage layer                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │
│  │ Recipe DB     │  │ Object store  │  │ Search index  │              │
│  │ transactional │  │ image files   │  │ full-text     │              │
│  │ metadata      │  │ variants      │  │ recipe search │              │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘              │
│          │                    │                     │                   │
│          └────────────────────┴─────────────────────┘                   │
│                                  │                                     │
│                          Family sync / cache layer                   │
│                          - device local store                         │
│                          - pending sync queue                         │
│                          - conflict resolution                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical implementation |
|-----------|----------------|------------------------|
| Mobile client | Capture photo, browse cookbook, edit recipe drafts, handle offline queue | Native mobile app, PWA, or hybrid shell |
| App API | Expose recipe and family operations; validate inputs; enforce auth rules | HTTP JSON API or serverless API layer |
| Identity & family access service | Register members, manage invites, family membership, role checks | OIDC/OAuth or auth provider plus family membership table |
| Ingestion service | Accept upload metadata, create recipe draft, track source image and review state | Domain service behind API |
| OCR / extraction service | Convert image to text; produce structured candidates for title, ingredients, instructions, categories | Managed OCR + ML parsing service or background worker |
| Review & validation service | Present extracted draft to human user; approve/reject/transform before confirm | API + editing UI |
| Recipe domain service | Enforce canonical recipe schema, ingredient normalization, category assignment | Domain logic in backend |
| Object storage | Preserve photo originals and derived images; provide signed upload/download URLs | Blob/object storage |
| Relational metadata store | Store canonical recipes, family associations, draft states, permissions, comments | SQL database |
| Search index | Make recipe name, ingredient, and category queries responsive | Full-text search index or search service |
| Sync engine | Propagate completed recipe updates to family devices; resolve collisions | Event stream + sync queue or conflict-safe replication |
| Offline cache | Queue uploads and edits locally; replay when connectivity returns | Local database or app cache |

## Recommended Project Structure

The best structure for this project is a small but intentionally layered architecture: one shared family domain, a mobile-first client, and a backend that separates storage, image handling, OCR workflows, and search concerns.

```text
src/
├── mobile/                    # phone-first UI, camera capture, offline cache
│   ├── screens/               # recipe list, upload, review, detail, settings
│   ├── components/            # recipe card, ingredient editor, camera flow
│   ├── sync/                  # local queue, retry logic, conflict handling
│   └── stores/                # client state and offline persisted draft state
├── api/                       # application endpoints and auth checks
│   ├── routes/                # recipe, family, upload, OCR, sync routes
│   ├── controllers/           # request validation and orchestration
│   └── middleware/            # auth, family membership, rate limiting
├── domain/                    # recipe entities, family model, validation rules
│   ├── recipe/                # title/ingredient/instruction schema
│   ├── family/                # membership and access rules
│   └── review/                # draft lifecycle states and approvals
├── services/
│   ├── ingestion/             # upload validation and draft creation
│   ├── ocr/                   # image-to-text + structured extraction
│   ├── search/                # search normalization and indexing
│   └── sync/                  # device synchronization and conflict resolution
├── storage/
│   ├── blobs/                 # image/file storage abstraction
│   ├── db/                    # recipe schema and read/write access
│   └── search/                # indexer client and query abstraction
├── jobs/                      # asynchronous OCR and indexing tasks
│   ├── ocr-worker/            # image processing pipeline
│   └── indexing-worker/       # build recipe search documents
├── config/                    # env config, auth providers, storage settings
└── shared/                    # DTOs, validation schemas, event contracts
```

### Structure Rationale

- **mobile/**: the app is the primary user touchpoint and should be optimized for phone capture, review, and quick search.
- **api/**: keeps authentication and recipe operations separate from OCR and storage details.
- **domain/**: centralizes business rules (recipe schema, family access, validation) so the same rules apply across all channels.
- **services/**: isolates OCR, search, and sync logic so they can evolve independently without entangling the UI.
- **storage/**: prevents the application layer from depending on one storage type; image blobs and recipe metadata are different concerns.
- **jobs/**: OCR and indexing are asynchronous and should not block the user experience.

## Architectural Patterns

### Pattern 1: Request/response API with background job processing

**What:** The phone app uploads an image and creates a recipe draft immediately, then a background OCR worker processes the image and emits a structured draft candidate. The user reviews and approves before saving.

**When to use:** This fits the core requirement that OCR is helpful but not authoritative. A long-running OCR task cannot block recipe creation or user review.

**Trade-offs:** Strong separation of concerns and better reliability. Requires job tracking, retry semantics, and clean state transitions for draft approval/rejection.

**Example:**

```typescript
// conceptual flow; stack-agnostic
uploadRecipeImage(file)
  -> persist image blob
  -> create recipeDraft { status: 'pending_ocr' }
  -> enqueue OcrJob(draftId, imageKey)

ocrWorker(draftId, imageKey)
  -> extract text from image
  -> structure into title, ingredients, instructions, categories
  -> update recipeDraft { status: 'ready_for_review', candidate: ... }
```

### Pattern 2: Authoritative recipe record with separate review state

**What:** Keep one canonical recipe record, but do not treat the OCR output as the final truth. A draft review state ensures the user can modify the extracted text before the recipe is confirmed.

**When to use:** This is the correct model for handwriting recognition where errors are likely.

**Trade-offs:** More data model complexity, but much safer than auto-saving uncertain OCR results. It also makes auditing easier when someone re-edits a recipe after the fact.

**Example:**

```typescript
// conceptual model; not tied to a specific stack
Recipe {
  id: string
  familyId: string
  status: 'draft' | 'confirmed' | 'archived'
  title: string
  ingredients: Ingredient[]
  instructions: Instruction[]
  sourceImageKey?: string
  createdBy: string
  reviewedBy?: string
  reviewedAt?: string
}
```

### Pattern 3: Family-scoped data with per-user identity

**What:** Users authenticate individually, then belong to a family group whose recipes are shared. The recipe data are scoped to the family, while user-level identity remains separate for ownership, audit, and future permissions.

**When to use:** This is the most natural model for a shared household cookbook with multiple members and individual device ownership.

**Trade-offs:** More access-control complexity than a single shared account, but safer and more scalable. It also avoids ownership ambiguity in a household with multiple devices.

**Example:**

```typescript
User {
  id: string
  email: string
  familyMemberships: string[]
}

Family {
  id: string
  name: string
  members: string[]
}

Recipe {
  id: string
  familyId: string
  ownerUserId: string
  visibility: 'family'
}
```

## Data Flow

### Primary recipe capture flow

```text
Phone camera
    ↓
Photo capture / image selection
    ↓
Upload to app API
    ↓
Image validation + blob storage
    ↓
OCR / handwriting extraction service
    ↓
Structured candidate: title, ingredients, instructions, categories
    ↓
Editable draft shown in mobile review screen
    ↓
User edits / confirms / rejects fields
    ↓
Confirmed recipe stored as canonical recipe record
    ↓
Recipe metadata indexed for search
    ↓
Shared sync to family members' devices
    ↓
Recipe searchable by name, ingredient, category
```

### Key data flows

1. **Photo ingestion flow:** The app captures a handwritten recipe, uploads the original image, and stores it in object storage while creating a draft record. The system should keep the raw image as evidence and allow reprocessing if extraction quality improves.
2. **Extraction review flow:** OCR produces a candidate draft; the app must display it in a review editor so the user can correct errors before confirmation. Save only confirmed state to canonical recipe data.
3. **Recipe publication/sync flow:** After confirmation, the recipe is written to the shared family dataset, indexed for search, and synchronized outward to other family devices. This should be idempotent so retries do not create duplicate recipes.
4. **Search flow:** The API queries a search index over recipe title, ingredient text, and category tokens; the UI should show results quickly and support partial matches.
5. **Offline-first flow:** A local device cache stores draft images, pending uploads, and recent recipe metadata. When connectivity returns, the app replays queued operations and resolves conflicts deterministically.

## Recommended Architecture Decisions

### 1) Family access model

Recommended default: individual user accounts connected to a shared family group.

- Why: clear ownership, easier device-level auth, future support for invites and access revocation.
- Keep recipe visibility family-scoped rather than public.
- Do not start with a shared “family login” unless the user explicitly prefers it.

**Decision requiring user input:** Should the product use a single family account or per-person accounts with a family membership group? This has major implications for user identity, auditability, and invite flows.

### 2) Image storage and processing

Recommended default: a blob/object store for original photos and generated thumbnails, with metadata stored in a transactional database.

- Original images should be retained as source evidence.
- Generated OCR crops and thumbnails can be separate artifacts if needed.
- The object store is not the canonical recipe source; it is the original asset store.

### 3) Recipe persistence model

Recommended model: canonical recipe table + search projection + source image references.

- The relational database stores the normalized recipe record.
- Search uses a denormalized record or searchable index.
- Draft review states remain part of the canonical lifecycle; do not overwrite the user’s final edits with raw OCR output.

### 4) Search architecture

Recommended default: maintain a searchable projection of normalized recipe data using full-text search on title, ingredient lines, and category tags.

- Search should be exact enough for name and ingredient lookup.
- Keep a small metadata layer for category filtering and sorting.
- Add a lightweight search tuning pass after initial usage reveals common queries.

### 5) Mobile/offline strategy

Recommended default: local-first mobile shell with queued sync.

- Capture and draft review should work even with weak or absent connectivity.
- Uploads and edits should queue locally and sync after connectivity returns.
- For offline conflict handling, prefer “last writer wins” on the same field with a clear revision/updated timestamp, or require explicit user conflict resolution for edits that overlap.

**Decision requiring user input:** Should the first release be a web app with strong PWA support, or a native app shell for iOS/Android? The answer affects offline capability, camera access, push notifications, and sync reliability.

## Architectural Alternatives and Trade-offs

### Alternative A: Native mobile app + backend API

**Characteristics:**
- Best camera UX and file handling
- Strong offline support
- More mobile-specific work for app store distribution

**Pros:**
- Better photo capture and local caching
- Easier to build offline-first flows
- More polished phone experience

**Cons:**
- Higher development cost
- Requires maintenance for both iOS and Android or a cross-platform toolchain

**Best fit:** If the team wants the most reliable phone-first experience and can support mobile app maintenance.

### Alternative B: Responsive web app with PWA support

**Characteristics:**
- Fastest greenfield path
- Device camera access can be supported with browser APIs
- Lower platform maintenance cost

**Pros:**
- Lower cost to launch
- Easier to deploy and maintain
- Works well for a family cookbook while staying accessible on phones

**Cons:**
- Camera and file handling quality varies by browser
- Offline support is adequate but not as polished as a native app
- Harder to guarantee full-device reliability

**Best fit:** If the first release priorities are speed, simplicity, and broad device access.

### Alternative C: Serverless-first backend with managed services

**Characteristics:**
- Small team can start with isolated functions for OCR, auth, and recipes
- Good scaling and lower operational burden

**Pros:**
- Very quick to prototype
- Natural fit for asynchronous OCR workers and event-driven sync
- Cloud-managed services reduce infrastructure upkeep

**Cons:**
- Event choreography can become complex if not deliberately designed
- Debugging distributed jobs can be harder than a monolithic API during early growth

**Best fit:** If the team expects asynchronous processing and wants to separate OCR from the main API path.

### Alternative D: Monolith-first backend with modular services inside one application

**Characteristics:**
- Simpler initial architecture
- Easier to reason about during first 1–5 teams and MVP scope

**Pros:**
- Faster to implement and test
- Clearer transaction boundaries for recipe creation and family membership

**Cons:**
- OCR and sync components can become tightly coupled if not kept modular
- Scaling later may require extraction into separate services

**Best fit:** If the team is small and product likely stays under moderate scale for the first release.

## Sensible Build Order

1. **Family identity and access model**
   - Build authentication, family membership, and recipe permissions first.
   - Without this, recipes cannot be correctly shared or protected.

2. **Recipe schema and CRUD APIs**
   - Build the canonical recipe data model and update flow before adding photography or OCR.
   - This creates the base for drafts, confirmed recipes, and search indexing.

3. **Phone-first recipe browsing and editing UI**
   - Prioritize the mobile recipe list, detail view, and editor workflow.
   - Users need to navigate and update recipes comfortably on a phone before more advanced automation is added.

4. **Photo upload and image storage**
   - Add image capture, upload, and blob lifecycle management.
   - Keep original images separate from canonical recipe records to prevent data loss or poor extraction results.

5. **OCR pipeline and draft review**
   - Add background OCR processing and a review screen that allows edits before final save.
   - Do not auto-save OCR output without review; this is a primary product requirement and a key risk area.

6. **Search and family synchronization**
   - Once recipes exist and are confirmed, build search indexing and family-wide propagation.
   - Make search fast enough for name, ingredient, and category queries.

7. **Offline queue and sync conflict handling**
   - After core flows work online, add asynchronous retries and conflict resolution.
   - Offline capability is important to the family use case, but it should be layered in after the data model is stable.

8. **Hardening and operational improvements**
   - Add monitoring, audit logs, duplicate detection, image retention policies, and family permission review.

## Important Non-Functional Concerns

### Authorization and data boundaries

- A family cookbook should make recipe access family-scoped, not global.
- Recipe ownership, edit privileges, and family membership must be enforced in the API layer, not only the client.
- A user should never rely on the front-end to prevent unauthorized access.

### Privacy and image handling

- Original recipe photos can contain handwriting, notes, and personal context beyond the recipe itself.
- Store image metadata and retention policies explicitly.
- If the app ever supports deletion, ensure recipe records and image blobs are handled consistently.

### Search quality

- Search needs to work on normalized text and category tokens, not only the title.
- Ingredient lookups often fail if a recipe stores ingredient text as a single paragraph rather than structured ingredient rows.
- Category tags should be normalized to support filtering and fuzzy searching.

### Mobile and offline considerations

- A large camera upload should not block the user while the app is collecting a recipe.
- Local storage should persist pending uploads and recent recipe state.
- Sync should be idempotent and resilient to network loss or device interruption.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Saving OCR output directly without review

**What people do:** Treat the parsed recipe as final as soon as the image is processed.

**Why it's wrong:** Handwriting extraction is error-prone. This creates bad recipes, user distrust, and a messy family cookbook.

**Do this instead:** Keep OCR as a candidate draft. Require human validation before saving the canonical record.

### Anti-Pattern 2: Using a single shared account without member identity

**What people do:** Use one family login for everyone and skip per-user accounts.

**Why it's wrong:** It collapses ownership, access control, and audit history into one account. It is also problematic when devices or members leave the family.

**Do this instead:** Prefer per-user identity plus family membership and explicit role rules.

### Anti-Pattern 3: Storing image files and recipe rows in the same database schema

**What people do:** Keep raw image bytes next to recipe metadata in a single transactional store.

**Why it's wrong:** Images are large, expensive to index, and often need different lifecycle and retention rules than recipe text.

**Do this instead:** Use object storage for image assets and a relational or document store for recipe metadata and permissions.

### Anti-Pattern 4: Designing search as an afterthought

**What people do:** Store recipe data in a raw free-text blob and only add search later.

**Why it's wrong:** Name, ingredient, and category lookups become slow and brittle as data grows.

**Do this instead:** Build a normalized searchable projection from the start.

## Integration Points

### External services

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| OCR provider | Async background job | Best implemented as a worker that returns a structured candidate for human review |
| Object storage | Signed upload URLs or API-mediated upload | Keeps original images outside the transactional DB |
| Auth provider | OIDC/OAuth with family membership claims | Need decision on single-family vs user-based identity |
| Search service | Index recipe projection | Use title, ingredient, and category text |
| Sync service | Device event stream or polling | Needed for multi-device family updates |

### Internal boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Mobile client ↔ API | JSON over HTTPS | Handles upload, review, and recipe queries |
| API ↔ OCR worker | Job queue or async callback | Separate long-running work from request handling |
| API ↔ Recipe DB | Transactions and domain validation | Outer boundary for canonical recipe data |
| API ↔ Search index | Indexing events | Keep search data eventually consistent |
| Client ↔ Local cache | SQLite/IndexedDB or equivalent | Enables offline queue and replay |

## Sources

- Google Cloud Vision OCR documentation: https://cloud.google.com/vision/docs/ocr (accessed 2026-10-20)
- Azure AI Vision documentation: https://learn.microsoft.com/azure/ai-services/computer-vision/overview (accessed 2026-10-20)
- AWS Textract documentation: https://docs.aws.amazon.com/textract/latest/dg/what-is.html (accessed 2026-10-20)
- AWS S3 object storage overview: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html (accessed 2026-10-20)
- Azure Blob Storage overview: https://learn.microsoft.com/azure/storage/blobs/storage-blobs-introduction (accessed 2026-10-20)
- Google Firebase Authentication documentation: https://firebase.google.com/docs/auth (accessed 2026-10-20)
- OpenID Connect Core specification: https://openid.net/specs/openid-connect-core-1_0.html (accessed 2026-10-20)
- PostgreSQL full-text search: https://www.postgresql.org/docs/current/textsearch.html (accessed 2026-10-20)
- MDN Progressive Web Apps documentation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps (accessed 2026-10-20)
- Google Android app data and storage guidance: https://developer.android.com/training/data-storage (accessed 2026-10-20)
- Apple developer documentation for app lifecycle and offline-capable apps: https://developer.apple.com/documentation/uikit/app_and_environment (accessed 2026-10-20)

---
*Architecture research for: family recipe cookbook*
*Researched: 2026-10-20*
