# Phase 1: Decisions and Shared Cookbook - Context

**Gathered:** 2026-10-21 (updated 2026-10-21: production stack approved)
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the foundation of a private, shared family cookbook through a browser-based web app usable across desktop, tablet, and phone screen sizes: account access through individual family memberships and invite links, plus manual recipe creation, viewing, and editing across devices. There is no separate phone-specific app; native mobile apps, app-store distribution, and an installable PWA are excluded. The owner creates the cookbook and manages invitations and access. Handwritten-photo recognition belongs to Phase 2; search and category management belong to Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Web Access and Connectivity
- **D-01:** Superseded by D-22 and D-23: the earlier app-store-installable iPhone and Android app decision is no longer in scope.
- **D-02:** Superseded by D-23: v1 supports the web app across desktop, tablet, and phone browsers.
- **D-03:** Previously loaded recipes remain available in the signed-in browser during a disconnection. Offline browsing shows only cached recipes with a clear offline notice; editing requires an internet connection. (Mechanism: D-37, D-38.)
- **D-04:** Clear cached recipe data when the member signs out.
- **D-05:** Superseded by D-24 through D-36: the production stack is now selected and approved.

### Family Membership and Invitations
- **D-06:** The first person to sign up creates the family cookbook and becomes its owner.
- **D-07:** Superseded by D-29: invitations are one-time invite links, not emails to a specific address. An invitee without an account still creates one and joins the cookbook in a single guided flow.
- **D-08:** Use individual accounts with email address and password (see D-30); do not use a shared family login.
- **D-09:** The owner manages invitations and access. All invited members can view, add, and edit recipes in the shared cookbook, consistent with the approved project requirements.
- **D-10:** When the owner removes a member's access, show a one-time list of recipes that member added and let the owner decide which to keep or remove. Do not show contributor names elsewhere in the cookbook.

### Recipe Text and Structure
- **D-11:** Recipe content may be in Portuguese or English. Preserve each recipe's original wording, language, quantities, and units; do not translate or automatically convert them.
- **D-12:** Enter each ingredient as a flexible text line rather than requiring separate quantity, unit, and ingredient fields.
- **D-13:** Store instructions as separate ordered steps that can be rearranged.

### Source Photos and Retention
- **D-14:** Retain original source photo(s) with a saved photo-imported recipe. The OCR review screen does not need to display the photo alongside extracted text; this is a previously established project decision.
- **D-15:** Recipe deletion, restoration, and a general trash bin are not part of Phase 1. Keep the approved roadmap scope unchanged. The owner-only cleanup choice in D-10 applies specifically to member access removal; do not build general recipe-delete or restore controls in this phase.

### Clarifications recorded after the planning checkpoint
- **D-16:** iPhone and Android phones are available, but their availability is not evidence that browser compatibility or product flows have been tested. Physical-device phone testing is not a release prerequisite for the general web target. Apple and Google developer accounts and store-track eligibility are not relevant.
- **D-17:** If a regular (non-owner) member's account is deleted (only by the operator in v1, per D-41), retain shared recipes and remove or anonymize that member's private creator metadata. This is a separate account-deletion policy, not the D-10 access-removal workflow.
- **D-18:** Accept that recipes cached in a disconnected browser remain readable until it reconnects or the member signs out. After reconnection, reauthorize before refreshing or showing remote data and clear the cache if access is denied. Do not claim immediate remote erasure from an offline browser.
- **D-19:** Partially superseded by D-29/D-30. Still valid: an invitation expires seven days after issue and the owner may revoke it (and create a new one). No longer valid: email verification of the exact invited address — no emails are sent in v1.
- **D-20:** The application interface supports Portuguese and English. Recipe content in either language remains faithful to the entered wording, language, quantities, and units per D-11. (Mechanism: D-26, D-27.)
- **D-21:** The D-10 removal review identifies recipes by their original creator metadata. Include recipes first added by the removed member even if another member edited them later. Keep creator identity private and do not display contributor attribution in ordinary recipe UI.
- **D-22:** Superseded by D-23. This earlier decision selected a mobile-first browser web app for phone browsers only and excluded native apps, app stores, and installable PWA.
- **D-23:** Deliver one general browser-based web app usable across desktop, tablet, and phone screen sizes. There is no separate phone-specific version. Do not build native iOS or Android apps, app-store distribution, or an installable PWA. This supersedes the phone-only support boundary in D-02 and D-22.

