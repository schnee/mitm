# Requirements: Meet Me in the Middle

**Defined:** 2026-04-08
**Core Value:** Turn a slow, awkward "where should we meet?" negotiation into a fast and fair decision both people accept.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Sessions

- [ ] **SESS-01**: User can create a two-person meetup session and receive a shareable join link.
- [ ] **SESS-02**: Invitee can join session from link without creating an account.
- [ ] **SESS-03**: Both participants can see synchronized session state (inputs, shortlist, confirmation status).

### Location and Consent

- [ ] **LOCT-01**: User can provide location via current location permission or typed address.
- [ ] **LOCT-02**: User can review and confirm the location used for ranking before results are generated.
- [ ] **LOCT-03**: If geolocation fails or is denied, user can complete flow via manual location entry.

### Travel Fairness and Preferences

- [ ] **FAIR-01**: Each participant can set willingness-to-travel split using predefined options (50/50, 60/40, 70/30).
- [ ] **PREF-01**: Participants can select high-level preference tags (for example coffee, cocktails, vintage shops).
- [ ] **PREF-02**: Preference tags influence ranking order of candidate venues.

### Venue Retrieval and Ranking

- [ ] **RANK-01**: System retrieves candidate venues between both participants using one configured places provider.
- [ ] **RANK-02**: System ranks candidates using travel-time fairness and preference relevance.
- [ ] **RANK-03**: Each result shows key decision metadata: ETA per participant, venue category, and open status when available.

### Decision Flow

- [ ] **DECS-01**: Both participants can add candidates to a shared shortlist.
- [ ] **DECS-02**: Session can end with one confirmed place visible to both participants.
- [ ] **DECS-03**: Confirmed place provides external map/deep link for navigation handoff.

### Web and Reliability

- [ ] **PLAT-01**: Core flow works on mobile web and desktop web from modern browsers.
- [ ] **PLAT-02**: Core decision funnel events are captured for analytics (`session_start`, `inputs_set`, `results_returned`, `decision_confirmed`).

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Ranking and UX Enhancements

- **UXEX-01**: User sees explainable fairness breakdown card for each ranked venue.
- **UXEX-02**: Users can quickly react accept/reject to candidate venues for faster consensus.
- **UXEX-03**: User can pick context mode (date/networking/casual) that adjusts ranking weights.

### Privacy and Personalization

- **PRIV-01**: User can default to approximate location until final confirmation.
- **PERS-01**: User can save default travel split and preferred tags across sessions.

### Expansion

- **GRUP-01**: Session supports 3+ participants with fair ranking.
- **NATV-01**: Native iOS and Android apps are available with shared backend logic.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| In-app chat/messaging | Not required to validate core fair-meeting value; high moderation and notification overhead |
| Reservations and payments | High integration burden before proving recommendation quality and completion rate |
| Full social profiles/feed | Distracts from single decision workflow and adds privacy complexity |
| Multi-provider map/routing abstraction in v1 | Increases API complexity and debugging surface during MVP |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SESS-01 | Phase 1 | Complete |
| SESS-02 | Phase 1 | Complete |
| SESS-03 | Phase 1 | Complete |
| LOCT-01 | Phase 1 | Complete |
| LOCT-02 | Phase 1 | Complete |
| LOCT-03 | Phase 1 | Complete |
| FAIR-01 | Phase 2 | Pending |
| PREF-01 | Phase 2 | Pending |
| PREF-02 | Phase 2 | Pending |
| RANK-01 | Phase 2 | Pending |
| RANK-02 | Phase 2 | Pending |
| RANK-03 | Phase 2 | Pending |
| DECS-01 | Phase 3 | Pending |
| DECS-02 | Phase 3 | Pending |
| DECS-03 | Phase 3 | Pending |
| PLAT-01 | Phase 4 | Pending |
| PLAT-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after initial definition*
