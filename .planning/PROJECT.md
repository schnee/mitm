# Meet Me in the Middle

## What This Is

Meet Me in the Middle is a mobile and web app that helps two people quickly agree on where to meet when they start in different places. Each participant shares location, travel willingness (such as 70/30), and high-level preferences, and the app returns ranked places that feel fair and relevant. Initial focus is professional networking and dating meetups.

## Core Value

Turn a slow, awkward "where should we meet?" negotiation into a fast and fair decision both people accept.

## Requirements

### Validated

- [x] Two-person session flow where one person creates and the other joins (validated in Phase 1)
- [x] Location capture for both participants with clear consent (validated in Phase 1)
- [x] Travel willingness input with asymmetric split options (50/50, 60/40, 70/30) (validated in Phase 2)
- [x] Preference tag selection (for example coffee, cocktails, vintage shops) (validated in Phase 2)
- [x] Ranked venue recommendations based on fairness, travel burden, and preferences (validated in Phase 2)
- [x] Shortlist and confirmation flow that ends with one selected place (validated in Phase 3)
- [x] Cross-device launch readiness and funnel telemetry for modern web browsers (validated in Phase 4)

### Active

- [x] Phase 7 orchestration: auto-transition from ranking-input save to waiting/generating states without manual ranking trigger (UX-11)
- [x] Phase 7 orchestration: generate one canonical session-level ranked list from both participants' saved ranking inputs (UX-12, UX-13)
- [x] Phase 7 orchestration: make `Refresh ranking` optional secondary action while removing required `Run ranking` in main flow (UX-14)
- [x] Phase 7 orchestration: provide actionable ranking-failure retry states that preserve location/ranking progress (UX-15)
- [x] Phase 7 orchestration: ensure idempotent concurrent-save handling, lifecycle telemetry, and responsive shared-results consistency (UX-16, UX-17, UX-18)
- [ ] Phase 8 UX orchestration: replace long vertical flow with guided single-active-step progression and collapsed completed-step summaries (UX-19, UX-20)
- [ ] Phase 8 UX orchestration: add sticky two-person session status + mobile next-action CTA to reduce uncertainty and unblock progression (UX-21, UX-22)
- [ ] Phase 8 map-first decisioning: synchronize ranked spots between markers and list interactions with clear shortlist/confirmed marker states (UX-23, UX-24)
- [ ] Phase 8 state clarity/accessibility: deliver concise partner-progress feedback states with responsive + accessible behavior on mobile/desktop (UX-25, UX-26)

### Out of Scope

- Group meetups (3+ participants) — added coordination complexity not required for MVP value test
- In-app chat and full social profiles — not essential to proving decision-speed and fairness value
- Native iOS/Android apps — mobile web is enough for early validation and faster iteration
- Reservations, ticketing, and payments — external booking is unnecessary for MVP outcome

## Context

- Current behavior is manual back-and-forth via text, map links, and ad hoc compromise.
- User trust depends on perceived fairness and low setup friction.
- For MVP, single-region rollout and limited provider integrations reduce operational risk.
- Success depends on converting intent into confirmed meeting places quickly.
- Ranking orchestration now prioritizes one shared, auto-generated list so both participants converge without manual reruns.
- Next focus is mobile-first guided/collapsible flow and map-driven decisioning to reduce scroll friction without expanding MVP scope.

## Constraints

- **Platform**: Web-first responsive experience for mobile and desktop — optimize build speed and shared code.
- **Scope**: Two participants only for v1 — keep fairness model and UI simple.
- **Privacy**: Minimize precise location retention with session TTL auto-expiry — reduce trust and compliance risk early.
- **Integration**: One places provider and one routing provider initially — contain cost and reliability variance.
- **Deployment**: Frontend deploys to Cloudflare and backend deploys to Google Cloud — keep edge delivery and backend service concerns clearly separated.
- **Execution**: High-leverage MVP before expansion — prioritize proof of core value over breadth.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Start with travel-time fairness instead of geometric midpoint | Fairness perception is based on effort and time, not distance | - Pending |
| Use percentage-based willingness split (for example 70/30) | Mirrors real negotiation language and user intent | - Pending |
| Launch with tag-based preferences before deeper personalization | Fast to implement while still improving recommendation quality | - Pending |
| Build mobile web first, then evaluate native apps | Enables faster validation and lower initial complexity | - Pending |
| Keep Phase 6 scoped to UX polish only | Maintains execution focus and avoids re-opening validated ranking/provider decisions | Decided 2026-04-09 |
| Keep Phase 7 scoped to shared ranking flow orchestration only | Improves coordination speed/trust while preserving validated fairness algorithm and provider integrations | Decided 2026-04-09 |
| Keep Phase 8 scoped to guided flow and map/list decision UX only | Reduces friction and coordination ambiguity while preserving two-participant model, fairness fundamentals, provider integrations, and existing backend contracts | Planned 2026-04-10 |
| Deploy frontend on Cloudflare | Fast global edge delivery aligns with web-first MVP and mobile responsiveness goals | Decided 2026-04-08 |
| Deploy backend on Google Cloud | Supports managed backend services and future scaling flexibility for session/realtime/ranking workloads | Decided 2026-04-08 |
| Use session-first ephemeral persistence (Alternative 3) | Creating a server session at User 1 start reduces flow fragility while TTL limits sensitive retention | Decided 2026-04-08 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after Phase 8 scoping (mobile-first guided flow and map-driven decisioning)*
