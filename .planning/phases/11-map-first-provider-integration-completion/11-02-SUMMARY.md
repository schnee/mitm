---
phase: 11-map-first-provider-integration-completion
plan: "02"
subsystem: map-list-synchronization
tags: [map-list-sync, bidirectional-sync, selection-persistence]
dependency_graph:
  requires: [11-01]
  provides: [map-list-sync, selection-persistence]
  affects: [ranking-results-list, ranked-spots-map, session-page]
tech_stack:
  added: []
  patterns:
    - "Marker click triggers list smooth-scroll to card"
    - "Focus on map button pans map to venue"
    - "selectedVenueId state preserved across mutations"
key_files:
  created: []
  modified:
    - "src/app/s/[token]/page.tsx"
    - "src/components/ranking/RankedResultsList.tsx"
    - "src/components/ranking/RankedSpotsMap.tsx"
    - "src/app/globals.css"
decisions:
  - "Use useRef Map for dynamic list item refs (instead of single ref)"
  - "selectedVenueId setter passed to both onMarkerSelect and onVenueFocus"
  - "Ranking refresh validates selectedVenueId still exists in results"
metrics:
  duration: "2026-04-10T19:55:00Z to 2026-04-10T20:05:00Z"
  completed_date: "2026-04-10"
  task_count: 3
  file_count: 4
---

# Phase 11 Plan 02: Map/List Synchronization

## Summary

Implemented two-way map/list synchronization: marker click selects corresponding list card with smooth scroll; list "Focus on map" action pans map to marker while preserving zoom. Selected venue state persists across shortlist/confirm changes and ranking refresh.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Implement marker click to list highlight with smooth scroll | 9764322 | RankedResultsList.tsx, page.tsx, globals.css |
| 2 | Implement list focus action to pan map to marker | 9764322 | RankedSpotsMap.tsx, page.tsx |
| 3 | Preserve selected venue across state changes and ranking refresh | 9764322 | page.tsx |

## Verification

- `npx tsc --noEmit` passes with no errors
- Marker click triggers onMarkerSelect with venue ID (D-06)
- Selected list card has .result-card-selected class (D-06)
- List auto-scrolls to selected card with smooth animation (D-06)
- List cards contain "Focus on map" action button (D-07)
- Clicking triggers map pan animation (D-07)
- Map zoom level is preserved during pan (D-07)
- Selected venue state survives shortlist/confirm mutations (D-08)
- Selected venue state survives ranking refresh if present (D-08)
- Selection clears appropriately if venue no longer exists (D-09)

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

*Plan: 11-02*
*Completed: 2026-04-10*