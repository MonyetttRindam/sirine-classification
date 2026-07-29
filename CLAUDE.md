# CLAUDE.md

Konteks untuk Claude Code. Dokumen ini memuat hal-hal yang **tidak bisa ditebak dari
membaca kode** — path yang aneh, jebakan data, dan keputusan yang sudah dikunci.

Spec produk ada di [`docs/PROJECT.md`](docs/PROJECT.md).
Roadmap & progress di [`docs/PLANNING.md`](docs/PLANNING.md).
Pembagian tugas tim di [`docs/TIM.md`](docs/TIM.md).

---

## Project

Klasifikasi suara sirine kendaraan darurat, 4 kelas: `ambulance`, `firetruck`, `police`,
`traffic`. Kerja Praktik PT VINIX7, Juli–September 2026.

**Status (27 Juli 2026)**: **Fase 4 deployment inti SELESAI & teruji end-to-end.** Model final
(fine-tune YAMNet, macro-F1 D2 = 0.883) → **paket inferensi `ml/src` + backend FastAPI + demo
Gradio** yang **membandingkan dua model (D1 3-kelas vs D2 4-kelas) berdampingan**, lengkap dengan
**alert 3 lapis** (gerbang OOD YAMNet + confidence threshold + persistensi). Semua diverifikasi:
`ml/src` mereproduksi macro-F1 kedua model, dan stack FastAPI↔Gradio jalan end-to-end.

**Update (29 Juli 2026)**: frontend utama sekarang **React + Vite** (`frontend-web/`, bukan lagi
Gradio) dan **deployment single-container SUDAH dibangun & teruji**: `Dockerfile` multi-stage
(Node build FE → Python runtime, YAMNet di-pre-cache) → backend FastAPI **sekaligus menyajikan
React build** di `/` (API tetap di `/predict`,`/health`,`/stream-file`,`/stream`; info API pindah
ke `/api`). Image `sirine:local` diuji: `/health` dua model OK, `/` render SPA, `/predict` police
→ D2 "police" & D1 "firetruck" (perbandingan jalan). Repo di-push ke GitHub (lihat bawah).
**Target host: Hugging Face Spaces (Docker, port 7860)** — front-matter ada di `README.md` root.
`requirements-deploy.txt` = deps ramping (inferensi+web). **Sisa (ditunda)**: create HF Space +
push ke remote-nya (butuh akun/token HF, manual), opsi CI sync GitHub→HF. Detail di bagian
**"Deployment Fase 4"** di bawah; hasil eksperimen di `docs/TEMUAN_EKSPERIMEN.md`; roadmap di
`docs/PLANNING.md`.

**Bahasa**: dokumentasi, komentar kode, dan narasi notebook ditulis dalam **bahasa
Indonesia**. Nama variabel dan fungsi tetap bahasa Inggris.

---

## Environment

**Python 3.11 wajib.** Versi lebih baru melanggar pin `tensorflow<2.17` di
`requirements.txt`. Interpreter: `C:\Users\ABIL KHOIRI\AppData\Local\Programs\Python\Python311\python.exe`

```powershell
cd "d:\Coding Vscode\Siren Classification"
.\.venv\Scripts\Activate.ps1
```

Untuk notebook, pilih kernel **"Python 3 (siren)"** — tidak perlu aktivasi terminal.

Versi terpasang: numpy 1.26.4 · pandas 2.2.3 · librosa 0.10.2 · scikit-learn 1.5.2 ·
tensorflow 2.16.2 · tensorflow-hub 0.16.1 · matplotlib 3.9.4

### Dua jebakan environment

1. **TensorFlow tidak memakai GPU di Windows** sejak versi 2.11. Training lokal = CPU.
   Dataset kecil (~1.6k file) jadi baseline CNN masih wajar di CPU; untuk eksperimen
   berat pakai Kaggle GPU sesuai rencana di PLANNING.
2. **YAMNet (Fase 3b) butuh Keras 2.** TF 2.16 default ke Keras 3, sedangkan TF-Hub
   butuh Keras 2. Wajib set **sebelum** `import tensorflow`:
   ```python
   import os
   os.environ["TF_USE_LEGACY_KERAS"] = "1"
   import tensorflow as tf
   ```

### Menghapus / rebuild `.venv`

