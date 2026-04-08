# Meet Me in the Middle

## What This Is

Meet Me in the Middle is a mobile and web app that helps two people quickly agree on where to meet when they start in different places. Each participant shares location, travel willingness (such as 70/30), and high-level preferences, and the app returns ranked places that feel fair and relevant. Initial focus is professional networking and dating meetups.

## Core Value

Turn a slow, awkward "where should we meet?" negotiation into a fast and fair decision both people accept.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Two-person session flow where one person creates and the other joins
- [ ] Location capture for both participants with clear consent
- [ ] Travel willingness input with asymmetric split options (50/50, 60/40, 70/30)
- [ ] Preference tag selection (for example coffee, cocktails, vintage shops)
- [ ] Ranked venue recommendations based on fairness, travel burden, and preferences
- [ ] Shortlist and confirmation flow that ends with one selected place

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

## Constraints

- **Platform**: Web-first responsive experience for mobile and desktop — optimize build speed and shared code.
- **Scope**: Two participants only for v1 — keep fairness model and UI simple.
- **Privacy**: Minimize precise location retention — reduce trust and compliance risk early.
- **Integration**: One places provider and one routing provider initially — contain cost and reliability variance.
- **Execution**: High-leverage MVP before expansion — prioritize proof of core value over breadth.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Start with travel-time fairness instead of geometric midpoint | Fairness perception is based on effort and time, not distance | - Pending |
| Use percentage-based willingness split (for example 70/30) | Mirrors real negotiation language and user intent | - Pending |
| Launch with tag-based preferences before deeper personalization | Fast to implement while still improving recommendation quality | - Pending |
| Build mobile web first, then evaluate native apps | Enables faster validation and lower initial complexity | - Pending |

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
*Last updated: 2026-04-08 after initialization*
