# Phase 1: Decisions and Shared Cookbook — Research

**Researched:** 2026-10-21  
**Domain:** Responsive browser web app for desktop, tablet, and phone; individual accounts and exact-email invitations; manual recipe CRUD; read-only offline cached recipes  
**Confidence:** MEDIUM for documented web-platform and accessibility capabilities; LOW for end-to-end product feasibility because no application or browser UAT has run.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

<!-- DATA_a7M2qP9x_START -->
#### Web Access and Connectivity
- **D-01:** Superseded by D-22 and D-23: the earlier app-store-installable iPhone and Android app decision is no longer in scope.
- **D-02:** Superseded by D-23: v1 supports the web app across desktop, tablet, and phone browsers.
- **D-03:** Previously loaded recipes remain available in the signed-in browser during a disconnection. Offline browsing shows only cached recipes with a clear offline notice; editing requires an internet connection.
- **D-04:** Clear cached recipe data when the member signs out.
- **D-05:** No implementation stack or framework is selected. Keep options open until implementation research validates them against the general browser-web target and the rest of the project constraints.

#### Family Membership and Invitations
- **D-06:** The first person to sign up creates the family cookbook and becomes its owner.
- **D-07:** The owner invites relatives by email to a specific address. An invitee without an account can create one and join the cookbook in a single guided flow.
- **D-08:** Use individual email-and-password accounts; do not use a shared family login.
- **D-09:** The owner manages invitations and access. All invited members can view, add, and edit recipes in the shared cookbook, consistent with the approved project requirements.
- **D-10:** When the owner removes a member's access, show a one-time list of recipes that member added and let the owner decide which to keep or remove. Do not show contributor names elsewhere in the cookbook.

#### Recipe Text and Structure
- **D-11:** Recipe content may be in Portuguese or English. Preserve each recipe's original wording, language, quantities, and units; do not translate or automatically convert them.
- **D-12:** Enter each ingredient as a flexible text line rather than requiring separate quantity, unit, and ingredient fields.
- **D-13:** Store instructions as separate ordered steps that can be rearranged.

#### Source Photos and Retention
- **D-14:** Retain original source photo(s) with a saved photo-imported recipe. The OCR review screen does not need to display the photo alongside extracted text; this is a previously established project decision.
- **D-15:** Recipe deletion, restoration, and a general trash bin are not part of Phase 1. Keep the approved roadmap scope unchanged. The owner-only cleanup choice in D-10 applies specifically to member access removal; do not build general recipe-delete or restore controls in this phase.

#### Clarifications recorded after the planning checkpoint
- **D-16:** iPhone and Android phones are available, but their availability is not evidence that browser compatibility or product flows have been tested. Browser validation must use recorded results rather than availability or compatibility tables. Physical-device phone testing is not a release prerequisite for the general web target. Apple and Google developer accounts and store-track eligibility are not relevant.
- **D-17:** If a regular (non-owner) member deletes their account, retain shared recipes and remove or anonymize that member's private creator metadata. This is a separate account-deletion policy, not the D-10 access-removal workflow.
- **D-18:** Accept that recipes cached in a disconnected browser remain readable until it reconnects or the member signs out. After reconnection, reauthorize before refreshing or showing remote data and clear the cache if access is denied. Do not claim immediate remote erasure from an offline browser.
- **D-19:** An invitation expires seven days after issue. The owner may resend or revoke an invitation. The invitee must verify the exact invited email address before joining; account creation and acceptance remain one guided flow per D-07.
- **D-20:** The application interface supports Portuguese and English. Recipe content in either language remains faithful to the entered wording, language, quantities, and units per D-11.
- **D-21:** The D-10 removal review identifies recipes by their original creator metadata. Include recipes first added by the removed member even if another member edited them later. Keep creator identity private and do not display contributor attribution in ordinary recipe UI.
- **D-22:** Superseded by D-23. This earlier decision selected a mobile-first browser web app for phone browsers only and excluded native apps, app stores, and installable PWA.
- **D-23:** Deliver one general browser-based web app usable across desktop, tablet, and phone screen sizes. There is no separate phone-specific version. Do not build native iOS or Android apps, app-store distribution, or an installable PWA. This supersedes the phone-only support boundary in D-02 and D-22.
<!-- DATA_a7M2qP9x_END -->

Source: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:16-46`. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:16-46`]

### the agent's Discretion

<!-- DATA_g4L8nR2c_START -->
- Choose the technical architecture, libraries, account/session implementation, and web framework only after validating the product decisions above and the browser platform constraints. No specific vendor, stack, or OCR provider is approved by the research.
- Determine the representative browser/viewport support matrix and implementation details for showing cached recipes safely in web browsers and communicating offline state, while preserving D-03, D-04, and D-18. Reassess feasibility without an installable PWA.
- Make source-photo retention, authorization, and member-removal cleanup explicit in the data and access design; do not infer legal, provider, or backup retention policy from this discussion.
- Before implementing account deletion for the cookbook owner, obtain a focused decision on the disposition of shared recipes, cookbook ownership/continuity, and private creator metadata. This owner-account case is distinct from the settled D-17 regular-member deletion policy and D-10 member removal.
<!-- DATA_g4L8nR2c_END -->

