# Phase 04 Research - Launch Readiness & Stabilization

**Date:** 2026-04-09  
**Status:** Complete  
**Scope:** Implementation guidance for PLAT-01, PLAT-02

## Research Question

What is the fastest implementation path to prove end-to-end flow reliability across modern mobile/desktop browsers and capture required funnel telemetry without introducing new infrastructure complexity?

## Recommended Technical Direction

### standard_stack
- **Testing baseline:** Extend existing Playwright suite in `tests/e2e` and run the same funnel spec across multiple Playwright projects (`Desktop Chrome`, `Desktop Safari`, `Pixel 5`, `iPhone 12`).
- **Telemetry storage:** Add a lightweight in-memory funnel event store inside `SessionRepository` to match current in-memory session architecture.
- **Telemetry emission points:** Emit events from existing server-authoritative paths:
  - `session_start` on successful `createSession`
  - `inputs_set` when second participant location confirmation makes `inputsReady=true`
  - `results_returned` when ranking endpoint returns 200
  - `decision_confirmed` when confirmation endpoint returns 200
- **Operational visibility:** Add a read endpoint for funnel events and completeness per session so staged verification can assert event quality.

### architecture_patterns
1. **Server-side funnel truth (not client analytics calls)**
   - Record funnel events in backend handlers/repository transitions to avoid browser/network loss.
   - Keep event payload minimal and deterministic: `event`, `sessionId`, `timestamp`, optional `metadata`.

2. **Idempotent event emission for milestone events**
   - `inputs_set` and `decision_confirmed` should be emitted once per session even if endpoints are retried.
   - Use repository-level guard (`already recorded`) to prevent duplicate funnel counts.

3. **Cross-browser reliability from one canonical funnel spec**
   - Build one full-flow Playwright test that uses existing API route stubbing and runs under desktop + mobile projects.
   - Keep assertions centered on core funnel milestones to detect platform blockers quickly.

4. **Sync resilience fallback for browser variance**
   - Add fallback polling path in `useSessionSync` when `EventSource` is unavailable or repeatedly fails.
   - Preserve same merged snapshot semantics so UI behavior remains identical.

## Contract Baseline for Planning

Add/extend contracts:
- `FunnelEventName = "session_start" | "inputs_set" | "results_returned" | "decision_confirmed"`
- `FunnelEventRecord`:
  - `sessionId: string`
  - `event: FunnelEventName`
  - `occurredAt: string`
  - `metadata?: Record<string, string | number | boolean | null>`

Required API surface:
- `GET /v1/analytics/funnel/:sessionId` -> returns ordered funnel events + completeness map for the four required events.

## Context7 Verification Notes

- Verified Playwright multi-project configuration using Context7 (`/microsoft/playwright.dev`):
  - `projects` array with desktop + mobile device presets via `devices`.
  - Supported presets include `Desktop Chrome`, `Desktop Safari`, `Pixel 5`, `iPhone 12`.

## dont_hand_roll

- Do **not** add external analytics SDKs for v1 (no Segment/GA SDK dependency).
- Do **not** make client UI the source of truth for funnel metrics.
- Do **not** create browser-specific test logic when one shared funnel spec can run per project.

## common_pitfalls

1. **Duplicate funnel events from retries/reloads**
   - Mitigation: repository-level dedupe by `(sessionId, event)` for milestone events.

2. **False confidence from desktop-only testing**
   - Mitigation: require mobile emulation projects in Playwright config and run same full-flow spec.

3. **SSE instability masking flow correctness**
   - Mitigation: add fallback polling in sync hook and verify snapshot updates still progress.

4. **Telemetry not queryable for verification**
   - Mitigation: add explicit analytics read endpoint used by tests and staged checks.

## Testing Targets for This Phase

- API tests for funnel event recording and dedupe behavior.
- API route tests for analytics read endpoint and response shape.
- Playwright cross-project funnel test that verifies create/join -> inputs -> ranking -> confirm flow completes.
- Automated command for launch-readiness pass that includes TypeScript, vitest API tests, and Playwright funnel spec.

## Planning Implications

- Split into three execute plans:
  1. Add backend funnel telemetry contracts, repository recording, and route wiring for analytics visibility.
  2. Improve session sync resilience for browser variance (SSE fallback polling) with targeted tests.
  3. Add cross-browser Playwright matrix and full-funnel regression verification harness.

---

*Research complete for phase planning.*
