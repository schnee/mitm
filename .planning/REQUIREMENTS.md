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

### v1.x UX Polish (UX-only Scope)

- [ ] **UX-06**: Redesign create-session startup screen with clear hierarchy, confidence copy, and primary CTA.
- [ ] **UX-07**: Redesign negotiation/ranking screen for readability, explainability clarity, and faster decision actions.
- [ ] **UX-08**: Improve loading/empty/error/success states across startup, ranking, shortlist, and confirmation.
- [ ] **UX-09**: Ensure polished responsive behavior on mobile + desktop breakpoints for the full flow.
- [ ] **UX-10**: Accessibility polish baseline (focus visibility, labels, contrast, keyboard operability for key actions).

Scope guardrail: UX polish only for v1.x; no fairness algorithm or provider changes.

### v1.x Shared Auto-Ranking & Synced Results (UX/Flow Orchestration Scope)

- [ ] **UX-11**: After a participant saves ranking inputs, UI transitions immediately to a clear next state: waiting for other participant if only one has saved, generating suggestions when both are ready.
- [ ] **UX-12**: System computes one canonical ranked list per session using both participants' saved ranking inputs while preserving current split handling and preference merge behavior.
- [ ] **UX-13**: Canonical ranked results persist at session scope and synchronize to both participants so both see the same ordered list without manual rerun.
- [ ] **UX-14**: `Run ranking` is removed as a required primary action from the main flow; optional secondary `Refresh ranking` remains available for retry/recompute.
- [ ] **UX-15**: If ranking generation fails (provider error, missing prerequisites, transient failure), users see actionable messaging with retry path and no loss of prior progress.
- [ ] **UX-16**: Ranking generation is idempotent and conflict-safe under concurrent saves from both participants, preventing duplicate/conflicting list states.
- [ ] **UX-17**: Telemetry captures flow events: `ranking_inputs_saved`, `ranking_waiting_for_partner`, `ranking_generation_started`, `ranking_generation_succeeded`, `ranking_generation_failed`, `ranking_results_rendered`.
- [ ] **UX-18**: Shared ranked list rendering remains consistent across desktop/mobile breakpoints and preserves explainability/reaction affordances delivered in Phase 5/6.

Scope guardrail: keep split decision behavior conceptually unchanged; do not change fairness algorithm fundamentals or provider integrations; do not expand beyond two-user sessions.

### v1.x Mobile-First Guided Flow & Map-Driven Decisioning (UX Orchestration/Presentation Scope)

- [ ] **UX-19**: Replace long vertical flow with a guided stepper (Location -> Preferences -> Spots -> Shortlist -> Confirm) that shows one primary step expanded at a time.
- [ ] **UX-20**: Completed steps auto-collapse into compact summary rows (for example, "Location: Confirmed") to reduce scrolling.
- [ ] **UX-21**: Add a sticky session status bar that shows progress for both users (You and Partner) and clearly indicates who is blocking the next step.
- [ ] **UX-22**: Add a sticky primary CTA area on mobile that always presents the single next action for the current user.
- [ ] **UX-23**: Introduce a map-first "Ranked spots" view with synchronized markers and list items (tap list highlights marker; tap marker focuses list item).
- [ ] **UX-24**: Update map state when shortlist changes: shortlisted spots use distinct marker styling, and confirmed spot is visually locked/highlighted.
- [ ] **UX-25**: Add concise, state-specific feedback for waiting/loading/error/success, including partner-progress updates (for example, "Waiting for partner to save preferences").
- [ ] **UX-26**: Preserve responsive usability and accessibility across mobile and desktop (focus order, tap targets, contrast, keyboard fallback for core actions).

Scope guardrails:
- Keep two-participant model unchanged.
- Do not change fairness algorithm fundamentals or provider integrations.
- Reuse current ranking/decision backend contracts where possible; prioritize UX orchestration and presentation.

Acceptance criteria:
- On mobile, users can complete end-to-end flow with materially less scrolling (single active step + collapsed completed steps).
- At every point, both users can see what they need to do next and what the other participant has completed.
- Suggestions are visible on both map and list, and shortlist/confirm actions update both representations consistently.
- Confirmed place state is unambiguous on both clients and reflected in the map.
- No regression in existing create/join, location confirmation, preference save, shortlist, and confirmation flows.

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
| SESS-01 | Phase 9 | Pending |
| SESS-02 | Phase 9 | Pending |
| SESS-03 | Phase 10 | Pending |
| LOCT-01 | Phase 9 | Pending |
| LOCT-02 | Phase 10 | Pending |
| LOCT-03 | Phase 10 | Pending |
| FAIR-01 | Phase 9 | Pending |
| PREF-01 | Phase 9 | Pending |
| PREF-02 | Phase 9 | Pending |
| RANK-01 | Phase 9 | Pending |
| RANK-02 | Phase 9 | Pending |
| RANK-03 | Phase 9 | Pending |
| DECS-01 | Phase 9 | Pending |
| DECS-02 | Phase 9 | Pending |
| DECS-03 | Phase 9 | Pending |
| PLAT-01 | Phase 9 | Pending |
| PLAT-02 | Phase 9 | Pending |
| UX-06 | Phase 9 | Pending |
| UX-07 | Phase 9 | Pending |
| UX-08 | Phase 9 | Pending |
| UX-09 | Phase 9 | Pending |
| UX-10 | Phase 9 | Pending |
| UX-11 | Phase 10 | Pending |
| UX-12 | Phase 9 | Pending |
| UX-13 | Phase 10 | Pending |
| UX-14 | Phase 9 | Pending |
| UX-15 | Phase 9 | Pending |
| UX-16 | Phase 9 | Pending |
| UX-17 | Phase 9 | Pending |
| UX-18 | Phase 9 | Pending |
| UX-19 | Phase 9 | Pending |
| UX-20 | Phase 9 | Pending |
| UX-21 | Phase 9 | Pending |
| UX-22 | Phase 9 | Pending |
| UX-23 | Phase 11 | Pending |
| UX-24 | Phase 11 | Pending |
| UX-25 | Phase 10 | Pending |
| UX-26 | Phase 11 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Checked off (current): 0
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-10 after milestone gap audit and closure phase planning (Phases 9-11)*
