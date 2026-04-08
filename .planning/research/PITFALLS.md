# Pitfalls Research

**Domain:** Two-party meetup location negotiation (location recommendations + coordination)
**Researched:** 2026-04-08
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Optimizing for geometric midpoint instead of travel burden fairness

**What goes wrong:**
Recommendations look “mathematically central” but feel unfair because one person gets a much longer ETA, more transfers, or higher effort.

**Why it happens:**
Teams shortcut to lat/lng midpoint distance because it is easy to implement and demo.

**How to avoid:**
- Use travel-time matrix as the primary optimization objective (not straight-line distance).
- Score candidate venues with explicit fairness terms: max(ETA_A, ETA_B), ETA gap, and willingness split (50/50, 60/40, 70/30).
- Include mode-aware routing (walk/transit/drive) and time-of-day where available.

**Warning signs:**
- User feedback: “This is closer for them, not me.”
- High shortlist abandonment after viewing ETAs.
- Frequent manual override to a non-top-ranked venue.

**Phase to address:**
Phase 2 — Fairness scoring + ranking engine.

---

### Pitfall 2: Opaque ranking destroys trust in “fairness”

**What goes wrong:**
Even good results are rejected because users cannot tell *why* a place is ranked first.

**Why it happens:**
Teams treat ranking explainability as “nice to have” and only show a list.

**How to avoid:**
- Show per-result explanation chips: “22 min vs 25 min”, “matches coffee + quiet”, “within your 60/40 split.”
- Add “why this ranked here” breakdown in detail view.
- Log rejection reasons to tune weighting.

**Warning signs:**
- Users repeatedly ask “how did you pick this?”
- Low acceptance despite good ETA parity.
- A/B tests show no lift from improved model quality.

**Phase to address:**
Phase 2 — Ranking UI + explanation instrumentation.

---

### Pitfall 3: Geolocation permission and accuracy failure paths are underdesigned

**What goes wrong:**
Session setup fails when location permission is denied/timed out/unavailable, or browser policy blocks access.

**Why it happens:**
Happy-path implementation assumes geolocation always works.

**How to avoid:**
- Build explicit states for `PERMISSION_DENIED`, `POSITION_UNAVAILABLE`, and `TIMEOUT`.
- Provide graceful fallback: manual address input + map pin.
- Use HTTPS everywhere and test iframe/policy scenarios if embedded.
- Capture returned accuracy (meters) and downgrade confidence when coarse.

**Warning signs:**
- Elevated join drop-off on location step.
- Spikes in geolocation error codes.
- Support reports: “app says can’t locate me.”

**Phase to address:**
Phase 1 — Session creation/join + consent and fallback UX.

---

### Pitfall 4: Violating geocoding storage/licensing rules

**What goes wrong:**
Team caches/stores geocoding results in ways disallowed by provider terms, creating compliance and migration risk.

**Why it happens:**
Developers assume all geocodes are storable forever.

**How to avoid:**
- Decide early: temporary vs permanent geocoding mode.
- For Mapbox, use permanent geocoding only where persistence is required and budgeted.
- Keep provider-specific data retention policy in code/docs and architecture review checklist.

**Warning signs:**
- Long-lived DB tables full of raw geocoder payloads without legal review.
- No distinction between session cache and persistent storage.
- Missing provider compliance notes in ADRs.

**Phase to address:**
Phase 0 — Data policy + provider contract constraints.

---

### Pitfall 5: Place freshness blind spots (closed venues, stale IDs/hours)

**What goes wrong:**
App suggests closed/unavailable places; users lose confidence quickly.

**Why it happens:**
Teams treat place data as static and skip runtime validity checks.

**How to avoid:**
- Resolve and store canonical place IDs, but re-hydrate freshness fields at recommendation time.
- Check status fields (e.g., operational status) and opening-hours proximity before ranking.
- Add “report bad suggestion” feedback loop and suppress repeated failures.

**Warning signs:**
- Increased “place closed” reports.
- Frequent ZERO_RESULTS/NOT_FOUND on place details lookup.
- Confirmed meetup rate drops despite stable traffic.

