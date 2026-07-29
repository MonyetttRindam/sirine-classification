# PLANNING

Roadmap, progress tracking, decision log, dan blocker log untuk project **Siren Classifier**.

Dokumen ini adalah **execution tracker** — apa yang direncanakan, apa yang sudah selesai, apa yang berubah dari rencana awal. Untuk _apa yang dibangun_ lihat [`PROJECT.md`](PROJECT.md). Untuk _siapa yang mengerjakan_ lihat [`TIM.md`](TIM.md).

---

## 📅 Timeline Overview

**Total durasi**: ~11 minggu (Juli 14 – September 30, 2026)

> **Status per 27 Juli 2026** — **Fase 4 deployment inti SELESAI & teruji end-to-end.** Setelah
> model final (fine-tune YAMNet, macro-F1 D2 **0.883**), dibangun **paket inferensi `ml/src` +
> backend FastAPI + demo Gradio** yang **membandingkan dua model berdampingan** (D1 clean 3-kelas
> 0.976 vs D2 noisy/produksi 4-kelas 0.883), dengan **alert 3 lapis** (gerbang OOD YAMNet +
> confidence threshold + persistensi). Diverifikasi: `ml/src` **mereproduksi macro-F1 kedua model**
> di test set (bukti refactor identik training), dan stack **FastAPI↔Gradio jalan end-to-end**
> (uji smoke berhasil, termasuk contoh perbandingan: audio *police* → D2 tebak "police", D1 yang
> tak kenal police tebak "firetruck").
>
> ### ✅ Sudah dibangun sesi 27 Juli (Fase 4a + 4b inti)
> - `scripts/export_d1_artifacts.py` → `standardize.npz` (statistik train D1 yang tak ikut tersimpan).
> - `ml/src/`: `config · audio · yamnet_hub · classifiers · ood · alert · inference` + `config/inference.yaml`.
> - `backend/` FastAPI: `/health`, `/predict` (side-by-side), `/stream-file` (timeline), `/stream` (WS).
> - `frontend-gradio/` demo: tab **Bandingkan** (D1|D2) + tab **Simulasi Streaming** (timeline alert).
> - `tests/`: `test_inference` (reproduksi macro-F1), `test_ood`, `test_alert` — semua lolos.
>
> ### ✅ Tambahan sesi lanjutan 27 Juli
> - **Temperature scaling D2** (`scripts/calibrate_temperature.py`): `T=4.43`, ECE 0.13→0.04 →
>   keyakinan jujur; `confidence_threshold` alert disesuaikan 0.85→0.40 (skala terkalibrasi).
> - **UI Gradio dipoles** (tema Soft, accordion penjelasan, contoh klik, metrik model) + **mode
>   rekam mikrofon** (rekam-lalu-analisis).
> - **`run_demo.ps1`** — 1 klik nyalakan backend+frontend; `demo_samples/` audio contoh.
>
> ### 🔜 Sisa Fase 4 (ditunda)
> 1. **Live mic real-time** (WS `/stream` streaming kontinu) — **ditunda ke fase deploy web**
>    (permintaan user); backend WS sudah ada, wiring frontend belum.
> 2. **Deploy HF Spaces + Dockerfile + CI/CD** (Fase 4c / M6).
> 3. **Setup repo Git terpisah** — prasyarat kerja paralel tim (masih ditunda, decision log 2026-07-22).
>
> Fakta teknis lengkap (dua pipeline, jebakan versi, ambang OOD) ada di `CLAUDE.md`
> §"Deployment Fase 4" dan decision log di bawah (2026-07-27).

| Week | Fase | Fokus | Owner Utama |
|---|---|---|---|
| 1 (Jul 14-20) | Setup | Repo, environment, dataset lokal | Abil |
| 2 (Jul 21-27) | Fase 1 | Data pipeline: standardize, manifest, split | Abil |
| 3 (Jul 28-Aug 3) | Fase 2 | Baseline model: log-mel + CNN 2D | Abil |
| 4 (Aug 4-10) | Fase 3a | Data augmentation experiments | Abil |
| 5 (Aug 11-17) | Fase 3b | YAMNet transfer learning + robustness study | Abil |
| 6 (Aug 18-24) | Fase 4a | Backend FastAPI + Fase 4b Gradio kick-off | Abil + Eka |
| 7 (Aug 25-31) | Fase 4b | Gradio demo lengkap + integrasi backend | Eka + Abil |
| 8 (Sep 1-7) | Fase 4c | Deployment + Rangga QC dimulai | Abil + Rangga |
| 9 (Sep 8-14) | Stretch/Buffer | React demo (opsional) atau extra experiments | Eka (opsional) |
| 10 (Sep 15-21) | Fase 5a | Dokumentasi + laporan KP | Semua |
| 11 (Sep 22-30) | Fase 5b | Slide presentasi + final polish + presentasi | Semua |

