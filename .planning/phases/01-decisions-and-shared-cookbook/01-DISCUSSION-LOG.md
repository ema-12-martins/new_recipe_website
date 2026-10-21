# Phase 1: Decisions and Shared Cookbook - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `01-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-10-20
**Phase:** 1-decisions-and-shared-cookbook
**Areas discussed:** Phone app or mobile web; inviting family members; recipe wording and units; photo lifecycle; offline use; recipe deletion scope; browser-only delivery

---

## Phone app or mobile web

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Which phones should the first version work well on? | Both iPhone and Android; mostly iPhones; mostly Android | Both iPhone and Android |
| How should family members open the cookbook on their phones? | Install from app stores; open in phone browser without installation; either, choose simplest for both platforms | Install from app stores |
| Should v1 also work on a computer or tablet? | Phone first plus usable computer browser; phone support only; full phone/tablet/computer support | Phone support only |
| What should still work during temporary internet loss? | View previously loaded recipes and sync changes on reconnect; browse/edit offline and sync later; online only with a clear message | View previously loaded recipes; later clarified that editing requires internet |

**Notes:** The user selected an installable app-store app for both iPhone and Android, with phone support only for v1.

---

## Inviting family members

| Question | Options presented | Selected |
|----------|-------------------|----------|
| How should the owner invite someone? | Email invitation to a specific address; invite link/code; both | Email invitation |
| How should invitees sign in? | Email and password; one-time email link; Apple or Google sign-in | Email and password |
| What happens when an invitee has no account? | Create account and join in one guided flow; sign up then accept; owner creates accounts | Create account and join in one guided flow |
| How should the first cookbook start? | First signup creates it and becomes owner; wait for first invitee; any member starts it and assigns an owner later | First signup creates it and becomes owner |
| What happens to a removed member’s contributed recipes? | Keep all; remove all; owner decides case by case | Owner decides case by case |
| How can the owner make that case-by-case decision without visible contributor labels? | Show a one-time list during removal; keep all without identifying them; remove all | Show the list only during removal and let the owner choose per recipe |

**Notes:** Prior project decisions already establish individual accounts, owner-managed invitations/access, and shared editing by all invited members. No contributor names should otherwise appear in the cookbook.

---

## Recipe wording and units

| Question | Options presented | Selected |
|----------|-------------------|----------|
| What language are most handwritten recipes in? | Portuguese; English; a mix of Portuguese and English | A mix of Portuguese and English |
| Should original wording and measurements be preserved? | Preserve language, wording, and units without translation/conversion; allow optional translation; automatically translate/convert | Preserve original language, wording, and units |
| How should ingredient quantities be entered? | One flexible text line; separate quantity/unit/name fields; text line plus optional structured fields | One flexible text line |
| How should instructions be entered? | Separate reorderable steps; one text block; allow either | Separate ordered steps that can be rearranged |

---

## Photo lifecycle

| Question | Options presented | Selected |
|----------|-------------------|----------|
| What happens to source photos when a recipe is deleted? | Recoverable trash before deletion; delete immediately; keep permanently in separate archive | Recoverable trash |
| How long should deleted recipes/photos remain recoverable? | 30 days; 7 days; until owner permanently deletes | 30 days |
| Who may restore or permanently remove a recipe during that period? | Any invited member; owner only; any member restores but only owner permanently deletes | Any invited member |

**Notes:** The user then chose to keep general recipe deletion, restoration, and trash outside Phase 1 and defer them rather than changing the approved roadmap. The preferences above are recorded for possible future scope only.

---

## Offline use

| Question | Options presented | Selected |
|----------|-------------------|----------|
| During internet loss, view cached recipes only or also make changes? | View loaded recipes only and require internet to edit; edit cached recipes and sync later; full offline access including adding recipes | View previously loaded recipes only; online is required to edit |
| How long should cached recipes remain available? | While signed in and refresh online; until app closes; member chooses saved offline recipes | While signed in; refresh when online |
| What happens to cached recipes on sign-out? | Clear cache; keep recipes; let member decide | Clear cached recipes |
| How should offline browsing appear? | Show cached recipes only with offline notice; show all but mark unavailable; block cookbook | Show cached recipes only with a clear offline notice |

---

## Recipe deletion scope

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Should general deletion and trash be added to Phase 1 despite not being approved requirements? | Defer delete/trash and keep Phase 1 unchanged; update roadmap to include recipe deletion | Defer delete/trash and keep Phase 1 unchanged |

## Deferred Ideas

- General recipe deletion, restore, and a 30-day trash bin; the future preference is that any invited member can restore or permanently remove a deleted recipe during the recovery period.

---

## Clarifications after the planning checkpoint

**Date:** 2026-10-20  
**Phase:** 1-decisions-and-shared-cookbook

| Topic | Clarification |
|-------|---------------|
| Platform validation access | A current iPhone and Android phone and Apple and Google developer accounts are available for the validation spike. Availability is not evidence that installation, store-track distribution, or store eligibility has been tested. |
| Regular-member account deletion | Retain shared recipes and remove/anonymize the deleted member's private creator metadata. Keep this distinct from owner-initiated member removal. |
| Offline revocation | Accept that cached recipes on a disconnected device remain readable until it reconnects or the member signs out. Reauthorize on reconnect; do not promise immediate remote erasure. |
| Invitation lifecycle | Invitations expire after seven days; the owner may resend or revoke; the invitee must verify the matching invited email. |
| Interface language | App chrome supports Portuguese and English in addition to preserving recipe content in either language. |
| Member-removal recipe scope | Use original creator metadata: include recipes first added by the removed member even if another member edited them later. Keep attribution hidden in ordinary recipe UI. |

The cookbook owner's own account-deletion behavior remains unresolved and must be a focused decision checkpoint before that flow is implemented. It must not be inferred from regular-member account deletion or D-10.

---

## Browser-only delivery

| Option | Description | Selected |
|--------|-------------|----------|
| Mobile-first browser web app only | No native apps, app-store distribution, or installable PWA | ✓ |
| Responsive web app for phones and desktop | No native apps; adds desktop support | |
| Installable PWA for phones | No native App Store/Play apps; allows web installation | |

**User's choice:** Mobile-first browser web app only; no native apps, app-store distribution, or PWA.
**Notes:** Phone-only support remains the v1 target. Existing read-only offline/cache and account decisions carry forward for revalidation in the browser-only context. Production framework, backend/identity, hosting/deployment, and cache approach remain unapproved.
