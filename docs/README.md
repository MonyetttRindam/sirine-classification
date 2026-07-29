# Siren Classifier

Sistem klasifikasi suara sirine kendaraan darurat berbasis deep learning. Mendeteksi 4 kelas — ambulance, firetruck, police, traffic — dengan support **single-file inference** dan **streaming inference** real-time.

Dikembangkan sebagai bagian dari Kerja Praktik di PT VINIX7 (Juli–September 2026).

---

## 📌 Status

🚧 **In Development** — Minggu 2 (Fase 1). EDA kedua dataset selesai, environment siap,
baseline model sedang dikerjakan. Progress terkini di [`PLANNING.md`](PLANNING.md).

---

## 🎯 Overview Singkat

- **4-class classifier**: ambulance, firetruck, police, traffic
- **2 mode inferensi**:
  - Mode 1 — Single file (upload .wav 3-detik)
  - Mode 2 — Streaming (audio kontinu dari mikrofon)
- **Stack**: TensorFlow + FastAPI + Gradio
- **Deployment**: Railway (backend) + HuggingFace Spaces (demo)

Detail lengkap ada di [`PROJECT.md`](PROJECT.md).

---

## 👥 Tim

| Anggota | Role |
|---|---|
| Muhammad Abil Khoiri | ML/Backend Engineer & Tech Lead |
| Eka | Frontend Developer |
| Muhammad Dwi Rangga | QC & Testing |

Detail spesialisasi & pembagian tugas di [`TIM.md`](TIM.md).

---

## 📁 Struktur Repository

Kondisi saat ini (Minggu 2) — folder bertanda ⏳ belum dibuat:

```
Siren Classification/
├── README.md                    # File ini
├── PROJECT.md                   # Product specification (apa & kenapa)
├── TIM.md                       # Profil tim & pembagian tugas
├── PLANNING.md                  # Roadmap, progress, decision log
├── requirements.txt             # Dependencies ML
├── Dataset/                     # Data mentah (git-ignored)
│   ├── Dataset1/sounds/         # D1: ambulance, firetruck, traffic
│   └── Dataset2/                # D2: ambulance, firetruck, police + traffic
├── notebooks/
│   ├── 01_eda_dataset1.ipynb    # EDA D1
│   ├── 02_eda_dataset2.ipynb    # EDA D2
│   └── 03_baseline_model.ipynb  # Baseline CNN 2D (WIP)
├── ml/
│   ├── eda_dataset{1,2}.csv     # Inventaris hasil EDA
│   ├── manifest_full.csv        # Manifest gabungan
│   ├── split_{train,val,test}.csv
│   ├── artifacts/               # Model & metrics per eksperimen (git-ignored)
│   ├── cache/                   # Fitur log-mel ter-cache (git-ignored)
│   └── src/                     # ⏳ Refactor dari notebook
├── figures/                     # Plot hasil EDA
├── backend/                     # ⏳ FastAPI service (Fase 4a)
└── frontend-gradio/             # ⏳ Web demo (Fase 4b)
```

---

## 🚀 Quick Start

**Prasyarat**: Python 3.11 (versi lebih baru belum kompatibel dengan pin `tensorflow<2.17`).

```powershell
# Setup environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
pip install ipykernel

# Daftarkan kernel untuk Jupyter/VS Code
python -m ipykernel install --user --name siren --display-name "Python 3 (siren)"
```

**Menjalankan notebook**: buka file di `notebooks/`, pilih kernel **"Python 3 (siren)"**
di pojok kanan atas. Tidak perlu aktivasi terminal.

Dataset tidak ikut di-commit. Download D1 & D2 dari tautan di bagian
[Dataset](#-dataset), lalu tempatkan sesuai struktur folder di atas.

```powershell
# Backend & demo — belum tersedia (Fase 4)
# cd backend && uvicorn src.main:app --reload
# cd frontend-gradio && python app.py
```

> **Catatan Windows**: TensorFlow ≥2.11 tidak memakai GPU di Windows native.
> Untuk training pakai Kaggle GPU atau WSL2.

---

## 📊 Dataset

- **D1** — [Emergency Vehicle Siren Sounds](https://www.kaggle.com/datasets/vishnu0399/emergency-vehicle-siren-sounds) (600 file, 3 kelas, clean)
- **D2** — [Emergency Vehicle Sirens with Traffic Noise](https://www.kaggle.com/datasets/santhoshkumarv/emergency-vehicle-sirens-with-traffic-noise) (1675 file, 4 kelas, mixed)

Preprocessing standard: resample 22050 Hz, mono, 3.0 detik, peak normalize.

### Temuan EDA yang menentukan desain pipeline

| | D1 | D2 |
|---|---|---|
| File | 600 (596 unik — 4 duplikat di `ambulance`) | 1675 |
| **Rekaman unik** | 596 | **1048** |
| Kelas | 3 (tanpa `police`) | 4 |
| Sample rate | campur: 22.05k / 44.1k / 48k | seragam 44.1 kHz |
| Channel | 585/600 stereo | semua stereo |
| Durasi | 3.0 s (seragam) | 3.0 s (seragam) |

**Konsekuensi terpenting — split wajib group-aware.** Setiap sirine di D2 punya 2 varian
overlay (`mixed_sound_57.wav` dan `mixed_sound_57_1.wav`) yang berasal dari rekaman yang sama.
Dengan random split, **65% file test punya "saudara" di train** — akurasi akan menggelembung
dan tidak bertahan di dunia nyata. Karena itu split memakai
`GroupShuffleSplit(groups=source_id)`, diverifikasi dengan assert bahwa irisan `source_id`
antar split kosong.

Karena durasi sudah seragam 3.0 detik, pad/crop tidak diperlukan.

Detail lengkap: [`notebooks/01_eda_dataset1.ipynb`](../notebooks/01_eda_dataset1.ipynb) dan
[`notebooks/02_eda_dataset2.ipynb`](../notebooks/02_eda_dataset2.ipynb).

---

## 📝 Dokumentasi

- 📖 [PROJECT.md](PROJECT.md) — Product specification (apa yang dibangun & kenapa)
- 👥 [TIM.md](TIM.md) — Anggota tim, spesialisasi, pembagian tugas
- 🗓️ [PLANNING.md](PLANNING.md) — Roadmap, progress log, decision log

---

## 📄 License

Proprietary — Kerja Praktik VINIX7 2026.

---

_Version: 0.1.1 (in development) — last updated 2026-07-22_
