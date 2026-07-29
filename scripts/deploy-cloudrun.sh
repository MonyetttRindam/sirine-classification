#!/usr/bin/env bash
# =============================================================================
# Deploy Sirine Classification ke Google Cloud Run (single-container).
# Jalankan di Google Cloud Shell (gcloud + git-lfs sudah tersedia) ATAU lokal
# jika gcloud sudah terinstal & login (`gcloud auth login`).
#
#   bash scripts/deploy-cloudrun.sh
#
# Cloud Build akan mem-build Dockerfile di cloud lalu deploy. Idempoten: jalankan
# ulang untuk update (deploy revisi baru).
# =============================================================================
set -euo pipefail

SERVICE="${SERVICE:-sirine}"
REGION="${REGION:-asia-southeast2}"     # Jakarta (terdekat dari Indonesia)
MEMORY="${MEMORY:-2Gi}"                 # TF + YAMNet + 2 model butuh >512MB
CPU="${CPU:-2}"

# Pastikan bobot model LFS sudah terunduh (bukan pointer 130 byte).
if command -v git-lfs >/dev/null 2>&1; then
  echo ">> git lfs pull (ambil bobot model asli)…"
  git lfs pull
else
  echo "!! git-lfs tidak ada — pastikan file model di ml/artifacts/ BUKAN pointer LFS."
fi

echo ">> Deploy ke Cloud Run: service=$SERVICE region=$REGION mem=$MEMORY cpu=$CPU"
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory "$MEMORY" \
  --cpu "$CPU" \
  --timeout 300 \
  --port 8080

echo ">> Selesai. URL layanan:"
gcloud run services describe "$SERVICE" --region "$REGION" --format 'value(status.url)'
