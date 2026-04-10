---
phase: 10-session-continuity-state-persistence-hardening
date: 2026-04-10
status: complete
scope: SESS-03, LOCT-02, LOCT-03, UX-11, UX-13, UX-25
---

# Phase 10 Research: Session Continuity & State Persistence Hardening

## What This Research Answers

How to implement refresh/rejoin-safe session continuity so location confirmation, preference completion, blocker ownership, and next-action guidance stay correct after reload.

## Inputs Reviewed

- `.planning/ROADMAP.md` (Phase 10 goal, requirement IDs, GAP-01/GAP-03 handoff)
- `.planning/REQUIREMENTS.md` (SESS-03, LOCT-02, LOCT-03, UX-11, UX-13, UX-25 pending)
- `.planning/v1.0-MILESTONE-AUDIT.md` (integration gaps + broken flows)
- `.planning/phases/08-mobile-first-guided-flow-map-driven-decisioning/*-SUMMARY.md`
- Current implementation:
  - `src/app/s/[token]/page.tsx`
  - `src/hooks/useSessionSync.ts`
  - `src/components/location/LocationCaptureForm.tsx`
  - `src/components/location/LocationConfirmCard.tsx`
  - `src/components/ranking/RankingInputsForm.tsx`
  - `src/lib/api/session-client.ts`
  - `tests/e2e/ranking-results.spec.ts`

## Root-Cause Findings

### GAP-01 (Location continuity) — confirmed

1. **Location confirm gate is local-only:**
   - `LocationConfirmCard` uses `draftSaved` prop to enable `Confirm location`.
   - `draftSaved` state in `page.tsx` is only set by current-page callbacks, so reload/rejoin resets it to `false` even when server has draft location data.
2. **No draft-hydration signal from snapshot/events:**
   - `SessionSnapshotParticipant` has only `locationConfirmedAt`; no `locationDraftUpdatedAt` (field exists only in event diff type).
   - UI cannot derive “draft exists but unconfirmed” from hydrated snapshot.

**Impact:** user may be blocked from confirming after refresh even though draft already saved server-side.

### GAP-03 (Preference continuity + lifecycle messaging drift) — confirmed

1. **Preference completion inference is local-only:**
   - `myPreferencesSaved` flips true only in `RankingInputsForm.onSaved` callback.
   - Reload/rejoin loses this local flag, and derived flow can regress.
2. **Flow derivation uses ambiguous booleans:**
   - `myPreferencesSaved` is inferred with `myPreferencesSaved || rankingLifecycleState !== "waiting"`.
   - This is not participant-specific and can be wrong in waiting/partner-save scenarios.
3. **Status copy defaults are not hydration-derived:**
   - `rankingStatus` and `decisionStatus` start from static strings and update only after local actions.

**Impact:** blocker ownership and state badges can drift from canonical server lifecycle after reload.

## Implementation Strategy (Recommended)

### 1) Make hydration state authoritative for continuity

- Extend session snapshot contracts to expose participant draft/prefs progress needed by UI:
  - per participant: `locationDraftUpdatedAt: string | null`
  - per participant: `rankingInputsUpdatedAt: string | null` (or equivalent `hasRankingInputs: boolean`)
- Merge and preserve these fields in `useSessionSync` event/snapshot updates.

### 2) Refactor page-level progression to derive from snapshot + participant identity

- Replace local-only progression flags (`draftSaved`, `myPreferencesSaved`) with derived values from `sync.snapshot` + `participantId`.
- Keep local optimistic state for transient UX only (pending spinners, optimistic lists), not for phase completion truth.

### 3) Ensure LOCT-03 fallback remains unblocked after reload

- `LocationConfirmCard` should enable confirm when either:
  - current session has server-known location draft for current participant, or
  - user just saved draft in this render pass.
- Preserve existing manual geolocation fallback mechanics (no provider change).

### 4) Normalize lifecycle/status copy from canonical state

- Convert waiting/loading/success/error strings to derive from `rankingLifecycle`, readiness booleans, and participant progression.
- Keep UX-25 partner-progress language explicit (`Your turn` / `Waiting for partner`).

## Testing Strategy for Phase 10

1. **Unit tests (fast):**
   - Extend `src/lib/session-flow.test.ts` with refresh/rejoin cases where local flags are absent but snapshot indicates saved drafts/preferences.
2. **E2E continuity tests:**
   - Add scenario: save manual location draft -> reload -> confirm still enabled.
   - Add scenario: save preferences (participant A) -> reload -> still shows waiting/generating correctly.
3. **No regression checks:**
   - Existing ranking/shortlist/confirm tests stay green (`tests/e2e/ranking-results.spec.ts`).

## Scope Guardrails (Do Not Change)

- Do not change fairness algorithm, ranking provider integrations, or two-participant model.
- Do not redesign map provider integration (that is Phase 11 GAP-02).
- Keep API error contracts stable unless additional fields are additive and backward compatible.

## Plan Implications

- Phase 10 should be split into at least two plans:
  1. **Contract + sync hydration hardening** (snapshot/event fields + derivation plumbing)
  2. **UI continuity + verification hardening** (location confirm gating, lifecycle copy/state, e2e coverage)
- A third verification-focused plan may be needed if Playwright continuity scenarios materially expand.
