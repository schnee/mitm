# Phase 07 Research - Shared Auto-Ranking & Synced Results

**Date:** 2026-04-09  
**Status:** Complete  
**Scope:** Implementation guidance for UX-11 through UX-18

## Research Question

What is the fastest low-risk path to replace manual per-user ranking runs with one automatic, session-level ranked list that stays synchronized for both participants and remains retry-safe under concurrent saves and transient provider failures?

## Recommended Technical Direction

### standard_stack
- **No new infrastructure required:** keep existing Next.js + TypeScript frontend, Node API routes, in-memory repository patterns, and current SSE/polling sync model.
- **Server-authoritative orchestration:** trigger ranking generation from ranking-input save completion checks on the API side, not from a client-only `Run ranking` button.
- **Session-level canonical results:** persist generated ranking results and generation metadata in `SessionRepository` so both clients hydrate and converge on identical order/items.
- **UI state derived from shared session data:** expose waiting/generating/error/ready state via session snapshot + events so either participant can reload and recover state without rerunning actions.
- **Optional recompute action:** keep a `Refresh ranking` action that calls the same session-level generation path with explicit retry intent, instead of introducing a second codepath.

### architecture_patterns
1. **One orchestration path for auto-generate and refresh**
   - Reuse a single service entrypoint for generation; add mode metadata (`auto` vs `refresh`) only for telemetry/copy.
   - Avoid split implementations that can diverge in ordering, persistence, or error handling.

2. **Idempotent concurrent-save guardrails**
   - Introduce session-scoped generation coordination (for example `generationState: idle|waiting|running|failed|ready`, `generationRequestId`, `generationStartedAt`).
   - If both participants save near-simultaneously, allow only one active generation and have followers observe in-progress/ready state.

3. **Snapshot-first shared results contract**
   - Add `rankedResults` and `rankingLifecycle` fields to snapshot payloads so session hydration is sufficient even if events were missed.
   - Continue broadcasting incremental `session_updated` diffs for responsive UX, with full snapshot as recovery source.

4. **Retry without data loss**
   - On generation failure, keep saved location/ranking inputs untouched and return actionable error state (`failed` + message + retryable flag).
   - Ensure retry reuses existing saved inputs unless participants explicitly edit and resave.

## Contract Baseline for Planning

Add/extend contracts:
- `SessionSnapshot` (API + client):
  - `rankedResults: RankedVenue[]`
  - `rankingLifecycle: { state: "waiting" | "generating" | "ready" | "failed"; generatedAt?: string; lastErrorCode?: string | null; generationRequestId?: string | null }`
  - `rankingInputsReady: boolean` (both participants have saved ranking inputs)
- `SessionEvent.diff` additions:
  - `rankingLifecycle`
  - `rankedResults`
  - `rankingInputsReady`

Service/repository surface additions:
- `SessionRepository.upsertSessionRankedResults(sessionId, results, metadata)`
- `SessionRepository.setRankingLifecycle(sessionId, lifecyclePatch)`
- `RankingService.generateSessionRankedResults(sessionId, mode)` where `mode` is `auto` or `refresh`

Route behavior changes:
- `POST /v1/ranking/inputs`:
  - After successful save, evaluate readiness and trigger/queue automatic generation when both sides are ready.
  - Return lightweight lifecycle hint for immediate UI feedback.
- `POST /v1/ranking/results`:
  - Reposition as optional refresh/retry trigger and/or canonical results fetch endpoint.
  - Must return persisted session-level results, not participant-local recomputation assumptions.

## dont_hand_roll

- Do **not** modify fairness scoring math, split interpretation, or preference merge strategy.
- Do **not** introduce new places/routing providers or change provider adapter contracts in this phase.
- Do **not** expand beyond two-participant session assumptions.

## common_pitfalls

1. **Duplicate generation from concurrent saves**
   - Mitigation: session-scoped in-progress lock/request id with idempotent early return when generation already running.

2. **Clients show stale/manual-only ranking state after reload**
   - Mitigation: persist canonical ranked results in session snapshot and render from snapshot before local optimistic state.

3. **Failure copy blocks user progress or implies data loss**
   - Mitigation: explicit retry messaging that confirms ranking inputs/location remain saved and actionable.

4. **Telemetry cannot distinguish auto success vs manual rescue**
   - Mitigation: add lifecycle events for `ranking_auto_started`, `ranking_auto_succeeded`, `ranking_failed`, `ranking_refresh_requested`.

## Testing Targets for This Phase

- API tests for ranking-input save orchestration:
  - one participant saved -> waiting state,
  - second participant saved -> auto-generation triggered once,
  - concurrent saves -> single canonical result set.
- API tests for lifecycle persistence and recovery:
  - snapshot includes lifecycle + ranked results,
  - failed generation preserves prior inputs,
  - refresh path recomputes and replaces session-level results.
- Frontend/e2e checks for:
  - waiting and generating states without required `Run ranking`,
  - both participants seeing same ordered list,
  - retry UX after simulated provider failure,
  - responsive rendering parity for shared results state.

## Planning Implications

- Keep roadmap split into three execution plans:
  1. Save-state orchestration with waiting/generating transitions and UI contract updates.
  2. Canonical session-level result persistence, idempotent generation control, and refresh/retry behavior.
  3. Lifecycle telemetry + responsive shared-results validation and end-to-end hardening.

---

*Research complete for phase planning.*