---

## 🎯 Milestone

| ID | Milestone | Target Week | Status |
|---|---|---|---|
| M1 | Data pipeline ready (Fase 1) | End of Week 2 | 🟡 In Progress — EDA & split logic ✅, script `ml/src/` ❌ |
| M2 | Baseline model trained (Fase 2) | End of Week 3 | 🟡 In Progress — notebook jalan, hasil belum tercatat |
| M3 | Improvements + robustness study complete (Fase 3) | End of Week 5 | 🟡 Model final ✅ (fine-tune YAMNet, macro-F1 0.883) — robustness study D1→D2 belum |
| M4 | Backend API live (Fase 4a) | End of Week 6 | 🟢 Selesai lebih awal (27 Jul) — FastAPI dua model + alert, teruji end-to-end lokal |
| M5 | Gradio demo live di HF Spaces (Fase 4b) | End of Week 7 | 🟡 Demo lokal ✅ (side-by-side D1|D2 + timeline) — deploy HF Spaces belum |
| M6 | Deployment complete + CI/CD (Fase 4c) | End of Week 8 | ⚪ Pending — + temperature scaling |
| M7 | Documentation + laporan KP submitted (Fase 5) | End of Week 11 | ⚪ Pending |
| M8 (stretch) | React demo live | End of Week 9 | ⚪ Optional |

Legend: 🟢 Done · 🟡 In Progress · ⚪ Pending · 🔴 Blocked · ❌ Cancelled

---

## 📋 Sprint Plan

### Week 1 — Setup & Onboarding

**Owner**: Abil (setup), all (onboarding)

- [ ] Setup GitHub repo dengan struktur folder — @abil · ⏸️ ditunda (lihat decision log 2026-07-22)
- [ ] Bikin & commit dokumentasi awal (PROJECT, TIM, PLANNING, README) — @abil · TIM/PLANNING/README ✅, PROJECT.md belum
- [x] Setup .gitignore + requirements.txt baseline — @abil
- [ ] Invite Eka & Rangga sebagai collaborator — @abil · 🔴 terblokir oleh repo
- [x] Download dataset D1 & D2 ke lokal — @abil
- [x] Setup Python virtual environment + install dependencies — @abil
- [ ] Onboarding meeting (share vision, walkthrough PROJECT.md) — all
- [ ] Setup jadwal weekly sync — all

**Deliverable**: repo hidup, tim onboarded, environment ready.
**Status**: environment ✅ · dataset ✅ · repo & onboarding ❌ (carry over ke Minggu 3)

---

### Week 2 — Fase 1: Data Pipeline

**Owner**: Abil

- [ ] Script `standardize_audio.py` — resample, mono, pad/crop, normalize — @abil · logika ada di notebook, belum jadi script
- [ ] Jalankan standardize untuk D1 & D2 → `data/processed/` — @abil · tidak perlu file terpisah, konversi dilakukan on-the-fly saat load
- [ ] Script `build_manifest.py` — parse metadata dari filename → CSV — @abil · logika ada di notebook, belum jadi script
- [ ] Script `split.py` — GroupShuffleSplit by `source_id` → train/val/test — @abil · logika ada di notebook, belum jadi script
- [x] Manifest untuk D2 production (4-class) — @abil · `ml/manifest_full.csv` + `ml/split_{train,val,test}.csv`
- [ ] Manifest untuk robustness study (D1 train + D2 eval subset 3-class) — @abil
- [x] EDA notebook — distribusi kelas, waveform, spectrogram per kelas — @abil · 2 notebook, satu per dataset
- [x] Verifikasi split anti-leakage (assert irisan `source_id` == kosong) — @abil

