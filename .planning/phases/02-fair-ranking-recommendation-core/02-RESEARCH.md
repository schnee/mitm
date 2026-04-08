# Phase 02 Research - Fair Ranking & Recommendation Core

**Date:** 2026-04-08  
**Status:** Complete  
**Scope:** Implementation guidance for FAIR-01, PREF-01, PREF-02, RANK-01, RANK-02, RANK-03

## Research Question

What implementation approach will deliver fast, explainable two-party ranking that combines willingness split, preference tags, and provider-backed travel-time data while staying aligned with the existing Cloud Run + Firestore architecture?

## Recommended Technical Direction

### standard_stack
- **Backend execution:** Extend current `services/api` Node/TypeScript service (Cloud Run-ready) rather than adding a separate ranking service in Phase 2.
- **Provider integration:** Use a single Google Maps adapter boundary (`@googlemaps/google-maps-services-js`) for candidate retrieval + travel durations.
- **Validation:** Keep zod at all route boundaries for split/tag/ranking payloads.
- **Persistence:** Keep session-scoped ranking inputs/results in the existing session repository model (ephemeral, session-first).

### architecture_patterns
1. **Input contracts before ranking logic**
   - Persist willingness split (`50_50`, `60_40`, `70_30`) and preference tags on session state first.
   - Block ranking endpoint until both participants have confirmed location and ranking inputs exist.

2. **Provider adapter boundary (no direct SDK calls in routes)**
   - Routes call ranking service; ranking service calls adapter interface.
   - Adapter returns normalized DTOs (`CandidateVenue`, `TravelMatrix`) so scoring logic is provider-agnostic.

3. **Deterministic fairness scoring**
   - Compute per-candidate score from:
     - participant ETA burden (A and B)
     - configured willingness split target
     - preference tag overlap
   - Sort deterministically: `totalScore DESC`, tie-break by lower max ETA, then stable candidate id.

4. **Metadata-first result payload**
   - Every ranked item should carry required decision metadata (`etaParticipantA`, `etaParticipantB`, `category`, `openNow`).
   - Avoid deferred “details lookup” for top-ranked list in Phase 2; include enough info in initial response to satisfy RANK-03.

## Provider Findings (Google Maps)

Validated via Context7 (`/googlemaps/google-maps-services-js`):
- **Places Nearby/Text Search** support candidate discovery by location + keyword/type and include `types`, `opening_hours.open_now`, and place identifiers.
- **Distance Matrix** supports batched origin-destination durations suitable for two-participant ETA matrix.
- API key usage fits current backend-only integration model (`process.env.GOOGLE_MAPS_API_KEY`).

## Data/Contract Baseline for Planning

Add these phase-specific contracts:
- `WillingnessSplit` enum: `"50_50" | "60_40" | "70_30"`
- `PreferenceTag` as constrained string union for curated v1 tags
- `RankingInputState` persisted per session (`split`, `tags`, `updatedAt`)
- `RankedVenue` output shape:
  - `venueId`, `name`, `category`, `openNow`
  - `etaParticipantA`, `etaParticipantB`
  - `fairnessScore`, `preferenceScore`, `totalScore`

Required API surfaces:
- `POST /v1/ranking/inputs` -> store split + tags for session
- `POST /v1/ranking/results` -> generate ranked venues from locations + inputs

## dont_hand_roll

- Do **not** call Google APIs from client/browser.
- Do **not** introduce multi-provider abstraction breadth (single provider only in this phase).
- Do **not** rank by geometric midpoint alone; ETA fairness is mandatory.
- Do **not** treat preference tags as display-only metadata; they must influence score ordering.

## common_pitfalls

1. **Opaque ranking behavior**
   - Mitigation: include score components in response payload for debugging and later explainability.

2. **Cost/latency fan-out**
   - Mitigation: cap candidate set before matrix call (e.g., top 12 candidates), batch matrix request once per ranking run.

3. **Unstable result ordering**
   - Mitigation: deterministic tie-breakers and snapshot persistence in session state.

4. **Missing metadata in result cards**
   - Mitigation: enforce response contract with tests for ETA per participant + category + open status.

## Testing Targets for This Phase

- Input endpoint accepts only allowed splits and curated tags; rejects invalid values.
- Ranking service computes deterministic ordering for known ETA/tag fixtures.
- Preference tags measurably influence ordering (same ETA data, different tag profile -> reordered top candidates).
- Results endpoint returns required metadata fields per candidate.

## Planning Implications

- Split into three execute plans:
  1. Input contracts + persistence + API for split/tags.
  2. Provider adapter + fairness scoring + ranking endpoint.
  3. Frontend input + ranked results rendering wired to Phase 2 APIs.

## Open Questions to Resolve During Execution

- Final curated v1 tag set (keep small to reduce noisy scoring).
- Initial candidate cap value balancing quality vs latency/cost.
- Whether to use Places Nearby vs Text Search as primary candidate discovery endpoint for launch region.

---

*Research complete for phase planning.*
