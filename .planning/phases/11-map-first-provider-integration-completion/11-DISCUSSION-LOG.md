# Phase 11: map-first-provider-integration-completion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 11-map-first-provider-integration-completion
**Areas discussed:** Provider map integration, Marker/list interaction rules, Marker-state visual parity, Accessibility and keyboard parity, Failure/degraded behavior

---

## Provider map integration

| Option | Description | Selected |
|--------|-------------|----------|
| `@vis.gl/react-google-maps` | Keep component contract and use stack-aligned React wrapper for provider map rendering. | ✓ |
| Raw Google Maps JS loader | Implement direct loader/integration without wrapper. | |
| You decide | Leave library decision to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-fit all ranked venues | Fit viewport to ranked results when data loads. | ✓ |
| Top-ranked fixed zoom | Center/zoom on top result only. | |
| Remember pan/zoom after first render | Persist user viewport model earlier. | |
| You decide | Leave viewport behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Simple custom markers only | No clustering/advanced overlays in this phase. | ✓ |
| Marker clustering | Cluster dense markers. | |
| Advanced overlays | Rich HTML marker overlays. | |
| You decide | Leave marker strategy to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| List-only fallback warning | Non-blocking fallback when key missing/invalid. | ✓ |
| Hard blocking error | Stop Spots step until map key resolves. | |
| Retry loader then fallback | Add retry-first path before fallback. | |
| You decide | Leave failure behavior to implementation agent. | |

**User's choice:** Keep `RankedSpotsMap` contract, use `@vis.gl/react-google-maps`, auto-fit ranked bounds, simple markers, and non-blocking list-only fallback.
**Notes:** User confirmed JavaScript Maps API is already enabled in Google Cloud.

---

## Marker/list interaction rules

| Option | Description | Selected |
|--------|-------------|----------|
| Marker click highlights + smooth-scrolls list card | Keep map/list in visible sync. | ✓ |
| Highlight only | No scroll movement. | |
| Highlight only if offscreen | Conditional scroll behavior. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Focus on map pans to marker, keeps zoom | Preserve user zoom context. | ✓ |
| Focus on map pans and zooms in | Auto-zoom one level. | |
| Focus on map selects only | No pan motion. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve selection if venue still exists, else clear | Stable but safe behavior after shortlist/confirm changes. | ✓ |
| Reset to top-ranked | Force deterministic reset. | |
| Always clear on mutation | Aggressive reset model. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve selection if still present, else first ranked | Stable selection across refresh. | ✓ |
| Always first ranked | Deterministic reset each refresh. | |
| Always none | Require fresh explicit selection. | |
| You decide | Leave behavior to implementation agent. | |

**User's choice:** `1A,2A,3A,4A`
**Notes:** Selection persistence is preferred over aggressive reset in both mutation and refresh paths.

---

## Marker-state visual parity

| Option | Description | Selected |
|--------|-------------|----------|
| Confirmed terminal dominant | Confirmed styling overrides other marker states. | ✓ |
| Confirmed + selected layered | Dual state visualization. | |
| Confirmed + shortlisted layered | Dual state visualization. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Shortlisted color priority + selected ring | Keeps shortlist semantics while preserving selection cue. | ✓ |
| Shortlisted fully overrides selected | No selected cue on shortlisted marker. | |
| Selected overrides shortlisted | Selection supersedes shortlist semantics. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit selected/shortlisted/confirmed list badges | Map/list state parity in cards. | ✓ |
| Selected highlight only | Minimal list-side indicators. | |
| Confirmed-only badges | Limited parity. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| One-time pan to confirmed marker | Confirm emphasis without locking viewport. | ✓ |
| Always centered confirmed marker | Force map lock to confirmation. | |
| No auto-pan on confirm | No confirmation viewport guidance. | |
| You decide | Leave behavior to implementation agent. | |

**User's choice:** `1A,2A,3A,4A`
**Notes:** Confirmed state must remain explicit and unambiguous in both marker and list representations.

---

## Accessibility and keyboard parity

| Option | Description | Selected |
|--------|-------------|----------|
| Roving marker focus + Enter/Space select | Arrow-key traversal across markers with activation keys. | ✓ |
| Tab-only marker traversal | Standard tab sequence only. | |
| List-only keyboard model | Markers not keyboard-focusable. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Polite live announcements for state changes | SR feedback for selected/shortlisted/confirmed transitions. | ✓ |
| Confirm-only announcements | Minimal announcement scope. | |
| No live region | Focus-label-only model. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Minimum 44x44 tap targets | Baseline mobile accessibility target. | ✓ |
| Minimum 48x48 tap targets | Larger baseline target. | |
| Keep current sizes | No explicit minimum. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Strict map/list action parity | Every map action has list equivalent. | ✓ |
| Partial parity | Parity for shortlist/confirm only. | |
| Map-first only | Limited list fallback. | |
| You decide | Leave behavior to implementation agent. | |

**User's choice:** `1A,2A,3A,4A`
**Notes:** Accessibility parity is required for core actions, not optional enhancement.

---

## Failure/degraded behavior

| Option | Description | Selected |
|--------|-------------|----------|
| 5s timeout + fallback + retry control | Fast degraded-mode handoff with explicit recovery action. | ✓ |
| 10s timeout + fallback | Slower handoff, no retry control. | |
| No timeout | Wait indefinitely for map load. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Keep list interactive + warning + disable broken map interactions | Preserve forward progress while surfacing map error. | ✓ |
| Full-page error | Block progress on map errors. | |
| Silent map failure | Degrade without user notice. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Emit load_failed/fallback_shown/retry_clicked/recovered | Full degraded-state telemetry set. | ✓ |
| Emit load_failed only | Minimal telemetry. | |
| No new telemetry | No degraded-state instrumentation. | |
| You decide | Leave behavior to implementation agent. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Provider map required in normal path | Fallback is contingency only. | ✓ |
| Fallback and provider are equal complete states | Both accepted as default completion. | |
| Provider map optional | Not required in this phase. | |
| You decide | Leave behavior to implementation agent. | |

**User's choice:** `1A,2A,3A,4A`
**Notes:** Phase completion explicitly depends on provider-backed map path shipping as default.

---

## the agent's Discretion

- Marker visual polish details within locked state hierarchy.
- Internal loader/retry implementation details.

## Deferred Ideas

None.
