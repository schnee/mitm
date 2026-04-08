# Phase 01 Research — Discovery & Session/Input Backbone

**Date:** 2026-04-08  
**Status:** Complete  
**Scope:** Implementation guidance for SESS-01/02/03 and LOCT-01/02/03

## Research Question

What do we need to know to plan a reliable Phase 1 implementation for two-person session creation/join, synchronized state, and consented location capture with fallback?

## Recommended Technical Direction

### standard_stack
- **Framework:** Next.js App Router + TypeScript (web-first responsive flow)
- **Backend:** Supabase Postgres + Realtime + RLS
- **Validation:** Zod on all route boundaries
- **State sync:** Supabase realtime subscription to session-scoped channel
- **Location input modes:** Browser geolocation + manual typed address fallback

### architecture_patterns
1. **Server-authoritative session lifecycle**
   - Session row is source of truth.
   - Client only sends intents (`create_session`, `join_session`, `set_location`, `confirm_location`).
   - Server enforces two-participant max and valid transitions.

2. **Join-by-link with anonymous participant identity**
   - Session owner creates session and receives shareable URL containing join token.
   - Invitee joins without account creation.
   - Participant identity stored as scoped participant record (session-local, not global profile).

3. **Location pipeline with explicit confirmation gate**
   - Capture location (GPS or typed address) into draft state.
   - Show review card (label + coordinates/normalized address).
   - Persist `location_confirmed_at` only after explicit user confirmation.
   - Downstream phases must block ranking until both confirmations exist.

4. **Realtime synchronization strategy**
   - Both clients subscribe to the same session channel.
   - Broadcast only session-safe state changes (presence, join status, location set/confirmed).
   - Persist in Postgres first, then fan out to clients.

## Data/Contract Baseline for Planning

Plan around these minimal entities:
- `sessions`: id, join_token, status, created_at, expires_at
- `participants`: id, session_id, role(host|invitee), display_name(optional), joined_at
- `participant_locations`: participant_id, input_mode(geolocation|manual), lat, lng, address_label, confirmed_at

Required API surfaces (or server actions):
- `POST /api/sessions` → create session + join URL
- `POST /api/sessions/join` → join by token
- `POST /api/sessions/{id}/location` → upsert draft location
- `POST /api/sessions/{id}/location/confirm` → explicit confirm
- `GET /api/sessions/{id}` → current canonical state for initial hydration

## dont_hand_roll

- Do **not** build custom websocket infrastructure for v1 sync; use Supabase realtime.
- Do **not** create account/auth flows in Phase 1; requirement is no-account invitee join.
- Do **not** mix multiple geocoding/place providers in this phase.
- Do **not** allow ranking flow before both participants confirm location.

## common_pitfalls

1. **Geolocation dead-end UX**
   - If permission denied/timeout path is weak, users abandon.
   - Mitigation: first-class manual entry path with no penalty.

2. **Session desync between peers**
   - Local optimistic state diverges from server truth.
   - Mitigation: hydrate from canonical GET, then realtime patches from DB writes.

3. **Token misuse / accidental over-joining**
   - More than two participants or stale links.
   - Mitigation: enforce two-participant cap + expiry check server-side.

4. **Implicit location use without consent signal**
   - Trust/privacy risk if draft location acts as final.
   - Mitigation: explicit `confirmed_at` and UI badge/state for confirmed location.

## Testing Targets for This Phase

- Create session returns valid join URL and stores host participant.
- Join endpoint accepts valid token, rejects expired/full sessions.
- Realtime propagation updates both clients when participant joins and confirms location.
- Geolocation failure path still allows manual address completion.
- Ranking gate condition (for next phase dependency): both participants must have confirmed locations.

## Planning Implications

- Split plans by vertical slice, not horizontal layer:
  1) Session create/join contracts + API + state sync
  2) Location capture/confirmation flow + failure handling
  3) End-to-end verification + hardening for two-user synchronization
- Include at least one human verification checkpoint for dual-client flow.

## Open Questions to Resolve During Execution

- Join token format/TTL values (must be explicit and test-covered).
- Manual address normalization source for phase 1 (provider endpoint vs temporary pass-through string).
- Session expiry behavior in UI when invitee opens stale link.

---

*Research complete for phase planning.*
