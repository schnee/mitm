# Phase 13: Map-First Persistent UX

## Goal

Replace dual-map layout with a single persistent map that transitions through session stages, creating an "enhanced Google Maps" feel.

## Current State

- Setup step: location map (left) + preferences panel (right) → separate card flow
- Spots step: ranked spots map + list side by side
- Two maps displayed throughout session

## Target State

- **Single persistent map** displayed throughout entire session
- Setup: user pin on map + overlay panel with slider/tags
- Transition: fade out prefs, zoom to cover spots, remove user pin
- Spots: map with ranked markers + list below (current design retained)
- Map acts as the "hero" - always visible, transitions between stages

## Key Design Decisions

1. **Map transitions with stage** - zoom to cover spots, markers appear/remove
2. **Keep list + markers** - both remain (current design)  
3. **Desktop: map + overlay panels** - replace location/prefs cards
4. **Mobile: map on top, content below** - similar to current
5. **Fade transitions** - CSS fade for panel switch, map zooms to bounds
6. **Remove NextActionRail** - progress shown in map markers

## Changes Required

- New PersistentMap component (handles all stages)
- Overlay panels for each stage
- Update session-flow for map-first detection
- CSS animations for transitions
- Cleanup unused components

## Files to Create

- `src/components/map/PersistentMap.tsx` - main map component
- `src/components/overlays/SetupOverlay.tsx` - slider + tags panel
- `src/components/overlays/SpotsOverlay.tsx` - ranked list panel
- `src/components/overlays/ShortlistOverlay.tsx` - shortlist panel
- Phase plans in `.planning/phases/13-map-first-persistent-ux/`

## Dependencies

- Phase 12 (unified setup) - must complete first