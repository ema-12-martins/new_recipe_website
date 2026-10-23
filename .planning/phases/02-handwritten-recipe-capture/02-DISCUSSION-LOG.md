# Phase 2: Handwritten Recipe Capture - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-23
**Phase:** 2-Handwritten Recipe Capture
**Areas discussed:** Photo capture flow, Draft review screen, Recognition failure and manual fallback, Provider benchmark and privacy, Source photos after saving

---

## Photo capture flow

| Question | Options considered | Selected |
|----------|--------------------|----------|
| How photos are provided | a. One "Add photos" native picker / b. Separate camera and gallery buttons / c. You decide | a |
| Multiple pages | a. Thumbnails with reorder and remove / b. Order of addition only / c. You decide | a |
| Limits | a. 6 photos, client-side resize, JPEG/PNG/HEIC / b. Originals up to a size cap / c. Other | a |
| After choosing a photo | a. Preview and explicit "Read recipe" / b. Automatic recognition / c. You decide | a |

**Notes:** All recommended options chosen.

---

## Draft review screen

| Question | Options considered | Selected |
|----------|--------------------|----------|
| Draft display | a. Reuse recipe form with banner / b. Separate review screen / c. You decide | a |
| Photo during review | a. Thumbnails beside the form / b. Text-only / c. You decide | b |
| Uncertain lines | a. No flagging / b. Highlight low confidence / c. You decide | a |
| Confirmation | a. Single Save button / b. Confirmation dialog / c. You decide | a |
| Leaving unsaved | a. Discard with warning / b. Keep draft / c. You decide | a |

**Notes:** User chose a text-only review screen (option b), against the recommendation.

---

## Recognition failure and manual fallback

| Question | Options considered | Selected |
|----------|--------------------|----------|
| What is unusable | a. Error/timeout/empty only / b. Also low-quality heuristic / c. You decide | b |
| While running | a. Progress, cancel, ~60 s timeout / b. Spinner / c. You decide | a |
| Failure screen | a. Try again / manual, photos kept / b. Manual without photos / c. You decide | a |
| Manual entry reachable | a. Failure screen and capture screen / b. Failure screen only / c. You decide | a |
| Mostly-wrong draft | a. Start over available / b. Just edit / c. You decide | (no answer) |

**Notes:** The low-quality threshold depends on the benchmark. Question 5 was unanswered, so the recommended option (a) was applied.

---

## Provider benchmark and privacy

| Question | Options considered | Selected |
|----------|--------------------|----------|
| Sample set | a. 15-20 pages / b. 5-8 pages / c. Other | a |
| Approval criteria | a. Correction effort, target set after results / b. Fixed target now / c. You decide | a |
| Privacy | a. EU, no retention, no training / b. EU preferred / c. Other | a |
| Organisation | a. Benchmark is the first plan, parallel non-provider work / b. Benchmark before any planning / c. You decide | a |
| Candidates | a. Earlier-research candidates / b. Google only / c. Other | a |

**Notes:** All recommended options chosen.

---

## Source photos after saving

| Question | Options considered | Selected |
|----------|--------------------|----------|
| Where photos appear | a. Bottom section / b. Top of page / c. You decide | a |
| Changing photos on edit | a. Add and remove / b. Read-only / c. You decide | a |
| Photos on a manual recipe | a. Yes / b. No / c. You decide | a |
| Offline | a. Cache for opened recipes / b. No offline photos / c. You decide | a |
| Visibility | a. Members only via storage policies / b. You decide | a |

**Notes:** All recommended options chosen.

---

## the agent's Discretion

Visual layout and copy, storage bucket layout and image library, and server-side routing of recognition once a provider is approved.

## Deferred Ideas

None.