Source: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:48-52`. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:48-52`]

### Deferred Ideas (OUT OF SCOPE)

<!-- DATA_v9C3sH1m_START -->
- General recipe deletion, restore, and a trash bin are deferred and must not expand Phase 1. If this feature is later added, the user's preference is to keep a deleted recipe and its source photos recoverable for 30 days; any invited family member could restore or permanently remove it during that period. This preference does not authorize implementing those controls in the current phase.
<!-- DATA_v9C3sH1m_END -->

Source: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:112-113`. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:112-113`]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | A family member can create and use an individual account to access the cookbook. | Validate account creation, verification, sign-in/out, responsive form use, and account-isolated data across the representative browser matrix. No identity provider is selected. |
| AUTH-02 | A cookbook owner can invite family members to the private shared cookbook and remove their access. | Validate invite creation and lifecycle, exact verified-email binding, owner-only controls, removal, and reauthorization across representative browser engines. No email/auth provider is selected. |
| AUTH-03 | An invited family member can view, add, and edit recipes in the shared cookbook. | Test member acceptance and family-scoped reads/writes; product behavior and backend authorization remain unproven. |
| AUTH-04 | A family member can access the same shared cookbook and its saved recipes across their devices. | Verify authenticated online access to one canonical shared dataset from distinct browsers/clients; browser cache is only a local replica. |
| RECP-01 | A family member can manually create, view, and edit a recipe with a title, ingredients, and ordered instructions. | Test responsive browser manual CRUD (create/read/update, not general delete), free-text ingredients, ordered/reorderable steps, and faithful Portuguese/English persistence. |
| RECP-03 | A family member can edit any saved recipe in the shared cookbook. | Verify a member can edit another member's recipe, that saved ordering/text survive reload and another device, and that family membership—not UI visibility alone—governs access. |

The six IDs and descriptions are copied from `.planning/REQUIREMENTS.md:10-19`. [VERIFIED: `.planning/REQUIREMENTS.md:10-19`]
</phase_requirements>

## Summary

The refreshed target is one general browser app that reflows across desktop, tablet, and phone sizes. Validation must cover layout, input, keyboard/touch accessibility, auth/privacy, recipe fidelity, and the specified offline-cache behavior across representative browser engines and viewport classes. Device-mode emulation is a valuable repeatable check, but must be labeled as emulation rather than evidence from a physical device. No actual app or browser validation has run.

**Primary recommendation:** Plan framework-neutral responsive web behavior; use the evidence matrix in `01-PLATFORM-EVIDENCE.md` to cover current Chromium, Firefox, and WebKit/Safari engine families at representative desktop, tablet, and phone viewports. Run the core responsive flow in emulated viewports and browser automation; run direct actual-device/browser checks when available or when an emulation gap is material, but do not make a physical iPhone/Android test a universal gate. Keep the production framework, backend, identity/email, hosting/deployment, cache approach, and project layout unapproved until a suitable browser-validation gate is reviewed and the user explicitly decides. No native app, store distribution, or installable PWA work is in scope.