**Deliverable**: audio standardized, manifest CSV siap, split anti-leakage terverifikasi.

**Milestone M1** ✅ tercapai kalau semua checklist di atas selesai.

**Catatan**: EDA & split anti-leakage sudah beres dan terverifikasi. Yang tersisa adalah
refactor dari notebook ke script reusable di `ml/src/` — sengaja ditunda sampai baseline
stabil supaya tidak refactor dua kali.

---

### Week 3 — Fase 2: Baseline Model

**Owner**: Abil

- [ ] Config schema YAML (`configs/exp01_baseline.yaml`) — @abil
- [ ] Feature extractor: log-mel spectrogram (`ml/src/features/logmel.py`) — @abil
- [ ] Data loader `tf.data` pipeline (`ml/src/data/dataset.py`) — @abil
- [ ] Model CNN 2D VGG-style (`ml/src/models/cnn2d.py`) — @abil
- [ ] Training script (`ml/src/training/train.py`) dengan callbacks — @abil
- [ ] Evaluation metrics (per-class F1, macro F1, confusion matrix) — @abil
- [ ] Run baseline experiment di Kaggle GPU — @abil
- [ ] Log ke `experiments.csv` + save artifacts — @abil

**Deliverable**: baseline CNN 2D trained di D2, metrics baseline direport (target: macro F1 baseline).

**Milestone M2** ✅

---

### Week 4 — Fase 3a: Augmentation Experiments

**Owner**: Abil

- [ ] Implementasi SpecAugment (`ml/src/data/augment.py`) — @abil
- [ ] Implementasi noise mixing augmentation — @abil
- [ ] Config exp02 (SpecAugment), exp03 (noise mix), exp04 (kombinasi) — @abil
- [ ] Run 3 experiments di Kaggle — @abil
- [ ] Bandingkan hasil vs baseline (M2) — @abil
- [ ] Update `experiments.csv` — @abil

**Deliverable**: 3-4 augmentation experiments logged, ada pemenang jelas.

---

### Week 5 — Fase 3b: Transfer Learning + Robustness

**Owner**: Abil

- [ ] Setup YAMNet transfer learning (`ml/src/models/yamnet_transfer.py`) — @abil
- [ ] Config exp05 (YAMNet frozen), exp06 (YAMNet fine-tune) — @abil
- [ ] Run YAMNet experiments — @abil
- [ ] Konfigurasi robustness study: train D1 clean (3-class) — @abil
- [ ] Evaluate di D2 subset 3-class → hitung performance gap — @abil
- [ ] Buat robustness report (angka konkret + tabel + plot) — @abil
- [ ] Pilih best model untuk deployment — @abil

**Deliverable**: transfer learning result + robustness study complete. Model final terpilih (macro F1 > 85% target).

**Milestone M3** ✅

---

### Week 6 — Fase 4a: Backend API

**Owner**: Abil (backend), Eka mulai orientasi Gradio

- [ ] Setup FastAPI project di `backend/` — @abil
- [ ] Load model saat startup (cache) — @abil
- [ ] Endpoint `/health`, `/info` — @abil
- [ ] Endpoint `POST /predict` (Mode 1: single-file) — @abil
- [ ] Feature extraction pipeline dalam inference service — @abil
- [ ] CORS middleware — @abil
- [ ] Streaming inference module (sliding window + smoothing + hysteresis) — @abil
- [ ] Endpoint `WS /stream` (Mode 2: streaming) — @abil
- [ ] Testing lokal via curl / Postman — @abil
- [ ] Baca dokumentasi Gradio, bikin skeleton `app.py` — @eka

**Deliverable**: backend API jalan lokal, `/predict` dan `/stream` berfungsi.

**Milestone M4** ✅

---

### Week 7 — Fase 4b: Gradio Demo

**Owner**: Eka (frontend), Abil (integration support)

- [ ] Gradio UI upload audio (Mode 1) — @eka
- [ ] Gradio UI record audio dari mic (Mode 2) — @eka
- [ ] Play audio component — @eka
- [ ] Visualisasi log-mel spectrogram — @eka
- [ ] Bar chart probability per kelas — @eka
- [ ] Timeline chart untuk streaming inference — @eka
- [ ] Integrasi call ke backend FastAPI — @eka + @abil
- [ ] Deploy Gradio ke HuggingFace Spaces — @eka
- [ ] Test end-to-end demo — @eka

