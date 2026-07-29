---
title: Sirine Classification
emoji: 🚨
colorFrom: blue
colorTo: red
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# 🚨 Sirine Classification — Deteksi Suara Sirine Kendaraan Darurat

Klasifikasi suara sirine kendaraan darurat (4 kelas: **ambulance, firetruck, police,
traffic**) dengan **dua model dibandingkan berdampingan**. Kerja Praktik PT VINIX7.

Web app membandingkan:

| | Model D1 | Model D2 |
|---|---|---|
| Data latih | Dataset 1 (bersih) | Dataset 2 (noisy / produksi) |
| Kelas | 3 (tanpa `police`) | 4 |
| Arsitektur | YAMNet beku → mean+std → MLP | fine-tune YAMNet end-to-end |
| macro-F1 (test) | **0.976** | **0.883** |

Plus **alert 3 lapis** (gerbang OOD YAMNet AudioSet + confidence threshold terkalibrasi +
persistensi hysteresis untuk streaming).

## Arsitektur deploy

Satu container:

```
React (Vite build, static)  ──►  FastAPI  ──►  ml/src (D1 + D2 + YAMNet + OOD + alert)
        frontend-web/dist         backend/          ml/src/
```

Backend menyajikan hasil build React di `/` dan API di `/predict`, `/health`,
`/stream-file`, `/stream` (WebSocket).

## Menjalankan dengan Docker (lokal)

```bash
docker build -t sirine .
docker run --rm -p 7860:7860 sirine
# buka http://localhost:7860
```

## Deploy ke Hugging Face Spaces

Space ini bertipe **Docker**. Cukup push repo ini ke remote Space; HF membaca
`Dockerfile` + front-matter README di atas (`sdk: docker`, `app_port: 7860`) lalu
build otomatis. Model `ml/artifacts/**` dilacak via **Git LFS**.

## Pindah host (Railway / Render / Fly)

`Dockerfile`-nya standar — connect repo GitHub yang sama, platform auto-build. Frontend
memakai `VITE_API_URL` (default same-origin), jadi kalau backend dipisah cukup set env
itu ke URL backend saat build frontend.

## Pengembangan lokal (tanpa Docker)

```bash
# backend
.venv/Scripts/python -m uvicorn backend.main:app --reload --port 8000
# frontend (terminal lain)
cd frontend-web && npm run dev      # Vite :5173, proxy ke :8000
```

## Struktur

```
ml/src/          paket inferensi (config, audio, yamnet_hub, classifiers, ood, alert, inference)
backend/         FastAPI (serve API + React build)
frontend-web/    React + Vite (UI utama)
config/          inference.yaml (registry model + ambang OOD/alert + temperature)
ml/artifacts/    dua model produksi (D1 .keras + D2 SavedModel) — via Git LFS
tests/           reproduksi macro-F1 kedua model + OOD + alert
docs/            PROJECT, PLANNING, TIM, TEMUAN_EKSPERIMEN
```

Detail keputusan teknis & jebakan data ada di `CLAUDE.md`.