**Planning alignment:** Current CONTEXT.md records D-23 and says physical phone testing is not a release prerequisite; ROADMAP.md now describes responsive desktop/tablet/phone browser scope and a representative browser validation gate. STATE.md remains stale: it says “Phase 1 interim browser-validation gate planned; delivery paused pending actual phone-browser UAT and production choices” and “A phone-friendly private online cookbook for one family, including manually entered and photo-imported recipes, shared editing, and recipe retrieval.” This research follows the current CONTEXT/ROADMAP target; STATE.md was not edited because the user limited file changes to these two research artifacts. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:6-8,16-52`; `.planning/ROADMAP.md:12,20-21`; `.planning/STATE.md:4,22`]

### What the browser evidence does and does not establish

- WCAG 2.2 Reflow includes a 320 CSS-pixel-width criterion for ordinary vertically scrolling content; keyboard access and minimum target-size criteria are separately documented. Use WCAG 2.2 as the recommended accessibility validation baseline; this does not claim conformance, a formal audit, or legal compliance. [CITED: https://www.w3.org/TR/WCAG22/#reflow; https://www.w3.org/TR/WCAG22/#keyboard; https://www.w3.org/TR/WCAG22/#target-size-minimum; accessed 2026-10-21]
- Chrome DevTools Device Mode and Firefox Responsive Design Mode provide viewport/device emulation. Emulation does not prove actual operating-system browser chrome, physical touch/keyboard behavior, email handoff, storage lifecycle, or end-to-end product behavior. [CITED: https://developer.chrome.com/docs/devtools/device-mode/; https://firefox-source-docs.mozilla.org/devtools-user/responsive_design_mode/; accessed 2026-10-21]
- Browser automation documentation describes test execution on Chromium, Firefox, and WebKit and emulated mobile/tablet profiles. Use browser-engine results as automation evidence; report them separately from real browser/device observations. [CITED: https://playwright.dev/docs/browsers; accessed 2026-10-21]
- Service Workers and browser storage are available web-platform options and do not require installing the web app. Storage is subject to browser policy, quota, clearing, and eviction; cached application resources and cached recipe records are distinct. Thus D-03 remains a required product behavior but its feasibility/durability is not established. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API; https://developer.mozilla.org/en-US/docs/Web/API/Cache; https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API; https://webkit.org/blog/14403/updates-to-storage-policy/; https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria; accessed 2026-10-21]
- No compatibility table, local/emulated run, or device availability is product UAT. All UAT statuses in `01-PLATFORM-EVIDENCE.md` remain NOT RUN.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Responsive sign-up, sign-in, invite acceptance, and recipe UI | Browser / Client | API / Backend | Browser UI must reflow across desktop, tablet, and phone viewports; identity and membership decisions must be enforced remotely, not trusted to client UI. |
| Responsive accessibility and input behavior | Browser / Client | — | Semantic controls, keyboard/focus behavior, readable reflow, and pointer/touch target usability are client responsibilities across viewports. [CITED: https://www.w3.org/TR/WCAG22/; accessed 2026-10-21] |
| Account identity, invitation status, owner role, membership, and access removal | API / Backend | Browser / Client | Identity verification and authorization require a trusted boundary; clients must not grant themselves membership or owner rights. |
| Canonical shared recipes and cross-device synchronization | Database / Storage | API / Backend | AUTH-04 needs durable shared server-side state; a browser cache is local and only a replica. |
| Manual recipe create/view/edit | Browser / Client | API / Backend; Database / Storage | Client provides adaptive editors; backend/data layer authorizes and persists shared recipe changes. |
| Read-only offline recipe display and cache purge on sign-out | Browser / Client | API / Backend | Local browser storage can serve previously cached data; the backend reauthorizes on reconnect. Browser data may be evicted. |

This is a responsibility map, not a selected deployment topology. [ASSUMED]

## Standard Stack

### Core

| Component | Version | Purpose | Status |
|-----------|---------|---------|--------|
| Browser web platform (HTML/CSS/JavaScript and supported browser storage/network APIs) | No project version floor selected | Responsive desktop/tablet/phone UI, online requests, and possible local read-only data | Web capabilities are documented; browser support floor and production framework remain unapproved pending suitable browser validation and explicit user approval. |

No third-party package or production framework is recommended. The existing `.planning/research/STACK.md` names its core as “Expo + React Native + React” and recommends a native-first distribution; that recommendation is platform-mismatched/superseded for this revised general-browser target. Do not carry its Expo/native or conditional PWA recommendations forward. [VERIFIED: `.planning/research/STACK.md:1-4,11-21,143-151`; `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:5-7,16-20,46`]

### Supporting browser capabilities to investigate in the spike

| Capability | Role | Selection status / caveat |
|------------|------|---------------------------|
| Service Worker API | Can intercept requests and support an offline application shell or controlled network/cache behavior. | Optional browser capability, not required for app installation and not by itself a PWA install. It does not determine the recipe data model or guarantee cache retention. |
| Cache API | Explicit Request/Response cache that can support resource caching. | Candidate browser primitive only; not selected for recipes. Requires app-managed versioning, invalidation, and account isolation. |
| IndexedDB | Structured origin-scoped browser data storage, suitable to evaluate for recipe records. | Candidate browser primitive only; not selected. Browser storage can be cleared or evicted. |
| HTTPS | Secure production origin and prerequisite for Service Workers in normal browser contexts. | Required deployment property to verify; hosting provider and deployment design are unapproved. |

Service Worker use requires a secure context (normally HTTPS; localhost is treated as secure for development). Any HTTPS host and deployment design remain unselected. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API; accessed 2026-10-21]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate phone app or app-store distribution | One responsive browser app accessed through a URL | The general web app is the target; native builds, stores, and installable PWA behavior are explicitly out of scope. |
| Browser-managed HTTP cache as recipe persistence | Explicit application-managed browser storage | Generic HTTP caching is not a reliable account-scoped recipe-store contract. App-managed storage permits explicit data boundaries and purge logic, but is still subject to browser data clearing/eviction. Exact primitive is unresolved. |
| Installable PWA as an offline prerequisite | An ordinary browser app using supported web storage and, if justified, a Service Worker | Browser APIs do not require installable-app distribution. Offline shell/data persistence still needs validation; do not add install prompts or installation requirements. |

**Installation:** None. This phase must not lock or install a production stack.

**Version verification:** No production packages have been selected, so there are no package versions to approve. At validation time, record current browser names and exact versions for each run; standards/compatibility documentation is not a substitute for product evidence.

## Package Legitimacy Audit

Not applicable to the research refresh: no external packages are recommended or installed. Run the package-legitimacy gate if a later approved implementation plan introduces packages.

## Architecture Patterns

### System Architecture Diagram

```text
Desktop / tablet / phone browser clients
                    |
       responsive UI + account session
          | sign-up / invitation /
          | recipe read/write requests
          v
      HTTPS trusted boundary
       | identity + exact-email verification
       | membership + owner authorization
       | recipe validation and persistence
       v
 Canonical private family cookbook
          |
          | authorized online recipe response
          v
 Account-scoped browser cache (optional implementation)
       | online: reauthorize, refresh
       | offline: cached recipes only + notice
       | offline: writes disabled
       | sign-out/denied reconnect: purge
