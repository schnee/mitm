# Meet Me in the Middle

A web app that helps two people quickly agree on where to meet when they start in different locations.

## Quick Start

```bash
npm install
cp .env.example .env.local
```

Set `GOOGLE_MAPS_API_KEY` in `.env.local` for real ranking candidates.

## Run Locally

Two terminals from the project root:

**Terminal A (API):**
```bash
set -a && source .env.local && set +a && npm run dev:api
```

**Terminal B (Web):**
```bash
npm run dev:web
```

- Web: http://localhost:3000
- API: http://localhost:8080/health

## Tech Stack

- Next.js 16 (web frontend)
- Custom API server (Express-based, runs on port 8080)
- Google Maps Platform (Places + Distance Matrix APIs)
- React 19 + TypeScript

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── decision/     # Shortlist/confirm flows
│   ├── location/    # Location capture
│   ├── ranking/     # Ranking inputs/results
│   └── session/     # Session progress
├── hooks/           # React hooks
└── lib/            # Client utilities
services/api/src/
├── routes/          # API endpoints
└── modules/        # Business logic
tests/e2e/         # Playwright tests
deploy/             # Deployment configs
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_MAPS_API_KEY` | Yes | For Places/Distance Matrix |
| `NEXT_PUBLIC_API_BASE_URL` | No | Default: http://localhost:8080 |
| `API_PORT` | No | Default: 8080 |

## Testing

```bash
# Unit tests
npm test

# E2E tests (requires local servers running)
npx playwright test
```

## Deployment

- **API**: Cloud Run (see `docs/deployment/production-cloud-run-cloudflare.md`)
- **Web**: Cloudflare Pages via OpenNext

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start API server |
| `npm run dev:web` | Start Next.js dev server |
| `npm run build:cloudflare` | Build for Cloudflare |
| `npm run deploy:cloudflare` | Deploy web to Cloudflare |
| `npm run deploy:api:cloudrun` | Deploy API to Cloud Run |