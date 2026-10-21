# Phase 1 Responsive Browser Validation Evidence

**Purpose:** Track proposed browser validation for the single general web app across desktop, tablet, and phone screen sizes.

**Evidence status:** **NOT RUN** for every browser target and all 20 UAT ideas below. This document is a test plan and empty evidence record, not proof of a browser, viewport, account flow, recipe, or cache behavior having passed. No application build, live backend, account flow, browser automation, viewport emulation, or real-device browser test has been run.

**Scope:** One browser-based web app. There is no separate phone-specific app. Explicitly exclude native apps, app-store distribution, and installable PWA. A service worker or browser storage may be evaluated as ordinary browser capabilities; neither requires installable-app delivery. Do not request or record personal credentials, invite tokens, or real family recipe data; use synthetic accounts and recipes.

**Product decisions to preserve:** Individual accounts; exact verified-email invitations; private cookbook membership; D-10 one-time member-removal review with explicit keep/remove choice and no ordinary contributor attribution; D-17 regular-member account deletion retains shared recipes while removing/anonymizing private creator metadata; Portuguese/English interface with source-faithful recipe text; and D-03/D-04/D-18 read-only offline/cache behavior. D-17 is a policy constraint, not an added account-deletion UAT case. No OCR/source-photo work, general recipe deletion/restore, search/category work, or live co-editing is introduced here. [VERIFIED: `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:16-52,112-113`]

**Production decisions:** Framework, backend, identity/email, hosting/deployment, cache strategy, and directory layout remain unapproved until a suitable browser-validation gate has recorded evidence and the user explicitly approves the choices. Browser version snapshots and test tools are not production decisions.

## Evidence distinction and recording rules

Record the kind of evidence precisely:

- **AUTOMATED BROWSER:** a test executed in an identified browser engine/runtime; record engine, browser name/version, OS/runtime, test runner/version, date, build/revision, and artifact.
- **EMULATED VIEWPORT:** a browser emulating viewport dimensions/device characteristics; also record the underlying browser/version, CSS viewport width/height, orientation, zoom/device scale as available, and emulation tool/version. This is not a real-device observation.
- **REAL DESKTOP BROWSER:** actual desktop browser execution; record OS, browser/version, physical display viewport, zoom, and evidence.
- **REAL DEVICE/BROWSER:** actual mobile/tablet hardware and browser; record device model, OS, browser/version, viewport/orientation and evidence. Useful supplemental evidence, but physical iPhone/Android testing is **not a prerequisite** for the general web target.

