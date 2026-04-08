# Stack Research

**Domain:** Two-party meetup location negotiation app (web-first, mobile-responsive)
**Researched:** 2026-04-08
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.2.2 | Full-stack web app framework (UI + server routes/actions) | Fastest path to a production web MVP with strong DX, App Router defaults, and first-class deployment on Vercel. Fits your explicit web-first scope and keeps iteration loop short. **Confidence: HIGH** |
| React | 19.2.4 | UI runtime for interactive negotiation/session flows | Current React baseline for Next.js apps; large ecosystem and predictable hiring/support. **Confidence: HIGH** |
| TypeScript | 6.0.2 | Type safety across UI, scoring logic, and integrations | Reduces regressions in fairness logic and API contracts while still moving quickly. **Confidence: HIGH** |
| Supabase (Postgres + Auth + Realtime + Storage + Edge Functions) | Cloud-managed (use `@supabase/supabase-js` 2.102.1, `@supabase/ssr` 0.10.0) | Backend platform for auth, session state, shortlist persistence, and realtime updates | Best speed/cost tradeoff for greenfield: one platform covers database, auth, and realtime without assembling many services. **Confidence: HIGH** |
| PostGIS (Supabase extension) | Supabase-managed extension (rolling) | Geospatial queries (distance filters, candidate area computations) | Meetup ranking is geo/time-driven; PostGIS removes need for custom geo infra and scales better than app-side distance math. **Confidence: HIGH** |
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
| Supabase CLI 2.88.0 | Local DB, migrations, type generation | Use SQL migrations + generated TS types; keep schema evolution explicit and reviewable. |
| Playwright 1.59.1 | End-to-end testing for critical flows | Cover create/join session, location consent, ranking, shortlist confirmation before scaling traffic. |

## Installation

```bash
# Core
pnpm add next@16.2.2 react@19.2.4 react-dom@19.2.4 typescript@6.0.2 tailwindcss@4.2.2

# Backend + maps + data layer
pnpm add @supabase/supabase-js@2.102.1 @supabase/ssr@0.10.0 @tanstack/react-query@5.96.2 zod@4.3.6 @vis.gl/react-google-maps@1.8.2 @sentry/nextjs@10.47.0

# Optional PWA
pnpm add next-pwa@5.6.0

# Dev dependencies
pnpm add -D playwright@1.59.1 @types/node@25.5.2
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 | Remix | Choose Remix if your team strongly prefers web-standard loaders/actions and does not need Next-specific ecosystem/deployment defaults. |
| Supabase | Firebase | Choose Firebase if Firestore’s document model and Google-native ecosystem matter more than SQL/PostGIS capabilities. |
| Google Maps Platform | Mapbox (Search + Directions) | Choose Mapbox when API cost predictability and map customization are more important than Google POI depth in your launch region. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React Native/Expo for MVP | Conflicts with project constraint (web-first; native out-of-scope) and slows validation cycle | Next.js responsive web + optional PWA |
| Self-hosted Postgres + custom auth + custom websocket stack | Ops-heavy for greenfield; increases maintenance before product fit | Supabase managed Postgres/Auth/Realtime |
| Multiple map/place providers at launch | Adds reconciliation bugs, inconsistent ranking, and debugging complexity | One provider first (Google Maps Platform), add abstraction later |
| ORM-first schema design (e.g., Prisma-first) for geo + RLS-heavy MVP | Often creates friction with PostGIS features and Supabase RLS workflows | SQL-first migrations via Supabase CLI + typed query layer |

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
| @supabase/ssr@0.10.0 | @supabase/supabase-js@2.102.1 | SSR helpers wrap supabase-js; keep both updated together. |
| tailwindcss@4.2.2 | next@16.2.2 | Stable for modern Next App Router projects. |

## Sources

- Context7 `/vercel/next.js` — App Router and Server Actions production guidance
- Context7 `/supabase/supabase` — Supabase JS client, Realtime/auth/database capabilities
- Context7 `/expo/expo` — current Expo SDK branch/version context for future native expansion
- npm registry: `https://www.npmjs.com/package/next` (16.2.2), `https://www.npmjs.com/package/react` (19.2.4), `https://www.npmjs.com/package/typescript` (6.0.2), `https://www.npmjs.com/package/@supabase/supabase-js` (2.102.1), `https://www.npmjs.com/package/tailwindcss` (4.2.2), etc.
- Next.js docs: `https://nextjs.org/docs`
- Supabase docs: `https://supabase.com/docs`
- Google Maps Platform docs: `https://developers.google.com/maps`

---
*Stack research for: Meet Me in the Middle*
*Researched: 2026-04-08*
