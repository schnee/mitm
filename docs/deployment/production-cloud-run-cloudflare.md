# Production deployment (Cloud Run API + Cloudflare/OpenNext web)

This document reflects a known-good production deployment flow that has been run successfully.

## Known-good production runbook (Cloud Run)

Use these commands in order.

```bash
# 0) Set your project/region once per shell
export PROJECT_ID="YOUR_GCP_PROJECT"
export REGION="us-central1"
export SERVICE_NAME="mitm-api"
export RUNTIME_SA="mitm-api-runtime"

gcloud config set project "$PROJECT_ID"

# 1) Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

# 2) Create Artifact Registry repo (Docker format)
gcloud artifacts repositories create "cloud-run-source-deploy" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Cloud Run source deploy artifacts"

# 3) Create runtime service account + grant Secret Manager access
gcloud iam service-accounts create "$RUNTIME_SA" \
  --display-name="MITM API runtime"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 4) Create secret + add latest version for Google Maps key
gcloud secrets create GOOGLE_MAPS_API_KEY --replication-policy="automatic"
printf '%s' 'YOUR_GOOGLE_MAPS_API_KEY' | gcloud secrets versions add GOOGLE_MAPS_API_KEY --data-file=-

# 5) Deploy from source (known-good flags)
# NOTE: --clear-base-image was required in this project to bypass stale buildpack base-image behavior.
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --service-account "${RUNTIME_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --env-vars-file deploy/cloud-run/cloudrun.env \
  --set-secrets GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest \
  --clear-base-image

# 6) Retrieve URL + verify health
API_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')"
echo "$API_URL"
curl -fsS "$API_URL/health"
```

## Cloudflare/OpenNext deployment notes (practical fixes)

1. In `next.config.js`, set `output: "standalone"`.
2. Ensure a `build` npm script exists and runs `next build`.
3. Export API base URL before frontend build so the client bundle is correct:

```bash
export NEXT_PUBLIC_API_BASE_URL="https://mitm-api-jird3i3t7a-uc.a.run.app"
rm -rf .next .open-next
npm run build
npx @opennextjs/cloudflare@latest build --config deploy/cloudflare/wrangler.toml --skipBuild
npx wrangler@latest deploy --config deploy/cloudflare/wrangler.toml
```

4. Use explicit Wrangler config path (`--config deploy/cloudflare/wrangler.toml`).
5. In `deploy/cloudflare/wrangler.toml`, remember path resolution is relative to that file, so `main` and `assets.directory` must target `../../.open-next/...` (not `./.open-next/...`).
6. If OpenNext build artifacts are missing, run build first, then deploy.

## Custom domain: `mmitm.giantmetalrooster.com`

1. In Cloudflare Worker settings, map the custom domain `mmitm.giantmetalrooster.com` to the deployed worker.
2. Update Cloud Run runtime env to use the same domain for app links and CORS:
   - `APP_URL=https://mmitm.giantmetalrooster.com`
   - `CORS_ORIGIN=https://mmitm.giantmetalrooster.com`
3. Redeploy Cloud Run and verify newly created session/invite links use the custom domain.

## Troubleshooting (errors seen in production setup)

- `artifactregistry.googleapis.com` not enabled:
  - Symptom: source deploy fails while preparing build artifacts.
  - Fix: run `gcloud services enable artifactregistry.googleapis.com` and retry.
- Secret version not found (`GOOGLE_MAPS_API_KEY:latest`):
  - Symptom: deploy or runtime fails to resolve secret.
  - Fix: create secret and add at least one version (`gcloud secrets versions add ...`).
- Container startup issues from buildpack defaults (`/workspace/index.js`, missing `npm`/`node` in runtime image):
  - Symptom: container crashes immediately on start.
  - Fix: deploy with `gcloud run deploy --source . --clear-base-image` to force a clean base image selection.
- OpenNext worker module not found:
  - Symptom: Wrangler reports worker entrypoint missing.
  - Fix: run OpenNext build first and ensure `wrangler.toml` paths use `../../.open-next/...` relative paths.
- Frontend falls back to localhost API:
  - Symptom: client requests target `http://localhost:8080` in production.
  - Fix: export/set `NEXT_PUBLIC_API_BASE_URL` before running OpenNext build, then redeploy worker.

## Cloudflare GitHub watcher configuration

- If you deploy via Wrangler Workers only, there is no automatic GitHub watch trigger by default.
- If a Cloudflare Pages project is connected to GitHub, configure **Build Watch Paths** in Cloudflare Pages settings.
- Recommended include patterns:
  - `src/**`
  - `package.json`
  - `package-lock.json`
  - `next.config.*`
  - `tsconfig.json`
  - `deploy/cloudflare/**`
- Recommended exclude patterns:
  - `services/api/**`
  - `deploy/cloud-run/**`
  - `.planning/**`
  - `tests/**` (optional)
- This is configured in the Cloudflare dashboard and cannot be enforced solely from this repository.
