#!/usr/bin/env bash
set -euo pipefail

COLLECTION_GROUP="participant_locations"
FIELD="expireAt"
CHECK_ONLY="false"

if [[ "${1:-}" == "--check-only" ]]; then
  CHECK_ONLY="true"
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install gcloud to validate Firestore TTL policy for ${COLLECTION_GROUP}.${FIELD}."
  echo "Skipping check in local-only mode."
  exit 0
fi

if [[ -z "${GCP_PROJECT_ID:-}" ]]; then
  echo "GCP_PROJECT_ID is required to verify Firestore TTL policy."
  exit 1
fi

OUTPUT="$(gcloud firestore fields ttls list --project "$GCP_PROJECT_ID" --format="value(field,state)" || true)"
TARGET_PATH="${COLLECTION_GROUP}.${FIELD}"

if [[ "$OUTPUT" == *"${TARGET_PATH}"*"ACTIVE"* ]]; then
  echo "TTL policy active for ${TARGET_PATH}."
  exit 0
fi

if [[ "$CHECK_ONLY" == "true" ]]; then
  echo "TTL policy missing for ${TARGET_PATH}."
  echo "Run: gcloud firestore fields ttls update ${TARGET_PATH} --collection-group=${COLLECTION_GROUP} --enable-ttl --project=${GCP_PROJECT_ID}"
  exit 1
fi

echo "Creating TTL policy for ${TARGET_PATH}..."
gcloud firestore fields ttls update "${TARGET_PATH}" --collection-group="${COLLECTION_GROUP}" --enable-ttl --project "$GCP_PROJECT_ID"
echo "TTL policy update requested for ${TARGET_PATH}."
