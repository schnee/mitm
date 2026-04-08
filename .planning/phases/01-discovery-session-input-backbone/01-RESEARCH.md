# Phase 01 Research - Discovery & Session/Input Backbone

**Date:** 2026-04-08  
**Status:** Complete  
**Scope:** Implementation guidance for SESS-01/02/03 and LOCT-01/02/03

## Research Question

What is the most reliable and privacy-aware approach for Phase 1 to support two-person session create/join, synchronized state visibility, and consented location capture with fallback?

## Recommended Technical Direction

### standard_stack
- **Framework:** Next.js App Router + TypeScript (web-first responsive flow)
- **Frontend hosting:** Cloudflare
- **Backend baseline:** Cloud Run API + Firestore + Secret Manager + Cloud Logging
- **Validation:** Zod on all route boundaries
- **State sync:** Server-authoritative canonical reads with push updates (Firestore listeners or API event stream) plus reconnect re-hydration
- **Location input modes:** Browser geolocation + manual typed address fallback

### architecture_patterns
1. **Server-authoritative session lifecycle**
   - Session document is source of truth.
   - Client sends intents (`create_session`, `join_session`, `set_location`, `confirm_location`).
   - API enforces two-participant max, expiry, and legal lifecycle transitions.

2. **Join-by-link with anonymous participant identity**
   - Host creates session and receives a shareable join URL containing token.
   - Invitee joins without account creation.
   - Participant identity is scoped to session only (no profile persistence in Phase 1).

3. **Location pipeline with explicit confirmation gate**
   - Capture location (geolocation or manual address) into draft state.
   - Show review card (label + coordinates/normalized address when available).
   - Persist `location_confirmed_at` only after explicit user action.
   - Ranking must remain blocked until both confirmations exist.

4. **Ephemeral precise-location retention**
   - Store precise location fields with clear expiry metadata.
   - Enforce Firestore TTL cleanup for session-scoped records.
   - Keep only minimum fields needed for current phase behavior and auditability.

## Data/Contract Baseline for Planning

Plan around these minimal entities:
- `sessions`: id, join_token, status, created_at, expires_at
- `participants`: id, session_id, role(host|invitee), joined_at
- `participant_locations`: participant_id, input_mode(geolocation|manual), lat, lng, address_label, confirmed_at, updated_at

Required API surfaces:
- `POST /api/sessions` -> create session + join URL
- `POST /api/sessions/join` -> join by token
- `GET /api/sessions/{id}` -> canonical session snapshot for hydration
- `POST /api/sessions/{id}/location` -> upsert draft location
- `POST /api/sessions/{id}/location/confirm` -> explicit confirm

## dont_hand_roll

- Do **not** add account/auth flows in Phase 1; requirement is no-account invitee join.
- Do **not** integrate multiple geocoding/place providers in this phase.
- Do **not** allow ranking path to execute before both participants confirm location.
- Do **not** keep precise location beyond agreed TTL window.

## common_pitfalls

1. **Geolocation dead-end UX**
   - Weak denied/timeout handling causes abandonment.
   - Mitigation: first-class manual entry path with equal completion path.

2. **Session desync between peers**
   - Client-local optimistic state can diverge from canonical server state.
   - Mitigation: hydrate from canonical `GET`, then apply push updates; force refresh on reconnect.

3. **Token misuse or stale joins**
   - Over-joining or expired links degrade trust.
   - Mitigation: server-side checks for two-person cap, token validity, and expiry with explicit status codes.

4. **Implicit location use without consent signal**
   - Privacy/trust risk if draft location acts as final.
   - Mitigation: explicit `confirmed_at` gate and visible confirmation state per participant.

5. **Cross-cloud configuration drift**
   - Cloudflare and GCP env mismatch creates integration instability.
   - Mitigation: establish env contract early (`NEXT_PUBLIC_API_URL`, secrets, stage/prod parity checklist).

## Testing Targets for This Phase

- Create session returns valid join URL and persists host participant.
- Join endpoint accepts valid token; rejects expired/full/unknown sessions with deterministic 4xx responses.
- Two clients converge to the same canonical session state after join and reconnect.
- Geolocation denied/timeout still reaches successful manual completion and confirmation.
- Readiness gate remains false until both participants have `confirmed_at` set.
- TTL behavior is validated in staging (configuration + observable expiry behavior).

## Planning Implications

- Split execution by vertical slices:
  1) Create/join contracts + persistence + canonical snapshot API
  2) Sync model (hydrate + push + reconnect recovery)
  3) Location capture/fallback/confirmation + TTL policy verification
- Add one dual-client human verification checkpoint before phase sign-off.

## Open Questions to Resolve During Execution

- Join token length/entropy and exact TTL values.
- Push transport choice for web clients (Firestore listener via backend bridge vs API event stream) for best reliability on Cloudflare-hosted frontend.
- Manual address normalization strategy for Phase 1 (provider geocode vs raw label passthrough).
- User-facing stale-session behavior when invitee opens an expired link.

---

*Research complete for phase planning.*
