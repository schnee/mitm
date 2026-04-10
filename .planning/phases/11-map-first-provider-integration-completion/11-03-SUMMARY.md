---
phase: 11-map-first-provider-integration-completion
plan: "03"
subsystem: marker-state-parity-accessibility
tags: [marker-hierarchy, accessibility, telemetry, state-parity]
dependency_graph:
  requires: [11-02]
  provides: [marker-state-hierarchy, accessibility-features, map-telemetry]
  affects: [ranking-results-list, ranked-spots-map, client-telemetry]
tech_stack:
  added:
    - "src/lib/client-telemetry.ts"
  patterns:
    - "Marker state precedence: confirmed > shortlisted > selected > default"
    - "Live-region announcements (sr-only class)"
    - "44x44 min touch targets"
    - "Telemetry events for map load/fallback/retry/recovered"
key_files:
  created:
    - "src/lib/client-telemetry.ts"
  modified:
    - "src/app/s/[token]/page.tsx"
    - "src/components/ranking/RankedResultsList.tsx"
    - "src/components/ranking/RankedSpotsMap.tsx"
    - "src/app/globals.css"
decisions:
  - "Confirmed state is terminal - no shortlisted/selected visuals layered on top"
  - "Use console.log for dev telemetry (production would use analytics endpoint)"
  - "Add confirmedVenueId prop to RankedResultsList for confirmed badge display"
  - "Add sr-only CSS class for screen reader live regions"
metrics:
  duration: "2026-04-10T20:10:00Z to 2026-04-10T20:20:00Z"
  completed_date: "2026-04-10"
  task_count: 4
  file_count: 5
---

# Phase 11 Plan 03: Marker State Parity, Accessibility, and Telemetry

## Summary

Implemented marker state hierarchy with confirmed as terminal/dominant state, shortlisted having color priority, and selected showing ring accent. Added accessibility features including 44x44 minimum tap targets and sr-only class for live-region announcements. Added map load timeout and runtime error handling with telemetry events for degradation/recovery states.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Implement marker state hierarchy | dac9c0d | RankedSpotsMap.tsx, globals.css |
| 2 | Mirror marker states to list cards with badges | dac9c0d | RankedResultsList.tsx, page.tsx, globals.css |
| 3 | Implement accessibility | dac9c0d | globals.css |
| 4 | Implement map load timeout and runtime error handling | dac9c0d | RankedSpotsMap.tsx, client-telemetry.ts |

## Verification

- `npx tsc --noEmit` passes with no errors
- Confirmed marker ignores shortlisted/selected states (D-10)
- Shortlisted marker displays before selected marker (D-11)
- Selected marker shows ring/accent styling (D-11)
- List cards show matching state badges (D-12)
- Badge colors match map marker colors (D-12)
- Touch targets meet 44x44 minimum (D-16)
- Timeout fallback shows retry button (D-18)
- Runtime errors show warning but keep list working (D-19)
- Telemetry emits four events correctly (D-20)

## Deviation: None - plan executed exactly as written.

## Auth Gates

None - no authentication required for this task.

## Known Stubs

None - all required functionality implemented.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| none | - | No new security surface introduced |

---

*Plan: 11-03*
*Completed: 2026-04-10*