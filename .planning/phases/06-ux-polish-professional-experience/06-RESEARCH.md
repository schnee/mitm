# Phase 06 Research - UX Polish & Professional Experience

**Date:** 2026-04-09  
**Status:** Complete  
**Scope:** Implementation guidance for UX-06 through UX-10

## Research Question

What is the fastest, lowest-risk way to make the existing startup and decision flow feel production-grade across mobile and desktop without changing ranking logic or provider integrations?

## Recommended Technical Direction

### standard_stack
- **No new dependencies required:** keep Next.js + React + TypeScript + existing Playwright/Vitest stack.
- **Styling approach:** introduce lightweight app-level CSS (`src/app/globals.css`) and semantic section wrappers in current components instead of adding a UI framework.
- **State consistency:** standardize loading/empty/error/success microcopy directly in current page/component boundaries (`src/app/page.tsx`, `src/app/s/[token]/page.tsx`, ranking + decision + location components).
- **Accessibility baseline:** enforce visible focus states, explicit labels, contrast-safe tokens, and keyboard-friendly button/link interactions in existing controls.
- **Responsive polish:** validate key breakpoints through Playwright projects already configured (`Desktop Chrome`, `Desktop Safari`, `Pixel 5`, `iPhone 12`).

### architecture_patterns
1. **Polish in-place over rewrites**
   - Upgrade existing components and pages rather than replacing flow structure.
   - Preserve API contracts and session-sync behavior from phases 1–5.

2. **Contract-stable UX updates**
   - Keep `session-client.ts` request/response shapes unchanged for phase 6.
   - Focus changes in presentation, copy, interaction states, and accessibility attributes.

3. **Shared state language**
   - Use consistent state labels across startup, ranking, shortlist, confirmation (`idle`, `loading`, `empty`, `error`, `success` semantics in copy and section UI).

4. **Verification-first polish**
   - Add/update e2e assertions for startup CTA clarity, ranking readability/action speed signals, responsive behavior, and keyboard accessibility.

## dont_hand_roll

- Do **not** change fairness scoring math, weighting, or ranking ordering behavior.
- Do **not** add provider abstractions or new backend integrations.
- Do **not** expand product scope beyond two-person web flow.

## common_pitfalls

1. **Visual improvements regress flow clarity**
   - Mitigation: preserve existing action order and API triggers while adjusting hierarchy/copy.

2. **State microcopy drifts between screens**
   - Mitigation: define canonical wording for loading/empty/error/success by stage and reuse.

3. **Accessibility added partially**
   - Mitigation: enforce focus-visible styles and aria labeling on all primary buttons/inputs in startup + decision flow.

4. **Responsive bugs hidden in desktop-only checks**
   - Mitigation: run Playwright against at least one desktop and one mobile project for updated specs.

## Planning Implications

- Keep three execute plans aligned to roadmap:
  1. Startup screen hierarchy + CTA confidence polish (UX-06).
  2. Negotiation/ranking readability + faster decision actions (UX-07).
  3. Cross-flow state consistency + responsive/accessibility baseline validation (UX-08, UX-09, UX-10).
- Assign final plan to integrate cross-cutting state/accessibility updates and verification across all touched surfaces.

---

*Research complete for phase planning.*
