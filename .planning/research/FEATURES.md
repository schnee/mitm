# Feature Research

**Domain:** Two-party meetup location coordination (web/mobile web)
**Researched:** 2026-04-08
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Two-person session creation + join-by-link | Competing tools center on “enter two locations and share/join quickly.” Frictionless session start is baseline. | LOW | Use short invite link + no-account join for MVP speed. |
| Location input with consent (current location or typed address) | Users expect map-style apps to support both live location and manual entry; consent control is critical for trust. | MEDIUM | Support coarse sharing and fallback to typed neighborhood/address. |
| Fair midpoint ranking by travel time (not just geometric distance) | Users care about effort fairness; midpoint tools market “fair for everyone” and practical meeting points. | MEDIUM | Score by door-to-door ETA split before preference weighting. |
| Venue type filtering/tags (coffee, drinks, etc.) | Competitors consistently ask for place type/category at search time. | LOW | Start with tag presets + free-text keyword fallback. |
| Ranked recommendations with key metadata | Users expect a short ranked list with ETA and basic venue context before deciding. | MEDIUM | Show ETA for each person, total fairness score, open-now flag, rating. |
| Shortlist + final confirmation | Core job-to-be-done is ending indecision with one selected place. | LOW | One-tap “lock this spot” state visible to both users. |
| Shareable final plan (map deep link) | Users expect handoff into navigation app after decision. | LOW | Deep-link to provider map page for routing. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Asymmetric travel willingness (50/50, 60/40, 70/30) | Matches real negotiation language (“I can travel farther today”), improving perceived fairness and acceptance. | MEDIUM | Make split explicit in UI and reflected in ranking explanation. |
| Explainable fairness card per venue | Builds trust: users see *why* a place ranked high (ETA delta, willingness fit, preference match). | MEDIUM | Lightweight model introspection beats opaque “magic ranking.” |
| Fast consensus UX (accept/reject per candidate) | Reduces back-and-forth vs. passive list browsing; faster time-to-decision is a measurable product edge. | MEDIUM | Optional swipe/quick reactions; auto-promote mutual accepts to shortlist. |
| Context modes (date / networking / casual catch-up) | Improves relevance of recommendations without requiring heavy personalization. | LOW | Mode presets influence tags and ranking weights. |
| Safety-first location precision controls | Differentiates on trust: neighborhood-level sharing until both users are comfortable. | MEDIUM | “Approximate until confirmed” toggle; reveal exact spot only at final selection. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Group meetup support (3+ people) in v1 | “More users per session sounds bigger market.” | Explodes fairness math, UI complexity, and decision latency; risks delaying validation of core 2-person use case. | Keep strict 2-person MVP; design data model to extend later. |
| In-app chat/messaging | “Users coordinate details in chat.” | Rebuilds commodity messaging, moderation, abuse controls, and notifications complexity with weak differentiation. | Keep lightweight comments + deep-link to external messaging apps. |
| Reservations/payments in product | “Complete booking flow sounds premium.” | High integration and support burden before proving core decision value. | Provide outbound links to booking providers after place selection. |
| Native iOS/Android first | “Better device integration.” | Slower iteration and duplicate surface area before PMF. | Mobile-web first; move native only after retention and usage signal. |
| Full social profiles/feed | “Increase engagement.” | Distracts from single job-to-be-done and introduces privacy/compliance overhead. | Minimal profile (name/avatar optional) scoped to session utility. |

## Feature Dependencies

```
Session creation + join link
    └──requires──> Shared session state + realtime sync
                           └──requires──> Venue shortlist + final confirmation

Location input + consent
    └──requires──> Routing/ETA computation
                           └──requires──> Fairness ranking engine

Preference tags
    └──enhances──> Ranked recommendations

Asymmetric willingness split
    └──enhances──> Fairness ranking engine

Group meetup (3+)
    └──conflicts (v1 scope)──> Fast consensus UX + low-friction MVP
```

### Dependency Notes

- **Session creation requires shared session state:** without synced state, two users cannot see the same candidates/decisions.
- **Location input requires routing/ETA:** fairness cannot be computed from coordinates alone; ETA is the user-perceived burden.
- **Preference tags enhance ranking:** relevance quality improves only after baseline fairness scoring works.
- **Asymmetric willingness enhances fairness ranking:** split preferences are an input to ranking weights, not a standalone feature.
- **Group meetup conflicts with MVP speed:** it adds combinatorial complexity and slows validation of two-person value.

