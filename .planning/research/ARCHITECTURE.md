# Architecture Research

**Domain:** Two-party meetup location negotiation app (web-first MVP)
**Researched:** 2026-04-08
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                                Client Layer                                │
├────────────────────────────────────────────────────────────────────────────┤
│  Mobile Web UI (PWA)                                                       │
│  - Session create/join                                                     │
│  - Location consent + capture                                              │
│  - Willingness split + preference tags                                     │
│  - Ranked options + shortlist + confirm                                    │
└───────────────┬────────────────────────────────────────────────────────────┘
                │ HTTPS (REST/Server Actions) + WebSocket (presence/updates)
┌───────────────▼────────────────────────────────────────────────────────────┐
│                    Application Layer (GCP API Boundary)                     │
├────────────────────────────────────────────────────────────────────────────┤
│ Cloud Run API (Node.js/TypeScript)                                          │
│  - REST endpoints: session API, ranking API, confirm API                   │
│  - Session lifecycle/state machine enforcement                             │
│  - Auth/session middleware                                                  │
│  - Recommendation service (fairness scoring)                                │
│  - Integration adapters (Places + Routing matrix)                           │
└───────────────┬────────────────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────────────────┐
│                               Data Layer                                    │
├────────────────────────────────────────────────────────────────────────────┤
│ Firestore (ephemeral session documents)                                     │
│  - sessions, participants, preferences, candidates, shortlist, final         │
│  - precise location fields with TTL auto-expiry policy                       │
│ Cloud Logging (request/session lifecycle telemetry)                          │
└───────────────┬────────────────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────────────────┐
│                           External Providers                                │
├────────────────────────────────────────────────────────────────────────────┤
│ Places API (candidate venues by tags/area)                                  │
│ Routing Matrix API (travel-time matrix, asymmetric durations)               │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Talks To |
|-----------|----------------|----------|
| **Web Client (Next.js UI on Cloudflare)** | Collect inputs, show ranked candidates, shortlist, confirmation | Cloud Run API |
| **Session Service** | Create/join 2-person session; create canonical server session immediately on User 1 start; enforce session state machine | Firestore |
| **Location Consent + Capture Service** | Capture explicit consent and coarse/fine location payload | Firestore (TTL-managed location fields) |
| **Recommendation Engine** | Build candidate set, call matrix API, compute fairness + preference score | Places adapter, Routing adapter, Firestore |
| **Shortlist/Decision Service** | Persist votes/shortlist and finalize one location | Firestore |
| **Policy/Access Layer** | Enforce per-session authorization and data isolation | API auth context + Firestore rules/guards |
| **TTL/Expiry Policy** | Auto-expire precise location/session documents after retention window | Firestore TTL |

## Recommended Project Structure

```text
src/
├── app/                       # Next.js App Router pages + route handlers
│   ├── (marketing)/
│   ├── s/[sessionCode]/       # Session UX (join, negotiate, shortlist, confirm)
│   └── api-client/            # typed client for Cloud Run API
├── modules/                   # Business domains (clean boundaries)
│   ├── session/
│   ├── participant/
│   ├── recommendation/
│   ├── fairness/
│   └── decision/
├── integrations/              # External API adapters
│   ├── places/
│   └── routing/
├── data/
│   └── firestore/             # repositories, converters, lifecycle persistence
├── services/
│   └── api/                   # Cloud Run API service (session/ranking/decision)
└── lib/                       # shared utilities (validation, logging, config)
```

### Structure Rationale

- **`modules/` as primary boundary**: keeps business rules independent of framework and external APIs.
- **`integrations/` as anti-corruption layer**: isolates provider-specific request/response quirks.
- **Cloud Run API as thin orchestration**: request parsing/auth in handlers, domain logic in modules.
- **TTL policy, not app cron, for location retention**: expiry should not depend on user traffic.

## Architectural Patterns

### Pattern 1: Modular Monolith + BFF

**What:** Single deployable app, strict internal module boundaries, frontend and backend in one repo.
**When to use:** MVP/early product where speed and iteration matter more than independent service scaling.
**Trade-offs:** Fastest delivery and lower ops overhead; requires discipline to prevent module coupling.

**Example:**
```typescript
// app/api/recommendations/route.ts
import { recommendMeetup } from '@/modules/recommendation/service'

export async function POST(req: Request) {
  const input = await req.json()
  const result = await recommendMeetup(input) // domain module owns logic
  return Response.json(result)
}
```

### Pattern 2: Provider Adapter Boundary

**What:** External APIs only accessed via local adapter interfaces.
**When to use:** Any dependency that may change (places/routing providers, pricing tiers, quotas).
**Trade-offs:** Slightly more code now; major flexibility later.

**Example:**
```typescript
export interface RoutingMatrixPort {
  travelTimes(origins: LngLat[], destinations: LngLat[]): Promise<number[][]>
}
```

### Pattern 3: Explicit Session State Machine

