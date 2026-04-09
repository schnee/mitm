# Phase 03 Research - Shared Shortlist & Confirmation

**Date:** 2026-04-08  
**Status:** Complete  
**Scope:** Implementation guidance for DECS-01, DECS-02, DECS-03

## Research Question

What implementation approach will convert ranked results into a single, conflict-safe decision shared by both participants, while preserving real-time visibility and enabling immediate navigation handoff?

## Recommended Technical Direction

### standard_stack
- **Backend execution:** Extend existing `services/api` Node/TypeScript service and in-memory `SessionRepository` decision state.
- **Realtime sync:** Reuse existing session event stream (`/v1/sessions/:id/events`) and session snapshot hydration model.
- **Validation:** Keep zod boundary validation for all shortlist/confirm payloads.
- **Frontend integration:** Add shortlist + confirmation UI to existing `src/app/s/[token]/page.tsx` flow after ranking results are available.

### architecture_patterns
1. **Session-authoritative decision state**
   - Shortlist and confirmed place live in session state (shared by both participants).
   - Avoid per-client local shortlist as source of truth.

2. **Idempotent, conflict-safe confirmation**
   - First successful confirmation sets final place.
   - Reconfirming the same place returns success (idempotent).
   - Attempting to confirm a different place after confirmation returns deterministic conflict (`PLACE_ALREADY_CONFIRMED`).

3. **Metadata-preserving shortlist records**
   - Store shortlist records with ranking metadata needed for decision context:
     - `venueId`, `name`, `category`, `openNow`, `etaParticipantA`, `etaParticipantB`.
   - Keep `addedByParticipantId` and `addedAt` for traceability.

4. **Navigation handoff as URL contract**
   - Store and return explicit `navigationUrl` for confirmed place.
   - Use deterministic map URL template: `https://www.google.com/maps/search/?api=1&query={lat},{lng}`.

## Contract Baseline for Planning

Add/extend contracts:
- `ShortlistVenue`
  - `venueId`, `name`, `category`, `openNow`, `lat`, `lng`, `etaParticipantA`, `etaParticipantB`, `addedByParticipantId`, `addedAt`
- `ConfirmedPlace`
  - `venueId`, `name`, `category`, `lat`, `lng`, `navigationUrl`, `confirmedByParticipantId`, `confirmedAt`

Required API surfaces:
- `POST /v1/decision/shortlist` -> add or refresh shortlist item for session
- `POST /v1/decision/confirm` -> confirm one shortlist venue as final

Session snapshot should expose:
- `shortlist: ShortlistVenue[]`
- `confirmedPlace: ConfirmedPlace | null`

## dont_hand_roll

- Do **not** add chat/messaging to resolve decision conflicts (explicit non-goal).
- Do **not** allow more than one final confirmed venue per session.
- Do **not** compute deep links client-side only; backend must return canonical `navigationUrl`.

## common_pitfalls

1. **Race conditions on confirm**
   - Mitigation: repository-level atomic guard and deterministic 409 conflict response.

2. **Shortlist not truly shared**
   - Mitigation: keep shortlist in session snapshot + event stream updates, never isolated local-only state.

3. **Missing handoff data**
   - Mitigation: require `navigationUrl` in confirmed payload and UI render path.

4. **UI allows confirming items not in shortlist**
   - Mitigation: confirmation route validates target `venueId` exists in shortlist.

## Testing Targets for This Phase

- Repository tests cover shortlist add/update dedupe behavior and confirmed-place conflict protection.
- Route tests validate 200/400/404/409 behavior for shortlist + confirmation endpoints.
- UI test verifies shortlist updates, confirmed state rendering, and navigation link visibility.

## Planning Implications

- Split into three execute plans:
  1. Session decision-state contracts + repository methods + domain tests.
  2. Decision routes + validation + server wiring + API tests.
  3. Frontend shortlist/confirm/navigation integration + e2e coverage.

---

*Research complete for phase planning.*
