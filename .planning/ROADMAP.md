# Roadmap: Meet Me in the Middle

## Overview

This roadmap delivers the MVP in dependency order: establish two-person session and consented input reliability first, prove fair ranking quality second, close decisions collaboratively third, then launch with cross-device reliability and instrumentation so stabilization is data-driven.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Discovery & Session/Input Backbone** - Lock critical product/data decisions while delivering resilient two-person create/join and consented location capture.
- [ ] **Phase 2: Fair Ranking & Recommendation Core** - Generate and rank venue candidates by travel-time fairness and preference relevance.
- [ ] **Phase 3: Shared Shortlist & Confirmation** - Turn ranked options into one mutually confirmed destination.
- [ ] **Phase 4: Launch Readiness & Stabilization** - Validate cross-browser funnel reliability and instrument decision funnel analytics.

## Dependency Map and Sequencing Rationale

- **Phase 1 → Phase 2**: Ranking needs valid sessions and confirmed participant locations.
- **Phase 2 → Phase 3**: Shortlisting/confirmation only works once credible ranked results exist.
- **Phase 3 → Phase 4**: Launch reliability and instrumentation require full end-to-end flow.

Rationale: this order follows hard product dependencies and minimizes rework; each phase ends with a user-verifiable capability.

## Early Decisions That Must Be Made

### Product
- Fairness scoring emphasis: optimize for travel-time burden equity vs pure midpoint distance.
- Ranking presentation default: how much explanation appears in list view vs detail view.

### UX
- Join flow friction target: no-account invitee path with explicit consent checkpoints.
- Mobile-first screen order for two-person synchronized input and shortlist actions.

### Data
- Session-first ephemeral schema with server-created session record on User 1 start.
- Precise location retention TTL and deletion policy for session data.
- Event schema for funnel metrics (`session_start`, `inputs_set`, `results_returned`, `decision_confirmed`).

### Technical
- Deployment targets are fixed: Cloudflare for frontend and Google Cloud for backend.
- Backend baseline is fixed: Cloud Run API + Firestore with TTL + Secret Manager + Cloud Logging.
- Primary places/routing provider selection and adapter contract.
- Server-authoritative session state transitions and idempotent confirmation strategy.

## 30-Day Outcomes (Target Signals)

- End-to-end MVP flow is usable by internal testers from create session to confirmed place.
- **Target signal (leading):** ≥70% of internal test sessions reach `results_returned`.
- **Target signal (lagging):** Median time from `session_start` to `decision_confirmed` ≤12 minutes in dogfood runs.

## 90-Day Outcomes (Target Signals)

- Public MVP demonstrates repeatable decision closure for two-party meetups in initial region.
- **Target signal (leading):** ≥60% of sessions with both locations set reach shortlist activity.
- **Target signal (lagging):** ≥35% of started sessions end in `decision_confirmed`, with p95 flow error rate <3%.

## First 2 Weeks Execution Plan

1. Define and implement session schema for server-created sessions on User 1 start (`sessions`, `participants`, lifecycle timestamps/status).
2. Configure and verify TTL policy for session-scoped precise location auto-expiry.
3. Establish deployment foundations: Cloudflare frontend project and Google Cloud backend baseline (Cloud Run + Firestore + Secret Manager + Logging).
4. Deliver create/join session flow with synchronized state and no-account invitee path.
5. Implement and validate create/join lifecycle transitions before ranking integration.

## Phase Details

### Phase 1: Discovery & Session/Input Backbone
**Goal**: Two participants can reliably create/join one session and provide consented location inputs that synchronize in real time.
**Depends on**: Nothing (first phase)
**Requirements**: SESS-01, SESS-02, SESS-03, LOCT-01, LOCT-02, LOCT-03
**Objective**: Remove startup friction and input failure risk so downstream ranking has trustworthy participant data.
**Core Deliverables**:
- Server-created session at User 1 start with shareable link and invitee join.
- Synchronized shared session state for both participants using server-authoritative lifecycle transitions.
- Ephemeral session persistence with TTL auto-expiry for precise location fields.
- Location capture with permission flow, manual fallback, and explicit confirmation.
**Success Metrics**:
- **Leading**: Session join completion rate from shared link.
- **Leading**: Location input completion rate after geolocation denial.
- **Lagging**: Drop-off before both locations confirmed.
**Major Risks**:
- Geolocation denial/timeout causes abandonment.
- Session state desync creates trust failure.
- Cross-provider deployment setup drift (env vars/secrets/networking) slows early integration.
**Assumptions**:
- Invitees accept no-account join for MVP.
- Manual address entry can recover most geolocation failures.
**Non-Goals**:
- User accounts/profile persistence.
- Group sessions beyond two participants.
**Success Criteria** (what must be TRUE):
  1. User can create a two-person session and share a join link that successfully opens the same session for the invitee.
  2. Invitee can join from link without account creation and both participants see the same live session state.
  3. Each participant can provide location via geolocation or typed address and proceed without dead ends.
  4. Each participant explicitly confirms the location used for later ranking.
**Plans**: 3 plans
Plans:
- [x] 01-01-PLAN.md — Define session schema and implement server-created create/join contracts with no-account invitee flow.
- [x] 01-02-PLAN.md — Implement canonical lifecycle transitions and synchronized state for both participants.
- [x] 01-03-PLAN.md — Add TTL expiry policy for precise location plus fallback capture and explicit confirmation gate.
**UI hint**: yes

