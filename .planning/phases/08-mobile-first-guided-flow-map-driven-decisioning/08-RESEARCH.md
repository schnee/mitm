# Phase 8 Research — Mobile-First Guided Flow & Map-Driven Decisioning

## Research Goal
Identify the lowest-risk implementation approach for guided step orchestration, two-person status clarity, and synchronized map/list decisioning while preserving Phase 7 shared-ranking contracts.

## Inputs Reviewed
- `.planning/ROADMAP.md` (Phase 8 scope, risks, success criteria)
- `.planning/REQUIREMENTS.md` (UX-19..UX-26)
- `.planning/phases/07-shared-auto-ranking-synced-results/*-SUMMARY.md` (existing session ranking lifecycle + sync behavior)
- Current UI files:
  - `src/app/s/[token]/page.tsx`
  - `src/components/session/ParticipantStatus.tsx`
  - `src/components/ranking/RankingInputsForm.tsx`
  - `src/components/ranking/RankedResultsList.tsx`
  - `src/hooks/useSessionSync.ts`
  - `src/lib/api/session-client.ts`

## Findings

### 1) Existing contracts already support most orchestration
Phase 7 established all critical shared-state primitives for this phase:
- `rankingInputsReady`
- `rankingLifecycle`
- `rankedResults`
- synchronized `shortlist` + `confirmedPlace`

Implication: Phase 8 can stay UI-first and avoid backend contract expansion.

### 2) Current page is linear and scroll-heavy on mobile
`src/app/s/[token]/page.tsx` renders stages in a single vertical stack. This makes readiness state clear but causes long mobile scroll travel and weak “what next” guidance.

Implication: introduce local derived step state (active/completed/locked) and collapse completed sections into summaries.

### 3) Map-first can be delivered without provider/backend changes
Ranked venues already include `lat/lng`, shortlist and confirmed state already sync via snapshot/events.

Implication: build a map panel that consumes existing `RankedVenue[]`, `ShortlistVenue[]`, and `ConfirmedPlace` and synchronizes with list selection state. No provider adapter changes needed.

### 4) Highest regression risk is state divergence between map/list/stepper
If step state, marker state, and list state are computed in separate places, UI can drift under live updates.

Implication: add one shared UI-derivation utility for:
- current actionable step
- blocker ownership messaging
- marker/list visual state

## Recommended Implementation Pattern

### Pattern A — Interface-first UI orchestration (recommended)
1. Create a shared `session-flow` UI contract utility (step ids, completion checks, blocker logic, CTA derivation).
2. Add stepper + collapsed summary rows in `page.tsx` driven by contract utility.
3. Add sticky status/CTA components (mobile-first) using same derived flow state.
4. Add map/list synchronization component using existing ranked data contracts.

Why: minimizes scattered conditional logic and improves testability for UX-19..UX-26.

## Concrete Requirements Mapping
- UX-19/20 → guided stepper + collapse behavior.
- UX-21/25 → sticky two-person status + concise state copy.
- UX-22 → sticky next-action CTA rail for current user.
- UX-23/24 → map-first ranked spots + marker/list and shortlist/confirmed marker styling.
- UX-26 → responsive + accessibility checks and e2e safeguards.

## Do / Don’t

### Do
- Reuse `useSessionSync` snapshot as source of truth.
- Keep ranking generation, shortlist, confirm API calls untouched.
- Centralize flow-state derivation in one utility module.
- Validate with focused e2e on mobile projects.

### Don’t
- Don’t alter fairness ranking formulas or provider integrations.
- Don’t expand beyond two participants.
- Don’t duplicate lifecycle logic across multiple components.

## Verification Strategy
- Type safety pass: `npx tsc --noEmit`
- Existing regression suite slices:
  - `npx vitest run services/api/tests/ranking-inputs.test.ts services/api/tests/ranking-results.test.ts`
  - `npx playwright test tests/e2e/ranking-results.spec.ts --project="Pixel 5"`
- New/updated e2e should cover:
  - single-active-step progression
  - partner-blocked status messaging
  - map/list synchronized highlight
  - shortlist + confirmed marker state parity

## Research Conclusion
Phase 8 is a **Level 0–1 implementation** on top of existing contracts: no new backend APIs required, no provider change required, and no new domain modeling required. Focus should be deterministic UI state derivation and mobile-first interaction wiring.