```

Conceptual boundaries only; services and deployment are not chosen. The same web app must reflow across all three screen-size classes. Browser access does not require installing a native app, app-store distribution, or an installable PWA; Service Worker use, if selected, is a separate browser capability. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API; https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing; accessed 2026-10-21]

### Recommended Project Structure

No application code or established app structure exists. Do not prescribe directories until the web framework is selected. Preserve clear responsibility boundaries for responsive browser screens, identity/session, invitation/membership, recipe editing, authorized data access, and local cache/offline state. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:84-93`]

### Pattern 0: Responsive layout and accessible interaction

**What:** Build one fluid browser UI rather than device-specific app variants. Let content reflow at narrow widths, keep core recipe/account actions available in portrait and landscape, and verify long Portuguese/English labels and recipe text do not force clipped controls or avoidable two-dimensional scrolling. Provide semantic form controls, keyboard operation and visible focus, programmatic labels/errors, and usable pointer/touch targets. Use WCAG 2.2 as a validation reference; the project has not approved a formal conformance level. [CITED: https://www.w3.org/TR/WCAG22/#reflow; https://www.w3.org/TR/WCAG22/#keyboard; https://www.w3.org/TR/WCAG22/#focus-visible; https://www.w3.org/TR/WCAG22/#target-size-minimum; accessed 2026-10-21]

**When to use:** Every account, invite, cookbook, and recipe screen. Choose layout breakpoints from content needs and validate with representative CSS viewport widths rather than treating named device models as the layout specification. [ASSUMED]

### Pattern 5: Representative browser and viewport validation

**What:** Use a representative matrix spanning Chromium, Firefox, and WebKit/Safari, with desktop, tablet, and phone CSS viewport classes in portrait/landscape where meaningful. Execute repeatable responsive behavior checks with browser automation/emulation and identify the environment and mode in each result. Use real-device/browser checks as supplemental confirmation for behavior emulation cannot faithfully establish; physical phone tests are not a universal pass prerequisite. [CITED: https://playwright.dev/docs/browsers; https://developer.chrome.com/docs/devtools/device-mode/; https://firefox-source-docs.mozilla.org/devtools-user/responsive_design_mode/; accessed 2026-10-21]

**Evidence distinction:** Label evidence `AUTOMATED BROWSER`, `EMULATED VIEWPORT`, `REAL DESKTOP BROWSER`, or `REAL DEVICE/BROWSER`; do not turn viewport simulation into device evidence. Record browser name/version, OS/runtime, viewport in CSS pixels, orientation, zoom/device scale as available, test date, build, and artifact/reference. All current results remain NOT RUN.

### Pattern 1: Exact-email invitation with trusted acceptance

**What:** Owner issues a pending invitation bound to the intended email and cookbook. The invitee follows a guided browser flow, creates an individual account or signs in, verifies control of the invited address, and accepts. A trusted service checks the invitation's still-pending status, expiry, revocation status, target address, and the verified identity before changing membership. Apply the locked seven-day expiry, owner resend/revoke, and exact-email requirement. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:24-27,43`]

**What remains unproven:** No identity/email provider is selected. Provider-specific exact-email comparison, email normalization, deep-link/return-to-browser behavior, delivery, retry/expiry timing, and atomic invitation acceptance need a spike and contract tests. Do not treat the address typed into a browser form as proof of ownership. OWASP recommends cryptographically secure, single-use, time-limited verification tokens; this is security guidance, not a selected provider or a resolution of the nine product edge assumptions. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html; accessed 2026-10-21]

### Pattern 2: Family authorization at the trusted data boundary

**What:** Derive the actor from the authenticated session. Enforce active family membership for recipe reads, creates, and updates; enforce owner role separately for invite and access-management operations. Recheck membership after reconnect before showing refreshed remote data. UI hiding or an opaque family identifier is not authorization. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:24-28,42`; project security constraints below]

**When to use:** Every private cookbook operation. Backend and identity implementation are unselected; do not convert this recommendation into a vendor-specific schema or claim authorization is tested.

### Pattern 3: Lossless manual recipe editing

**What:** Keep recipe title, flexible ingredient text lines, and separately ordered instruction steps. Edit and save them as user-authored text; do not translate or normalize wording, units, or quantities. Support another member editing a saved recipe. Do not add general delete, search, categories, or OCR to this phase. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:30-37`; `.planning/REQUIREMENTS.md:17,19`; `.planning/ROADMAP.md:5-8`]