Tutup semua notebook dulu. Windows mengunci file `.pyd` selama kernel Jupyter hidup,
dan penghapusan akan gagal separuh jalan sehingga venv jadi rusak.

---

## Dataset — path persisnya

Nesting-nya tidak intuitif, terutama D2. Jangan ditebak:

```
Dataset/
├── Dataset1/sounds/{ambulance,firetruck,traffic}/    # D1, ada juga .png & .py (abaikan)
└── Dataset2/
    ├── Dataset/Dataset/{ambulance,firetruck,police}/ # D2 sirine — "Dataset" dua kali
    └── traffic/traffic/                              # D2 traffic — terpisah!
```

`Dataset/` di-gitignore. Kalau hilang, download dari Kaggle (tautan di `docs/PROJECT.md`).

| | D1 | D2 |
|---|---|---|
| Peran | training robustness study (clean) | **model produksi** |
| File | 600 (596 unik) | 1675 |
| Rekaman unik | 596 | **1048** |
| Kelas | 3 — **tidak ada `police`** | 4 |
| Sample rate | campur 22.05k/44.1k/48k | seragam 44.1k |
| Durasi | 3.0 s seragam | 3.0 s seragam |

Preprocessing: resample 22050 Hz, mono, peak normalize. **Pad/crop tidak perlu** —
durasi sudah seragam.

---

## ⚠️ Jebakan data — baca sebelum menyentuh split

### 1. Penomoran file bersifat GLOBAL dan dipakai kedua dataset

```
ambulance 1–200 · firetruck 201–400 · traffic 401–  · police 601–827
```

Nomor menandai rekaman sumber. **Nomor tidak restart per kelas.** Kalau menulis parser
`source_id`, jangan asumsikan penomoran per-folder.

### 2. D2 punya 2 varian per sirine → split wajib group-aware

`mixed_sound_57.wav` dan `mixed_sound_57_1.wav` berasal dari rekaman yang sama dengan
overlay noise berbeda. Hash isi file tidak menangkap ini (byte-nya beda).

**1675 file hanya berasal dari 1048 rekaman unik.** Dengan random split, **65% file test
punya saudara di train** (terukur: 164 source bocor). Karena itu:

```python
from sklearn.model_selection import GroupShuffleSplit
gss = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
train_idx, test_idx = next(gss.split(df, groups=df.source_id))
```

Selalu tutup dengan assert bahwa irisan `source_id` antar split kosong.

### 3. D1 traffic dan D2 traffic adalah FILE YANG SAMA

Terukur: korelasi log-mel **1.000 pada 25/25 pasangan** yang diuji. `sound_401.wav`
di D1 dan di D2 adalah audio identik. D1 traffic = 401–600, D2 traffic = 401–821.

**Konsekuensi untuk robustness study** (train D1 → eval D2): kelas traffic bocor total.
Saat menyusun subset evaluasi D2, **buang traffic id 401–600** dan pakai hanya 601–821
(221 file). Kalau tidak, traffic akan skor tinggi palsu dan performance gap yang diukur
jadi terlalu kecil.

> Catatan: `docs/PROJECT.md` §6 menyatakan "D2 adalah overlay dari D1 — semua file D1
> punya versi noisy di D2". Untuk **traffic** ini benar (bahkan identik, bukan sekadar
> overlay). Untuk **sirine** tidak terbukti: korelasi nomor-identik (ambulance 0.567,
> firetruck 0.784) nyaris sama dengan kontrol acak (0.484, 0.709) — selisih hanya ~0.08.
> Jadi ambulance/firetruck di D2 bukan versi ber-noise dari file D1 bernomor sama.

---

## Struktur & konvensi

```
notebooks/
├── 01_eda_dataset1.ipynb     # EDA D1 — sudah dieksekusi, output tersimpan
├── 02_eda_dataset2.ipynb     # EDA D2 — sudah dieksekusi, output tersimpan
└── 03_baseline_model.ipynb   # Baseline CNN 2D — WIP
ml/
├── eda_dataset{1,2}.csv      # inventaris hasil EDA
├── manifest_full.csv
├── split_{train,val,test}.csv
├── artifacts/                # git-ignored — model & metrics per eksperimen
└── cache/                    # git-ignored — fitur log-mel (.npy)
figures/eda_d{1,2}/           # plot hasil EDA
docs/                         # README, PROJECT, TIM, PLANNING
```

