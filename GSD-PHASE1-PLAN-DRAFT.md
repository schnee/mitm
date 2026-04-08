# GSD Phase 1 Plan Draft

## Purpose
Use this prompt with `/gsd-plan-phase` to produce a delivery plan for Phase 1 MVP of **Meet Me in the Middle**, with executable tasks, clear quality gates, and testable outcomes.

## Copy/Paste Prompt
```text
/gsd-plan-phase

Plan Phase 1 MVP for "Meet Me in the Middle" and return an implementation-ready execution plan.

Product context:
- Problem: Two people in different locations need a fair, fast way to pick a place to meet.
- Inputs: each person location, willingness-to-travel percentage split (for example 70/30), and preference tags (coffee, cocktails, vintage shops, etc.).
- Output: ranked places/POIs between them.
- Platforms: mobile and web.

Phase 1 MVP scope (must include):
1) Session creation and join flow for two participants.
2) Location capture for each participant.
3) Willingness-to-travel percentage capture (for example 50/50, 70/30).
4) Preference tag selection.
5) Candidate place retrieval.
6) Ranking logic that balances fairness, travel burden, and preferences.
7) Shortlist UI for reviewing ranked candidates.
8) Place confirmation step.

What I need from you:
1) Work breakdown structure with tasks and sub-tasks.
2) Dependency mapping and critical path.
3) Acceptance criteria for every major feature.
4) Test strategy (unit, integration, end-to-end, and basic usability checks).
5) Verification checkpoints by milestone (what is proven, how it is verified, and exit criteria).
6) Known risks, mitigations, and unresolved decisions.
7) Suggested timeline with realistic sequencing for a small cross-functional team.

Output format requirements:
- Keep it concise, practical, and execution-oriented.
- Use clear ownership hints by function (product, design, frontend, backend, QA).
- Make assumptions explicit.
```

## Customization Knobs
- Define team composition and capacity to adjust timeline realism.
- Specify data/provider constraints for place retrieval (for example API limits).
- Set ranking priorities (fairness-first, speed-first, preference-first).
- Add compliance or privacy constraints to tighten acceptance criteria.
