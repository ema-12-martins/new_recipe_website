# Phase 1: Decisions and Shared Cookbook - Context

**Gathered:** 2026-10-21
**Status:** Ready for refreshed research and planning

<domain>
## Phase Boundary

Deliver the foundation of a private, shared family cookbook through a browser-based web app usable across desktop, tablet, and phone screen sizes: account access through individual family memberships and invitations, plus manual recipe creation, viewing, and editing across devices. There is no separate phone-specific app; native mobile apps, app-store distribution, and an installable PWA are excluded. The owner creates the cookbook and manages invitations and access. Handwritten-photo recognition belongs to Phase 2; search and category management belong to Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Web Access and Connectivity
- **D-01:** Superseded by D-22 and D-23: the earlier app-store-installable iPhone and Android app decision is no longer in scope.
- **D-02:** Superseded by D-23: v1 supports the web app across desktop, tablet, and phone browsers.
- **D-03:** Previously loaded recipes remain available in the signed-in browser during a disconnection. Offline browsing shows only cached recipes with a clear offline notice; editing requires an internet connection.
- **D-04:** Clear cached recipe data when the member signs out.
- **D-05:** No implementation stack or framework is selected. Keep options open until implementation research validates them against the general browser-web target and the rest of the project constraints.

### Family Membership and Invitations
- **D-06:** The first person to sign up creates the family cookbook and becomes its owner.
- **D-07:** The owner invites relatives by email to a specific address. An invitee without an account can create one and join the cookbook in a single guided flow.
- **D-08:** Use individual email-and-password accounts; do not use a shared family login.
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
- **D-16:** iPhone and Android phones are available, but their availability is not evidence that browser compatibility or product flows have been tested. Browser validation must use recorded results rather than availability or compatibility tables. Physical-device phone testing is not a release prerequisite for the general web target. Apple and Google developer accounts and store-track eligibility are not relevant.
- **D-17:** If a regular (non-owner) member deletes their account, retain shared recipes and remove or anonymize that member's private creator metadata. This is a separate account-deletion policy, not the D-10 access-removal workflow.
- **D-18:** Accept that recipes cached in a disconnected browser remain readable until it reconnects or the member signs out. After reconnection, reauthorize before refreshing or showing remote data and clear the cache if access is denied. Do not claim immediate remote erasure from an offline browser.
- **D-19:** An invitation expires seven days after issue. The owner may resend or revoke an invitation. The invitee must verify the exact invited email address before joining; account creation and acceptance remain one guided flow per D-07.
- **D-20:** The application interface supports Portuguese and English. Recipe content in either language remains faithful to the entered wording, language, quantities, and units per D-11.
- **D-21:** The D-10 removal review identifies recipes by their original creator metadata. Include recipes first added by the removed member even if another member edited them later. Keep creator identity private and do not display contributor attribution in ordinary recipe UI.
- **D-22:** Superseded by D-23. This earlier decision selected a mobile-first browser web app for phone browsers only and excluded native apps, app stores, and installable PWA.
- **D-23:** Deliver one general browser-based web app usable across desktop, tablet, and phone screen sizes. There is no separate phone-specific version. Do not build native iOS or Android apps, app-store distribution, or an installable PWA. This supersedes the phone-only support boundary in D-02 and D-22.

### the agent's Discretion
- Choose the technical architecture, libraries, account/session implementation, and web framework only after validating the product decisions above and the browser platform constraints. No specific vendor, stack, or OCR provider is approved by the research.
- Determine the representative browser/viewport support matrix and implementation details for showing cached recipes safely in web browsers and communicating offline state, while preserving D-03, D-04, and D-18. Reassess feasibility without an installable PWA.
- Make source-photo retention, authorization, and member-removal cleanup explicit in the data and access design; do not infer legal, provider, or backup retention policy from this discussion.
- Before implementing account deletion for the cookbook owner, obtain a focused decision on the disposition of shared recipes, cookbook ownership/continuity, and private creator metadata. This owner-account case is distinct from the settled D-17 regular-member deletion policy and D-10 member removal.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope and Phase Requirements
- `.planning/PROJECT.md` — project purpose, core value, prior decisions, and boundaries.
- `.planning/REQUIREMENTS.md` — approved v1 requirements and phase traceability.
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, dependency, and decision gate.
- `.planning/STATE.md` — current project position and accumulated constraints.

### Research and Open Technical Decisions
- `.planning/research/SUMMARY.md` — synthesis and roadmap implications; explicitly warns that confidence is low overall and stack/OCR recommendations are unapproved.
- `.planning/research/STACK.md` — candidate technical stacks; recommendations and version snapshots are not verified or selected.
- `.planning/research/ARCHITECTURE.md` — platform-neutral architecture options and unresolved browser, identity, and sync decisions.
- `.planning/research/FEATURES.md` — feature landscape, dependencies, and anti-features; competitor claims are provisional.
- `.planning/research/PITFALLS.md` — risks around authorization, image handling, recognition, syncing, and privacy.
- `.planning/phases/01-decisions-and-shared-cookbook/01-RESEARCH.md` — refresh for general browser web delivery across screen sizes before planning.
- `.planning/phases/01-decisions-and-shared-cookbook/01-PLATFORM-EVIDENCE.md` — browser validation evidence; native/store checks are excluded.
- `.planning/phases/01-decisions-and-shared-cookbook/01-STACK-OPTIONS.md` — prior provisional spike candidate and package audit; not approval of a production web stack.
- `.planning/phases/01-decisions-and-shared-cookbook/01-01-SUMMARY.md` — completed planning work and decisions to preserve; do not duplicate its completed audit.

### External Specifications
- No external specs or ADRs were referenced during this discussion.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None identified. This is a greenfield workspace with no application source code.

### Established Patterns
- None identified. No codebase maps or application implementation patterns exist yet.

### Integration Points
- None identified in application code. The first phase establishes the application structure and its integration points.

</code_context>

<specifics>
## Specific Ideas

- The app is one general browser-based web app across desktop, tablet, and phone screen sizes. There is no separate phone-specific app; do not include native apps, app-store distribution, or an installable PWA.
- Offline support is intentionally limited: show cached recipes while signed in, identify the offline state, disallow edits until online, and clear the cache at sign-out.
- Email invite acceptance should let a new relative create an individual email-and-password account and join the family cookbook in one guided flow.
- Use free-form ingredient lines and editable, reorderable instruction steps so Portuguese and English family recipes can retain their original phrasing and measurements.
- The source photo remains attached to a saved imported recipe, but need not be displayed beside extracted text during correction.
- During member removal only, show the owner the affected member's recipes for a keep-or-remove decision. Do not expose contributor attribution elsewhere.
- Current iPhone and Android phones are available, but browser compatibility and product behavior are not considered validated until the spike records evidence across a representative browser/viewport matrix. Physical phone testing is not a release prerequisite. App-store/build routes are out of scope.
- Regular-member account deletion retains shared recipes and removes/anonymizes private creator metadata. Owner-account deletion remains an explicit execution decision checkpoint; do not infer it from D-10 or D-17.

</specifics>

<deferred>
## Deferred Ideas

- General recipe deletion, restore, and a trash bin are deferred and must not expand Phase 1. If this feature is later added, the user's preference is to keep a deleted recipe and its source photos recoverable for 30 days; any invited family member could restore or permanently remove it during that period. This preference does not authorize implementing those controls in the current phase.

</deferred>

---

*Phase: 1-decisions-and-shared-cookbook*
*Context gathered: 2026-10-21*
