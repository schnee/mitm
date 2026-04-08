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
│                           Application Layer (BFF)                           │
├────────────────────────────────────────────────────────────────────────────┤
│ Next.js App Router                                                          │
│  - Route Handlers: session API, ranking API, confirm API                   │
│  - Server Actions: simple form mutations                                   │
│  - Auth/session middleware                                                  │
│  - Recommendation service (fairness scoring)                                │
│  - Integration adapters (Places + Routing matrix)                           │
└───────────────┬────────────────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────────────────┐
│                               Data Layer                                    │
├────────────────────────────────────────────────────────────────────────────┤
│ PostgreSQL (transactional data)                                            │
│  - users, sessions, participants, preferences, candidates, shortlist, final │
│  - ephemeral_location_shares (TTL cleanup)                                  │
│ Realtime channel state (presence + lightweight event stream)                │
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
| **Web Client (Next.js UI)** | Collect inputs, show ranked candidates, shortlist, confirmation | BFF APIs + Realtime channel |
| **Session Service** | Create/join 2-person session; enforce session state machine | Postgres, Realtime |
| **Location Consent + Capture Service** | Capture explicit consent and coarse/fine location payload | Postgres (ephemeral table), Realtime |
| **Recommendation Engine** | Build candidate set, call matrix API, compute fairness + preference score | Places adapter, Routing adapter, Postgres |
| **Shortlist/Decision Service** | Persist votes/shortlist and finalize one location | Postgres, Realtime |
| **Policy/Access Layer** | Enforce per-session authorization and data isolation | Postgres RLS / auth context |
| **Cleanup Worker (cron/job)** | Delete expired precise locations and stale sessions | Postgres |

## Recommended Project Structure

```text
src/
├── app/                       # Next.js App Router pages + route handlers
│   ├── (marketing)/
│   ├── s/[sessionCode]/       # Session UX (join, negotiate, shortlist, confirm)
│   └── api/
│       ├── sessions/          # create/join/endpoints
│       ├── recommendations/   # ranking endpoint
│       └── decisions/         # shortlist + confirm endpoint
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
│   ├── db/                    # schema + queries + repository layer
│   └── realtime/              # channel utilities + event contracts
├── jobs/                      # TTL cleanup and maintenance jobs
└── lib/                       # shared utilities (validation, logging, config)
```

### Structure Rationale

- **`modules/` as primary boundary**: keeps business rules independent of framework and external APIs.
- **`integrations/` as anti-corruption layer**: isolates provider-specific request/response quirks.
- **`app/api/` as thin orchestration**: request parsing/auth in handlers, domain logic in modules.
- **`jobs/` separate from request path**: retention and cleanup must not depend on user traffic.

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
3. **Realtime carries coordination events, not full source of truth** (truth remains in Postgres).

## Suggested Build Order (Roadmap Dependency Backbone)

1. **Foundation: Session + Auth + Basic Data Model**
   - Build: user/session/participant tables, create/join flow, route handler skeleton.
   - Why first: all later flows depend on identity + shared session context.

2. **Location Consent + Ephemeral Storage**
   - Build: consent UI, location capture endpoint, TTL fields + cleanup job.
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
| 0–1k users | Single app + single Postgres instance; aggressive caching not required |
| 1k–100k users | Add read replicas, queue recommendation jobs, cache venue candidates by area/tags |
| 100k+ users | Split recommendation compute into separate worker service; shard hot session traffic |

### First Bottlenecks

1. **External API latency/cost** (places + matrix calls) → mitigate with bounded candidate pool + caching.
2. **Realtime fan-out in busy geographies** → partition channels by session and tighten payload size.

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
| Realtime backend | Authorized per-session channels | Events for sync; DB remains source of truth |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `app/api` ↔ `modules/*` | Function calls via typed service interfaces | Keep handlers thin |
| `modules/recommendation` ↔ `integrations/*` | Port/adapter interface | Enables provider swap |
| `modules/*` ↔ `data/db` | Repository methods | Centralizes persistence policy and transactions |

## Sources

- Next.js App Router Route Handlers and Server Actions docs (official): https://nextjs.org/docs/app/getting-started/route-handlers, https://nextjs.org/docs/app/guides/forms *(HIGH)*
- Supabase Realtime authorization + RLS examples (official): https://supabase.com/docs/guides/realtime/authorization *(HIGH)*
- Mapbox Matrix API + Geocoding API docs (official): https://docs.mapbox.com/api/navigation/matrix/, https://docs.mapbox.com/api/search/geocoding/ *(HIGH)*
- Project constraints/context: `/Users/Brent.Schneeman/projects/tworavens/mitm/.planning/PROJECT.md` *(HIGH)*

---
*Architecture research for: Meet Me in the Middle*
*Researched: 2026-04-08*
