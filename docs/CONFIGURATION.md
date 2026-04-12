# Configuration

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `GOOGLE_MAPS_API_KEY` | API key for Google Places, Distance Matrix, and Geocoding |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | API server base URL |
| `API_PORT` | `8080` | Port for API server |
| `APP_URL` | `http://localhost:3000` | Used for join URL generation |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `GOOGLE_MAPS_PLACES_RADIUS_METERS` | `2500` | Search radius around midpoint |
| `E2E_APP_URL` | `http://localhost:3000` | E2E test base URL |

## Google Maps API Setup

1. Create a Google Cloud project
2. Enable billing (required for API access)
3. Enable these APIs:
   - Places API
   - Distance Matrix API
   - Geocoding API
4. Create API credentials (API key)
5. Restrict key usage to your app's origins

## Local Setup

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add your GOOGLE_MAPS_API_KEY
```

## Deployment Configuration

### Cloud Run (API)

See `deploy/cloud-run/` for templates:
- `cloudrun.env.example` - environment variables
- `api.Dockerfile` - container definition
- `cloudbuild.api.yaml` - Cloud Build config

### Cloudflare (Web)

See `deploy/cloudflare/`:
- `wrangler.toml` - Cloudflare Pages config
- `.dev.vars_example` - local dev variables

## App URL Configuration

For production, set:
- `APP_URL` → your production web URL (e.g., `https://mmitm.example.com`)
- `CORS_ORIGIN` → your production web origin

This ensures join URLs generated for sharing point to the correct location.