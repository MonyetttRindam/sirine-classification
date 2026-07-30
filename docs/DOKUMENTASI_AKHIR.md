# Dokumentasi Akhir — Klasifikasi Suara Sirine Kendaraan Darurat

**Kerja Praktik PT VINIX7 · Juli–September 2026**
Sistem deteksi & klasifikasi suara sirine kendaraan darurat berbasis AI, dari data mentah
sampai aplikasi web yang bisa diakses publik.

Repositori: <https://github.com/MonyetttRindam/sirine-classification>

---

## 1. Ringkasan Eksekutif

Proyek ini membangun sistem yang **mendengar suara di sekitar dan menentukan apakah ada
sirine kendaraan darurat** — ambulans, pemadam kebakaran, atau polisi — lalu membedakannya
dari suara lalu lintas biasa. Tujuannya sebagai dasar untuk aplikasi seperti peringatan dini
bagi pengemudi tuli/berkurang pendengaran, atau prioritas lampu lalu lintas.

**Apa yang dihasilkan:**

- **Dua model AI** yang dibandingkan berdampingan:
  - **Model D1** (data bersih, 3 kelas) — akurat di kondisi ideal, **macro-F1 0.976**.
  - **Model D2** (data berisik/nyata, 4 kelas termasuk polisi) — model **produksi**,
    **macro-F1 0.883**, menembus target > 0.85.
- **Aplikasi web** (React) tempat siapa pun bisa **mengunggah audio, merekam dari mikrofon,
  atau memantau langsung secara real-time**, dan melihat kedua model menebak sekaligus.
- **Sistem alert 3 lapis** agar peringatan tidak asal bunyi: menyaring suara non-sirine,
  memakai ambang keyakinan terkalibrasi, dan menahan alarm supaya tidak berkedip.
- **Deployment satu-kontainer** (Docker) yang sudah teruji end-to-end dan **online lewat
  internet** (Cloudflare Tunnel), siap dipindah ke cloud kapan pun.

**Angka kunci:**

| Model | Data | Kelas | macro-F1 | Peran |
|---|---|---|---|---|
| D1 | Dataset 1 (bersih) | 3 (tanpa polisi) | **0.976** | studi robustness / pembanding |
| D2 | Dataset 2 (berisik) | 4 | **0.883** | **model produksi** |

> **Kenapa dua model?** Justru perbandingannya yang informatif: pada audio polisi, D2 menebak
> "polisi" dengan benar sementara D1 (tak mengenal kelas polisi) menebak yang paling mirip;
> pada audio berisik, terlihat model mana yang lebih tahan. Ini memperlihatkan secara nyata
> pengaruh kualitas data latih terhadap performa.

---

## 2. Latar Belakang & Tujuan

Sirine darurat dirancang untuk menembus kebisingan, tetapi tidak semua orang bisa
mengandalkannya — pengemudi dengan gangguan pendengaran, kabin kendaraan yang kedap, atau
sistem otomatis membutuhkan **deteksi berbasis mesin**. Tugas ini adalah **klasifikasi audio**:
memetakan potongan suara 3 detik ke salah satu kelas.

**Empat kelas target:** `ambulance`, `firetruck`, `police`, `traffic` (lalu lintas biasa =
bukan sirine).

**Metrik utama: macro-F1**, bukan accuracy — karena kelasnya tidak seimbang dan kita ingin
setiap kelas sirine terdeteksi baik, bukan sekadar total tebakan benar.

**Ruang lingkup KP:** dari eksplorasi data → pelatihan model → paket inferensi → aplikasi web
→ deployment. Bahasa dokumentasi & antarmuka: Indonesia.

---

## 3. Data

Dua dataset publik (Kaggle) dengan peran berbeda:

