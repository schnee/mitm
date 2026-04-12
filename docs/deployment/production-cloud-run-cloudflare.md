# Production Deployment

## Overview

- **API**: Google Cloud Run
- **Web**: Cloudflare Pages (via OpenNext adapter)

## Set Variables

```bash
# Set once per shell session
export PROJECT_ID="YOUR_GCP_PROJECT"
export REGION="us-central1"
export SERVICE_NAME="mitm-api"
export RUNTIME_SA="mitm-api-runtime"
```

## Deploy API to Cloud Run

```bash
# Build and deploy
npm run deploy:api:cloudrun
```

Or manually:

```bash
# Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Build container
gcloud builds submit --tag "$REGION-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/$SERVICE_NAME"

# Deploy
gcloud run deploy "$SERVICE_NAME" \
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/$SERVICE_NAME" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --env-vars-file deploy/cloud-run/cloudrun.env
```

## Deploy Web to Cloudflare

```bash
# Build and deploy
npm run deploy:cloudflare
```

This uses OpenNext adapter to produce Cloudflare Pages-compatible output.

## Requirements

- Google Cloud project with billing enabled
- Cloudflare account
- Google Maps API key with restricted referers

## Environment

Set these in Cloud Run:
- `GOOGLE_MAPS_API_KEY` (from Secret Manager or directly)
- `APP_URL` (your production URL)
- `CORS_ORIGIN` (your production origin)

## Verification

- API health: `https://your-api-url.run.app/health`
- Web: `https://your-domain.pages.app`