**Phase to address:**
Phase 3 — Recommendation quality hardening + feedback loop.

---

### Pitfall 6: API cost/quota blowups from fan-out queries

**What goes wrong:**
Autocomplete, matrix routing, and place details calls multiply per keystroke/session, causing throttling (429/OVER_QUERY_LIMIT) and unexpected spend.

**Why it happens:**
No request budgeting, no session token discipline, no debouncing/caching.

**How to avoid:**
- Debounce autocomplete and require minimum query length.
- Use unique session tokens correctly per autocomplete session.
- Batch matrix requests and cap candidate set before expensive calls.
- Enforce per-session API budget and circuit breakers.

**Warning signs:**
- Rising cost per completed meetup.
- 429 / OVER_QUERY_LIMIT error spikes.
- Latency spikes during peak usage due to retries/backoff.

**Phase to address:**
Phase 1 (token + debounce baseline) and Phase 3 (cost guardrails + observability).

---

### Pitfall 7: Coordination race conditions in two-party session state

**What goes wrong:**
Both users act simultaneously (shortlist/confirm/edit preferences), causing conflicting final states or phantom confirmations.

**Why it happens:**
State transitions are not modeled as a strict finite-state machine with idempotent server actions.

**How to avoid:**
- Define server-authoritative session FSM (Created → Joined → Ranked → Shortlisted → Confirmed).
- Use optimistic concurrency/version checks for writes.
- Make confirm action idempotent and append-only event logged.

**Warning signs:**
- Duplicate confirmations for different venues.
- “My screen says confirmed, theirs says pending.”
- High rate of reconciliation patches/hotfixes.

**Phase to address:**
Phase 1 — Core session model + synchronization contract.

---

### Pitfall 8: Over-collecting precise location and retaining too long

**What goes wrong:**
Product accumulates sensitive trace data not needed for MVP, increasing privacy risk and user discomfort.

**Why it happens:**
“Store everything for analytics” mindset and absent data minimization boundaries.

**How to avoid:**
- Store least-precision needed for ranking/audit (e.g., coarse origin tile after session close).
- Set TTL on raw coordinates and delete automatically.
- Separate operational logs from analytics; redact exact lat/lng where not required.
- Make consent copy explicit about what is stored and for how long.

**Warning signs:**
- Raw coordinates present in long-term logs.
- No data retention jobs configured.
- Privacy review cannot answer retention period confidently.