| | Dataset 1 (D1) | Dataset 2 (D2) |
|---|---|---|
| Peran | studi robustness (kondisi **bersih**) | **model produksi** (kondisi **berisik**) |
| Jumlah file | 600 (596 unik) | 1675 |
| Rekaman unik | 596 | **1048** |
| Kelas | 3 — **tanpa polisi** | 4 |
| Sample rate | campur 22k/44k/48k | seragam 44.1k |
| Durasi | 3.0 s seragam | 3.0 s seragam |

**Prapemrosesan:** resample ke 16 kHz (untuk YAMNet), mono, lalu jalur berbeda per model
(lihat §6). Durasi sudah seragam sehingga tidak perlu pad/crop pada tahap dasar.

### 3.1 Tiga jebakan data (dan cara mengatasinya)

Bagian ini krusial secara metodologis — mengabaikannya menghasilkan angka yang **terlihat
bagus tapi palsu**.

1. **Penomoran file bersifat global.** `ambulance 1–200 · firetruck 201–400 · traffic 401– ·
   police 601–827`. Nomor menandai rekaman sumber dan **tidak restart per kelas** — parser
   `source_id` harus sadar ini.

2. **D2 punya 2 varian per sirine → split wajib group-aware.** `mixed_sound_57.wav` dan
   `mixed_sound_57_1.wav` berasal dari rekaman yang sama dengan overlay noise berbeda. 1675
   file hanya berasal dari **1048 rekaman unik**. Dengan split acak, **65% file test punya
   "saudara" di train** (terukur: 164 sumber bocor) → skor melambung palsu. Solusi:
   **`GroupShuffleSplit` berdasarkan `source_id`**, ditutup dengan *assert* bahwa irisan
   `source_id` antar-split kosong (0 kebocoran, terverifikasi).

3. **Traffic D1 dan traffic D2 adalah file identik.** Korelasi log-mel **1.000** pada 25/25
   pasangan uji. Untuk studi robustness (latih D1 → uji D2), traffic id 401–600 dibuang agar
   kelas traffic tidak bocor total dan gap yang diukur tidak mengecil palsu.

> **Konsekuensi jujur:** gap D1 (0.976) vs D2 (0.798 pada model beku) sebesar ~0.18 **bukan
> kegagalan** — itu bukti split group-aware bekerja dan angka D2 mencerminkan generalisasi
> nyata ke rekaman yang belum pernah dilihat.

---

## 4. Metodologi & Eksperimen

Semua model bertumpu pada **YAMNet** (jaringan audio Google, dilatih di AudioSet) sebagai
*feature extractor*, dengan *classifier head* di atasnya. Metrik: macro-F1 di test set,
split group-aware.

### 4.1 Perjalanan eksperimen (yang menggerakkan angka)

| # | Eksperimen | Perubahan | D1 | D2 |
|---|---|---|---|---|
| 0 | baseline | YAMNet mean-pool (1024-d) + MLP | 0.964 | 0.764 |
| 1 | esf1 | early-stop pindah ke val **macro-F1** | 0.964 | 0.773 |
| 2 | **meanstd** | fitur **mean + std** (2048-d) | **0.976** | 0.798 |
| 3 | augmentasi | + noise/shift/gain ×2 pada train D2 | — | 0.797 |
| 4 | tweak murah | class_weight / ensemble seed | — | ≤0.787 |
| 5 | **fine-tune YAMNet** | buka layer 10–14 + L2/dropout (Kaggle GPU) | — | **0.883** 🏆 |

### 4.2 Temuan penting

- **Sirine dibedakan oleh pola temporal, bukan spektrum rata-rata.** Lompatan terbesar pada
  model beku (+0.026) datang dari mengganti agregasi fitur dari *rata-rata* frame YAMNet
  menjadi **mean + std** antar-frame — memberi classifier informasi *modulasi* sirine
  (wailing naik-turun) yang hilang saat dirata-rata. Kenaikan terkonsentrasi di firetruck
  (+0.076). Ini bukti empiris atas hipotesis akustik dari EDA.

