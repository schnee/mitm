# Testing

## Test Types

### Unit Tests

Located in `src/lib/*.test.ts` and `services/api/tests/`.

Run:
```bash
npm test
```

Uses Vitest.

### E2E Tests

Located in `tests/e2e/`.

Run:
```bash
npx playwright test
```

Requires both API and web servers running.

## Running Tests

### Full E2E Suite

```bash
# Start servers in two terminals
npm run dev:api
npm run dev:web

# Run tests
npx playwright test
```

### Compatibility Matrix

Tests across multiple browsers/devices:

```bash
npm run test:e2e:launch
```

Runs against:
- Desktop Chrome
- Desktop Safari
- Pixel 5
- iPhone 12

### Single Test File

```bash
npx playwright test tests/e2e/funnel-compatibility.spec.ts
```

### Debug Mode

```bash
npx playwright test --debug
```

## Test Files

| Test | Module | Coverage |
|------|--------|----------|
| `session-create-join.test.ts` | session | Create, join, state transitions |
| `location-flow.test.ts` | location | Draft, confirm, geocoding |
| `ranking-inputs.test.ts` | ranking | Travel preference input |
| `ranking-results.test.ts` | ranking | Place ranking algorithm |
| `decision-state.test.ts` | decision | Shortlist, reactions, confirm |
| `session-sync.test.ts` | session | Real-time sync |
| `step-flow-smoke.spec.ts` | e2e | Full funnel smoke test |
| `funnel-compatibility.spec.ts` | e2e | Cross-browser compatibility |

## CI/CD

Tests run on every commit via GitHub Actions.

## Adding Tests

Tests for new API routes go in `services/api/tests/`.
Tests for new UI flows go in `tests/e2e/`.

Use the existing test files as templates.