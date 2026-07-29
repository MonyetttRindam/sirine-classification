# Emergency Vehicle Siren Sound Classification System

**Project spec** untuk sistem klasifikasi suara sirine kendaraan darurat yang dikembangkan sebagai bagian dari Kerja Praktik di PT VINIX7 (Juli–September 2026).

Dokumen ini adalah **product specification** — mendefinisikan _apa_ yang harus dibangun dan _kenapa_. Detail _kapan_ dan _bagaimana_ eksekusinya ada di `PLANNING.md`.

---

## 1. Overview

### Deskripsi

Sistem klasifikasi audio yang mendeteksi & mengidentifikasi suara sirine kendaraan darurat (ambulance, firetruck, police) dari environment noise (traffic). Sistem harus mampu beroperasi dalam dua mode:

- **Mode 1 — Single-file inference**: menerima file audio berdurasi tetap (3 detik) dan mengembalikan prediksi kelas
- **Mode 2 — Streaming inference**: menerima audio stream kontinu (dari mikrofon atau source lain) dan menghasilkan prediksi real-time yang terupdate secara periodik

### Problem Statement

PT VINIX7 mengembangkan sistem deteksi kendaraan darurat berbasis audio. Sistem ini menjadi komponen fundamental yang menyediakan fungsi klasifikasi suara sirine sebagai layanan yang dapat diintegrasikan ke sistem downstream (misalnya alert driver, preemption sinyal lalu lintas).

Kebutuhan utama:
- Model klasifikasi audio yang **akurat pada kondisi realistic** (dengan traffic noise campuran)
- **API service** yang dapat dipanggil oleh sistem lain (developer VINIX7)
- **Streaming inference** karena audio dari mikrofon adalah stream kontinu, bukan file diskrit
- **Web demo** untuk showcase dan validation manual

---

## 2. Users & Use Cases

### Target User

**Developer VINIX7** — engineer internal yang akan mengintegrasikan sistem ini ke platform VINIX7 yang lebih besar. Bukan end-user awam.

Karakteristik user:
- Familiar dengan REST API dan WebSocket
- Butuh dokumentasi API yang clear
- Butuh sistem yang predictable, well-tested, dan deployment-ready
- Butuh demo untuk validation manual dan showcase ke stakeholder

### Use Case Utama

**UC1 — Integrasi API single-file**
Developer VINIX7 mengirim file audio 3-detik ke endpoint `/predict` dan menerima JSON berisi prediksi kelas beserta confidence per kelas. Digunakan untuk testing offline atau processing batch.

**UC2 — Integrasi API streaming**
Developer VINIX7 membuka WebSocket connection ke endpoint `/stream`, mengirim chunk audio secara periodik (misal setiap 250ms), dan menerima stream prediksi kelas yang updated tiap chunk. Digunakan untuk deteksi real-time dari sistem yang menggunakan mikrofon live.

**UC3 — Demo web (validation & showcase)**
Developer VINIX7 atau stakeholder lain membuka web demo, dapat:
- Upload file audio → melihat prediksi (Mode 1)
- Record audio langsung dari mikrofon browser → melihat prediksi live (Mode 2)
- Melihat visualisasi spectrogram audio input

Digunakan untuk manual QA, presentasi ke management, atau exploratory testing.

---

## 3. Functional Requirements

### 3.1 Model & Inference Engine

- Model klasifikasi **4 kelas**: `ambulance`, `firetruck`, `police`, `traffic`
- Support **batch inference** (single file → prediksi tunggal)
- Support **streaming inference** dengan sliding window + smoothing:
  - Window size: 3 detik (matched dengan durasi training)
  - Hop size: 250ms (konfigurable)
  - Smoothing: moving average pada probability output
  - Hysteresis: alert trigger membutuhkan confidence tinggi konsisten selama beberapa window untuk mencegah flicker
- Output format konsisten antara Mode 1 dan Mode 2:
  ```json
  {
    "predicted_class": "ambulance",
    "confidence": 0.94,
    "probabilities": {
      "ambulance": 0.94,
      "firetruck": 0.03,
      "police": 0.02,
      "traffic": 0.01
    },
    "timestamp": "2026-08-15T10:30:45.250Z"
  }
  ```

### 3.2 Backend API (FastAPI)

**Endpoint yang wajib disediakan:**

