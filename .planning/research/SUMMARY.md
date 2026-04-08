# Project Research Summary

**Project:** Meet Me in the Middle
**Domain:** Two-party meetup location negotiation app (web-first, mobile-responsive)
**Researched:** 2026-04-08
**Confidence:** MEDIUM

## Executive Summary

Meet Me in the Middle is a two-person coordination product whose core job is not “find the geometric middle,” but “help two people agree on a place that feels fair.” The combined research points to a web-first modular monolith: Next.js + TypeScript on the app side, Supabase/Postgres (+ PostGIS) for data/auth/realtime, and a single mapping provider for places + travel-time routing. This is the fastest path to a production MVP while preserving enough architectural discipline to evolve later.

The recommended approach is to build in strict dependency order: session/auth foundation, consented location capture with fallback paths, provider adapters, fairness ranking engine, then realtime shortlist/confirmation. Product scope should stay narrow in v1: two-person sessions, willingness split (50/50, 60/40, 70/30), explainable ranked venues, shortlist, and final shareable destination. Defer group meetups, native apps, and booking flows until retention and decision-speed metrics validate the core.

The biggest risks are trust failures (opaque ranking, perceived unfairness), reliability failures (geolocation errors, race conditions), and cost/compliance failures (API fan-out, geocoding retention/licensing). Mitigation is explicit: ETA-based scoring with explainability UI, server-authoritative session FSM + idempotent confirms, and early guardrails for API budgeting, data retention TTL, and provider policy compliance.

## Key Findings

### Recommended Stack

The stack recommendation is strong and pragmatic for MVP speed: Next.js 16 + React 19 + TypeScript 6, with Supabase as integrated backend and PostGIS for geo operations. This avoids premature service sprawl while supporting realtime collaboration and SQL-first control where fairness logic and RLS matter. Google Maps Platform is currently the best quality default for POI/routing, but pricing/region behavior should be validated early.

**Core technologies:**
- **Next.js 16.2.2 + React 19.2.4:** full-stack web delivery with fast iteration and App Router defaults.
- **TypeScript 6.0.2:** safer scoring/API contracts in fairness-critical logic.
- **Supabase (`@supabase/supabase-js` 2.102.1, `@supabase/ssr` 0.10.0):** auth, Postgres, realtime in one managed platform.
- **PostGIS (Supabase extension):** robust geospatial/radius/distance operations for ranking pipeline.
- **Google Maps Platform + `@vis.gl/react-google-maps` 1.8.2:** high-quality places + routes + map UX for consumer flows.
- **Tailwind CSS 4.2.2:** rapid responsive UI implementation.

Critical version pairings: Next 16↔React 19, and `@supabase/ssr` kept in lockstep with `@supabase/supabase-js`.

### Expected Features

v1 should optimize for low-friction two-party decision closure, not broad social surface area.

**Must have (table stakes):**
- Two-person session create/join by link (prefer no-account invitee flow).
- Consent-based location input (live + manual fallback).
- ETA-based fairness ranking with willingness split.
- Preference tags for venue filtering.
- Ranked results with metadata + fairness explanation.
- Shortlist + final confirmation + map deep-link export.

**Should have (competitive):**
- Explainable fairness card per venue.
- Fast consensus interactions (accept/reject) once baseline conversion plateaus.
- Context modes (date/networking/casual).
- Safety-first precision controls (approximate-until-confirmed).

**Defer (v2+):**
- Group meetups (3+).
- Native mobile apps.
- Reservations/payments.
- Rich social profiles/feed.

### Architecture Approach

Adopt a **modular monolith + BFF** with thin route handlers and domain-heavy modules. Keep external dependencies behind adapter interfaces and enforce a server-authoritative session state machine (`created → joined → ranked → shortlisted → confirmed`). Realtime is for coordination events; Postgres remains source of truth.

**Major components:**
1. **Web Client (Next.js UI)** — capture inputs, render rankings, drive shortlist/confirm UX.
2. **Application/BFF services** — session, consent capture, recommendation scoring, decision finalization.
3. **Data + policy layer** — Postgres/RLS/realtime channels, ephemeral location tables, cleanup jobs.
4. **Provider adapters** — normalized Places and Routing Matrix integrations.

### Critical Pitfalls

1. **Optimizing midpoint instead of travel burden fairness** — rank by travel time + ETA gap + willingness weights, not pure distance.
2. **Opaque ranking undermines trust** — expose per-venue “why ranked” explanation chips and detail breakdown.
3. **Geolocation failure paths ignored** — explicitly handle denied/unavailable/timeout with manual entry fallback.
4. **Session race conditions** — enforce server FSM, optimistic concurrency/version checks, idempotent confirm.
5. **API cost/compliance blowups** — debounce/token discipline, cap matrix fan-out, and codify geocoding retention/licensing policy.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 0: Policy, Contracts, and Foundation Guardrails
**Rationale:** Compliance/privacy/provider constraints must be locked before data model and caching decisions.
**Delivers:** Provider policy ADRs (geocoding retention, storage rules), data retention policy (TTL), join-token entropy rules, initial schema contracts.
**Addresses:** Trust prerequisites behind consent/location features.
**Avoids:** Geocoding licensing violations, over-retained precise location, weak join-code security.