- **Augmentasi tidak membantu (~0).** YAMNet sudah dilatih di jutaan klip berisik, jadi
  extractor beku memetakan audio ter-augmentasi ke embedding nyaris sama — augmentasi
  "diserap" sebelum mencapai classifier. Prinsip: augmentasi berguna saat **melatih**
  extractor, bukan saat extractor **beku dan sudah robust**. **Jangan diulang tanpa alasan
  baru.**

- **Fine-tuning menembus target (0.80 → 0.88).** Membuka sebagian bobot YAMNet dan melatihnya
  (Kaggle GPU) adalah lompatan terbesar. Kunci keberhasilan:
  - **Two-phase**: warm-up head (core beku) → buka sebagian core dengan LR kecil (1e-5).
    Membuka seluruh backbone sekaligus = overfit parah.
  - **Buka sebagian + regularisasi**: hanya blok atas (layer 10–14), BatchNorm beku, L2 +
    dropout 0.5.
  - **Jebakan numerik**: `reduce_std` di pooling menghasilkan NaN gradient saat std=0 (hanya
    muncul ketika core dilatih) → fix `sqrt(var + 1e-6)`.

- **Ambulance kelas tersulit** (F1 ~0.87 di final), traffic paling mudah (~0.99).

### 4.3 Hasil model final

**Model D1** (YAMNet beku → mean+std → standardize → MLP) — data bersih, 3 kelas:

| Metrik | Nilai |
|---|---|
| macro-F1 | **0.976** |
| accuracy | 0.976 |
| F1 ambulance / firetruck / traffic | 0.964 / 0.964 / 1.000 |

**Model D2** (fine-tune YAMNet end-to-end) — data berisik, 4 kelas, **produksi**:

| Metrik | Nilai |
|---|---|
| macro-F1 | **0.883** |
| accuracy | 0.883 |
| F1 ambulance / firetruck / police / traffic | 0.874 / 0.843 / 0.824 / 0.992 |

> **Verifikasi anti-bocor:** paket inferensi `ml/src` **mereproduksi** macro-F1 kedua model
> di test set (D1 ≈ 0.976, D2 ≈ 0.883). Ini bukti pipeline produksi identik dengan pelatihan
> — bukan angka karangan.

---

## 5. Arsitektur Sistem

```
                         ┌─────────────── Aplikasi Web (React) ───────────────┐
   Audio (upload /       │  Upload · Rekam mic · Streaming file · Live mic     │
   mic / streaming)      └───────────────────────┬─────────────────────────────┘
        │                                        │  HTTP /predict, /stream-file
        ▼                                        │  WebSocket /stream
   ┌─────────────────────── Backend FastAPI ─────┴───────────────────────┐
   │  ml/src:  config · audio · yamnet_hub · classifiers · ood · alert    │
   │           · inference (ModelRegistry)                                │
   └──────────────────────────────────────────────────────────────────────┘
        │                        │                         │
   YAMNet (dimuat 1×)      Model D1 (.keras)         Model D2 (SavedModel)
   → embedding             → 3 probabilitas          → 4 probabilitas
   → gerbang OOD
```

**Prinsip sinergi:** YAMNet dimuat **sekali** saat startup dan dipakai untuk tiga hal —
embedding fitur D1, gerbang OOD (skor sirine AudioSet), dan reuse antar-request.

### 5.1 Alert 3 lapis

Peringatan tidak boleh asal bunyi. Setiap potongan audio melewati:

1. **Gerbang OOD (YAMNet AudioSet)** — "ada sirine sama sekali atau tidak?". Memakai skor
   kelas sirine AudioSet (indeks 316–319, 390, 391), ambang longgar **0.05** sebagai filter
   kasar terhadap hening/musik/obrolan. Pertahanan utama ada di lapis berikutnya.
2. **Ambang keyakinan (terkalibrasi)** — label ∈ {ambulance, firetruck, police} dan keyakinan
   ≥ ambang. Traffic ≠ alert.
3. **Persistensi hysteresis** (streaming) — butuh `n_on = 2` window berturut untuk menyala,
   `n_off = 2` untuk mati. Mencegah alarm berkedip. (Terbukti di uji WebSocket: alert police
   menyala tepat di window ke-2.)

