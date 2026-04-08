# Stack Research

**Domain:** Two-party meetup location negotiation app (web-first, mobile-responsive)
**Researched:** 2026-04-08
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.2.2 | Web app framework for responsive frontend UX | Fastest path to a production web MVP with strong DX and App Router defaults, while remaining deployable to Cloudflare for frontend delivery. Fits your explicit web-first scope and keeps iteration loop short. **Confidence: HIGH** |
| React | 19.2.4 | UI runtime for interactive negotiation/session flows | Current React baseline for Next.js apps; large ecosystem and predictable hiring/support. **Confidence: HIGH** |
| TypeScript | 6.0.2 | Type safety across UI, scoring logic, and integrations | Reduces regressions in fairness logic and API contracts while still moving quickly. **Confidence: HIGH** |
| Cloud Run | Managed service (current GA) | Run backend API for session lifecycle, ranking orchestration, and state transitions | GCP-native runtime with low ops overhead and clean separation from Cloudflare-hosted frontend. Fits session-first API boundaries and scales per request volume. **Confidence: HIGH** |
| Firestore (native mode) | Managed service (current GA) | Ephemeral session persistence (`sessions`, `participants`, state transitions) with TTL expiry | Document model maps directly to short-lived create/join flows; TTL policies enforce automatic cleanup for precise location data. **Confidence: HIGH** |
| Secret Manager | Managed service (current GA) | Centralized secret storage for maps keys and service credentials | Removes plaintext secret sprawl across environments and keeps backend key access auditable. **Confidence: HIGH** |
| Cloud Logging | Managed service (current GA) | Structured request/session lifecycle logging | Gives immediate production diagnostics for create/join failures and ranking issues without custom log plumbing. **Confidence: HIGH** |
| Google Maps Platform (Places API + Routes API + Maps JS) | API-based managed service (current GA endpoints) + `@vis.gl/react-google-maps` 1.8.2 | Place search/details, travel-time estimation, interactive map rendering | Highest POI quality and routing coverage for a consumer-facing “fair meetup” UX. Faster to validate than stitching multiple weaker providers. **Confidence: MEDIUM** (cost/per-region behavior must be validated) |
| Tailwind CSS | 4.2.2 | Rapid responsive UI styling | Lowest-friction way to ship polished mobile/desktop responsive UI quickly. **Confidence: HIGH** |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.96.2 | Server-state caching, retries, optimistic updates | Use for places/ranking fetches and shortlist mutations to keep UX snappy and resilient on mobile networks. |
| zod | 4.3.6 | Runtime validation for API payloads and form input | Use at every boundary (join code, location payload, preference tags) to prevent bad scoring inputs. |
| @sentry/nextjs | 10.47.0 | Error monitoring + performance traces | Use from day 1; fairness/routing bugs will happen in edge cases and need fast diagnosis. |
| next-pwa | 5.6.0 | PWA capabilities (installability/offline shell) | Use if early users primarily open from mobile browsers and want “app-like” entry; defer if launch speed is priority. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm 10.33.0 | Fast, deterministic package management | Better monorepo/workspace performance and lower install time than npm for iterative dev. |
| Google Cloud CLI (gcloud) | Cloud Run, Firestore, IAM, and secret provisioning | Keep infra setup scripted and reviewable from day one for dev/stage/prod parity. |
| Playwright 1.59.1 | End-to-end testing for critical flows | Cover create/join session, location consent, ranking, shortlist confirmation before scaling traffic. |

## Deployment Targets

| Surface | Target | Notes |
|---------|--------|-------|
| Frontend (web app) | Cloudflare | Serve the Next.js web experience from edge infrastructure for low-latency mobile/desktop delivery. |
| Backend services | Google Cloud | Run backend APIs/workers and supporting services with clear separation from frontend hosting concerns. |

### Immediate Phase 1 Execution Impact