**Deliverable**: Gradio demo live di HF Spaces, semua fitur berfungsi.

**Milestone M5** ✅

---

### Week 8 — Fase 4c: Deployment + QC Start

**Owner**: Abil (deployment), Rangga (QC)

- [ ] Dockerfile untuk backend — @abil
- [ ] Deploy backend ke Railway — @abil
- [ ] Setup env variables & secrets — @abil
- [ ] Update Gradio endpoint ke backend production URL — @eka
- [ ] Setup GitHub Actions CI (lint + basic test + docker build) — @abil
- [ ] Testing end-to-end demo di production URL — @rangga
- [ ] Test Mode 1: berbagai format audio (.wav, .mp3, corrupt, short/long) — @rangga
- [ ] Test Mode 2: berbagai browser (Chrome, Firefox, Safari) — @rangga
- [ ] Dokumentasi bug di GitHub Issues — @rangga

**Deliverable**: backend deployed live, CI/CD active, initial QC report.

**Milestone M6** ✅

---

### Week 9 — Stretch / Buffer

**Owner**: Eka (kalau ambil stretch), Abil (kalau extra experiments)

- [ ] (Stretch) Setup React + Vite project — @eka
- [ ] (Stretch) Bangun UI custom untuk Mode 1 & Mode 2 — @eka
- [ ] (Stretch) Deploy React ke Vercel — @eka
- [ ] (Alternative) Extra experiments: Optuna HP search, SNR sweep analysis — @abil
- [ ] (Alternative) Buffer untuk task minggu sebelumnya yang slip — all

**Deliverable**: (opsional) React demo live, atau buffer resolved.

**Milestone M8 (stretch)** ✅ kalau React demo live.

---

### Week 10 — Fase 5a: Dokumentasi & Laporan

**Owner**: All

- [ ] Update semua dokumentasi (PROJECT, TIM, PLANNING, README) — @abil
- [ ] Draft laporan KP:
  - Bab 1: Pendahuluan + problem statement — @abil
  - Bab 2: Literature review (SpecAugment, YAMNet, PANNs) — @rangga
  - Bab 3: Metodologi (dataset, pipeline, model) — @abil
  - Bab 4: Hasil & analisis (metrics, robustness study) — @abil
  - Bab 5: Deployment & UI — @eka
  - Bab 6: Kesimpulan & future work — @abil
- [ ] Screenshot & diagram untuk laporan — @eka + @abil
- [ ] Proofreading — @rangga

**Deliverable**: draft laporan KP (~80% done).

---

### Week 11 — Fase 5b: Final Polish

**Owner**: All

- [ ] Final review laporan — all
- [ ] Slide presentasi (bisa reuse struktur assignment Week 1) — @abil + @eka
- [ ] Video demo singkat (screencast) — @eka
- [ ] Final testing sebelum presentasi — @rangga
- [ ] Submit laporan KP — @abil
- [ ] Presentasi ke VINIX7 — all

**Deliverable**: laporan submitted, presentasi delivered.

**Milestone M7** ✅

---

## ✅ Progress Log

Update log ini setiap task selesai. Format:

```
- [x] YYYY-MM-DD · [Fase X] Task description — @nama
```

### 2026-07

- [x] 2026-07-11 · [Setup] Audit dataset D1 & D2, confirm overlay & format issues — @abil
- [x] 2026-07-11 · [Setup] Keputusan pendekatan: Opsi C + robustness study arah A — @abil
- [x] 2026-07-11 · [Setup] Keputusan tech stack finalized — @abil
- [x] 2026-07-11 · [Docs] PROJECT.md v1.0 selesai — @abil
- [x] 2026-07-11 · [Docs] TIM.md v1.0 selesai — @abil
- [x] 2026-07-11 · [Docs] PLANNING.md v1.0 selesai — @abil
- [x] 2026-07-22 · [Setup] Dataset D1 & D2 tersedia di lokal (`Dataset/`) — @abil
- [x] 2026-07-22 · [Setup] Python 3.11.9 + venv + install `requirements.txt` — @abil
- [x] 2026-07-22 · [Setup] Registrasi Jupyter kernel "Python 3 (siren)" — @abil
- [x] 2026-07-22 · [Setup] `.gitignore` dibuat (exclude Dataset, venv, artifacts, cache) — @abil
- [x] 2026-07-22 · [Fase 1] EDA Dataset 1 — `notebooks/01_eda_dataset1.ipynb` — @abil
- [x] 2026-07-22 · [Fase 1] EDA Dataset 2 — `notebooks/02_eda_dataset2.ipynb` — @abil
- [x] 2026-07-22 · [Fase 1] Manifest + group split D2 terverifikasi anti-leakage — @abil
- [ ] (WIP) 2026-07-22 · [Fase 2] Baseline CNN 2D — `notebooks/03_baseline_model.ipynb`
      dijalankan, checkpoint tersimpan, tapi belum sampai sel logging metrik — @abil