**Responsive browser checks:** Test narrow and wide viewports, portrait/landscape, browser zoom, virtual keyboard behavior on phones/tablets, long ingredient lines, step reordering without relying only on drag, save feedback, reload, browser navigation, Portuguese and English text, and cross-browser round-trip. These are proposed checks, not observed outcomes. [ASSUMED]

### Pattern 4: Read-only offline cache with explicit limits

**What:** If the selected implementation caches recipe data, scope it by signed-in account/family and retain only data authorized while online. Offline views must clearly identify stale/cached state and disable create/edit/reorder saves. On sign-out, purge account recipe data before another account can use the browser. After reconnect, reauthorize before remote refresh/display; purge if access is denied. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:19-20,42`]

**Non-installable PWA distinction:** A Service Worker can support request handling, offline resources, and Cache API use in a regular browser on a secure origin; it does not make the app native or mean the user has installed it. PWA installation is a separate browser/OS installation experience. The product prohibits an installable PWA, not necessarily a service worker. Browser UAT should confirm that no install flow is required or surfaced and that the ordinary URL works in the target browsers. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API; https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing; https://webkit.org/blog/8090/workers-at-your-service/; accessed 2026-10-21]

**Feasibility limit:** Browser storage may be cleared or evicted under browser policy/storage pressure; service-worker caching does not guarantee recipe-data durability. A cached page shell and cached recipe records are separate things. Test (a) losing network while a signed-in page is open and (b) reopening/reloading the ordinary browser URL offline as distinct scenarios. D-03/D-04/D-18 behavior is not demonstrated until those tests pass on real devices. [CITED: https://webkit.org/blog/14403/updates-to-storage-policy/; https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria; accessed 2026-10-21]

### Anti-Patterns to Avoid

- **Treating PWA installation as required:** Contradicts D-23; ordinary browser support is the target.
- **Treating a Service Worker as a PWA or durable database:** It is a browser capability; installability and storage persistence are separate questions.
- **Assuming browser storage is durable:** It can be cleared/evicted. Do not promise offline availability beyond observed and product-approved limits.
- **Caching authenticated API responses without account-bound access and purge rules:** Risks showing another or removed member's data.
- **Relying on client-side hiding for authorization:** Enforce membership and owner role at the trusted data boundary.
- **Using a shared family credential or accepting a typed email as verified identity:** Both contradict individual accounts and exact-email invitation acceptance.
- **Adding native/store tasks, OCR, source-photo upload, search/category, or general recipe-delete/restore:** These are outside Phase 1.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email ownership verification | Custom password/token cryptography or client-only email match | A vetted identity/email-verification capability after provider approval; bind invitation acceptance to verified identity on the trusted side | Verification, token lifetime, replay, and identity binding are security-sensitive. No provider is approved. [CITED: OWASP Email Validation and Verification Cheat Sheet, accessed 2026-10-21] |
| Family data authorization | UI-only gates or security based on unguessable family IDs | Backend/data-boundary authorization evaluated on every operation | Browser code is controlled by the user; client checks cannot protect private family data. [ASSUMED] |
| Offline recipe persistence | Assuming HTTP cache, service-worker cache, or PWA install guarantees durability | Prototype browser storage approaches and explicitly test cache scope, eviction, reauthorization, and purge | Browser storage policy is best-effort and platform behavior must be observed. [CITED: WebKit storage policy, accessed 2026-10-21] |
| Recipe text/order | Translation, unit normalization, rigid quantity/unit parser | Preserve original text and explicit sequence as entered | Required to keep family recipes faithful. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:30-33`] |