**What:** Session transitions are finite and validated (`created -> joined -> ranked -> shortlisted -> confirmed`).
**When to use:** Multi-step collaborative flows where race conditions are common.
**Trade-offs:** Adds modeling work; prevents invalid transitions and “stuck” sessions.

## Data Flow

### Request Flow (Ranking)

```text
User A/B submit location + split + tags
    ↓
Session API validates participant + state
    ↓
Recommendation Engine builds search centroid/area
    ↓
Places Adapter fetches candidate venues
    ↓
Routing Adapter fetches travel-time matrix (A→venue, B→venue)
    ↓
Fairness Scorer computes weighted burden + preference score
    ↓
Ranked list persisted + broadcast to both participants
    ↓
Client renders top options and starts shortlist actions
```

### Realtime Collaboration Flow

```text
Participant joins session
    ↓
Server authorizes session membership
    ↓
Client subscribes to session channel (presence + updates)
    ↓
Events: participant_joined, ranking_ready, shortlist_updated, confirmed
    ↓
Both UIs remain in sync without polling-heavy loops
```

### Data Direction Rules (important boundaries)

1. **Client never calls Places/Matrix APIs directly** (API keys and scoring logic stay server-side).
2. **Modules call integrations via interfaces only** (no direct SDK calls in UI/routes).
3. **Client sync signals are advisory, not full source of truth** (truth remains in Firestore session documents).

## Suggested Build Order (Roadmap Dependency Backbone)

1. **Foundation: Session + Auth + Basic Data Model**
   - Build: session/participant collections, create/join flow, Cloud Run API skeleton.
   - Why first: all later flows depend on identity + shared session context.

2. **Location Consent + Ephemeral Storage**
   - Build: consent UI, location capture endpoint, TTL fields + expiry policy.
   - Why second: recommendation and fairness are impossible without trusted input.

3. **Provider Adapters (Places + Matrix) in Isolation**
   - Build: integration modules, contract tests, retry/error handling, quota guards.
   - Why third: de-risks external dependency variance before product logic is wired.

4. **Recommendation/Fairness Engine**
   - Build: candidate generation + scoring algorithm using 50/50, 60/40, 70/30 weights.
   - Why fourth: core product value; depends on steps 1–3.

5. **Realtime Session Sync + Shortlist UX**
   - Build: channel authorization, events, shortlist updates.
   - Why fifth: collaboration polish after core ranking correctness exists.

6. **Confirmation + Audit Trail + Hardening**
   - Build: final decision endpoint, immutable confirmation record, observability/alerts.
   - Why sixth: closes the loop for “intent → confirmed place” KPI.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users | Single Cloud Run service + Firestore; aggressive caching not required |
| 1k–100k users | Tune Firestore indexes, queue recommendation jobs, cache venue candidates by area/tags |
| 100k+ users | Split recommendation compute into separate worker service; shard hot session traffic |

### First Bottlenecks

1. **External API latency/cost** (places + matrix calls) → mitigate with bounded candidate pool + caching.
2. **Hot document contention in busy sessions** → keep writes granular and avoid unnecessary global counters.

## Anti-Patterns

### Anti-Pattern 1: “Chat-first” architecture for MVP

**What people do:** Build in-app chat/social graph before ranking engine.
**Why it’s wrong:** Adds complexity without validating core fairness value.
**Do this instead:** Keep collaboration to minimal presence/events + shortlist actions.

### Anti-Pattern 2: Persisting precise location forever

**What people do:** Store exact coordinates indefinitely in primary user profile.
**Why it’s wrong:** Trust/compliance risk and unnecessary sensitive retention.
**Do this instead:** Store precise session coordinates ephemerally; persist only coarse analytics long-term.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Places API | Server-side adapter with normalized `PlaceCandidate` DTO | Keep provider response out of domain layer |
| Routing Matrix API | Server-side adapter returning normalized duration matrix | Matrix values are directional/asymmetric; score accordingly |
| Firestore | Session-scoped document model with TTL policies | Primary source of truth for create/join lifecycle |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `services/api` ↔ `modules/*` | Function calls via typed service interfaces | Keep handlers thin |
| `modules/recommendation` ↔ `integrations/*` | Port/adapter interface | Enables provider swap |
| `modules/*` ↔ `data/firestore` | Repository methods | Centralizes persistence policy and lifecycle transitions |

## Sources

- Next.js App Router Route Handlers and Server Actions docs (official): https://nextjs.org/docs/app/getting-started/route-handlers, https://nextjs.org/docs/app/guides/forms *(HIGH)*
- Cloud Run service architecture docs (official): https://cloud.google.com/run/docs/architecture *(HIGH)*
- Firestore TTL policies docs (official): https://cloud.google.com/firestore/docs/ttl *(HIGH)*
- Google Maps Places + Routes API docs (official): https://developers.google.com/maps/documentation/places/web-service, https://developers.google.com/maps/documentation/routes *(HIGH)*
- Project constraints/context: `/Users/Brent.Schneeman/projects/tworavens/mitm/.planning/PROJECT.md` *(HIGH)*

---
*Architecture research for: Meet Me in the Middle*
*Researched: 2026-04-08*