**Phase to address:**
Phase 0 — Privacy model + retention policy, verified again in Phase 4.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Midpoint by straight-line distance only | Fast MVP demo | Re-ranking rewrite when fairness complaints appear | Only for prototype spikes, never production MVP |
| Client-only ranking logic | Faster iteration | Trust and integrity issues; easy tampering | Acceptable only before any shared session confirm flow |
| Persist full provider payloads blindly | Easy debugging | Terms/licensing and schema lock-in risk | Only in short-lived debug storage with strict TTL |
| Polling every few seconds for session sync | Simple implementation | Battery/network cost and scaling pain | Acceptable for low-volume alpha; replace with evented updates |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Browser Geolocation API | Assuming location always available | Handle denied/unavailable/timeout states + manual fallback |
| Places provider | Using deprecated/non-canonical identifiers | Use canonical place IDs and refresh details before final ranking |
| Places autocomplete | Reusing/omitting session token | Generate unique token per typing session; complete with details call |
| Routing matrix API | Calling matrix on too many candidates | Pre-filter candidates first, then matrix top-N only |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N×M route matrix on every filter change | Slow ranking UI, provider throttling | Cache by origin+time bucket, pre-filter, recompute selectively | ~hundreds of concurrent sessions |
| Keystroke-level autocomplete without debounce | API burst, jittery UX | 250–400ms debounce + min chars + cancel in-flight requests | Even at low traffic, noticeable cost |
| Full place-details fetch for all candidates | High latency to first recommendation | Fetch lightweight search first; hydrate details lazily for shortlist | ~10+ candidates per query |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing precise home/work coordinates in URLs or logs | Sensitive location disclosure | Use opaque session IDs; avoid lat/lng in share links; log redaction |
| Weak join-code entropy for two-party sessions | Session hijacking/trolling | High-entropy one-time join tokens + expiration + attempt limits |
| Trusting client-provided fairness score | Manipulated ranking/selection | Recompute fairness server-side and sign decision payloads |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Asking for too much upfront (exact prefs, many fields) | Abandonment before first recommendation | Progressive disclosure: location + willingness first, refine later |
| No explicit “fairness” explanation | Perceived bias toward one person | Show side-by-side ETA burden and split rationale |
| Ranking unstable between refreshes | Confusion and distrust | Freeze ranking snapshot for active session version |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Location capture:** Works when permission denied/timeouts — verify manual fallback flow and analytics for each failure code.
- [ ] **Fairness ranking:** Not just distance — verify objective uses ETA + split weight + tie-breakers.
- [ ] **Venue recommendations:** Not stale — verify operational/open checks before showing top results.
- [ ] **Two-party confirmation:** Conflict-safe — verify idempotent confirm and versioned session writes.
- [ ] **Provider usage:** Cost-safe — verify debounce, token usage, and per-session request budget alerts.
- [ ] **Privacy:** Minimization enforced — verify TTL deletion of raw coordinates in production.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Unfair ranking complaints | MEDIUM | Ship explainability + rebalance weights + run replay analysis on rejected sessions |
| Closed/stale venue recommendations | MEDIUM | Add freshness re-check layer + suppress bad place IDs + backfill QA tests |
| Quota/cost incident | LOW/MEDIUM | Enable kill-switch for expensive endpoints, tighten debounce, reduce candidate fan-out |
| Session race-condition confirmations | HIGH | Introduce server FSM and migration script for state reconciliation |
| Location privacy over-retention | HIGH | Purge historical precise coords, deploy TTL jobs, update consent and incident comms |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Midpoint instead of fairness | Phase 2 | Offline replay shows reduced ETA gap vs baseline |
| Opaque ranking | Phase 2 | User testing: participants can correctly explain top result rationale |
| Geolocation failure paths | Phase 1 | Funnel shows successful progression for deny/timeout/manual flows |
| Geocoding storage/licensing violations | Phase 0 | ADR + data retention policy approved; audits show compliant storage |
| Stale place freshness | Phase 3 | Closed-place report rate below threshold |
| API quota/cost blowups | Phase 1 + 3 | Cost/session dashboard and 429/OVER_QUERY_LIMIT alerts stable |
| Two-party state races | Phase 1 | Concurrency test suite passes conflict scenarios |
| Over-retained precise location | Phase 0 + 4 | Automated TTL deletion reports and privacy audit pass |

## Sources

- MDN Geolocation API security + errors (secure context, permission, error codes, permissions policy):  
  https://github.com/mdn/content/blob/main/files/en-us/web/api/navigator/geolocation/index.md **(HIGH)**  
  https://github.com/mdn/content/blob/main/files/en-us/web/api/geolocationpositionerror/index.md **(HIGH)**  
  https://github.com/mdn/content/blob/main/files/en-us/web/http/reference/headers/permissions-policy/geolocation/index.md **(HIGH)**
- Mapbox temporary vs permanent geocoding and API limits (429 behavior, matrix limits):  
  https://docs.mapbox.com/help/dive-deeper/understand-temporary-vs-permanent-geocoding **(HIGH)**  
  https://docs.mapbox.com/api **(HIGH)**  
  https://docs.mapbox.com/api/navigation/matrix **(HIGH)**
- Google Places details status/session token behavior (ZERO_RESULTS, OVER_QUERY_LIMIT, token billing implications):  
  https://developers.google.com/maps/documentation/places/web-service/legacy/details **(MEDIUM; legacy page in corpus, still useful for failure modes/token discipline)**
- Domain pattern synthesis from current project context (fairness perception, two-party negotiation UX):  
  /Users/Brent.Schneeman/projects/tworavens/mitm/.planning/PROJECT.md **(HIGH for project-specific constraints)**

---
*Pitfalls research for: Two-party meetup location negotiation apps*
*Researched: 2026-04-08*
