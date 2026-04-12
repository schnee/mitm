# Phase 12: Unified Setup Flow

## Goal

Combine location capture and meetup preferences into a single "setup" step, reducing friction.

## Current Behavior

1. **Location Step**: User captures location → confirms → advances to preferences
2. **Preferences Step**: User sets travel preference + tags → advances to ranking
3. Two separate API calls, two UI steps

## Proposed Behavior

1. **Unified Setup Step** (single card):
   - Interactive map centered on user location
   - User can tap/drag to set starting point
   - Travel preference selector (70/30, 60/40, 50/50, etc.)
   - Venue type tags (coffee, lunch, dinner, cocktails, dessert, museum, etc.)
   - Single "Continue" button → calls both existing APIs in sequence

2. **State Machine**: No backend change needed - endpoints already handle both
   - Existing: `location/draft` handles location + confirms in one call
   - Existing: `ranking/inputs` handles split + tags

3. **Sync Behavior**: Both participants must complete setup before ranking results appear

## Implementation Scope

### UI Components
- Create unified `SetupCard.tsx`
- Merge from existing `LocationConfirmCard` + `RankingInputsForm`
- Single submit calls `upsertLocationDraft()` then `upsertRankingInputs()`

### Session Flow
- Remove separate preference step
- Update `src/lib/session-flow.ts` to skip preference step

### Tests
- Update E2E funnel tests to use unified setup
- Update any tests checking for separate preference step