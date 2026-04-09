# Production deployment scaffold

This repository now includes deployment scaffolding for:

- API on Google Cloud Run
- Web frontend on Cloudflare Workers using OpenNext

No deployment has been executed by this scaffold.

## Files added

- `deploy/cloud-run/api.Dockerfile`: container image definition for the API service
- `deploy/cloud-run/cloudrun.env.example`: env vars template for Cloud Run runtime settings
- `deploy/cloud-run/service.template.yaml`: Cloud Run service template with env placeholders
- `deploy/cloud-run/cloudbuild.api.yaml`: Cloud Build pipeline for build + push + Cloud Run deploy
- `deploy/cloudflare/wrangler.toml`: Cloudflare Worker config targeting OpenNext output
- `deploy/cloudflare/.dev.vars.example`: local vars for wrangler-based local runs

## API (Cloud Run)

You can use npm scripts added in this scaffold:

- `npm run deploy:api:cloudrun`

1. Build image locally (optional validation):

```bash
docker build -f deploy/cloud-run/api.Dockerfile -t mitm-api:local .
```

2. Copy and edit env values:

```bash
cp deploy/cloud-run/cloudrun.env.example deploy/cloud-run/cloudrun.env
```

Then set real `APP_URL` and `CORS_ORIGIN` in `deploy/cloud-run/cloudrun.env`.

3. Fill placeholders in `deploy/cloud-run/service.template.yaml`:
   - `PROJECT_ID`, `REGION`, image tag
   - `APP_URL`, `CORS_ORIGIN`

4. Set `GOOGLE_MAPS_API_KEY` in Secret Manager:

```bash
gcloud secrets create GOOGLE_MAPS_API_KEY --replication-policy=automatic
printf '%s' 'YOUR_KEY' | gcloud secrets versions add GOOGLE_MAPS_API_KEY --data-file=-
```

5. Deploy with either:
    - Cloud Build config: `deploy/cloud-run/cloudbuild.api.yaml`
    - Service manifest: `deploy/cloud-run/service.template.yaml`

If using direct gcloud deploy/update, reuse env file values:

```bash
gcloud run deploy mitm-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file deploy/cloud-run/cloudrun.env \
  --set-secrets GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest
```

## Web (Cloudflare + OpenNext)

You can use npm scripts added in this scaffold:

- `npm run build:cloudflare`
- `npm run deploy:cloudflare`

1. Build Next.js for Cloudflare Worker runtime:

```bash
npx @opennextjs/cloudflare@latest build
```

2. Update `deploy/cloudflare/wrangler.toml`:
   - `name`
   - `NEXT_PUBLIC_API_BASE_URL` to your Cloud Run API URL
   - set `workers_dev = false` after custom domain wiring

3. Deploy Worker:

```bash
npx wrangler@latest deploy --config deploy/cloudflare/wrangler.toml
```

For local Worker runtime testing:

```bash
cp deploy/cloudflare/.dev.vars.example deploy/cloudflare/.dev.vars
npx wrangler@latest dev --config deploy/cloudflare/wrangler.toml
```

## Minimal production env checklist

- API: `APP_URL`, `CORS_ORIGIN`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_PLACES_RADIUS_METERS`
- Web: `NEXT_PUBLIC_API_BASE_URL`