### Phase 2: Fair Ranking & Recommendation Core
**Goal**: Participants receive ranked venue recommendations that reflect travel fairness split and selected preference tags.
**Depends on**: Phase 1
**Requirements**: FAIR-01, PREF-01, PREF-02, RANK-01, RANK-02, RANK-03
**Objective**: Prove the core value proposition by producing recommendations both users perceive as fair and relevant.
**Core Deliverables**:
- Travel willingness split input (50/50, 60/40, 70/30).
- Preference tag selection and ranking influence.
- Candidate retrieval and ranking with ETA and venue metadata.
**Success Metrics**:
- **Leading**: Results generation success rate after both locations are confirmed.
- **Leading**: Percentage of sessions where users interact with top-5 ranked venues.
- **Lagging**: User-reported fairness acceptance in test sessions.
**Major Risks**:
- Poor ranking relevance undermines trust.
- Provider latency/cost spikes degrade responsiveness.
**Assumptions**:
- Single-provider venue coverage is adequate in launch region.
- Predefined willingness splits match common negotiation behavior.
**Non-Goals**:
- Multi-provider aggregation.
- Deep personalization or context modes.
**Success Criteria** (what must be TRUE):
  1. Each participant can set one willingness split option (50/50, 60/40, 70/30) before ranking.
  2. Participants can select preference tags and see ranked results change accordingly.
  3. System returns ranked candidate venues between both participants using configured provider data.
  4. Each ranked result displays ETA per participant, venue category, and open status when available.
**Plans**: 3 plans
Plans:
- [ ] 02-01-PLAN.md — Define and validate willingness split + preference tag input contracts and persistence API.
- [ ] 02-02-PLAN.md — Implement provider-backed candidate retrieval and fairness+preference ranking endpoint.
- [ ] 02-03-PLAN.md — Wire ranking input/result UX with ETA/category/open-status metadata rendering.
**UI hint**: yes

### Phase 3: Shared Shortlist & Confirmation
**Goal**: Both participants can converge from ranked results to one confirmed place with clear handoff for navigation.
**Depends on**: Phase 2
**Requirements**: DECS-01, DECS-02, DECS-03
**Objective**: Convert recommendation quality into completed decisions with minimal back-and-forth.
**Core Deliverables**:
- Shared shortlist actions on ranked venues.
- Conflict-safe final confirmation visible to both participants.
- External map/deep-link handoff for confirmed destination.
**Success Metrics**:
- **Leading**: Shortlist interaction rate after results are shown.
- **Leading**: Confirmation success rate once shortlist has at least one item.
- **Lagging**: Median time from first shortlist action to confirmation.
**Major Risks**:
- Race conditions create conflicting confirmations.
- Ambiguous ownership of final confirm action increases friction.
**Assumptions**:
- Shared shortlist is enough to replace chat for MVP.
- External navigation handoff satisfies post-confirmation need.
**Non-Goals**:
- In-app messaging.
- Reservation/booking integrations.
**Success Criteria** (what must be TRUE):
  1. Both participants can add venues to a single shared shortlist and see updates in near real time.
  2. Session can end with one confirmed place that is clearly visible as final for both participants.
  3. Confirmed place provides a working external map/deep link for navigation handoff.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Launch Readiness & Stabilization
**Goal**: The full decision workflow runs reliably on modern mobile/desktop browsers and exposes funnel telemetry for launch tuning.
**Depends on**: Phase 3
**Requirements**: PLAT-01, PLAT-02
**Objective**: Reduce launch risk by proving compatibility and making performance/conversion measurable.
**Core Deliverables**:
- Cross-browser validation of core flow on mobile web and desktop.
- Instrumented funnel events for start, input completion, results, and confirmation.
- Stabilization pass on top failure modes discovered in staged usage.
**Success Metrics**:
- **Leading**: Browser/device pass rate for full funnel test suite.
- **Leading**: Event completeness rate for the four required funnel events.
- **Lagging**: Stable baseline conversion from `session_start` to `decision_confirmed` in launch cohort.
**Major Risks**:
- Browser-specific regressions at launch.
- Missing/dirty analytics events hide bottlenecks.
**Assumptions**:
- Modern-browser scope is acceptable for initial go-to-market.
- Four-event funnel is sufficient for first optimization loop.
**Non-Goals**:
- Native iOS/Android apps.
- Advanced experimentation platform.
**Success Criteria** (what must be TRUE):
  1. Users can complete the end-to-end flow on modern mobile and desktop browsers without platform-specific blockers.
  2. Required funnel events are captured for each session lifecycle (`session_start`, `inputs_set`, `results_returned`, `decision_confirmed`).
  3. Top launch-blocking reliability issues are fixed and verified in staged runs before broad rollout.
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Discovery & Session/Input Backbone | 3/3 | Complete | 01-01, 01-02, 01-03 |
| 2. Fair Ranking & Recommendation Core | 0/TBD | Not started | - |
| 3. Shared Shortlist & Confirmation | 0/TBD | Not started | - |
| 4. Launch Readiness & Stabilization | 0/TBD | Not started | - |