### 5.2 Kalibrasi keyakinan (temperature scaling)

Model D2 awalnya *overconfident* (keyakinan ~0.97 padahal akurasi ~0.84). Dengan
**temperature scaling** (T = 4.43, dikalibrasi di validation), *Expected Calibration Error*
turun **0.13 → 0.04** dan keyakinan menjadi jujur (≈ akurasi). Konsekuensinya, ambang alert
diturunkan **0.85 → 0.40** pada skala terkalibrasi. Semua parameter ada di
`config/inference.yaml` — bisa diubah tanpa menyentuh kode.

### 5.3 Dua pipeline berbeda (jangan disatukan)

| | Model D1 | Model D2 |
|---|---|---|
| Prapemrosesan | 16k mono → **peak-normalize** | 16k mono (**tanpa** peak-norm) |
| Fitur | YAMNet beku → concat(mean,std) 2048 → standardize | pad/crop 48000 → patches (5,96,64,1) |
| Model | MLP (`model.keras`, Keras 3) | fine-tune YAMNet (**SavedModel**) |
| Keluaran | 3 probabilitas | 4 probabilitas (+ temperature) |

> **Catatan deployment:** model D2 wajib format **SavedModel**, bukan `.keras` — file `.keras`
> dari Kaggle (tf_keras 2.20) gagal dimuat di TF 2.16 lokal. SavedModel tahan beda versi.

---

## 6. Aplikasi Web

Frontend **React + Vite** dengan empat mode pemakaian, keduanya model tampil berdampingan:

- **Upload Audio** — pilih contoh atau seret file `.wav`/`.mp3` → prediksi D1 & D2 + gerbang
  OOD + badge alert.
- **Rekam Mic** — rekam ~4 detik dari mikrofon, **putar ulang hasil rekaman**, lalu otomatis
  diklasifikasi.
- **Streaming (file)** — unggah audio panjang → timeline `siren_score` per window + penanda
  event alert.
- **Live Mic (real-time)** — pantau **langsung & kontinu** dari mikrofon lewat WebSocket:
  audio dikirim per potongan, backend membalas status alert tiap window (state on/off, label,
  keyakinan, skor OOD), divisualisasikan sebagai bar bergulir + banner status.

Desain: font Archivo/Manrope, hero foto, animasi halus, indikator status yang jelas. Semua
inferensi contoh berjalan dengan fallback data bila backend offline (mode contoh).

---

## 7. Deployment

**Satu kontainer** menyajikan semuanya: `Dockerfile` multi-stage mem-build React (Node) lalu
menjalankannya di atas backend FastAPI (Python) yang **sekaligus menyajikan hasil build React**
di `/` dan API di `/predict`, `/health`, `/stream-file`, `/stream`. YAMNet di-*pre-cache* saat
build agar request pertama cepat.

**Status teruji:** image `sirine:local` (≈4.4 GB) build sukses; `/health` menampilkan dua
model; `/` merender aplikasi React; `/predict` audio polisi → D2 "police" & D1 "firetruck";
WebSocket `/stream` mereproduksi hysteresis alert.

**Online tanpa kartu kredit:** aplikasi dijalankan di laptop (kontainer Docker) lalu
diekspos ke internet lewat **Cloudflare Tunnel** — mendapat URL publik `*.trycloudflare.com`
tanpa mendaftar/kartu. Cocok untuk demo. Disediakan skrip 1-klik `start-demo.cmd` /
`stop-demo.cmd` (Windows) + shortcut Desktop.

**Siap pindah ke cloud 24/7:** `Dockerfile` standar → bisa langsung di-deploy ke **Google
Cloud Run** (skrip `scripts/deploy-cloudrun.sh`), Railway, Render, atau Fly.io dengan menyambung
repo GitHub yang sama. Frontend memakai `VITE_API_URL` sehingga backend bisa dipisah tanpa
mengubah kode.