**Parameter fitur** (samakan di semua notebook & script):
`SR=22050 · DURATION=3.0 · N_FFT=1024 · HOP=512 · N_MELS=64` → input shape `(64, 130, 1)`

**Normalisasi**: hitung mean/std **hanya dari train**, lalu terapkan ke val/test.
Menghitungnya dari seluruh data adalah leakage halus yang gampang lolos review.

**Experiment tracking**: CSV manual (`ml/experiments.csv`), bukan MLflow — keputusan
sadar, lihat decision log PLANNING 2026-07-11. Tiap eksperimen menghasilkan config JSON,
model checkpoint, metrics JSON, dan satu baris di CSV.

---

## Keadaan yang perlu diketahui

- **Sudah jadi repo Git sendiri & di-push ke GitHub** (29 Juli 2026): **public** di
  `https://github.com/MonyetttRindam/sirine-classification` (branch `main`). Model produksi
  dilacak via **Git LFS** (`.gitattributes`: `*.keras/*.pb/variables.data-*`). `.gitignore`
  meng-whitelist HANYA dua model produksi dari `ml/artifacts/` (sisanya eksperimen, tak di-commit).
- **`ml/experiments.csv` sudah terisi** — 7 eksperimen tercatat (baseline s/d fine-tune).
- **`ml/src/` SUDAH ADA** (dibuat Fase 4, 27 Juli). Paket inferensi produksi:
  `config · audio · yamnet_hub · classifiers · ood · alert · inference`. Refactor hutang
  preprocessing sudah dibayar untuk jalur inferensi (extraction/manifest/split lama masih
  di notebook — belum diangkat, tidak menghalangi deploy).
- **Target macro-F1 > 85% di test D2: TERCAPAI** (fine-tune YAMNet = 0.883). Metrik utama
  macro-F1, bukan accuracy.

---

## Deployment Fase 4 — SUDAH DIBANGUN (27 Juli 2026)

Web = **perbandingan DUA model berdampingan**, bukan satu. Keduanya masuk produksi:

| | D1 | D2 |
|---|---|---|
| Artefak | `ml/artifacts/d1_yamnet_mlp_meanstd/model.keras` | `ml/artifacts/d2_yamnet_finetune/siren_savedmodel/` |
| Kelas | 3 (**tanpa police**) | 4 |
| macro-F1 | 0.976 (clean) | 0.883 (noisy/produksi) |
| Arsitektur | YAMNet **beku** → mean+std → standardize → MLP | fine-tune YAMNet **end-to-end** (SavedModel) |

**⚠️ Dua model = dua pipeline BERBEDA — jangan disatukan:**
- **D1**: `16k mono → PEAK-NORMALIZE → YAMNet asli → emb per-frame → concat(mean,std)=2048
  → standardize (train stats) → MLP → 3 probs`.
- **D2**: `16k mono (TANPA peak-norm) → pad/crop 48000 → _wave_to_patches → (1,5,96,64,1)
  → SavedModel → 4 probs`.

**⚠️ Model D2 WAJIB SavedModel, bukan `model.keras`** (terkunci versi tf_keras Kaggle 2.20 vs
lokal 2.16). Muat via `tf.saved_model.load`, nama input **dinamis** (`structured_input_signature`,
jangan hard-code `input_2`). **Model D1 `model.keras`** justru dilatih lokal (Keras 3 TF 2.16) →
muat normal via `tf.keras.models.load_model`. **Jangan set `TF_USE_LEGACY_KERAS`** — semua
komponen jalan di Keras 3 default (D1 Keras 3, D2/YAMNet keras-agnostic).

**Prasyarat D1**: statistik standardisasi train tidak ikut tersimpan saat training. Di-generate
ulang oleh `scripts/export_d1_artifacts.py` → `d1_yamnet_mlp_meanstd/standardize.npz`. Kalau
hilang, jalankan ulang skrip itu.