| Method | Path | Fungsi |
|---|---|---|
| GET | `/health` | Health check (untuk monitoring & CI/CD) |
| GET | `/info` | Metadata model (versi, kelas, feature config) |
| POST | `/predict` | Single-file inference: terima .wav file, kembalikan prediksi (Mode 1) |
| WS | `/stream` | Streaming inference: WebSocket untuk audio chunk kontinu (Mode 2) |

**Requirement backend:**
- Framework: FastAPI
- Model dimuat sekali pada startup (bukan tiap request)
- Support CORS untuk domain frontend
- Return proper HTTP status codes & error messages
- Validasi input (format audio, ukuran file)
- API documentation otomatis via Swagger UI di `/docs`

### 3.3 Web Demo — MVP (Gradio)

**Prioritas primary. Wajib jadi.**

Framework: Gradio, deploy ke HuggingFace Spaces.

**Fitur wajib:**
- Upload audio file dari device (Mode 1)
- Record audio langsung dari mikrofon browser (Mode 2)
- Play audio yang di-upload/record
- Visualisasi log-mel spectrogram audio input
- Tampilkan hasil prediksi + probability bar chart per kelas
- Untuk Mode 2: timeline chart yang menunjukkan probability tiap kelas berubah over time

**Alasan Gradio dipilih sebagai MVP:**
- Native support audio input (upload & record) dalam 1 baris kode
- Native support streaming output
- Deploy 1-klik ke HuggingFace Spaces (gratis)
- Cepat build (~2-4 hari total)

### 3.4 Web Demo — Stretch Goal (React + Vite)

**Prioritas stretch. Dikerjakan jika Fase 1-4 selesai lebih cepat.**

Framework: React + Vite, deploy ke Vercel.

**Fitur yang dibangun (subset atau superset dari Gradio):**
- Semua fitur Gradio, tapi dengan UI/UX yang custom
- Dashboard-style layout (multi-page: home, upload, live)
- Design sistem yang consistent (Tailwind CSS)
- State management proper (Zustand atau React Context)

**Alasan React sebagai stretch:**
- Portfolio value lebih tinggi (industry-standard tech)
- Full kontrol UI/UX untuk demo yang lebih polished
- Reuse backend FastAPI yang sudah ada — tidak perlu development backend tambahan
- **Namun**: butuh effort besar (2-3 minggu) dan skill frontend yang belum tentu dimiliki tim → makanya stretch, bukan primary

### 3.5 Training Pipeline

**Wajib disediakan sebagai script terpisah (bukan hanya notebook):**

- Data preprocessing: audio standardization (resample, mono, pad/crop, normalize)
- Metadata manifest generation (CSV dengan `source_id`, `condition`, `class`)
- Split generation dengan **group-based splitting** (mencegah data leakage)
- Feature extraction: log-mel spectrogram
- Model training: CNN 2D from scratch (baseline) + YAMNet transfer learning (improvement)
- Data augmentation: SpecAugment, noise mixing
- Evaluation: comprehensive metrics + confusion matrix

**Config-driven**: semua hyperparameter dan eksperimen setting harus bisa di-swap via file config (YAML). Kode training TIDAK boleh hardcode parameter.

**Experiment tracking**: menggunakan **CSV manual log** (bukan MLflow — di-skip karena kompleksitas setup).
- Setiap eksperimen menghasilkan:
  - Config file YAML (input)
  - Model checkpoint (output)
  - Metrics JSON (output)
  - Row baru di master `experiments.csv`

### 3.6 Evaluation & Reporting

**Metrics yang wajib direport:**

- **Model utama (D2 production)**:
  - Accuracy (train, val, test)
  - Precision, Recall, F1 per class
  - Macro F1, Weighted F1
  - Confusion matrix (raw + normalized)
  - Classification report (sklearn format)

- **Robustness study**:
  - Train model di D1 clean (3 kelas)
  - Evaluate di D2 subset 3 kelas (ambulance, firetruck, traffic)
  - Report performance gap: clean-test vs noisy-test
  - Formal analysis: berapa persen accuracy drop akibat noise?

**Reporting artifacts:**
- Confusion matrix plots (PNG)
- Metrics table (Markdown / CSV)
- Training/validation loss & accuracy curves
- Comparison table across experiments

---

## 4. Non-Functional Requirements

### 4.1 Performance

- **Single-file inference latency**: < 2 detik dari file upload sampai response (termasuk feature extraction)
- **Streaming inference latency**: < 500ms per update cycle
- **Model target accuracy**: **Macro F1 > 85% di D2 test set** (production model)

### 4.2 Deployment