- [x] 2026-07-24 · [Fase 1] Preprocessing D1 & D2 → manifest + split group-aware
      (`03_preprocessing_dataset{1,2}.ipynb`), 0 kebocoran source terverifikasi — @abil
- [x] 2026-07-24 · [Fase 3b] Ekstraksi + cache embedding YAMNet D1 & D2
      (`04_features_yamnet.ipynb`), 1024-d mean-pool — @abil
- [x] 2026-07-24 · [Fase 3b] Baseline YAMNet + MLP head — D1 macro-F1 **0.9643**,
      D2 macro-F1 **0.7639** (`05_train_dataset{1,2}.ipynb`) — @abil
- [x] 2026-07-24 · [Fase 3b] Eksperimen #1 early-stopping pada val macro-F1 →
      D2 **0.7725** (+0.009), D1 tetap; menyingkap bahwa tembok D2 adalah diskriminasi
      sirine, bukan pemilihan epoch (`06_experiment_earlystop_f1.ipynb`) — @abil
- [x] 2026-07-24 · [Fase 3b] Eksperimen #2 fitur mean+std (2048-d) → D2 **0.7983**
      (+0.026, lever terbaik), D1 0.9762; mengonfirmasi pembeda sirine = pola temporal
      (`07_features_yamnet_stats` + `08_experiment_meanstd`) — @abil
- [x] 2026-07-24 · [Fase 3a] Eksperimen #3 augmentasi (noise/shift/gain ×2, D2) →
      **0.7965** (flat); YAMNet beku sudah robust noise → augmentasi diserap
      (`09_features_yamnet_aug` + `10_experiment_augment`) — @abil
- [x] 2026-07-24 · [Docs] Temuan eksperimen dirangkum untuk laporan KP →
      `docs/TEMUAN_EKSPERIMEN.md` — @abil
- [x] 2026-07-24 · [Fase 3b] Eksperimen #4 tweak murah (class_weight/ensemble) → semua
      ≤ meanstd; menegaskan plateau fitur beku (`11_experiment_tweaks.ipynb`) — @abil
- [x] 2026-07-27 · [Fase 3b] Fine-tune YAMNet di Kaggle GPU (D2) → **macro-F1 0.8830**,
      TARGET >0.85 TERCAPAI. CNN-spektrogram fine-tune kalah (~0.71). Model final diekspor
      SavedModel `ml/artifacts/d2_yamnet_finetune/siren_savedmodel/`, teruji load di lokal —
      @abil
- [x] 2026-07-27 · [Fase 3b] Pelajaran: `.keras` terkunci versi tf_keras → dipakai
      SavedModel yang tahan beda versi untuk deployment (lihat TEMUAN §2.8) — @abil
- [x] 2026-07-27 · [Fase 4] Prasyarat D1: `scripts/export_d1_artifacts.py` → `standardize.npz`
      (statistik train mean/std yang tak ikut tersimpan saat training) — @abil
- [x] 2026-07-27 · [Fase 4a] Paket inferensi `ml/src/` (config·audio·yamnet_hub·classifiers·
      ood·alert·inference) — refactor hutang preprocessing dibayar; `tests/test_inference.py`
      **mereproduksi macro-F1 D1 0.9762 & D2 0.8837** (bukti identik training) — @abil
- [x] 2026-07-27 · [Fase 4a] Backend FastAPI (`/health`, `/predict` side-by-side, `/stream-file`,
      WS `/stream`) + alert 3 lapis (`ml/src/alert.py`); `test_ood` & `test_alert` lolos — @abil