**Key insight:** Offline access, cache clearing, and remote access revocation are different controls. D-18 explicitly accepts that a disconnected device can still show its cached recipes until reconnection or sign-out; no server can remotely erase data from a device that cannot communicate. On reconnect the application must reauthorize before showing remote state and clear the local cache on denial. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:42`]

## Common Pitfalls

### Pitfall 1: Mistaking compatibility records for product validation
**What goes wrong:** An API shows as supported in a browser compatibility table, so a flow is declared working.  
**Why it happens:** Compatibility records describe web API support, not the actual device/OS/browser combination, app layout, identity provider, network, cache lifecycle, or user journey.  
**How to avoid:** Run the selected browser/viewport matrix, record exact browser/version, OS/runtime, viewport, emulation-versus-real mode, build and concrete artifact. Actual-device observations are useful supplemental evidence but are not a universal gate.  
**Warning signs:** A claim that emulation is physical-device evidence, or a PASS without the environment/mode/build and evidence artifact.

### Pitfall 2: Equating service-worker cache with offline recipe support or app installation
**What goes wrong:** The offline shell loads but recipe records are unavailable, or a service worker is assumed to require/install a PWA.  
**Why it happens:** Static app assets, application data, and PWA install UX are distinct.  
**How to avoid:** Test shell and recipe data separately; keep the application usable through its ordinary browser URL without an install step.  
**Warning signs:** Only the home screen is cached; no cached recipe appears offline; instructions tell users to install.

### Pitfall 3: Over-promising cache survival or revocation
**What goes wrong:** The user expects recipes to remain locally forever or disappear instantly after remote membership removal.  
**Why it happens:** Browser storage may be evicted; a disconnected phone cannot receive a revocation.  
**How to avoid:** Honor D-18's stale-cache window; test storage loss, offline notice, disabled writes, reconnect authorization, denied-access purge, sign-out purge, and account switching.  
**Warning signs:** A fresh/reopened offline browser is assumed to work without testing or an offline removed member can still refresh remote data.

### Pitfall 4: Invite link joins the wrong account
**What goes wrong:** A forwarded link or pre-existing browser session joins a different email identity.  
**Why it happens:** The client trusts the URL/form address rather than the verified identity and pending invitation record.  
**How to avoid:** Test a distinct wrong-email session, exact invited-email verification, existing and new account flows, expiry, resend, and revocation in the actual browser path.  
**Warning signs:** Membership changes before verification or invite acceptance can be repeated without a defined result.

### Pitfall 5: Recipe editing changes family-authored content or sequence
**What goes wrong:** Browser input, parsing, editing, or reorder controls alter wording, punctuation, quantities, units, or step order.  
**Why it happens:** A normalized ingredient schema or untested mobile controls do not match flexible text entry.  
**How to avoid:** Round-trip Portuguese and English samples exactly through create/edit/save/reload and a second member/device; offer usable non-drag reorder controls.  
**Warning signs:** Forced numeric fields, automatic translation/conversion, or changed ordering after reload.

## Runtime State Inventory

Not a rename, refactor, or migration phase; omit runtime-state inventory.

## Security Domain

The project configuration contains `"security_enforcement": true,` and `"security_asvs_level": 1,`. [VERIFIED: `.planning/config.json:48-49`]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V1 Encoding and Sanitization | Yes | Safely render user-entered recipe and invitation text. |
| V2 Validation and Business Logic | Yes | Validate flows and enforce invite expiry, membership and role rules at trusted boundaries. |
| V4 API and Web Service | Yes if backend endpoints are used | Authenticate and authorize each operation; constrain trusted endpoints. |
| V6 Authentication | Yes | Use a vetted identity provider/capability; verify invited email identity. |
| V7 Session Management | Yes | Secure session handling, explicit sign-out, cache purge, and reconnect behavior. |
| V8 Authorization | Yes | Enforce family membership for recipe operations and owner role for invitations/removal. |
| V11 Cryptography | Yes | Use vetted platform/provider cryptography; do not implement custom password/token cryptography. |
| V12 Secure Communication | Yes | Use HTTPS for production traffic and service-worker contexts. |
| V14 Data Protection | Yes | Isolate/purge account cache and honor the approved creator/privacy and retention rules. |

Applicable category names were taken from the official OWASP ASVS 5.0.0 chapter list cited in the prior phase research; applicability must be confirmed against the chosen implementation. [CITED: https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv; accessed 2026-10-20]

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-family recipe read/write | Information Disclosure / Tampering | Server/data-boundary membership checks and negative authorization tests. |
| Forwarded, wrong-email, expired, or revoked invite | Spoofing / Elevation of Privilege | Validate invite status and verified recipient identity before granting membership. |
| Stale account-scoped browser cache after sign-out/account switch | Information Disclosure | Purge account data before switching sessions; test same-browser handoff on each platform. |
| Revoked membership while device remains offline | Information Disclosure | Preserve D-18's explicit stale-cache limitation; reauthorize on reconnect and purge when denied. |
| Recipe text rendered as markup | Tampering / Elevation of Privilege | Treat family recipe content as untrusted user input and encode it for display. |

The project instructions prohibit putting provider credentials or privileged keys in browser code and require authorization at the family boundary. Their Supabase-specific examples are conditional, not an endorsement or selection of Supabase. [VERIFIED: `.github/copilot-instructions.md:37,47,65`]

## Project Constraints (from copilot-instructions.md)

- **Phone usability:** “Recipe capture and browsing should work comfortably on phones — photographing and using recipes are the primary workflows.” For Phase 1, validate phone browsing and manual recipe use; photo capture/OCR implementation remains Phase 2. [VERIFIED: `.github/copilot-instructions.md:13`]
- **Accuracy:** “Extracted handwritten text must be reviewable and editable before a recipe is saved.” Phase 2 constraint; do not add OCR to this phase. [VERIFIED: `.github/copilot-instructions.md:14`; `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:7`]
- **Sharing:** “The family cookbook is online and shared across members' devices.” Browser-local cache is not the canonical cross-device data store. [VERIFIED: `.github/copilot-instructions.md:15`]
- **Credential and authorization security:** “Do not put provider credentials or privileged Supabase keys in the app.” “The service-role key bypasses RLS and must never ship in an app bundle.” “Scope every recipe and image operation by authenticated family membership with RLS/storage policies. A random or opaque family ID is not access control.” Preserve the security principles with any backend; Supabase-specific implementation remains conditional. [VERIFIED: `.github/copilot-instructions.md:37,47,65`]
- **OCR correctness (Phase 2):** “Keep draft/import status distinct from saved recipes. Store edits as user-authored values; do not silently overwrite corrections by rerunning extraction.” Do not expand Phase 1 into OCR. [VERIFIED: `.github/copilot-instructions.md:66`; `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:7`]
- **Device and authorization testing:** “Test camera permissions and image upload on actual iOS and Android devices.” “Include tests that prove a user outside a family cannot read its recipes or source images.” For Phase 1, validate the responsive browser matrix and family-scoped recipe authorization; camera/image tests remain Phase 2, where the project directive requires actual iOS/Android device testing. [VERIFIED: `.github/copilot-instructions.md:54-55`]
- **Workflow and project structure:** Use the selected GSD workflow for planning artifact changes; no app code, web framework, directory convention, or implementation pattern exists yet. [VERIFIED: `.github/copilot-instructions.md:174-184`; `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:84-93`]

## Nine Unresolved Edge-Probe Assumptions

All nine probes below remain unresolved. Preserve them as assumptions for implementation planning and observable contract tests; this research does not resolve or rename them. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-SOURCE-AUDIT.md:65-77`]