### Production Stack — Web Framework (approved 2026-10-21)
- **D-24:** Build the production app with Next.js (React + TypeScript) as one full-stack web app. — **Reversibility:** costly — every page, route, and server action is written against the framework; switching means a rewrite of the UI layer.
- **D-25:** Style with Tailwind CSS plus shadcn/ui accessible components; responsive across phone, tablet, and desktop.
- **D-26:** Interface language is carried in the URL (`/pt/...`, `/en/...`). First visit picks the locale from the browser language; the member's choice is remembered per user. — **Reversibility:** costly — route structure and every internal link depend on the locale segment.
- **D-27:** If the browser language is neither Portuguese nor English, default the interface to Portuguese.

### Production Stack — Backend and Accounts (approved 2026-10-21)
- **D-28:** Use Supabase as the backend: managed Postgres for cookbook data, Supabase Auth for accounts, Supabase Storage (later, Phase 2 photos), and Postgres Row Level Security to enforce family membership at the data boundary. Privileged (service-role) keys stay server-side only. — **Reversibility:** costly — schema, RLS policies, and auth integration are Supabase-specific; leaving requires a data and auth migration.
- **D-29:** No emails are sent in v1 (no invitation, verification, or password-reset emails; no email provider is configured). The owner creates a one-time invite link (single use, expires after 7 days, revocable) and shares it through any channel (e.g., WhatsApp). The relative opens the link and creates their own account and joins the cookbook in one guided flow.
- **D-30:** Members sign in with email address + password. The email is an unverified login identifier only; nothing is sent to it. Turning on email verification/reset later must remain possible. — **Reversibility:** costly — enabling verification later affects existing unverified accounts.
- **D-31:** No in-app password reset in v1. A member who forgets their password is removed by the owner and re-invited.
- **D-32:** If the owner forgets their password, the project operator resets it manually in the Supabase dashboard. No in-app owner recovery feature.

### Production Stack — Hosting (approved 2026-10-21)
- **D-33:** Host the web app on Vercel and the backend on Supabase Cloud, both on free tiers, with automatic deploys from the GitHub repository.
- **D-34:** Accept the Supabase free-tier inactivity pause; upgrade to the paid plan only if pauses become a real problem. No keep-alive workaround.
- **D-35:** Use an EU region (e.g., Frankfurt or Paris) for the Supabase project and, where configurable, Vercel functions. — **Reversibility:** costly — moving a Supabase project's region requires creating a new project and migrating data and accounts.
- **D-36:** Use the free `*.vercel.app` address for now; a custom domain can be added later.

### Offline Reading (approved 2026-10-21)
- **D-37:** Offline reading survives page reloads: use a service worker plus local browser storage (no web app manifest / no installable PWA) so recipes stay readable when the page is reopened without a connection.
- **D-38:** Cache only the recipes the signed-in user has actually opened on that device; do not pre-download the whole cookbook. D-03, D-04, and D-18 still govern offline notice, read-only behavior, sign-out purge, and reauthorization on reconnect.

### Account Deletion (resolves the open owner-deletion decision, 2026-10-21)
- **D-39:** The owner cannot delete their own account in the app in v1. If ever needed, the project operator handles it manually in Supabase.
- **D-40:** Regular members also cannot delete their own account in the app in v1; they ask the owner to remove their access (D-10).
- **D-41:** Any account deletion in v1 is an operator action outside the app; D-17's policy (keep shared recipes, remove/anonymize private creator metadata) applies when it happens.