- [x] 2026-07-27 · [Fase 4b] Demo Gradio (tab Bandingkan D1|D2 + tab Simulasi timeline);
      stack FastAPI↔Gradio teruji end-to-end (smoke) — @abil
- [x] 2026-07-27 · [Fase 4] Temperature scaling D2 (`scripts/calibrate_temperature.py`) →
      T=4.43, ECE 0.13→0.04; `confidence_threshold` alert 0.85→0.40 (skala terkalibrasi) — @abil
- [x] 2026-07-27 · [Fase 4b] UI Gradio dipoles + mode rekam mic; `run_demo.ps1` (1 klik);
      `demo_samples/` audio contoh; patch bug `gradio_client` (skema bool) — @abil
- [ ] (Ditunda) Live mic real-time (WS) → fase deploy web · HF Spaces + Docker/CI · GitHub repo — @abil

---

## 🧠 Decision Log

Catat keputusan penting yang **berubah dari plan awal**, dengan alasan.

### 2026-07-27 · Web = perbandingan DUA model (D1 vs D2), bukan satu model produksi

- **Konteks**: Plan awal Fase 4 mengasumsikan deploy **satu** model produksi (D2, 0.883). Saat
  mulai deployment, ditegaskan bahwa web harus **membandingkan D1 dan D2 berdampingan** — D1
  (clean, 3 kelas, tanpa *police*) vs D2 (noisy/produksi, 4 kelas). Nilai edukatifnya justru di
  beda kelas & kondisi (audio *police* → D2 "police", D1 tebak paling mirip).
- **Keputusan**: Backend & demo mendukung **dua model sekaligus** (side-by-side). Alert (gerbang
  OOD + threshold + persistensi) berlaku untuk **kedua** model.
- **Dampak teknis**: Dua **pipeline inferensi berbeda** dalam `ml/src` — D1 (peak-norm → YAMNet
  beku → mean+std → standardize → MLP) vs D2 (patches → SavedModel). YAMNet asli dimuat **sekali**,
  dipakai 3 hal: embedding D1, gerbang OOD, reuse. Statistik standardisasi D1 harus di-generate
  ulang (`export_d1_artifacts.py`) karena tak ikut tersimpan saat training.

### 2026-07-27 · Gerbang OOD dibuat LONGGAR (ambang 0.05, peak-scoring)

- **Konteks**: Rencana gerbang OOD YAMNet AudioSet untuk menolak audio non-sirine. Saat kalibrasi,
  terukur: noise putih & hening → skor **0.000** (bagus), TAPI sebagian sirine **noisy D2 (police)**
  serendah **~0.02**, hampir menyentuh level traffic (~0.02). Separasi tidak bersih untuk sirine
  bernoise berat.
- **Keputusan**: `siren_score` = **PEAK** skor kelas sirine (bukan mean antar-frame), ambang
  **longgar 0.05**. Gerbang = **filter kasar** lawan hening/noise/musik/speech (skor ~0), **bukan**
  penentu jenis. **Confidence threshold classifier = pertahanan utama** alert.
- **Alasan**: ambang ketat akan menolak sirine police asli yang noisy (false-negative alert).
  Trade-off diterima; semua ambang di `config/inference.yaml` mudah di-tune. Temperature scaling
  (kalibrasi) ditunda tapi hook sudah disiapkan.

### 2026-07-24 · Desain alert inference — gerbang keyakinan, bukan label mentah

- **Konteks**: Rencana web (Fase 4) akan mensimulasikan audio nyata (YouTube/TikTok) dan
  memicu alert saat ada sirine. Muncul pertanyaan: aksi/notif dipicu oleh **label** atau
  **confidence**?