| Requirement | Probe category | Unresolved assumption to verify |
|---|---|---|
| AUTH-01 | idempotency | What happens if account creation runs twice on the same input? |
| AUTH-01 | concurrency | If account bootstrap is interrupted or run in parallel, what is guaranteed? |
| AUTH-02 | idempotency | What happens if an invitation or acceptance runs twice on the same input? |
| AUTH-02 | concurrency | If invitation/acceptance or removal is interrupted or run in parallel, what is guaranteed? |
| AUTH-03 | unclassified | Manually review the requirement for an unclassified edge case; preserve it as unresolved until a test/contract is chosen. |
| AUTH-04 | unclassified | Manually review the requirement for an unclassified edge case; preserve it as unresolved until a test/contract is chosen. |
| RECP-01 | idempotency | What happens if recipe create/update runs twice on the same input? |
| RECP-01 | concurrency | If recipe create/update is interrupted or run in parallel, what is guaranteed? |
| RECP-03 | unclassified | Manually review the requirement for an unclassified edge case; preserve it as unresolved until a test/contract is chosen. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Service Workers, Cache API, and IndexedDB can be prototyped in the intended browser family, but documentation does not establish this app's actual device flow. | Browser support | A chosen minimum browser/version or storage mode may behave differently on the family's devices. |
| A2 | A browser-managed local cache may be sufficient for a limited read-only offline experience if it survives the tested lifecycle. | D-03 feasibility | Storage eviction, browser restart, or missing offline app shell can make recipes unavailable. |
| A3 | A trusted backend or identity service can bind invitation acceptance to the verified invited email and enforce the seven-day lifecycle. | Invitations | Provider normalization, token/redirect behavior, expiry and retries may not satisfy the exact user flow. |
| A4 | Membership authorization can be consistently enforced on all recipe operations by the eventual backend. | Security | Incorrect policy could expose private recipes or deny valid family members. |
| A5 | Recipe UI can preserve entered Portuguese/English strings and ordering through ordinary browser controls. | Manual CRUD | Browser keyboard, form, serialization, or concurrent updates may alter or lose content. |
| A6 | The recipe cache can be isolated and explicitly purged by account on sign-out in the chosen browser storage model. | D-04 | Data may survive logout, become visible after account switch, or be cleared too early. |
| A7 | The service-worker/offline shell can operate in the normal non-installed browser context on actual target browsers. | PWA distinction | Browser-specific lifecycle or configuration may require different design. |
| A8 | The browser cache can be distinguished from canonical online data, with stale cached content clearly labeled. | D-03/D-18 | Users may mistake stale or unauthorized data for live state. |
| A9 | One responsive browser experience is acceptably usable across desktop, tablet, and phone viewports in the supported browser set. | Responsive browser validation | Layout, forms, keyboard/touch input, accessibility, storage or browser lifecycle defects may block core use. |

These are provisional implementation assumptions, not approved product decisions or verified behavior. The nine spec-less probes above are separately retained verbatim.

## Open Questions

