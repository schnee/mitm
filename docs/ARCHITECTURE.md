# Architecture Overview

## System Diagram

```
┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js   │
│  (React)   │◀────│   Web App   │
└─────────────┘     └──────┬──────┘
                           │ HTTPS
                           ▼
                    ┌─────────────┐
                    │  API Server │
                    │  (Express)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Sessions│ │ Ranking  │ │ Location │
        │ Module │ │ Module   │ │ Module  │
        └────────┘ └────┬─────┘ └──────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Google Maps │
                  │   Platform  │
                  └─────────────┘
```

## Core Components

### Web Application (Next.js)

Located in `src/app/`, handles:
- Session initialization and join flows
- Location capture UI
- Meet-up preference input
- Ranked results display with map
- Shortlist management
- Final venue confirmation

### API Server

Located in `services/api/src/`, provides REST endpoints:

| Endpoint | Module | Purpose |
|----------|--------|---------|
| `POST /sessions` | session | Create new session |
| `GET /sessions/:id` | session | Get session state |
| `POST /sessions/:id/join` | session | Join existing session |
| `POST /location` | location | Submit location draft |
| `POST /location/confirm` | location | Lock in location |
| `POST /ranking/inputs` | ranking | Save travel preferences |
| `GET /ranking/results` | ranking | Get ranked meet-up spots |
| `POST /decision/shortlist` | decision | Add to shortlist |
| `POST /decision/confirm` | decision | Confirm final venue |

### Modules

**Session Module** (`services/api/src/modules/session/`)
- Lifecycle: `created` → `joined` → `locating` → `ranked` → `confirmed` → `expired`
- Participant tracking (host + invitee)
- Session persistence (in-memory for MVP)

**Location Module** (`services/api/src/modules/location/`)
- Geocoding via Google Maps
- Coordinate storage

**Ranking Module** (`services/api/src/modules/ranking/`)
- Midpoint calculation
- Google Places API integration
- Distance matrix scoring
- Fairness scoring based on travel willingness (e.g., 70/30 split)

**Decision Module** (`services/api/src/modules/decision/`)
- Shortlist management
- Reaction tracking (like/pass)
- Final confirmation

## Data Flow

1. **Session Init**: Host creates session → gets join URL
2. **Join**: Invitee joins via URL → both participants enter location
3. **Preferences**: Both set travel preference (e.g., 70/30)
4. **Ranking**: API calculates midpoint → queries Places → scores by travel time
5. **Decision**: Both review shortlist → confirm venue

## External Dependencies

- **Google Maps Platform**: Places API, Distance Matrix API, Geocoding API
- **Runtime**: Node.js 20+

## Deployment

- **API**: Google Cloud Run
- **Web**: Cloudflare Pages (OpenNext adapter)
- See `docs/deployment/production-cloud-run-cloudflare.md`