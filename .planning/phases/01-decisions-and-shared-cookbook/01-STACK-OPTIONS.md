# Phase 1 Architecture Candidates and Decision Gate

**Status:** Candidate A is approved for a reversible feasibility spike only; no
production stack is approved. Candidate B remains an alternative if Candidate A fails.
**Evidence confidence:** LOW overall. Documentation establishes that a capability is
described, not that this project's exact flows, package versions, store eligibility,
device installation, or security configuration have passed.
**Reviewed:** 2026-10-21

## Constraints to preserve

- Deliver a phone-first app installable on both iPhone and Android (D-01, D-02).
- Use individual email/password accounts, an owner-created family cookbook, and
  email-bound invitations (D-06 through D-09, D-19).
- Enforce family membership at the backend/data boundary; do not ship privileged
  credentials in the app.
- Preserve Portuguese or English recipe wording, quantities, ingredient lines, and
  instruction order; localize the app interface in Portuguese and English (D-11
  through D-13, D-20).
- Show only cached recipes while offline, disable writes, and purge the signed-in
  account's recipe cache at sign-out or account switch (D-03, D-04, D-18).
- Do not add OCR/photo handling, general recipe deletion, search, or categories to
  Phase 1 (D-14, D-15 and the Phase 2/3 boundaries).
- No candidate, service, package version, or directory layout in this document is a
  production decision.

## Candidate comparison

| Gate | Candidate A: Expo + React Native + Supabase + EAS Build | Candidate B: Flutter + Supabase |
|---|---|---|
| iPhone build and store route | Expo documents hosted iOS builds and store-ready binaries. Apple documents TestFlight distribution. Actual signed build, installation, and account eligibility remain untested. | Flutter documents App Store and TestFlight release steps; its iOS release guide requires Xcode on macOS. No macOS host is currently identified. |
| Android build and store route | Expo documents hosted Android builds and store-ready binaries. Google Play documents internal testing tracks. Actual signed build, installation, and account eligibility remain untested. | Flutter documents Android signing and Play Store release steps. Android SDK, Java, and Flutter are not installed on this Windows workstation. |
| Fit for this Windows workstation | Hosted builds may avoid local Xcode/Android build toolchains. Local native debugging is not established by the build service documentation. Node.js is available; `npm.ps1` is blocked by PowerShell execution policy, and CLI/service prerequisites remain unverified. | Requires a separate iOS/macOS build host and installation of Flutter/Android tooling for local work. No such host or toolchain is currently available. |
| Email/password and invitations | Supabase documents email/password authentication and an administrative invitation API. The administrative API is privileged and must run server-side; actual email verification, exact-address acceptance, expiry, resend, revoke, and first-owner behavior need a spike. | Same candidate Supabase identity/data capabilities; Flutter integration and the complete invitation flow still need a spike. |
| Family authorization | Supabase documents Postgres RLS. Correct grants and policies must be implemented and tested for cross-family reads/writes and owner-only actions; the documentation is not proof that project policies exist. | Same conditional Supabase authorization approach and same required negative tests. |
| Recipe fidelity and bilingual UI | Neither framework/provider documentation proves the required editable UI or text fidelity. The spike must create, edit, reopen, and compare Portuguese/English text, free-text ingredient lines, and ordered steps. | Same acceptance test; no candidate advantage is assumed. |
| Read-only offline access and cache purge | Neither combination is documented here as providing the required semantics. Implement or configure an account-scoped cache; prove offline writes are rejected rather than queued, sign-out purges it, and reconnect reauthorizes. | Same acceptance test; no candidate advantage is assumed. |
| Local full-stack development | Must demonstrate a repeatable app/backend run command without privileged client secrets. Supabase local tooling, email setup, and any needed cloud services remain to be verified. | Same backend gate; Flutter toolchain and a repeatable run path also remain to be established. |
| Provisional assessment | Better documented fit for the present Windows environment because EAS describes hosted iOS and Android builds. It still depends on service/package legitimacy review and real-device proof. | Viable alternative with official store-release instructions, but the missing macOS build host is a material unresolved dependency. |

The shared Supabase rows intentionally isolate the client/build choice. Supabase is
part of Candidate A's reversible spike target only; neither its identity service nor
database is configured or selected for production. The framework comparison is not a
ranking of production stacks.

## Provisional candidate checkpoint

**Approved provisional candidate:** Candidate A (Expo + React Native + Supabase +
EAS Build), approved by the user on 2026-10-21 for a disposable feasibility spike
only. The reason is its documented hosted build path for both phone platforms while
this workstation lacks Xcode and Android tooling. Candidate B remains an alternative
if the spike cannot meet its gates.

This approval does not select the production framework, backend, identity provider,
build/submission service, or directory layout. The user requested that execution
continue without Git commits; the approval and subsequent work remain uncommitted.