1. **What browser/OS versions and browser brands are in the target support set?** Record actual versions during the spike and ask the user to approve the supported floor before implementation.
2. **What does “previously loaded” include when a user closes/reloads the browser while offline?** Test active-tab offline and offline reopen separately; ask the user to confirm any expanded persistence expectation.
3. **Does the chosen non-installable web architecture satisfy D-03/D-04/D-18 across the agreed browser set?** No result exists. Validate active-page offline and reload/reopen separately, then ask the user to approve any limitation. Do not silently drop offline semantics or lock a cache primitive without evidence.
4. **Which identity/email service provides the required exact verified-email invitation flow?** Compare only after testing existing/new account paths, forwarded links, expiry, revoke/resend, and wrong-email denial.
5. **What is the cookbook-owner account deletion disposition?** User has explicitly required a focused decision before implementation; do not infer it from regular-member deletion D-17.
6. **How should invitation matching normalize case or provider-specific email aliases while honoring “exact invited email”?** This is an implementation contract to resolve with actual provider semantics, not assumed equivalence.

## Validation Architecture

The project configuration contains `"nyquist_validation": false,`, so the automated Nyquist Validation Architecture section is intentionally omitted. The project still needs a suitable browser-validation gate before production choices are approved; it does not make physical-device phone testing mandatory. [VERIFIED: `.planning/config.json:24`; `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:40-47`]

## Environment Availability

This research refresh used documentation lookups only; no application build, local package installation, backend, identity/email service, browser automation, emulated viewport test, or real-device browser test was run. Reported device availability is not test evidence. Exact browser versions, OS/runtime, viewport, validation mode, and test-service access remain to be recorded when validation runs. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:40-41`]

## Sources

### Primary browser/platform documentation

- WebKit, “Workers at Your Service” (2018-02-07): https://webkit.org/blog/8090/workers-at-your-service/ — Safari Service Worker background and availability notes. Accessed 2026-10-21.
- WebKit, “Updates to Storage Policy”: https://webkit.org/blog/14403/updates-to-storage-policy/ — WebKit/Safari quota, best-effort persistence, and eviction. Accessed 2026-10-21; the retrieved page did not expose a reliable publication date.
- MDN Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API — behavior and secure-context requirement. Accessed 2026-10-21; page's live revision is not treated as a fixed browser version.
- MDN Cache API: https://developer.mozilla.org/en-US/docs/Web/API/Cache — explicit browser cache API. Accessed 2026-10-21.
- MDN IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API — structured browser storage API. Accessed 2026-10-21.
- MDN storage quotas and eviction: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria — browser-managed storage limits and eviction. Accessed 2026-10-21.
- MDN PWA installation guide: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing — install/uninstall experience is separate from normal browser access. Accessed 2026-10-21.
- W3C Web Content Accessibility Guidelines (WCAG) 2.2 Recommendation (2023-10-05): https://www.w3.org/TR/WCAG22/ — reflow, keyboard access, visible focus, target size, and related criteria. Accessed 2026-10-21.
- Chrome DevTools Device Mode: https://developer.chrome.com/docs/devtools/device-mode/ — viewport/device emulation. Accessed 2026-10-21.
- Firefox Responsive Design Mode: https://firefox-source-docs.mozilla.org/devtools-user/responsive_design_mode/ — responsive viewport simulation. Accessed 2026-10-21.
- Browser automation browser support: https://playwright.dev/docs/browsers — documentation describes Chromium, Firefox, WebKit and device emulation; cited to distinguish engine/emulation evidence only, not as a package or stack recommendation. Accessed 2026-10-21.
- OWASP Email Validation and Verification Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html — single-use, time-limited verification token guidance. Accessed 2026-10-21.
- OWASP ASVS 5.0.0 chapter index: https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv — applicable web security chapter names. Accessed 2026-10-20.

### In-repo sources read this session

- `.planning/STATE.md` — active scope checked first; Phase 1 is not started and production stack remains unapproved.
- `.planning/REQUIREMENTS.md:10-19` — six Phase 1 requirements copied above.
- `.planning/ROADMAP.md:5-8` — earlier phone-browser-only goal/success criteria; superseded for this research refresh by current CONTEXT D-23, and not edited.
- `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:5-7,16-52,112-113` — current general-web scope, locked decisions, discretion, and deferred scope.
- `.planning/phases/01-decisions-and-shared-cookbook/01-SOURCE-AUDIT.md:65-77` — nine unresolved edge probes.
- `.github/copilot-instructions.md:13-15,37,47,54-55,65-66,174-184` — phone usability, sharing, privacy/security, testing, and workflow constraints.
- `.planning/config.json` — security enforcement enabled; Nyquist validation explicitly disabled.

## Metadata

**Confidence breakdown:**
- Browser APIs, responsive behavior, and accessibility references: MEDIUM — official documentation checked; no product/browser test.
- Identity/invitations: LOW — security guidance checked; no identity/email provider chosen or tested.
- Manual CRUD and responsive usability: LOW — requirements and standards reviewed; no app or actual browser flow exists.
- D-03/D-04/D-18 offline behavior: LOW — browser APIs make prototyping plausible, but storage retention and purge semantics have not been tested across the target browser set.

**Research date:** 2026-10-21  
**Valid until:** Recheck current browser versions and storage policies at implementation decision; complete the agreed browser-validation gate before stack approval.