## MVP Definition

### Launch With (v1)

Minimum viable product — what’s needed to validate the concept.

- [ ] Two-person session create/join via link — proves low-friction coordination entry.
- [ ] Consent-based location capture (live or typed) — essential trust + input quality.
- [ ] Travel willingness split (50/50, 60/40, 70/30) — core fairness differentiator.
- [ ] Preference tags (small curated set) — enough relevance without heavy complexity.
- [ ] Ranked venues with ETA + fairness explanation — validates “fast + fair” promise.
- [ ] Shortlist and final place confirmation — closes the decision loop.
- [ ] Share/export final destination link — enables immediate execution.

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Quick accept/reject consensus interactions — add when decision-time metrics plateau.
- [ ] Context modes (date/networking) — add when users request better relevance by scenario.
- [ ] Approximate-location privacy mode defaults — add when privacy objections appear in feedback.
- [ ] Lightweight reminders/reopen session — add when drop-off occurs between shortlist and confirmation.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Group meetups (3+) — defer until two-person retention and fairness model are stable.
- [ ] Native apps — defer until mobile-web conversion is proven and performance constraints justify native.
- [ ] Booking/reservations integrations — defer until significant post-selection churn indicates need.
- [ ] Rich profiles/social graph — defer unless repeat-network effects become primary growth driver.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Two-person session create/join | HIGH | LOW | P1 |
| Consent-based location capture | HIGH | MEDIUM | P1 |
| ETA-based fairness ranking | HIGH | MEDIUM | P1 |
| Preference tags | MEDIUM | LOW | P1 |
| Shortlist + confirmation | HIGH | LOW | P1 |
| Final map deep-link export | HIGH | LOW | P1 |
| Consensus swipes/reactions | MEDIUM | MEDIUM | P2 |
| Context modes | MEDIUM | LOW | P2 |
| Privacy precision toggles | MEDIUM | MEDIUM | P2 |
| Group meetup (3+) | MEDIUM | HIGH | P3 |
| Native apps | MEDIUM | HIGH | P3 |
| Reservations/payments | LOW (early) | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Whatshalfway | MeetWays | Halfwaze/Midpointr | Our Approach |
|---------|--------------|----------|--------------------|--------------|
| Two-address midpoint flow | Yes (meeting planner/journey planner) | Yes (enter two addresses) | Yes (two addresses) | Keep this baseline but optimize for 2-party negotiation UX. |
| Venue type/category filtering | Yes (venue type selector) | Yes (type of place) | Implied by place search | Keep as table stake with curated tags. |
| Share/join flow | Limited/varies | Limited/varies | Yes (share link on Halfwaze, Midpointr) | Make link-join first-class and no-account for invitee. |
| Fairness explainability | Mostly implicit | Mostly implicit | Some “fair for everyone” positioning | Explicit per-venue fairness breakdown as core differentiator. |
| Negotiation mechanics (willingness split, mutual selection) | Typically absent | Typically absent | Typically absent | Build explicit two-party negotiation primitives. |

## Sources

- Project context and scope constraints: `/Users/Brent.Schneeman/projects/tworavens/mitm/.planning/PROJECT.md` (**HIGH**, primary product intent)
- Whatshalfway homepage (meeting planner, venue type, two-address flow): https://www.whatshalfway.com/ (**MEDIUM**, official product site)
- MeetWays homepage (two addresses + place type): https://www.meetways.com/ (**MEDIUM**, official product site)
- Halfwaze homepage (two addresses + share link): https://halfwaze.com/ (**MEDIUM**, official product site)
- Midpointr homepage (“fair for everyone”, share link): https://midpointr.com/ (**MEDIUM**, official product site)
- Google support: Location sharing baseline expectation: https://support.google.com/maps/answer/7326816?hl=en (**MEDIUM**, official vendor docs)
- Google Maps help feature overview (discovery/navigation expectations): https://support.google.com/maps/answer/6291839?hl=en (**MEDIUM**, official vendor docs)
- Apple support: share ETA in Maps: https://support.apple.com/guide/iphone/share-your-estimated-time-of-arrival-iph65c86df8c/ios (**MEDIUM**, official vendor docs)

---
*Feature research for: two-party meetup location negotiation app*
*Researched: 2026-04-08*