### the agent's Discretion
- Directory layout, Supabase client/session integration pattern, data schema details, migration tooling, and test tooling — choose standard, well-supported approaches consistent with D-24 through D-38, and record exact package versions at install time.
- Service worker implementation and local storage choice (e.g., a maintained Next.js service-worker library vs. a hand-written worker; IndexedDB vs. Cache Storage), provided D-03, D-04, D-18, D-37, and D-38 hold and no installable-PWA manifest is shipped.
- Invite-link token design (opaque, single use, server-validated, 7-day expiry, revocable) and whether an invite records an optional display label for the owner's reference.
- Removing a member (D-10, D-31) must free their sign-in email so the same person can later re-register through a new invite; design the removal so this works while D-21 creator metadata for kept recipes is preserved or anonymized consistently.
- Representative browser/viewport coverage for testing across desktop, tablet, and phone sizes.
- Make source-photo retention, authorization, and member-removal cleanup explicit in the data and access design; do not infer legal, provider, or backup retention policy from this discussion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope and Phase Requirements
- `.planning/PROJECT.md` — project purpose, core value, prior decisions, and boundaries.
- `.planning/REQUIREMENTS.md` — approved v1 requirements (AUTH-01..04, RECP-01, RECP-03 for this phase) and phase traceability. Note: requirements do not mandate email; D-29 invite links satisfy AUTH-02.
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, dependency, and decision gate.
- `.planning/STATE.md` — current project position and accumulated constraints.

### Research (inputs, partly superseded by the D-24..D-41 stack decisions)
- `.planning/research/SUMMARY.md` — synthesis and roadmap implications.
- `.planning/research/STACK.md` — candidate stacks. Its Expo/React Native native-first recommendation is superseded by D-23/D-24; its Supabase, Postgres full-text search, and RLS guidance still applies.
- `.planning/research/ARCHITECTURE.md` — platform-neutral architecture options.
- `.planning/research/FEATURES.md` — feature landscape, dependencies, and anti-features.
- `.planning/research/PITFALLS.md` — risks around authorization, image handling, recognition, syncing, and privacy.
- `.planning/phases/01-decisions-and-shared-cookbook/01-RESEARCH.md` — prior Phase 1 research; refresh for Next.js + Supabase + Vercel web delivery before planning.

### Historical (do not re-plan from these)
- `.planning/phases/01-decisions-and-shared-cookbook/01-STACK-OPTIONS.md` — native-app spike candidates (Expo/Flutter); historical only, superseded by D-23/D-24.
- `.planning/phases/01-decisions-and-shared-cookbook/01-PLATFORM-EVIDENCE.md` — browser-validation evidence scaffold for the superseded Plan 01-08; historical only.
- `.planning/phases/01-decisions-and-shared-cookbook/01-08-PLAN.md` — superseded interim validation plan; must not be executed.
- `.planning/phases/01-decisions-and-shared-cookbook/01-01-SUMMARY.md` — completed historical decision/provenance work.

### External Specifications
- No external specs or ADRs were referenced during this discussion.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None. Greenfield repository: only `.github/`, `.gsd/`, and `.planning/` exist; no application source code.

### Established Patterns
- None yet. Phase 1 establishes the Next.js app structure, Supabase schema/migrations, and test setup.

### Integration Points
- GitHub repository → Vercel automatic deploys (D-33).
- Next.js server code → Supabase (Auth, Postgres with RLS); service-role key only on the server (D-28).

</code_context>

<specifics>
## Specific Ideas

- The app is one general browser-based web app across desktop, tablet, and phone screen sizes. No native apps, app stores, or installable PWA.
- Invites are shared by the owner through whatever channel the family already uses (e.g., WhatsApp), as a one-time link.
- No emails at all in v1 — keep the system simple; forgotten passwords are handled by remove-and-re-invite (members) or the Supabase dashboard (owner).
- Offline is for the kitchen with poor Wi-Fi: recipes you've opened stay readable even after reopening the page offline; editing waits for a connection.
- Use free-form ingredient lines and editable, reorderable instruction steps so Portuguese and English family recipes keep their original phrasing and measurements.
- During member removal only, show the owner the affected member's recipes for a keep-or-remove decision. Do not expose contributor attribution elsewhere.
- Interface defaults to Portuguese.

</specifics>

<deferred>
## Deferred Ideas

- General recipe deletion, restore, and a trash bin are deferred and must not expand Phase 1. If later added, the user's preference is to keep a deleted recipe and its source photos recoverable for 30 days; any invited family member could restore or permanently remove it during that period.
- Email delivery (invitations, verification, password reset) — possible later version; keep D-30 compatible with enabling it.
- In-app account self-deletion and owner transfer — possible later version.
- Custom domain — add later when wanted (D-36).

</deferred>

---

*Phase: 1-decisions-and-shared-cookbook*
*Context gathered: 2026-10-21*