> Catatan: Hugging Face Spaces kini menjadikan Docker Space berbayar (perlu PRO); hanya Static
> Space yang gratis dan itu tidak bisa menjalankan backend TensorFlow. Karena itu jalur gratis
> dialihkan ke Cloudflare Tunnel (demo) / Cloud Run (produksi, butuh verifikasi kartu).

---

## 8. Cara Menjalankan

**Demo cepat (Windows, sudah ada image Docker):**
```
dobel-klik start-demo.cmd     → app + tunnel + URL publik
dobel-klik stop-demo.cmd      → hentikan
```

**Dengan Docker (lintas OS):**
```bash
docker build -t sirine .
docker run --rm -p 7860:7860 sirine     # buka http://localhost:7860
```

**Pengembangan lokal (tanpa Docker):**
```bash
# backend
.venv/Scripts/python -m uvicorn backend.main:app --reload --port 8000
# frontend (terminal lain)
cd frontend-web && npm run dev          # Vite :5173
```

**Deploy 24/7 ke Google Cloud Run** (via Cloud Shell):
```bash
git clone https://github.com/MonyetttRindam/sirine-classification
cd sirine-classification && git lfs pull
bash scripts/deploy-cloudrun.sh
```

---

## 9. Struktur Proyek

```
ml/src/          paket inferensi (config, audio, yamnet_hub, classifiers, ood, alert, inference)
ml/artifacts/    dua model produksi (D1 .keras + D2 SavedModel) — via Git LFS
backend/         FastAPI (serve API + React build)
frontend-web/    React + Vite (UI utama)
config/          inference.yaml (registry model + ambang OOD/alert + temperature)
tests/           reproduksi macro-F1 kedua model + OOD + alert
scripts/         export_d1_artifacts · calibrate_temperature · deploy-cloudrun
docs/            PROJECT, PLANNING, TIM, TEMUAN_EKSPERIMEN, dokumen ini
Dockerfile       single-container (Node build → Python runtime)
start/stop-demo  skrip 1-klik demo (Windows)
```

---

## 10. Keterbatasan & Pengembangan Lanjut

**Keterbatasan yang diketahui (jujur):**

- Performa D2 (0.883) adalah generalisasi nyata ke data berisik; masih tertinggal dari D1
  bersih (0.976) — konsekuensi realistis kondisi lapangan, bukan bug.
- Ambulance adalah kelas tersulit (F1 ~0.87); dua kelas sirine paling sering tertukar di
  kondisi sangat berisik.
- Live mic memakai *downsampling* nearest-neighbor di browser (cukup untuk gerbang OOD/demo,
  bukan kualitas studio).
- Demo tunnel bergantung laptop menyala; URL berubah tiap restart (kecuali pakai domain
  sendiri / cloud).

**Arah pengembangan:**

- Deploy 24/7 ke Cloud Run (semua sudah disiapkan; tinggal verifikasi akun).
- Pengumpulan data ambulans lebih beragam untuk mengangkat kelas tersulit.
- Estimasi arah/jarak sumber sirine (beamforming multi-mikrofon) untuk peringatan pengemudi.
- Integrasi perangkat tepi (edge) di kendaraan / pos jaga.

---

## 11. Ringkasan Capaian

| Aspek | Status |
|---|---|
| Target macro-F1 > 0.85 (D2) | ✅ **0.883** |
| Split group-aware anti-bocor | ✅ 0 kebocoran, terverifikasi |
| Paket inferensi reproducible | ✅ mereproduksi metrik pelatihan |
| Alert 3 lapis + kalibrasi | ✅ ECE 0.13 → 0.04 |
| Aplikasi web (4 mode + live mic) | ✅ |
| Deployment single-container | ✅ teruji end-to-end |
| Online publik | ✅ Cloudflare Tunnel (siap Cloud Run) |

Sistem lengkap **dari data mentah sampai aplikasi yang bisa diakses** telah dibangun, diuji,
dan didokumentasikan.
