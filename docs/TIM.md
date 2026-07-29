# TIM

Dokumentasi anggota tim, spesialisasi, dan pembagian tugas untuk project **Emergency Vehicle Siren Sound Classification System** (VINIX7 KP, Juli–September 2026).

---

## Anggota Tim

### Muhammad Abil Khoiri — ML/Backend Engineer & Tech Lead

- **Background**: Computer Engineering — Telkom University Bandung
- **Spesialisasi**:
  - Machine Learning & Deep Learning (TensorFlow, PyTorch)
  - Data Science & Data Engineering
  - MLOps & Deployment (Docker, FastAPI, Railway, HuggingFace)
  - Experiment design & evaluation
- **Pengalaman relevan**:
  - MLOps portfolio: Telco Customer Churn Prediction (end-to-end pipeline)
  - Published preprint: CKD Severity Staging ML
  - Head of Research Division @ I-Smile Laboratory (mentoring ML/EDA)
- **Role di project**: Tech Lead — bertanggung jawab atas core teknis (data pipeline, model, backend, deployment) dan koordinasi tim.

### Eka — Frontend Developer

- **Background**: Sistem Informasi (semester 2)
- **Spesialisasi**:
  - UI/UX Design
  - Frontend Development (HTML, CSS, JavaScript)
- **Minat**: AI (baru mulai eksplorasi)
- **Role di project**: Frontend Developer — bertanggung jawab atas web demo yang di-consume oleh user.

### Muhammad Dwi Rangga — Quality Control & Testing

- **Background**: S1 Teknik Elektro
- **Spesialisasi**:
  - Membaca wiring diagram kelistrikan (electrical)
  - Menggambar teknik menggunakan CAD
- **Role di project**: QC & Testing — bertanggung jawab atas manual testing, dokumentasi bug/feedback, dan validasi kualitas deliverable sebelum di-ship.

---

## Pembagian Tugas

### Abil — ML/Backend/Lead (~75% workload)

**Ownership utama:**

- **Fase 1** — Data pipeline: audio standardization, manifest CSV, group-based train/val/test split
- **Fase 2** — Baseline model: log-mel feature extraction, CNN 2D from scratch, training pipeline, evaluation
- **Fase 3** — Improvements: data augmentation (SpecAugment, noise mixing), transfer learning (YAMNet), robustness study (train D1 → eval D2)
- **Fase 4a** — Backend FastAPI: endpoint `/predict`, `/stream` (WebSocket streaming inference), model loading, CORS, dokumentasi API
- **Fase 4c** — Deployment: Dockerize backend, deploy ke Railway, setup CI/CD GitHub Actions
- **Dokumentasi teknis**: PROJECT.md maintenance, PLANNING.md tracking, README backend & ML, laporan KP section teknis

### Eka — Frontend Developer (~15% workload)

**Ownership utama:**

- **Fase 4b — Gradio demo (MVP)**:
  - UI upload audio file
  - UI record audio dari mikrofon browser (Mode 2)
  - Play audio + visualisasi log-mel spectrogram
  - Tampilan hasil prediksi + probability bar chart
  - Timeline chart untuk streaming inference
  - Deploy ke HuggingFace Spaces
- **Fase 4d — React + Vite (STRETCH GOAL)**:
  - Hanya dikerjakan jika fase 1-4c selesai lebih cepat
  - UI custom dengan Tailwind CSS
  - Integration ke backend FastAPI
  - Deploy ke Vercel
- **Design assets**: UI mockup di Figma, screenshot untuk laporan/presentasi
- **Dokumentasi**: README frontend, panduan usage web demo

### Rangga — QC & Testing (~10% workload)

**Ownership utama:**

- **Fase 4b/4d — Manual testing web demo**:
  - Test Mode 1 (upload file) dengan berbagai format audio
  - Test Mode 2 (record mic) di berbagai browser (Chrome, Firefox, Safari)
  - Test edge case: file corrupt, durasi tidak sesuai, format asing, permission mic ditolak
  - Test streaming inference: latency, stability, akurasi realtime
- **Bug reporting**: dokumentasi bug di GitHub Issues dengan reproduction steps
- **UX feedback**: catatan usability dari perspektif user awam
- **Fase 5 — Dokumentasi & Laporan**:
  - Bantu penulisan laporan KP (section literature review, dataset description, referensi)
  - Testing report untuk section "Evaluation & QC"
  - Proofreading dokumentasi tim
- **Fase pra-testing** (sebelum web demo ready):
  - Baca paper referensi (SpecAugment, YAMNet, PANNs) → buat ringkasan
  - Bantu tracking progress di PLANNING.md
  - Riset kompetitor/prior work untuk section "Related Work"

---

## Komunikasi & Workflow

### Channel Komunikasi

- **Chat utama**: WhatsApp Group "Siren Classifier KP"
- **Code collaboration**: GitHub (repository `siren-classifier`)
- **Meeting/sync**: [tentukan bersama — misal Google Meet]

### Jadwal Sync

- **Weekly sync**: [tentukan hari & jam — misal Rabu 20:00 WIB via Google Meet]
- **Daily standup async**: post progress harian di WA group (opsional, format: yesterday/today/blocker)
- **Ad-hoc meeting**: kalau ada blocker atau decision penting

### Workflow Kolaborasi

- **Git branching**:
  - `main` — protected, hanya merge via PR
  - `dev` — integration branch
  - `feature/<nama-fitur>` — per task
- **Pull Request**:
  - Minimal 1 review dari Abil sebelum merge ke `dev`
  - PR ke `main` butuh approval + testing pass
- **Commit convention**: pakai Conventional Commits (`feat:`, `fix:`, `docs:`, dst)
- **Issue tracking**: GitHub Issues dengan label (`bug`, `feature`, `docs`, `question`)

### Decision Making

- **Keputusan teknis**: Abil sebagai tech lead punya final say, tapi selalu diskusi terbuka
- **Keputusan UX/desain**: Eka lead, review bareng tim
- **Keputusan scope/timeline**: konsensus tim, dokumentasikan di PLANNING.md decision log
- **Escalation**: kalau stuck > 2 hari, escalate ke supervisor VINIX7

### Handling Blocker

- Post di WA group secepatnya (jangan tunggu next sync)
- Tag person yang relevan untuk unblock
- Kalau tidak resolved dalam 1 hari, bahas di ad-hoc meeting

---

## Timeline Commitment

Estimasi commitment per minggu (adjust sesuai realita masing-masing):

| Anggota | Jam/minggu | Peak time |
|---|---|---|
| Abil | ~20-25 jam | Fase 1-3 (Juli - Agustus awal) |
| Eka | ~8-10 jam | Fase 4b (Agustus pertengahan) & Fase 4d stretch (September) |
| Rangga | ~5-8 jam | Fase 5 (September) & continuous QC saat demo ready |

---

## Progress Anggota

Setiap anggota update progress-nya di **PLANNING.md** setiap selesai task. Format:

```
- [x] [Fase] Task description — @nama (YYYY-MM-DD)
```

---

_Version: 1.0_
_Last updated: 2026-07-11_
