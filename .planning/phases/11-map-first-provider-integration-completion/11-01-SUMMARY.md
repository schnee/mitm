---
phase: 11-map-first-provider-integration-completion
plan: "01"
subsystem: map-first-provider-integration
tags: [google-maps, ranking, provider-backed, map-integration]
dependency_graph:
  requires: []
  provides: [provider-backed-map, map-timeout-fallback]
  affects: [ranking-results-list, spots-step]
tech_stack:
  added:
    - "@vis.gl/react-google-maps@1.8.2"
  patterns:
    - "Google Maps APIProvider + Map component"
    - "Auto-fit bounds on results load"
    - "5-second load timeout with retry"
key_files:
  created: []
  modified:
    - "src/components/ranking/RankedSpotsMap.tsx"
    - "src/app/globals.css"
    - "package.json"
    - "package-lock.json"
decisions:
  - "Use @vis.gl/react-google-maps for Google Maps integration"
  - "Keep existing component props contract (results, shortlistVenueIds, confirmedVenueId, selectedVenueId, onMarkerSelect)"
  - "Auto-fit bounds by calculating min/max lat/lng from results"
  - "5-second timeout triggers fallback with retry button"
metrics:
  duration: "2026-04-10T19:51:18Z to 2026-04-10T19:55:00Z"
  completed_date: "2026-04-10"
  task_count: 3
  file_count: 4
---

# Phase 11 Plan 01: Provider-Backed Map Integration

## Summary

Installed @vis.gl/react-google-maps and replaced fallback button-grid UI with provider-backed Google Maps rendering. The component now renders Google Maps when API key is present, with auto-fit bounds to all ranked venues on load, and 5-second timeout fallback when map fails to load.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install @vis.gl/react-google-maps and create provider-backed map component | a2a4964 | RankedSpotsMap.tsx, package.json, globals.css |
| 2 | Implement simple custom markers with state styling and auto-fit bounds | a2a4964 | RankedSpotsMap.tsx, globals.css |
| 3 | Add CSS for provider map container and marker state visual treatment | a2a4964 | globals.css |

## Verification

- `npx tsc --noEmit` passes with no errors
- Component props contract unchanged (D-01)
- Uses @vis.gl/react-google-maps (D-02)
- Auto-fit bounds implemented (D-03)
- Simple custom markers (D-04)
- Missing key shows warning with list-only fallback (D-05)
- 5-second timeout implemented (D-18)

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

*Plan: 11-01*
*Completed: 2026-04-10*