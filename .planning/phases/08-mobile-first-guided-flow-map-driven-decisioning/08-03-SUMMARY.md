---
phase: 08-mobile-first-guided-flow-map-driven-decisioning
plan: 03
subsystem: ui
tags: [nextjs, react, maps, accessibility, playwright]
requires:
  - phase: 08-mobile-first-guided-flow-map-driven-decisioning
    provides: guided steps, sticky status rails, next-action orchestration
provides:
  - map-first spots panel with marker state semantics
  - two-way map/list selection synchronization
  - responsive + keyboard interaction regression checks
affects: [ranking-ui, shortlist-flow, accessibility]
tech-stack:
  added: []
  patterns: [map/list shared selectedVenueId state, marker state precedence, keyboard-selectable markers]
key-files:
  created: [src/components/ranking/RankedSpotsMap.tsx]
  modified: [src/components/ranking/RankedResultsList.tsx, src/app/s/[token]/page.tsx, src/lib/session-flow.ts, src/app/globals.css, tests/e2e/ranking-results.spec.ts]
key-decisions:
  - "Used one shared selectedVenueId state to keep list and marker highlights in sync bidirectionally."
  - "Provided map fallback copy when Google Maps key is missing so list-only flow remains usable."
patterns-established:
  - "Marker state precedence is confirmed > shortlisted > selected > default."
requirements-completed: [UX-23, UX-24, UX-26]
duration: 64min
completed: 2026-04-10
---

# Phase 8 Plan 03: Map-First Spots + Map/List Sync Summary

**Ranked decisioning now presents a map-first spots stage with synchronized list-marker selection and keyboard-usable marker controls across mobile and desktop projects.**

## Performance

- **Duration:** 64 min
- **Started:** 2026-04-10T12:18:00Z
- **Completed:** 2026-04-10T13:22:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Added `RankedSpotsMap` with marker state classes, keyboard activation, and missing-key fallback messaging.
- Wired `selectedVenueId` between page/map/list for deterministic two-way synchronization.
- Extended e2e coverage for list→map focus, marker keyboard selection, shortlist/confirm progression, and cross-project execution.

## Task Commits
1. **Task 1: Build map component with marker states + keyboard interactions** - `bd0ac03` (feat)
2. **Task 2: Wire map-first layout and map/list synchronization** - `10e8228` (feat), `a307fa6` (fix)
3. **Task 3: Add cross-project map/list sync regression coverage** - `2a63ded` (fix)

## Files Created/Modified
- `src/components/ranking/RankedSpotsMap.tsx` - marker UI with state classes and keyboard selection.
- `src/components/ranking/RankedResultsList.tsx` - selected row highlighting and map focus action.
- `src/app/s/[token]/page.tsx` - map-first spots layout and two-way selection callbacks.
- `src/lib/session-flow.ts` - corrected shortlist completion semantics.
- `src/app/globals.css` - marker styles and responsive map/list layout.
- `tests/e2e/ranking-results.spec.ts` - map/list synchronization and confirm progression assertions.

## Decisions Made
- Kept map integration non-blocking by preserving list-only behavior when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is unset.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unreachable shortlist confirmation flow**
- **Found during:** Plan verification (`npx playwright test ... --project="Pixel 5" --project="Desktop Safari"`)
- **Issue:** `shortlist` step was marked complete immediately after the first shortlist add, collapsing the confirm action panel before users could confirm.
- **Fix:** Updated `deriveSessionFlow` so shortlist is only marked complete when a confirmed place exists, then aligned e2e progression assertions with the reachable shortlist → confirm flow.
- **Files modified:** `src/lib/session-flow.ts`, `tests/e2e/ranking-results.spec.ts`
- **Verification:** `npx tsc --noEmit`; `npx playwright test tests/e2e/ranking-results.spec.ts --project="Pixel 5" --project="Desktop Safari"`
- **Committed in:** `2a63ded`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix was required for correctness of guided shortlist/confirmation progression.

## Issues Encountered
- Initial e2e expectation assumed shortlist panel activation timing that no longer matched reachable confirm behavior; corrected after validating step-completion semantics.

## User Setup Required
Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable provider-backed map rendering. Without it, list-only ranked flow remains functional.

## Next Phase Readiness
- Phase 8 map/list decisioning is now stable and verified on both Pixel 5 and Desktop Safari projects.

## Self-Check: PASSED
