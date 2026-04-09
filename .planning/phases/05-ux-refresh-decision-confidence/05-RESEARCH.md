# Phase 05 Research - UX Refresh & Decision Confidence

**Date:** 2026-04-09  
**Status:** Complete  
**Scope:** Implementation guidance for UXEX-01, UXEX-02

## Research Question

What is the fastest low-risk path to improve ranking explainability and speed up collaborative decisions without changing core ranking math or provider integrations?

## Recommended Technical Direction

### standard_stack
- **No new framework/dependency required:** keep current Next.js + TypeScript frontend and in-memory Node API architecture.
- **Explainability source of truth:** expose fairness components from existing ranking scoring output (already computes `fairnessScore`, `preferenceScore`, `totalScore`) through backend contracts and UI list/detail cards.
- **Reaction model:** add lightweight per-participant reaction state (`accept` / `pass`) at session repository layer and expose through session snapshot + route.
- **UX refresh scope:** update ranking, shortlist, and confirmation components for stronger hierarchy, clearer status, and actionable microcopy.
- **Validation:** extend existing Playwright funnel test with explainability/reaction checks and add focused API route/repository tests for new reaction contracts.

### architecture_patterns
1. **Server-authoritative decision state**
   - Persist reactions in `SessionRepository` and distribute through existing snapshot/sync channel.
   - Avoid client-only reaction state to prevent participant desync.

2. **Contract-first for explainability payloads**
   - Add new fields to ranking contracts first, then wire route, client API types, and UI rendering.
   - Keep old fields intact to minimize breakage in existing ranking consumers.

3. **Single source for UX status text**
   - Centralize reaction and shortlist state messaging in page-level state derivation to reduce contradictory UI messages.

4. **Telemetry for optimization loop**
   - Record new interaction milestones (`result_reacted`, `shortlist_opened`, `reaction_to_shortlist`) in funnel metadata or supplemental analytics endpoint while preserving required PLAT events.

## Contract Baseline for Planning

Add/extend contracts:
- `RankedVenue` (backend + client):
  - `fairnessScore: number`
  - `preferenceScore: number`
  - `totalScore: number`
  - `fairnessDeltaMinutes: number` (absolute ETA difference)
- `VenueReaction`:
  - `venueId: string`
  - `participantId: string`
  - `reaction: "accept" | "pass"`
  - `reactedAt: string`

Required API surface additions:
- `POST /v1/decision/reaction` -> upsert participant reaction for a ranked venue.
- Session snapshot includes per-venue aggregated reaction state (counts and current participant reaction).

## dont_hand_roll

- Do **not** replace fairness algorithm or weighting logic in Phase 5.
- Do **not** add a second places/routing provider.
- Do **not** introduce websocket/state infra beyond current SSE + polling fallback model.

## common_pitfalls

1. **Explainability overload**
   - Mitigation: show concise score chips in list; reserve detailed rationale for expanded card.

2. **Reaction race/desync**
   - Mitigation: repository upsert keyed by `(sessionId, participantId, venueId)` and broadcast snapshot diff.

3. **Telemetry blind spots after UX changes**
   - Mitigation: add explicit assertions for new interactions in API tests/e2e.

4. **Regression in confirmation flow**
   - Mitigation: preserve existing shortlist/confirm handlers and run full-funnel e2e with updated UI selectors.

## Testing Targets for This Phase

- API tests for ranking response shape with explainability fields.
- API tests for reaction route validation, idempotent upsert, and snapshot inclusion.
- Frontend component checks (or e2e assertions) for:
  - explainability card rendering,
  - accept/pass action feedback,
  - empty/loading/error microcopy.
- Playwright full-funnel regression updated for refreshed controls and reaction flow.

## Planning Implications

- Split into three execute plans:
  1. Add explainability contracts and ranking UX hierarchy refresh.
  2. Add accept/pass shared reactions with conflict-safe sync.
  3. Add UX validation pass and interaction telemetry assertions.

---

*Research complete for phase planning.*
