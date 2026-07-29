# =============================================================================
# Sirine Classification — single-container (backend FastAPI + React build)
# Cocok untuk Hugging Face Spaces (SDK: docker, port 7860) & host lain (Railway,
# Render, Fly, VM) tanpa perubahan — cukup connect repo GitHub yang sama.
# =============================================================================

# ---------- Stage 1: build frontend React (Vite) ----------
FROM node:20-slim AS frontend
WORKDIR /fe
COPY frontend-web/package.json frontend-web/package-lock.json ./
RUN npm ci
COPY frontend-web/ ./
RUN npm run build          # -> /fe/dist (static)

# ---------- Stage 2: runtime Python (inferensi + serve) ----------
FROM python:3.11-slim

# Cache YAMNet & TF-Hub ke folder writable; TF pakai CPU (Windows/Docker tanpa GPU).
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    TFHUB_CACHE_DIR=/app/.tfhub \
    HF_HOME=/tmp/hf \
    TF_CPP_MIN_LOG_LEVEL=2 \
    MPLCONFIGDIR=/tmp/mpl \
    NUMBA_CACHE_DIR=/tmp/numba

# libsndfile1 -> soundfile; ffmpeg -> audioread (mp3/ogg); libgomp1 -> TensorFlow.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libsndfile1 ffmpeg libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements-deploy.txt ./
RUN pip install -r requirements-deploy.txt

# Pre-cache YAMNet saat build -> tidak ada unduhan lambat di request pertama.
RUN python -c "import tensorflow_hub as hub; hub.load('https://tfhub.dev/google/yamnet/1')"

# Kode + config + HANYA dua model produksi (D1 meanstd + D2 SavedModel).
COPY ml/__init__.py ./ml/__init__.py
COPY ml/src ./ml/src
COPY ml/artifacts/d1_yamnet_mlp_meanstd ./ml/artifacts/d1_yamnet_mlp_meanstd
COPY ml/artifacts/d2_yamnet_finetune/siren_savedmodel ./ml/artifacts/d2_yamnet_finetune/siren_savedmodel
COPY config ./config
COPY backend ./backend

# Hasil build React dari stage 1 -> backend menyajikannya di "/".
COPY --from=frontend /fe/dist ./frontend-web/dist

# HF Spaces mengharapkan app di port 7860 (bisa diatur via app_port di README).
EXPOSE 7860
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