Compatibility tables establish documented API information, not app behavior. Emulation and automation are useful repeatable coverage, but do not establish actual mobile OS browser chrome, hardware keyboard/touch behavior, storage lifecycle, external email handoff, or all network/device conditions. When such behavior matters and no actual-device evidence is available, record the gap as a limitation and raise it at the user decision gate rather than inferring a pass. [CITED: https://developer.chrome.com/docs/devtools/device-mode/; https://firefox-source-docs.mozilla.org/devtools-user/responsive_design_mode/; https://playwright.dev/docs/browsers; accessed 2026-10-21]

## Proposed representative browser/viewport matrix

This is a **recommended validation sample**, not a locked browser-support floor or claim that the application was tested. Select current stable browser versions when the run occurs and record exact versions then; do not invent version numbers now. The viewport samples are CSS pixels, not device model requirements. Expand the matrix if the user identifies additional browsers or if a test exposes a browser-specific defect. [ASSUMED]

| Target | Representative environment | Viewport/orientation sample | Evidence mode intended | Status | Run metadata / artifact |
|---|---|---|---|---|---|
| DESK-CHROMIUM | Current stable Chromium-family desktop browser | 1440 × 900; also narrow desktop window | Automated browser and/or real desktop browser | NOT RUN | NOT RECORDED |
| DESK-FIREFOX | Current stable Firefox desktop browser | 1440 × 900; also narrow desktop window | Automated browser and/or real desktop browser | NOT RUN | NOT RECORDED |
| DESK-WEBKIT | Current stable Safari/WebKit desktop browser, where available | 1440 × 900; also narrow desktop window | Automated WebKit and/or real Safari browser | NOT RUN | NOT RECORDED |
| TABLET-WEBKIT | WebKit/Safari tablet browser profile | 768 × 1024 portrait and 1024 × 768 landscape | Emulated viewport baseline; actual tablet observation optional | NOT RUN | NOT RECORDED |
| TABLET-CHROMIUM | Chromium-family tablet browser profile | 768 × 1024 portrait and 1024 × 768 landscape | Emulated viewport baseline; actual tablet observation optional | NOT RUN | NOT RECORDED |
| PHONE-WEBKIT | WebKit/Safari phone browser profile | 390 × 844 portrait; rotate to landscape | Emulated viewport baseline; actual phone observation optional | NOT RUN | NOT RECORDED |
| PHONE-CHROMIUM | Chromium-family phone browser profile | 360 × 800 portrait; rotate to landscape | Emulated viewport baseline; actual phone observation optional | NOT RUN | NOT RECORDED |

The 320 CSS-pixel width is an accessibility/reflow stress case, not another device target; run it at least in the representative desktop browser automation and record the underlying browser. WCAG 2.2 Reflow references 320 CSS pixels for ordinary vertically scrolling content. Do not treat sample viewport dimensions as required breakpoints. [CITED: https://www.w3.org/TR/WCAG22/#reflow; accessed 2026-10-21]

### Coverage allocation

- Run responsive smoke coverage for UAT-01, UAT-08, UAT-09, and UAT-17 across desktop, tablet, and phone viewport classes, including narrow width and portrait/landscape where applicable.
- Exercise auth/invitation/privacy cases (UAT-02–07, UAT-16, UAT-18–20) at minimum across the three desktop browser-engine targets; also check the user-facing layout/controls at a tablet and a phone viewport. Authorization must be verified at the trusted service boundary, not only through the UI.
- Exercise online cross-client sharing (UAT-10) using separate browser contexts/clients and the canonical server data. Browser contexts/emulators do not count as distinct physical devices.
- Exercise offline/cache cases (UAT-11–15) across the representative browser engines that are intended for support, with at least one desktop, one tablet, and one phone viewport. Browser-specific storage behavior must be reported separately; a pass in one engine is not evidence for another.
- This allocation is a starting recommendation. Final browser support policy and exact execution scope remain for user review; unrun cases remain NOT RUN.

## Responsive accessibility checks

Run these cross-cutting checks against account, invitation, cookbook, and recipe screens at the selected viewports. They are proposed checks only; all statuses remain NOT RUN. Use WCAG 2.2 as the accessibility reference baseline without claiming formal conformance or legal compliance. [CITED: https://www.w3.org/TR/WCAG22/; accessed 2026-10-21]

| Check | Acceptance evidence to record | Status |
|---|---|---|
| Reflow / zoom | At 320 CSS-pixel width and at browser zoom, ordinary content retains information and functionality without avoidable horizontal scrolling; record any inherently two-dimensional content exception. | NOT RUN |
| Keyboard and focus | All interactive flows are keyboard operable, focus order is meaningful, focus remains visible, and no keyboard trap blocks use. | NOT RUN |
| Touch/pointer targets | Check target spacing/size and practical touch operation at phone/tablet profiles against WCAG 2.2 criteria and exceptions. | NOT RUN |
| Forms and errors | Inputs have visible/programmatic labels; validation errors are understandable and reachable; focus/keyboard does not obscure the active field or action. | NOT RUN |
| Locale and text expansion | Portuguese and English UI labels, accents, long recipe titles, free-text ingredients, and instructions wrap without clipping, overlap, or loss of actions. | NOT RUN |
| Orientation and navigation | Core account and recipe tasks remain usable in portrait/landscape; browser back/forward and reload do not lose or corrupt saved data. | NOT RUN |

## UAT case matrix (all cases NOT RUN)

These are the same 20 validation ideas carried forward from the prior evidence record. Adapt “phone/device” language to any browser client and viewport; do not require a physical phone. For every actual run, record the target IDs from the matrix above, evidence mode, browser and exact version, OS/runtime, viewport, build/revision, date, concise observation, and a non-secret artifact reference.

| ID | UAT idea to exercise | Suggested matrix coverage | Status | Evidence reference |
|---|---|---|---|---|
| UAT-01 | Open the ordinary HTTPS URL in a browser without installing anything; sign in and navigate core screens. Confirm no native app, app-store, or installable-PWA route is required. | All desktop/tablet/phone viewport classes | NOT RUN | None |
| UAT-02 | Sign up and sign in with disposable individual identities; sign out and sign in again. Never capture passwords or tokens. | Three desktop engines plus narrow and wide responsive smoke | NOT RUN | None |
| UAT-03 | First user creates the cookbook and becomes owner; verify a second identity is not implicitly owner. Exercise interruption/retry/concurrent bootstrap only as observable probes, without assuming contracts. | Desktop browser; responsive owner screens at tablet/phone widths | NOT RUN | None |
| UAT-04 | Owner invites a new address; invitee completes the single guided account-creation/acceptance flow using the exact verified invited email and joins the intended private cookbook. | Three desktop engines; tablet/phone invitation UI smoke | NOT RUN | None |
| UAT-05 | Try accepting while verified as a different email; confirm no wrong-identity membership. Include existing-account behavior and record provider email-normalization behavior rather than assuming it. | Three desktop engines; tablet/phone invite layout smoke | NOT RUN | None |
| UAT-06 | Exercise seven-day expiry, owner resend, owner revoke, and acceptance of expired/revoked invitations. Confirm trusted-boundary behavior, not only hidden/disabled UI. | Three desktop engines; controlled synthetic timestamps | NOT RUN | None |
| UAT-07 | Verify owner-only invite/removal controls and that unrelated/signed-out users cannot read or change family recipes by direct navigation or changing a record identifier. | Three desktop engines; responsive UI check | NOT RUN | None |
| UAT-08 | Manually create synthetic Portuguese and English recipes with punctuation, accents, quantities, units, flexible ingredient lines, and ordered steps; reopen and view them. | Desktop, tablet, and phone viewport classes | NOT RUN | None |
| UAT-09 | Edit another active member's recipe; change title, ingredient text, and instruction order; save/reload/reopen and confirm wording/order. Do not add general recipe deletion. | Desktop, tablet, and phone viewport classes | NOT RUN | None |
| UAT-10 | Access the canonical saved recipes/edits from a second authorized browser client; distinguish online server state from local cache. | Separate browser contexts across desktop and a tablet/phone viewport | NOT RUN | None |
| UAT-11 | While signed in and online, load recipes and disable network without closing the page. Show only cached recipes, a clear offline notice, and disabled create/edit/reorder saves. | Each selected engine with desktop/tablet/phone viewport sampling | NOT RUN | None |
| UAT-12 | Separately test reload/close/reopen while offline. Record whether app resources and cached recipes load; do not assume reload persistence is guaranteed by “previously loaded.” | Each selected engine; include a narrow viewport | NOT RUN | None |
| UAT-13 | While offline, sign out or exercise the supported sign-out path, then inspect/reopen and attempt another account session. Confirm prior account recipes are not displayed after sign-out/account switch. | Each selected engine; same-browser account switch | NOT RUN | None |
| UAT-14 | Remove an active member while that member's browser client is disconnected. Confirm cached recipes may remain visible during the D-18 stale-cache window; do not claim immediate remote erasure. | Separate synthetic owner/member browser contexts | NOT RUN | None |
| UAT-15 | Reconnect the removed member's browser. Reauthorize before remote refresh/display and purge account cache when access is denied. | Each selected engine for offline/cache support | NOT RUN | None |
| UAT-16 | Owner removal review uses original creator metadata, including recipes later edited by another member; offer the one-time keep/remove choice and keep creator identity out of ordinary recipe views. | Three desktop engines; tablet/phone UI smoke | NOT RUN | None |
| UAT-17 | Switch UI locale between Portuguese and English. Verify labels/navigation change while saved Portuguese/English recipe text remains unchanged; do not conflate UI localization and recipe translation. | Desktop, tablet, and phone viewport classes | NOT RUN | None |
| UAT-18 | Enter synthetic hostile markup/script strings in recipe title, ingredient, and instruction fields. Confirm inert/safely encoded display with no executable element, handler, script, or side effect. | Three desktop engines and narrow viewport | NOT RUN | None |
| UAT-19 | As a signed-in non-owner, directly invoke invitation issue/resend/revoke and member-removal preview/commit operations. Verify trusted-boundary denial and unchanged synthetic membership/invitation state. | Three desktop engines; API authorization test plus UI smoke | NOT RUN | None |
| UAT-20 | In separate disposable fixtures, exercise both D-10 removal choices: keep affected recipes or remove only explicitly selected affected recipes as part of member removal. This is not general recipe deletion UI. | Three desktop engines; tablet/phone removal-screen smoke | NOT RUN | None |

### Result and privacy rules

- All statuses in this document are **NOT RUN**. No result may be inferred from compatibility documentation, device availability, source-code inspection, a page load, local mocks, or emulated viewport execution alone.
- When executed, use PASS only for the scope actually observed and cite its evidence. FAIL records a reproducible contradiction/blocker. Keep anything not executed NOT RUN. Do not infer actual device behavior from an emulation result.
- Never record passwords, invitation URLs/tokens, privileged keys, personal identifiers, or private family recipe content. Use disposable identities and synthetic recipe data.
- Record browser/OS/version, viewport, run mode, build, date, outcome, limitations, and a non-secret evidence reference. Do not label an emulated viewport as a real device.

## D-03 / D-04 / D-18 offline and cache feasibility (not tested)

Offline behavior remains in scope and must not be silently removed because installation is excluded. Browser storage and Service Worker APIs may be evaluated in an ordinary browser context; they do not guarantee recipe-data persistence. Separate cached application resources from cached recipe records, and test active-tab offline and reload/reopen offline independently. Browser data may be cleared or evicted. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API; https://developer.mozilla.org/en-US/docs/Web/API/Cache; https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API; https://webkit.org/blog/14403/updates-to-storage-policy/; https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria; accessed 2026-10-21]

| Decision | Required behavior to preserve | Validation evidence required | Status |
|---|---|---|---|
| D-03 | Previously loaded recipes remain available while signed in and disconnected; show only cached recipes with a clear offline notice; disable edits. | UAT-11 and UAT-12, per selected browser/storage engine; explicitly distinguish active-page offline from offline reload/reopen. | NOT RUN |
| D-04 | Clear account recipe cache when member signs out. | UAT-13, including same-browser account switch and proof that the prior account's recipe payload is not shown. | NOT RUN |
| D-18 | A disconnected browser may continue to display cached recipes until it reconnects or the member signs out; reauthorize before remote refresh and purge when access is denied. | UAT-14 and UAT-15; record stale-cache duration/context and reconnect denial/purge. | NOT RUN |

**Feasibility conclusion:** The above behaviors are requirements, not observed results. Browser APIs make prototyping possible, but no chosen storage design or persistence guarantee is established. If a behavior cannot be supported as specified, record the failure/limitation and obtain an explicit user decision; do not quietly remove offline semantics or promise indefinite survival or immediate remote erasure of a disconnected browser.

## Decision gate and open decisions

Complete the agreed representative browser-engine/viewport validation and record results before asking the user to approve the production framework, backend/identity/email, hosting/deployment, cache approach, and project layout. Physical phone testing is not a prerequisite. Actual device/browser observations may supplement emulation or be requested to investigate a concrete OS/hardware gap, but no actual-device status is implied here. If actual-device observations are absent, record that limitation; do not claim actual device coverage.

All nine unresolved edge-probe assumptions remain explicit in `01-RESEARCH.md`; this matrix does not resolve them. Retain each until the product owner approves an observable contract or an explicit deferral with rationale.

## Source references

- W3C, Web Content Accessibility Guidelines (WCAG) 2.2 Recommendation (2023-10-05): https://www.w3.org/TR/WCAG22/ — Reflow, keyboard access, focus, and target-size criteria. Accessed 2026-10-21.
- Chrome DevTools, Device Mode: https://developer.chrome.com/docs/devtools/device-mode/ — viewport/device emulation. Accessed 2026-10-21.
- Mozilla Firefox DevTools, Responsive Design Mode: https://firefox-source-docs.mozilla.org/devtools-user/responsive_design_mode/ — responsive viewport simulation. Accessed 2026-10-21.
- Playwright browser documentation: https://playwright.dev/docs/browsers — browser-engine automation/emulation reference, not a stack/package recommendation. Accessed 2026-10-21.
- MDN, Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API — browser capability and secure-context requirements. Accessed 2026-10-21.
- MDN, Cache API: https://developer.mozilla.org/en-US/docs/Web/API/Cache — cache storage interface. Accessed 2026-10-21.
- MDN, IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API — structured browser storage. Accessed 2026-10-21.
- WebKit, Updates to Storage Policy: https://webkit.org/blog/14403/updates-to-storage-policy/ — storage policy and eviction caveats. Accessed 2026-10-21.
- MDN, Storage quotas and eviction criteria: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria — browser storage quota/eviction behavior. Accessed 2026-10-21.
- `.planning/phases/01-decisions-and-shared-cookbook/01-CONTEXT.md:5-7,16-52,112-113` — general browser scope, decisions, discretion, and deferred scope.
- `.planning/ROADMAP.md:12,20-21` — responsive-browser goal and current representative browser validation gate.
- `.planning/STATE.md:4,22` — stale phone-oriented summary, intentionally not edited per task scope.
- `.planning/phases/01-decisions-and-shared-cookbook/01-RESEARCH.md` — requirements, project constraints, security/privacy, and the nine unresolved probes.

**Research date:** 2026-10-21  
**Evidence status:** All browser target statuses, UAT cases, and offline/cache checks are NOT RUN.
