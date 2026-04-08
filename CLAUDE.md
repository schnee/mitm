<!-- GSD:project-start source:PROJECT.md -->
## Project

**Meet Me in the Middle**

Meet Me in the Middle is a mobile and web app that helps two people quickly agree on where to meet when they start in different places. Each participant shares location, travel willingness (such as 70/30), and high-level preferences, and the app returns ranked places that feel fair and relevant. Initial focus is professional networking and dating meetups.

**Core Value:** Turn a slow, awkward "where should we meet?" negotiation into a fast and fair decision both people accept.

### Constraints

- **Platform**: Web-first responsive experience for mobile and desktop — optimize build speed and shared code.
- **Scope**: Two participants only for v1 — keep fairness model and UI simple.
- **Privacy**: Minimize precise location retention — reduce trust and compliance risk early.
- **Integration**: One places provider and one routing provider initially — contain cost and reliability variance.
- **Execution**: High-leverage MVP before expansion — prioritize proof of core value over breadth.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
# Core
# Backend + maps + data layer
# Optional PWA
# Dev dependencies
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
- Use Mapbox for maps/search/directions and aggressively cache place/routing responses.
- Because Google Places/Routes costs can grow quickly with high query volume.
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
