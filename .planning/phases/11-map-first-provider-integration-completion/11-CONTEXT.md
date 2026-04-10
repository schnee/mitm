# Phase 11: map-first-provider-integration-completion - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a true provider-backed map-first ranked spots experience in the Spots step, replacing the fallback marker-grid UI while preserving synchronized map/list behavior, shortlist and confirmed marker-state parity, and accessibility parity for core interactions.

</domain>

<decisions>
## Implementation Decisions

### Provider map integration
- **D-01:** Keep `RankedSpotsMap` component contract unchanged and replace internals with provider-backed map rendering.
- **D-02:** Use `@vis.gl/react-google-maps` as the client map library.
- **D-03:** On ranked-results load, auto-fit map bounds to all ranked venues.
- **D-04:** Use simple custom markers only for this phase (no clustering, no advanced overlay system).
- **D-05:** If browser map key is missing/invalid, keep list-only flow non-blocking with explicit warning UI.

### Marker and list synchronization behavior
- **D-06:** Marker click highlights matching list card and smooth-scrolls to that card.
- **D-07:** List "Focus on map" action selects marker and pans map to marker while preserving current zoom.
- **D-08:** Preserve selected venue across shortlist/confirm changes when the venue still exists; clear selection if it no longer exists.
- **D-09:** Preserve selected venue across ranking refresh/new result sets when still present; otherwise select first ranked venue.

### Marker-state parity and confirmation behavior
- **D-10:** Confirmed marker state is terminal and visually dominant; do not layer selected/shortlisted visuals on top.
- **D-11:** Before confirmation, shortlisted state has color priority while selected state is shown via ring accent.
- **D-12:** Ranked list cards must mirror marker states with explicit selected/shortlisted/confirmed badges.
- **D-13:** On successful confirmation, perform one-time pan to confirmed marker, then leave viewport under user control.

### Accessibility and interaction parity
- **D-14:** Implement roving keyboard focus across markers using arrow keys, with Enter/Space to select.
- **D-15:** Announce key selection/state changes via polite live-region messaging.
- **D-16:** Enforce minimum 44x44 tap targets for markers and key map/list controls.
- **D-17:** Ensure strict parity so every core map action has an equivalent list action.

### Failure handling and telemetry
- **D-18:** Apply 5-second map load timeout, then switch to list-only fallback and show retry control.
- **D-19:** For runtime map errors after initial load, keep list interactive, show persistent warning, and disable broken map interactions.
- **D-20:** Emit telemetry events for degraded and recovery states: `map_load_failed`, `map_fallback_shown`, `map_retry_clicked`, `map_recovered`.
- **D-21:** Phase 11 completion requires provider-backed map as the normal/default path; fallback is contingency only.

### the agent's Discretion
- Exact marker icon visual style details as long as state hierarchy and accessibility decisions above remain intact.
- Internal implementation details for map script loading and cleanup.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirement contracts
- `.planning/ROADMAP.md` — Phase 11 boundary, dependency, and gap-closure objective for provider-backed map completion.
- `.planning/REQUIREMENTS.md` — UX-23, UX-24, UX-26 requirements and phase-level acceptance expectations.
- `.planning/PROJECT.md` — fixed constraints: two-participant scope and single-provider integration strategy.

### Existing map-first implementation intent
- `.planning/phases/08-mobile-first-guided-flow-map-driven-decisioning/08-03-PLAN.md` — prior intended map-first implementation contract and marker-state requirements.
- `.planning/phases/08-mobile-first-guided-flow-map-driven-decisioning/08-03-SUMMARY.md` — delivered fallback behavior and known remaining provider-backed gap.

### Deployment and key management context
- `docs/deployment/production-cloud-run-cloudflare.md` — environment key provisioning flow relevant to browser map key behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ranking/RankedSpotsMap.tsx`: Existing marker-state logic and props contract to preserve while swapping internals.
- `src/components/ranking/RankedResultsList.tsx`: Existing list-side selection/focus entry points (`selectedVenueId`, `onVenueFocus`) for bidirectional sync.
- `src/app/s/[token]/page.tsx`: Existing `selectedVenueId` state and Spots-step map-first layout wiring.

### Established Patterns
- `src/app/s/[token]/page.tsx`: Session UI already uses optimistic local state merged with canonical sync snapshot; map behavior should follow this pattern.
- `src/app/globals.css`: Existing state class names (`marker-default`, `marker-selected`, `marker-shortlisted`, `marker-confirmed`, `result-card-selected`) should remain semantic anchors.
- `src/lib/session-flow.ts`: Spots-step summary already encodes "map + list synced" expectation.

### Integration Points
- Spots-step render path in `src/app/s/[token]/page.tsx` is the single integration surface for map/list synchronization behavior.
- Selection and decision state from shortlist/confirmed data in snapshot merge logic should drive marker/list state parity.
- Existing ranking/decision APIs in `src/lib/api/session-client.ts` remain unchanged; this phase is presentation/integration completion.

</code_context>

<specifics>
## Specific Ideas

- Keep the current `RankedSpotsMap` external component shape stable and only replace internals.
- Google Cloud JavaScript Maps API is enabled and should be treated as available for provider-backed map implementation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-map-first-provider-integration-completion*
*Context gathered: 2026-04-10*