- **Keputusan**: Alert **wajib** berbasis ambang keyakinan (confidence threshold), bukan
  argmax label mentah. Ditambah beberapa aturan desain (belum diimplementasi, catatan
  untuk Fase 4):
  - **Masalah out-of-distribution**: model hanya kenal 4 kelas, tapi audio nyata penuh
    non-sirine (musik, ngomong, hening). Softmax argmax **selalu** memilih 1 dari 4 →
    trigger-label = alarm palsu terus-menerus. Ambang keyakinan wajib.
  - **Gerbang YAMNet AudioSet**: YAMNet punya 521 skor bawaan termasuk "Siren", "Emergency
    vehicle", "Music", "Speech". Bisa jadi penyaring tahap-1 ("ada sirine atau tidak")
    sebelum classifier 4-kelas menentukan jenisnya. Saat ekstraksi fitur, skor ini kita
    buang (hanya ambil embedding) — untuk deployment bisa dimanfaatkan.
  - **Persistensi streaming**: deteksi harus bertahan beberapa frame berturut (mis. >1 s),
    bukan satu frame, untuk menghindari alarm berkedip. Sejalan dengan item "sliding window
    + smoothing + hysteresis" di checklist Minggu 6.
  - **Kalibrasi jadi relevan**: karena alert bergantung pada keyakinan, model overconfident
    (val_loss besar di D2) berbahaya. Rencanakan **temperature scaling** sebagai langkah
    finishing sebelum deployment.
- **Dampak**: Menambah kebutuhan desain di Fase 4a (backend inference) — bukan sekadar
  `argmax`. Kemungkinan perlu strategi "other/background" atau gerbang YAMNet.

### 2026-07-24 · Jalur model: langsung YAMNet transfer learning (lewati CNN2D from-scratch)

- **Konteks**: PLANNING semula menaruh baseline log-mel + CNN2D (Fase 2) dulu, augmentasi
  (Fase 3a), baru YAMNet (Fase 3b).
- **Keputusan**: Langsung membangun baseline dengan **YAMNet frozen + classifier head MLP**,
  belum mengerjakan CNN2D from-scratch. Preprocessing berhenti di manifest + split (fitur
  ditunda ke training karena representasi ditentukan backbone).
- **Alasan**: Data kecil (~2k file) + CPU lokal → transfer learning jauh lebih tepat dan
  cepat daripada melatih CNN dari nol. YAMNet sudah tersedia & terbukti jalan lokal.
- **Dampak**: Sudah ada baseline terukur (lihat progress 2026-07-24). CNN2D from-scratch
  bisa tetap dikerjakan nanti sebagai pembanding untuk laporan, atau dilewati. Notebook
  dipecah per dataset (D1/D2) mengikuti pola EDA.

### 2026-07-22 · Tunda setup GitHub repo

- **Konteks**: PLANNING Minggu 1 dan TIM.md mengasumsikan repo `siren-classifier` sendiri
  dengan workflow branch/PR/Issues. Kenyataannya folder project ini masih untracked di dalam
  repo induk `D:/Coding Vscode` yang berisi semua project lain.
- **Keputusan**: Belum di-setup sebagai repo terpisah. Fokus dulu ke ML lokal.
- **Alasan**: Belum ada kebutuhan upload ke GitHub dalam waktu dekat.
- **Dampak**: Onboarding Eka & Rangga tertunda, workflow kolaborasi di TIM.md belum berlaku.
  Perlu dieksekusi sebelum Minggu 6 (Fase 4a) saat Eka mulai kerja paralel.

### 2026-07-22 · Python 3.11 untuk kompatibilitas TF-Hub

- **Konteks**: Environment awal dibangun dengan Python 3.13 + TensorFlow 2.21 (versi terbaru).
- **Keputusan**: Turun ke Python 3.11.9, mengikuti pin di `requirements.txt`
  (numpy<2.0, tensorflow<2.17, librosa<0.11).
- **Alasan**: `tensorflow-hub` untuk YAMNet (Fase 3b) belum stabil di stack terbaru, dan
  Python 3.11 lebih dekat ke environment Kaggle tempat training akan dijalankan.
- **Dampak**: Semua pin terpenuhi tanpa konflik. Catatan penting untuk Fase 3b — TF 2.16
  default ke Keras 3, sedangkan TF-Hub butuh Keras 2, jadi wajib set
  `os.environ["TF_USE_LEGACY_KERAS"] = "1"` **sebelum** `import tensorflow`.

### 2026-07-22 · EDA dipecah per dataset, bukan satu notebook gabungan

