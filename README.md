# Meet Me in the Middle

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy local environment defaults:

```bash
cp .env.example .env.local
```

3. Set `GOOGLE_MAPS_API_KEY` in `.env.local` if you want real ranking candidates (without it, ranking runs but returns empty results).

4. For real ranking responses, your Google Cloud project must also have:
   - Billing enabled
   - Places API enabled
   - Distance Matrix API enabled

## Environment variables

These are the vars used by local web, API, and tests.

| Variable | Used by | Default | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Web app | `http://localhost:8080` | API base URL for client calls. |
| `API_PORT` | API server | `8080` | Port for `npm run dev:api`. |
| `APP_URL` | API server | `http://localhost:3000` | Used to generate absolute join URLs. |
| `CORS_ORIGIN` | API server | `http://localhost:3000` | Allowed browser origin for local web app. |
| `GOOGLE_MAPS_API_KEY` | API ranking provider | empty | Required for Google Places/Distance Matrix calls. |
| `GOOGLE_MAPS_PLACES_RADIUS_METERS` | API ranking provider | `2500` | Search radius around midpoint. |
| `E2E_APP_URL` | Playwright tests | `http://localhost:3000` | Base URL for E2E specs. |

## Run web + API locally

Use two terminals from the repository root.

Terminal A (API):

```bash
set -a && source .env.local && set +a && npm run dev:api
```

Terminal B (web):

```bash
npm run dev:web
```

Web app: `http://localhost:3000`  
API health check: `http://localhost:8080/health`

## Manual two-browser walkthrough

This walkthrough assumes `GOOGLE_MAPS_API_KEY` is set so ranking returns candidates.

1. In Browser A, open `http://localhost:3000` and click `Create session`.
2. Copy `Invitee Join URL` into Browser B. In Browser A, open `Host Continue URL`.
3. In both browsers, complete location capture. Quick manual-entry values you can use:
   - Browser A: `40.7128`, `-74.0060`
   - Browser B: `40.7306`, `-73.9352`
4. In both browsers, click `Save manual location`, then `Confirm location`.
5. In both browsers, save ranking preferences with `Save ranking inputs`.
6. In either browser, click `Run ranking`, then `Add to shortlist`, then `Confirm this place`.
7. Confirm both browsers show the confirmed place and `Open in Maps` link.

## Automated tests

```bash
# API/unit tests
npm test

# Install Playwright browsers (one-time per machine)
npx playwright install

# Full E2E suite (expects local web + API running)
npx playwright test

# Funnel compatibility matrix from package script
npm run test:e2e:launch
```

## Troubleshooting

- `Run ranking` returns no results:
  - Confirm `GOOGLE_MAPS_API_KEY` is set in `.env.local`
  - Confirm Places API + Distance Matrix API are enabled and billing is active
  - Restart API terminal after env changes
- One browser says `Confirmed. Waiting for other participant.` forever:
  - Profile B must use `Invitee Join URL`
  - Profile A must use `Host Continue URL` (contains `asHost=1`)
  - Use a fresh session after restarting services