**Alert 3 lapis — SUDAH diimplementasi** (`ml/src/alert.py`, berlaku untuk kedua model):
1. **Gerbang OOD YAMNet AudioSet** — `siren_score` = PEAK skor kelas sirine (idx 316-319,390,391),
   ambang **longgar 0.05** (filter kasar lawan hening/noise/musik yang skornya ~0). ⚠️ Temuan:
   pada D2 noisy, skor AudioSet **police bisa serendah ~0.02** (hampir = traffic) → sebagian
   sirine police lolos-gerbang gagal. Karena itu gerbang = filter kasar, **confidence threshold
   yang jadi pertahanan utama**. Kalau alert web sering salah, naikkan/turunkan ambang di config.
2. **Confidence threshold** (skala **terkalibrasi**) + label ∈ {ambulance,firetruck,police}
   (traffic ≠ alert).
3. **Persistensi hysteresis** (streaming): butuh `n_on` window berturut untuk ON, `n_off` untuk OFF.

**Temperature scaling D2 — SUDAH dikalibrasi** (`scripts/calibrate_temperature.py`, di val set):
`temperature=4.43` → ECE **0.13 → 0.04**, keyakinan rata-rata 0.97 → 0.84 (≈ akurasi, jadi jujur).
⚠️ **Konsekuensi**: keyakinan D2 turun banyak → `confidence_threshold` alert **diturunkan 0.85 → 0.40**
(skala terkalibrasi; sirine noisy asli berkisar ~0.44-0.84). D1 belum dikalibrasi (`temperature=1.0`,
sudah akurat di data bersih). Kalau ubah temperature, **sesuaikan ulang** `confidence_threshold`.
Semua parameter di **`config/inference.yaml`** — ubah tanpa sentuh kode.

**Struktur & cara jalankan** (semua dari root project, `.venv` aktif):
```
ml/src/         paket inferensi (config, audio, yamnet_hub, classifiers, ood, alert, inference)
backend/        FastAPI  → .venv/Scripts/python -m uvicorn backend.main:app --port 8000
frontend-gradio/ Gradio  → set BACKEND_URL, lalu .venv/Scripts/python frontend-gradio/app.py
tests/          test_inference (reproduksi macro-F1 kedua model) · test_ood · test_alert
config/inference.yaml   registry model + ambang OOD/alert + temperature
scripts/        export_d1_artifacts.py · calibrate_temperature.py
demo_samples/   audio contoh (contoh_{kelas}.wav + demo_streaming_15s.wav)
run_demo.ps1    1 klik: nyalakan backend + tunggu health + frontend
```
**Cara termudah**: `powershell -ExecutionPolicy Bypass -File .\run_demo.ps1` (backend+frontend sekaligus).
Install deps sekali: `pip install -r backend/requirements.txt -r frontend-gradio/requirements.txt`.

⚠️ **Dua jebakan Gradio 4.44** (sudah ditangani, jangan “diperbaiki” balik):
- butuh `huggingface_hub<1.0` (HfFolder) — dipin di requirements frontend.
- bug `gradio_client 1.3.0` `get_type`/`_json_schema_to_python_type` crash `'bool' is not iterable`
  saat build skema → “localhost is not accessible”. Dipatch di `frontend-gradio/app.py` (guard bool).

**Mikrofon**: mode **rekam-lalu-analisis** sudah aktif (`gr.Audio sources=["upload","microphone"]`).
**Live mic real-time** (WS `/stream` streaming kontinu) sengaja **ditunda ke fase deploy web** —
backend WS-nya sudah ada, wiring frontend-nya belum.

**Verifikasi kritis**: `tests/test_inference.py` mereproduksi macro-F1 D1≈0.976 & D2≈0.883 di
test set → bukti pipeline `ml/src` identik dengan training. Jalankan setelah ubah preprocessing.

**Augmentasi audio TIDAK membantu** — jangan diulang tanpa alasan baru (lihat TEMUAN §2.7).

---

## Cara kerja yang diharapkan

- Jangan menandai task PLANNING selesai kalau logikanya baru ada di notebook padahal
  checklist meminta script — itu menyembunyikan hutang refactor.
- Jangan mengarang angka metrik. Kalau notebook belum dijalankan sampai sel logging,
  catat sebagai WIP.
- Kode notebook diutamakan **mudah dibaca**: fungsi pendek, docstring singkat, dan
  narasi Markdown yang menjelaskan *kenapa*, bukan sekadar *apa*.