Before any package installation, the exact approved candidate and each package it
requires must appear in the research package-legitimacy audit, and the blocking human
review in Plan 01-02 must pass. This scorecard does not authorize installation.

**Spike package review:** The user approved the audited required package identities and
CLI tools on 2026-10-21 for the disposable spike only. Optional Expo Router and
SecureStore packages were excluded. Expo-managed package versions still need to be
resolved for SDK compatibility; approval does not select production dependencies.

## Observable pass/fail gates

For each phone, record the device model, OS version, build identifier, test date,
result, and a concrete non-secret artifact or log reference. A missing, mocked, or
inferred result is `NOT RUN`, not `PASS`. Keep iPhone and Android evidence separate.

| Gate | Pass evidence | Fail / not-passed condition |
|---|---|---|
| iPhone build, signing, installation | A candidate build is installed and launched on the available iPhone; record signing/distribution route and TestFlight status with build/device evidence. | No installable build, simulator-only evidence, unresolved account/signing requirement, or missing artifact. |
| Android build, signing, installation | A candidate build is installed and launched on the available Android phone; record signing/distribution route and Google Play internal-test status with build/device evidence. | No installable build, emulator-only evidence, unresolved account/signing requirement, or missing artifact. |
| Individual account and first owner | A test identity signs up and signs in using email/password; the first account becomes the family owner exactly once, including a retry/concurrent-bootstrap check. | Shared credentials, duplicate/ambiguous owner, unverified identity accepted, or no reproducible evidence. |
| Invitation and family boundary | An invite is accepted only by the verified invited email; wrong-email, expired, revoked, duplicate, and cross-family access attempts are denied. Owner-only actions are enforced outside the UI. | Client-only authorization, privileged credential in the app, or any unauthorized acceptance/read/write. |
| Recipe create/edit and fidelity | An authorized member creates, edits, reloads, and reopens Portuguese and English content; ingredient text and ordered instructions remain byte-for-byte/user-visible faithful. | Translation, quantity/unit conversion, reordered/lost text, or a test without saved/reloaded data. |
| Offline read-only behavior | While disconnected, only previously cached recipes appear with an offline notice; all mutations are rejected and not queued. Reconnect reauthorizes before refresh; sign-out/account switch purges the old account's cache. | Offline mutation is accepted/queued, cache crosses accounts, stale remote data is shown before reauthorization, or purge fails. |
| Local full-stack run | A clean, documented command starts the app and required backend services with test credentials; one account/data flow succeeds and no privileged key is bundled. | Undocumented manual setup, unavailable service dependency, or privileged secret in client configuration. |
| Bilingual interface | Portuguese and English interface controls are exercised on each phone; recipe content remains in its entered language. | Only recipe data is localized, interface text is missing in either language, or recipe text is changed. |
| D-10 member removal | Owner removal lists recipes by original creator, applies explicit keep/remove outcomes, and does not expose attribution in normal views. | General delete/trash UI is added, creator identity is displayed normally, or removal behavior lacks evidence. |

No result in this table is currently passed. The phones and Apple/Google developer
accounts are reported as available in D-16, but that availability is not evidence of
installation, store-track eligibility, or successful product flows.

## Current environment and unresolved evidence

- Operating system: Windows.
- Node.js is installed (`v26.8.1`). PowerShell resolves `npm` to a script blocked by
  the local execution policy; `npm.cmd` (`11.19.0`) successfully queried the official
  registry, but package installation has not been attempted.
- `xcodebuild`, `xcrun`, `adb`, `emulator`, `flutter`, `dart`, `java`, and `gradle`
  are not available on PATH.
- D-16 reports access to a current iPhone, Android phone, and Apple/Google developer
  accounts. Their models, OS versions, account roles, and distribution eligibility
  have not been checked.
- No app packages have been installed. Candidate A's framework/backend/build services
  are approved only for the feasibility spike; production framework, backend, identity
  provider, email service, build/submission service, store route, and directory layout
  remain unselected.

## Evidence sources

Official documentation reviewed 2026-10-20:

- Expo EAS Build: <https://docs.expo.dev/build/introduction/>
- Expo first build setup: <https://docs.expo.dev/build/setup.md>
- Apple TestFlight overview: <https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/>
- Google Play testing tracks: <https://support.google.com/googleplay/android-developer/answer/9845334?hl=en>
- Flutter iOS release (including the macOS/Xcode prerequisite): <https://docs.flutter.dev/deployment/ios.md>
- Flutter Android release: <https://docs.flutter.dev/deployment/android.md>
- Supabase password authentication: <https://supabase.com/docs/guides/auth/passwords>
- Supabase administrative invite API: <https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail>
- Supabase Postgres RLS: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Firestore offline behavior used as a cautionary comparison: <https://firebase.google.com/docs/firestore/manage-data/enable-offline>

These sources describe platform/provider capabilities. They do not validate a package,
candidate integration, project configuration, security policy, account entitlement,
device result, or store approval.
