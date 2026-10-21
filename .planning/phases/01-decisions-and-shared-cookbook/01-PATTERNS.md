# Phase 1: Decisions and Shared Cookbook — Pattern Map

**Mapped:** 2026-10-21  
**Files analyzed:** 5 files named by the existing interim validation plan  
**Application analogs found:** 0 / 5

## Scope and Interpretation

This map applies the user's latest clarification: the product target is a general responsive browser web app for phone, tablet, and desktop screen sizes. Native iOS/Android apps, app-store distribution, and an installable PWA are excluded.

The current `01-CONTEXT.md`, `01-RESEARCH.md`, and project state still describe phone-only support. This map does not edit those files; refresh them separately so the approved scope is consistent. Their phone-browser research remains useful for browser behavior, but does not limit responsive layout validation to phones.

The existing Phase 1 plan is interim validation-only. It names a disposable browser probe and evidence outputs, not production application modules. Production paths, framework, backend, identity provider, data store, and stack remain unapproved. Do not promote probe code, plan targets, existing phase checks, or provisional/native-oriented stack suggestions into production implementation analogs.

Responsive web validation and native device testing are different:

- **Responsive web validation:** exercise the ordinary browser URL at representative phone, tablet, and desktop viewport sizes; verify responsive layout and core browser flows. Use real phones/tablets/desktops where available to confirm browser and input behavior. Viewport emulation is useful coverage, not proof of physical-device behavior.
- **Native device testing:** testing installed iOS/Android application binaries, native APIs, store builds, or native permission flows. It is not a Phase 1 target. Testing a website in Safari or Chrome on a physical phone is browser validation, not native app testing.
- Do not test or introduce an install prompt, store route, or required PWA installation.

## File Classification

Paths below are the outputs named in `.planning/phases/01-decisions-and-shared-cookbook/01-08-PLAN.md`. The `browser-probe/` directory and `checks/browser-probe.test.mjs` were not present when mapped; they are planned disposable validation artifacts, not application source.

| Planned target | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.planning/phases/01-decisions-and-shared-cookbook/browser-probe/index.html` | test (browser fixture) | request-response | None | No existing browser app or probe fixture |
| `.planning/phases/01-decisions-and-shared-cookbook/browser-probe/app.js` | test (browser harness) | request-response | None | No existing browser app implementation |
| `.planning/phases/01-decisions-and-shared-cookbook/browser-probe/styles.css` | test (responsive fixture styling) | transform / presentation | None | No existing responsive UI code |
| `.planning/phases/01-decisions-and-shared-cookbook/checks/browser-probe.test.mjs` | test | request-response / batch validation | None | Existing phase checks validate planning artifacts, not browser product flows |
| `.planning/phases/01-decisions-and-shared-cookbook/01-PLATFORM-EVIDENCE.md` | documentation | batch / evidence recording | None | Existing evidence is not an application pattern |

These classifications describe validation assets only. No production controller, component, service, model, middleware, route, migration, or configuration file is specified by the current interim plan.

## Pattern Assignments

### `browser-probe/index.html` (test fixture, request-response)

**Analog:** None. No reusable application markup exists.

Keep this as a small, disposable browser validation surface for the planned flow. Make it usable at representative phone, tablet, and desktop viewport sizes per the latest clarification. It must run as an ordinary web page without native packaging, store distribution, or an installable PWA. Do not treat its markup as the production app shell.

### `browser-probe/app.js` (test harness, request-response)

**Analog:** None. No browser application code or selected framework exists.

Keep harness behavior isolated from any future production client. If it calls a validation endpoint, use only the plan's isolated disposable test service and synthetic identities/data. Keep test-control credentials and reset controls out of browser-delivered code; never place production credentials or privileged keys in the harness. The harness can provide evidence about the tested endpoint and browser flow only, not approve a production provider or architecture.

### `browser-probe/styles.css` (responsive test fixture, transform / presentation)

**Analog:** None. No responsive design system or UI styling is established.

Use responsive layout rules and record the viewport/device/browser conditions used for validation. Cover phone, tablet, and desktop sizes; do not use a phone-only mobile-first assumption as a reason to omit larger screen widths. These probe styles are evidence scaffolding, not production design tokens or component patterns.

### `checks/browser-probe.test.mjs` (test, request-response / batch validation)

**Analog:** None for product-flow tests. Existing phase checks are planning/evidence checks and must not be read as application behavior or production test architecture.

Use automated checks only for assertions the disposable test environment can reliably verify (for example, expected response/state and evidence-record completeness). Keep physical browser observations separate: a Node test or viewport emulator cannot establish that Safari/Chrome on a real device behaves correctly. Do not claim native app coverage.

### `01-PLATFORM-EVIDENCE.md` (documentation, batch / evidence recording)

**Analog:** None. Existing platform evidence does not establish responsive web behavior.

Record each result with test date, URL/build or probe revision, viewport dimensions, device when physical, OS, browser/version, flow, outcome, and evidence reference. Distinguish automated/emulated checks from physical-device browser checks. Mark unperformed tests `NOT RUN`; do not infer success from available hardware, compatibility documentation, or an unexecuted plan.

## Shared Patterns

These are validation principles from the current phase research and user clarification, not copyable code patterns.

### Responsive browser coverage

**Apply to:** the browser probe and its evidence.

- Cover representative phone, tablet, and desktop viewport sizes and record the dimensions.
- Verify key flows in an ordinary browser session at each required size; include responsive layout, navigation, form usability, and content readability.
- Where practical, run the ordinary site URL in actual browsers on physical devices. Label those results as browser-on-device validation, never as native app testing.
- Treat viewport emulation as responsive layout coverage only; it does not prove physical device, browser lifecycle, keyboard, or OS integration behavior.

### Disposable validation and privacy boundaries

**Apply to:** all probe behavior and automated checks.

- Use isolated, resettable test infrastructure, synthetic accounts/recipes, and a test-only email sink as required by the interim plan.
- Keep test-control endpoints and credentials on the trusted runner side; never expose privileged credentials in client assets.
- Do not connect the probe to a production tenant or real family data. A passing disposable probe is not evidence of production readiness.

### Evidence and scope boundaries

**Apply to:** test output and `01-PLATFORM-EVIDENCE.md`.

- Separate responsive web checks across screen sizes from actual physical-device browser checks, and both from native application tests (which are out of scope).
- State exactly what was run and what remains untested. Do not treat a static fixture, mock, API compatibility claim, or automated test as end-to-end product validation.
- Keep all outcomes provisional until the user decision gate and production architecture choices are explicitly resolved.

## No Analog Found

No tracked application implementation analogs are available to assign. The workspace has no established browser application source or selected production framework. Research and project instructions describe constraints and candidate patterns, but are conceptual guidance rather than executable code excerpts. Existing planning checks and interim plans are not production analogs.

## Metadata

**Analog search scope:** phase context, refreshed phase research, project instructions, phase plan targets, and phase directory inventory.  
**Files scanned:** current phase context/research/pattern map, project instructions, interim plan, phase state, and relevant artifact inventory.  
**Pattern extraction date:** 2026-10-21  
**Limitations:** source-control tooling was unavailable for an independent tracked-file audit; no existing source file is named as an analog. Context and research still state phone-only scope and should be reconciled separately with the latest responsive phone/tablet/desktop clarification. Production stack and implementation paths remain undecided.