### Phase 1: Core Session + Consented Input Backbone
**Rationale:** All downstream ranking/collaboration depends on valid two-party session and resilient input flows.
**Delivers:** Create/join by link, participant auth context, explicit geolocation error states + manual fallback, basic realtime presence, session FSM skeleton.
**Addresses:** P1 features for session creation and location capture.
**Avoids:** Geolocation drop-off failures, early race conditions.

### Phase 2: Fairness Engine + Explainable Recommendations
**Rationale:** This is the product’s core value proposition and primary PMF test.
**Delivers:** Places/routing adapters, ETA matrix pipeline, weighted fairness scoring (50/50–70/30), ranked results with explainability.
**Uses:** PostGIS, provider adapters, server-side scoring in domain modules.
**Implements:** Recommendation + fairness modules and ranking API.
**Avoids:** Geometric-midpoint trap and black-box ranking distrust.

### Phase 3: Decision Closure + Realtime Collaboration
**Rationale:** After ranking quality is credible, optimize for fast mutual decisions.
**Delivers:** Shortlist interactions, conflict-safe final confirmation, share/export destination links, immutable confirmation audit trail.
**Addresses:** Core JTBD completion and measurable decision-time reduction.
**Avoids:** Phantom confirmations, client-state divergence, stale decision state.

### Phase 4: Hardening, Cost Controls, and v1.x Differentiators
**Rationale:** Stabilize unit economics and reliability before expansion.
**Delivers:** Cost dashboards/alerts, candidate caps/caching, place freshness checks, suppression loops, optional consensus quick-actions/context modes/privacy toggles.
**Addresses:** v1.x enhancements and operational resilience.
**Avoids:** Quota incidents, stale/closed venue recommendations, privacy regression.

### Phase Ordering Rationale

- Ordering mirrors hard dependencies from research: session + consent input precede ranking; ranking precedes shortlist/confirmation polish.
- Architecture boundaries (modules + adapters + FSM) are introduced early to prevent rewrite when complexity rises.
- Front-loading policy/compliance and security guardrails prevents expensive retrofits after real user data arrives.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 0:** provider licensing/storage terms and privacy retention policy specifics by region/provider.
- **Phase 2:** routing/provider cost-quality tradeoffs (Google vs Mapbox), fairness weight calibration methodology.
- **Phase 4:** caching strategy and cost guardrail thresholds under expected query patterns.

Phases with standard patterns (can likely skip deeper research-phase):
- **Phase 1:** Next.js + Supabase create/join scaffolding, geolocation fallback UX baseline, basic RLS/realtime setup.
- **Phase 3:** Standard optimistic concurrency + idempotent confirmation patterns once FSM contracts are set.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Mostly official docs and current package versions; strong implementation consensus. |
| Features | MEDIUM | Good competitor scan and product-pattern alignment, but mostly homepage-level evidence and limited behavioral data. |
| Architecture | MEDIUM-HIGH | Strong pattern fit for MVP constraints; some provider-specific references vary (Google in stack vs Mapbox in architecture examples). |
| Pitfalls | MEDIUM | High-quality risk taxonomy and concrete mitigations; some provider failure-mode docs are legacy/indirect and need live validation. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Provider strategy mismatch risk:** Stack prefers Google Maps Platform while parts of architecture/pitfalls reference Mapbox specifics. **Action:** choose primary provider in planning, then align adapters, compliance rules, and test cases.
- **Fairness metric calibration unknown:** We have candidate objective terms but no target acceptance thresholds yet. **Action:** define offline replay + user-test acceptance criteria in Phase 2.
- **Regional/legal variability:** Storage/retention and privacy expectations can differ by jurisdiction. **Action:** perform a lightweight legal/compliance pass before production launch.
- **Realtime load assumptions unvalidated:** channel/event model is sound but not yet pressure-tested. **Action:** add concurrency/load scenarios before broad rollout.

## Sources

### Primary (HIGH confidence)
- Context7 `/vercel/next.js` — App Router/Server Actions architecture guidance.
- Context7 `/supabase/supabase` — auth/realtime/database integration patterns.
- Next.js official docs — route handlers/forms and deployment patterns.
- Supabase official docs — realtime authorization and RLS patterns.
- MDN geolocation and permissions policy docs — browser security/error handling baseline.
- Project context: `.planning/PROJECT.md`.

### Secondary (MEDIUM confidence)
- Google Maps Platform docs/support pages — feature expectations and failure modes.
- Mapbox API/geocoding/matrix docs — policy and quota guidance used for integration risk framing.
- Competitor homepages (Whatshalfway, MeetWays, Halfwaze, Midpointr) — market baseline and UX norms.

### Tertiary (LOW confidence)
- Legacy Google Places details documentation references in pitfalls notes (useful for error taxonomy but should be revalidated against current APIs).

---
*Research completed: 2026-04-08*
*Ready for roadmap: yes*