- Backend, Gradio, dan (jika jadi) React harus di-Dockerize
- Backend deploy ke **Railway**
- Gradio deploy ke **HuggingFace Spaces**
- React (stretch) deploy ke **Vercel**
- Semua deployment harus memiliki URL public yang dapat diakses reviewer

### 4.3 CI/CD

- GitHub Actions untuk:
  - Linting (Ruff / Black)
  - Basic testing (minimal untuk data split logic — anti-leakage guard)
  - Docker build validation

### 4.4 Reproducibility

- Setiap eksperimen harus bisa direproduce dari config file
- Random seed dikonfigurasi eksplisit (numpy, tensorflow, python)
- Dependencies pinned (requirements.txt dengan versi spesifik)
- Dataset preprocessing deterministic

### 4.5 Documentation

- README.md di root repo dengan quick start guide
- API documentation via Swagger UI otomatis
- Docstring untuk public functions
- Notebook eksperimen dengan narasi Markdown yang jelas

---

## 5. Out of Scope

Hal-hal berikut **secara eksplisit TIDAK dikerjakan** dalam scope KP ini untuk membatasi ekspektasi:

- ❌ **Deployment ke Raspberry Pi / edge device** — future work
- ❌ **Edge optimization** (TFLite quantization, pruning, knowledge distillation) — future work
- ❌ **MLflow experiment tracking** — di-skip karena overhead setup vs value untuk scope KP (diganti CSV manual)
- ❌ **Authentication / user management** di web demo
- ❌ **Database untuk simpan history prediksi**
- ❌ **Multi-channel audio processing / Direction of Arrival (DoA)**
- ❌ **Multi-language support** di UI
- ❌ **Advanced audio features** (misal onset detection, distance estimation)
- ❌ **Mobile app** (iOS/Android)

Item-item ini bisa menjadi topik "Future Work" di laporan KP.

---

## 6. Dataset

### Sumber Data

**Dataset D1 — Emergency Vehicle Siren Sounds** (clean)
- 3 kelas: ambulance (200), firetruck (200), traffic (200)
- Total: 600 file audio
- Durasi: ~3 detik per file

**Dataset D2 — Emergency Vehicle Sirens with Traffic Noise** (mixed)
- 4 kelas: ambulance (400), firetruck (400), police (454), traffic (421)
- Total: 1675 file audio
- Durasi: ~3 detik per file
- File dengan prefix `mixed_sound_*` = versi noisy dari D1

### Findings Audit

Berdasarkan analisis dataset:

- **D2 adalah overlay dari D1** — semua file D1 punya versi noisy di D2. Random split gabungan akan menyebabkan **data leakage**.
- **Kelas police hanya di D2** — tidak ada versi clean-nya.
- **Format audio tidak seragam** — sample rate campur (44.1kHz, 48kHz, 22.05kHz), channel campur (stereo & mono). Perlu standardisasi.

### Data Handling Requirements

- **Preprocessing standard**: resample ke 22050 Hz, convert ke mono, pad/crop ke 3.0 detik, peak normalize
- **Metadata tagging**: setiap file di-tag dengan `source_id`, `condition` (clean/mixed), `variant`, `class`
- **Split strategy**: `GroupShuffleSplit` by `source_id` untuk mencegah leakage varian file yang sama

### Strategi Penggunaan Data

- **Model produksi**: train + evaluate di **D2 only** (4 kelas, condition realistic)
- **Robustness study**: train di **D1 clean** (3 kelas) → evaluate di **D2 subset 3 kelas** overlap → ukur performance drop

---

## 7. Tech Stack

### Core Stack

| Komponen | Pilihan | Deployment |
|---|---|---|
| Language | Python 3.11 | — |
| ML Framework | TensorFlow / Keras | — |
| Audio Processing | Librosa | — |
| Backend | FastAPI + Uvicorn | Railway |
| Web Demo (MVP) | Gradio | HuggingFace Spaces |
| Web Demo (Stretch) | React + Vite + Tailwind | Vercel |
| Container | Docker | — |
| CI/CD | GitHub Actions | — |

### Development Stack

| Komponen | Pilihan |
|---|---|
| Experiment tracking | CSV manual log + per-experiment folder |
| Hyperparameter tuning | Optuna (opsional, di-add jika perlu) |
| Config | YAML |
| Package management | pip + requirements.txt |
| Notebook | Jupyter / Kaggle |

### Deliberately Excluded

