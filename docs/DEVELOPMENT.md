# Development

## Project Layout

```
src/                          # Next.js web app
├── app/                      # App router pages
│   ├── page.tsx              # Home page
│   ├── layout.tsx             # Root layout
│   └── s/[token]/            # Session page (host/joinee)
├── components/               # React components
│   ├── decision/            # Shortlist & confirmation
│   ├── location/           # Location capture
│   ├── ranking/             # Ranking display
│   └── session/            # Session state
├── hooks/                   # React hooks
└── lib/                    # Client utilities

services/api/src/            # API server
├── routes/                  # HTTP endpoints
├── modules/                # Business logic
└── dev-server.ts            # Development runner

tests/e2e/                 # Playwright tests
deploy/                    # Deployment configs
```

## Adding a New Feature

1. **API Route**: Add endpoint in `services/api/src/routes/`
2. **Module Logic**: Implement in `services/api/src/modules/`
3. **Client Call**: Add to `src/lib/api/session-client.ts`
4. **UI Component**: Create in `src/components/`
5. **Test**: Add E2E spec in `tests/e2e/`

## Coding Standards

- TypeScript strict mode enabled
- Use Zod for input validation
- React 19 with functional components
- Consistent naming: `PascalCase` for components, `camelCase` for functions

## Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# E2E tests (requires servers running)
npx playwright test

# Specific browser matrix
npm run test:e2e:launch
```

## Debugging

- API logs: Check terminal running `dev:api`
- Web logs: Browser console
- Use `console.log` in API routes for quick debugging

## Committing

Run tests before committing:
```bash
npm test && npx playwright test
```