- **Konteks**: Rencana awal satu notebook EDA untuk semua data.
- **Keputusan**: Dua notebook terpisah — `01_eda_dataset1.ipynb` dan `02_eda_dataset2.ipynb`.
- **Alasan**: D1 dan D2 punya karakter dan peran berbeda (D1 clean untuk robustness study,
  D2 mixed untuk produksi). Memisahkannya bikin temuan per dataset lebih jelas dan
  gampang dikutip di laporan KP.
- **Dampak**: Ada sedikit duplikasi kode helper antar notebook — diterima demi keterbacaan,
  akan hilang saat refactor ke `ml/src/`.

### 2026-07-11 · Skip MLflow, ganti CSV manual log

- **Konteks**: Awalnya rencana pakai MLflow untuk experiment tracking.
- **Keputusan**: Skip MLflow, ganti dengan CSV manual log + per-experiment folder structure.
- **Alasan**: Overhead setup MLflow (server, database, UI di Kaggle context) tidak sepadan dengan value-nya untuk scope KP. CSV manual sederhana tapi cukup sistematis.
- **Dampak**: Kehilangan experiment comparison UI, tapi trade-off diterima. Bisa upgrade ke MLflow post-KP kalau perlu.

### 2026-07-11 · Streamlit → Gradio untuk MVP demo

- **Konteks**: Awal pertimbangan pakai Streamlit untuk web demo.
- **Keputusan**: Ganti ke Gradio.
- **Alasan**: Native support audio input (upload & record) dalam 1 baris kode. Streaming output built-in. Deploy 1-klik ke HuggingFace Spaces.
- **Dampak**: Development lebih cepat (~2-4 hari vs 1-2 minggu Streamlit).

### 2026-07-11 · Next.js → React + Vite untuk stretch goal

- **Konteks**: Awal rencana stretch goal pakai Next.js.
- **Keputusan**: Ganti ke React + Vite.
- **Alasan**: Backend Python wajib (FastAPI + TF), jadi fitur unggulan Next.js (API routes, SSR) tidak kepake. React + Vite lebih ringan & learning curve lebih landai untuk Eka.
- **Dampak**: Setup lebih cepat, tapi tetap effort besar (stretch goal, bukan primary).

### 2026-07-11 · Pembagian tugas simplified

- **Konteks**: Awalnya pertimbangan pembagian workload merata dengan cross-training.
- **Keputusan**: Abil handle ~75% (ML + backend + deployment), Eka fokus frontend, Rangga fokus QC & testing.
- **Alasan**: Play to individual strengths. Realistic untuk timeline 2 bulan. Eka level frontend dasar (HTML/CSS/JS), Rangga background elektro (bukan software).
- **Dampak**: Workload Abil berat, tapi timeline realistic dan kualitas terjaga.

---

## 🚧 Blocker Log

Catat blocker aktif dan resolusinya.

### Format

```
### YYYY-MM-DD · [Status] Blocker title
- **Owner**: @nama
- **Deskripsi**: apa yang blocking
- **Impact**: task yang tertunda
- **Resolution**: apa yang dilakukan (kalau sudah resolved)
```

### Active

### 2026-07-22 · [Open] Onboarding tim terblokir karena repo belum ada

- **Owner**: @abil
- **Deskripsi**: Project belum jadi repo Git sendiri, jadi Eka & Rangga belum bisa clone,
  bikin branch, atau lapor bug lewat GitHub Issues.
- **Impact**: Checklist Minggu 1 (invite collaborator, onboarding meeting) tertahan.
  Belum kritis sekarang karena Fase 1–3 dikerjakan solo oleh Abil, tapi jadi blocker keras
  mulai Minggu 6 (Fase 4a) saat Eka mulai kerja paralel di Gradio.
- **Deadline efektif**: sebelum Minggu 6 (18 Agustus 2026)
- **Resolution**: —

### Resolved

_Belum ada._

---

## 📊 Experiment Log

Master log semua eksperimen ML ada di **`ml/experiments.csv`**.

Format kolom:

```
exp_id, date, config_file, feature, model, augment, val_acc, val_f1_macro, test_acc, test_f1_macro, notes
```

Setiap eksperimen menghasilkan:
- Config YAML di `ml/configs/`
- Model checkpoint di `ml/artifacts/{exp_id}/`
- Metrics JSON di `ml/artifacts/{exp_id}/metrics.json`
- Row baru di `ml/experiments.csv`

---

_Version: 1.4_
_Last updated: 2026-07-27_