- MLflow (kompleksitas setup vs value untuk KP scope)
- Streamlit (Gradio lebih pas untuk audio classifier)
- Next.js (React + Vite lebih ringan untuk stretch goal)

---

## 8. Repository Structure

Monorepo dengan pemisahan concern yang jelas:

```
siren-classifier/
├── README.md                    # Pintu masuk repo (1 layar)
│
├── docs/
│   ├── TIM.md                   # Profil anggota & pembagian tugas
│   ├── PROJECT.md               # Dokumen ini (product spec)
│   └── PLANNING.md              # Roadmap, progress, decision log
│
├── ml/                          # Training pipeline & research
│   ├── configs/                 # YAML per eksperimen
│   ├── src/                     # Preprocessing, feature, model, training
│   ├── notebooks/               # EDA, exploratory, error analysis
│   ├── data/                    # (git-ignore) raw & processed
│   ├── artifacts/               # (git-ignore) model checkpoint per experiment
│   └── experiments.csv          # Master log semua eksperimen
│
├── backend/                     # FastAPI service
│   ├── src/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── routes/              # /predict, /stream, /health, /info
│   │   ├── inference/           # Predictor & streaming logic
│   │   └── schemas.py           # Pydantic models
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend-gradio/             # MVP demo
│   ├── app.py
│   ├── requirements.txt
│   └── README.md
│
├── frontend-web/                # Stretch goal (React + Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
└── .github/workflows/
    └── ci.yml                   # Lint + test + build
```

---

## 9. High-Level Milestones

Fase besar dari project. Detail per-minggu dan task per-anggota ada di **PLANNING.md**.

| Milestone | Deliverable | Fase |
|---|---|---|
| M1 — Data Pipeline Ready | Audio standardized, manifest CSV, train/val/test split (dengan group logic) | Fase 1 |
| M2 — Baseline Model Trained | CNN 2D dari scratch di D2, metrics baseline direport | Fase 2 |
| M3 — Improvements Complete | Augmentation + YAMNet transfer learning + robustness study selesai | Fase 3 |
| M4 — Backend API Ready | FastAPI dengan endpoint `/predict` dan `/stream` (streaming inference) | Fase 4a |
| M5 — Gradio Demo Live | Gradio MVP deploy ke HuggingFace Spaces, terintegrasi dengan backend | Fase 4b |
| M6 — Deployment Complete | Backend deployed ke Railway, CI/CD active, URL live | Fase 4c |
| M7 — Documentation Complete | Laporan KP + slide presentasi + README final | Fase 5 |
| M8 (stretch) — React Demo Live | React + Vite deploy ke Vercel, integrated dengan backend | Fase 4d |

---

## 10. Success Metrics

Project dinyatakan **berhasil** jika memenuhi:

### Model Performance
- ✅ **Macro F1 > 85% di D2 test set** untuk model produksi
- ✅ Robustness study terlaporkan dengan angka konkret (misal "accuracy drop X% clean→noisy")
- ✅ Baseline & improvement models terdokumentasi dengan metrics lengkap

### System Functionality
- ✅ Backend API live, endpoint `/predict` dan `/stream` berfungsi
- ✅ Gradio demo live di HuggingFace Spaces, dapat diakses via URL public
- ✅ Fitur Mode 1 (upload file) dan Mode 2 (record mic) berjalan end-to-end

### Engineering Quality
- ✅ Backend + Gradio Dockerized dan deployed
- ✅ CI/CD active di GitHub Actions
- ✅ Semua eksperimen tercatat di `experiments.csv` dan reproducible dari config

### Documentation
- ✅ README, TIM.md, PROJECT.md, PLANNING.md lengkap dan up-to-date
- ✅ Laporan KP submit
- ✅ Slide presentasi siap

### Stretch (Nice to Have)
- ⭐ React + Vite demo live di Vercel
- ⭐ Optuna hyperparameter search terintegrasi
- ⭐ SNR sweep analysis (robustness terhadap level noise bervariasi)

---

## Referensi

- **Dataset D1**: Emergency Vehicle Siren Sounds (Kaggle)
- **Dataset D2**: Emergency Vehicle Sirens with Traffic Noise (Kaggle)
- **YAMNet**: https://tfhub.dev/google/yamnet/1
- **SpecAugment paper**: Park et al., 2019 — "SpecAugment: A Simple Data Augmentation Method for Automatic Speech Recognition"
- **Librosa**: https://librosa.org/doc/latest/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Gradio**: https://www.gradio.app/

---

_Version: 1.0_
_Last updated: 2026-07-11_