- Define session schema first (`sessions`, `participants`, lifecycle status fields) so server creates a canonical session as soon as User 1 starts.
- Add and verify Firestore TTL policy for precise location/session expiry before production traffic.
- Implement explicit create/join lifecycle transitions (`created -> joined -> locating -> ranked -> confirmed/expired`) with server-authoritative updates.
- Add deployment baseline tasks early: Cloudflare project setup for frontend and Google Cloud project/service setup for backend.
- Define environment variable and secret management flow across both providers before session create/join work is productionized.

## Installation

```bash
# Core
pnpm add next@16.2.2 react@19.2.4 react-dom@19.2.4 typescript@6.0.2 tailwindcss@4.2.2

# Backend + maps + data layer
pnpm add @google-cloud/firestore@7.11.0 @google-cloud/secret-manager@6.2.0 @google-cloud/logging@11.2.0 @tanstack/react-query@5.96.2 zod@4.3.6 @vis.gl/react-google-maps@1.8.2 @sentry/nextjs@10.47.0

# Optional PWA
pnpm add next-pwa@5.6.0

# Dev dependencies
pnpm add -D playwright@1.59.1 @types/node@25.5.2
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 | Remix | Choose Remix if your team strongly prefers web-standard loaders/actions and does not need Next-specific ecosystem/deployment defaults. |
| Cloud Run + Firestore | Supabase | Choose Supabase if SQL-first modeling and built-in Realtime/Auth reduce complexity more than staying fully GCP-native. |
| Google Maps Platform | Mapbox (Search + Directions) | Choose Mapbox when API cost predictability and map customization are more important than Google POI depth in your launch region. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React Native/Expo for MVP | Conflicts with project constraint (web-first; native out-of-scope) and slows validation cycle | Next.js responsive web + optional PWA |
| Long-lived precise location storage tied to user profiles | Increases privacy/compliance risk and is unnecessary for two-party MVP validation | Session-scoped Firestore documents with TTL auto-expiry |
| Multiple map/place providers at launch | Adds reconciliation bugs, inconsistent ranking, and debugging complexity | One provider first (Google Maps Platform), add abstraction later |
| Coupling frontend deployment to backend runtime | Cross-cloud separation is a deliberate constraint and should remain explicit | Cloudflare frontend + Cloud Run API boundary |

## Stack Patterns by Variant

**If strict cost cap is the top constraint:**
- Use Mapbox for maps/search/directions and aggressively cache place/routing responses.
- Because Google Places/Routes costs can grow quickly with high query volume.

**If native apps become phase-2 priority:**
- Add Expo (SDK 54) and share domain logic packages (ranking, validation, API clients) with web app.
- Because this preserves current web velocity while enabling native clients without backend rewrite.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@16.2.2 | react@19.2.4 | Current mainstream pairing for new Next.js apps. |
| @google-cloud/firestore@7.11.0 | Node.js 20+ runtime | Align Cloud Run runtime and local dev runtime to avoid SDK behavior drift. |
| tailwindcss@4.2.2 | next@16.2.2 | Stable for modern Next App Router projects. |

## Sources

- Context7 `/vercel/next.js` — App Router and Server Actions production guidance
- Google Cloud docs: Cloud Run, Firestore TTL, Secret Manager, Cloud Logging
- Context7 `/expo/expo` — current Expo SDK branch/version context for future native expansion
- npm registry: `https://www.npmjs.com/package/next` (16.2.2), `https://www.npmjs.com/package/react` (19.2.4), `https://www.npmjs.com/package/typescript` (6.0.2), `https://www.npmjs.com/package/@google-cloud/firestore` (7.11.0), `https://www.npmjs.com/package/tailwindcss` (4.2.2), etc.
- Next.js docs: `https://nextjs.org/docs`
- Cloud Run docs: `https://cloud.google.com/run/docs`
- Firestore docs: `https://cloud.google.com/firestore/docs`
- Google Maps Platform docs: `https://developers.google.com/maps`

---
*Stack research for: Meet Me in the Middle*
*Researched: 2026-04-08*
