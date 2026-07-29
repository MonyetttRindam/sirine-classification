# Temuan Eksperimen — Model Sirine

Catatan hasil & interpretasi eksperimen, disiapkan sebagai bahan **laporan KP Bab 4
(Hasil & Analisis)**. Angka mentah per eksperimen ada di [`../ml/experiments.csv`](../ml/experiments.csv);
dokumen ini menjelaskan *apa artinya*.

Semua model = **YAMNet beku (feature extractor) + classifier head MLP**. Split group-aware
(`source_id`), metrik utama **macro-F1** di test set.

_Terakhir diperbarui: 2026-07-24._

---

## 1. Ringkasan hasil

| # | Eksperimen | Perubahan | D1 macro-F1 | D2 macro-F1 |
|---|---|---|---|---|
| 0 | baseline | YAMNet mean-pool (1024-d) + MLP, early-stop `val_loss` | 0.9643 | 0.7639 |
| 1 | esf1 | early-stop pindah ke **val macro-F1** | 0.9643 | 0.7725 |
| 2 | **meanstd** | fitur **mean+std** (2048-d) | **0.9762** | **0.7983** |
| 3 | augmentasi | + noise/shift/gain ×2 pada train D2 | — | 0.7965 |
| 4 | tweak murah | class_weight / ensemble seed (uji cepat) | — | ≤0.7868 |
| 5 | **fine-tune YAMNet** | buka layer10-14 + L2/dropout (Kaggle GPU) | — | **0.8830** 🏆 |

**Model D2 final: fine-tune YAMNet (0.8830).** Target macro-F1 > 0.85 **TERCAPAI.** Per-kelas:
ambulance 0.874 · firetruck 0.843 · police 0.824 · traffic 0.992.

Efektivitas tiap lever pada D2:

- Perbaikan harness (esf1): **+0.009**
- Fitur lebih kaya (mean+std): **+0.026** ← satu-satunya yang benar-benar menggerakkan
- Augmentasi offline: **~0** (flat)

---

## 2. Temuan utama

### 2.1 Group-split membuktikan dirinya — gap D1 vs D2 itu jujur

D1 (clean) mencapai 0.976, D2 (noisy) 0.798. Gap ~0.18 ini **bukan kegagalan**, melainkan
bukti bahwa split group-aware bekerja. D2 test set berisi rekaman yang benar-benar belum
pernah dilihat model (0 kebocoran `source_id`, terverifikasi). Dengan split acak, D2 akan
tampak ~0.95 palsu karena varian overlay (`mixed_sound_N` & `mixed_sound_N_1`) bocor ke
train. Angka 0.798 adalah performa generalisasi paling jujur — dan inti dari robustness
study.

### 2.2 Sirine dibedakan oleh pola temporal, bukan spektrum rata-rata

Lompatan terbesar (+0.026) datang dari mengganti agregasi fitur: dari **rata-rata** frame
YAMNet menjadi **mean + std** antar-frame. Kenaikan terkonsentrasi di **firetruck (+0.076)**.
Ini mengonfirmasi dugaan EDA: pembeda sirine adalah **pola modulasi temporal** (wailing
naik-turun), yang hilang saat frame dirata-rata. Menambahkan standar deviasi (variasi
antar-waktu) memberi classifier informasi yang hilang itu.

**Untuk laporan:** ini bukti empiris, bukan klaim — angka konkret mendukung hipotesis
akustiknya.

### 2.3 Augmentasi tidak membantu karena YAMNet sudah robust

Augmentasi (noise mixing SNR 5–20 dB, time-shift, gain, 2× train) menghasilkan **~0
perubahan** (0.7983 → 0.7965).

**Penjelasan:** YAMNet dilatih di AudioSet — jutaan klip dunia nyata yang sudah penuh noise.
Jadi extractor beku memetakan audio ter-augmentasi ke embedding yang **nyaris sama** dengan
aslinya (jarak embedding kecil). Augmentasi "diserap" sebelum mencapai classifier.

**Prinsip umum:** augmentasi paling berguna saat **melatih** extractor (fine-tuning), bukan
saat extractor **beku dan sudah robust**. Terbukti empiris di data ini.

### 2.4 Ambulance adalah kelas tersulit

Di semua eksperimen D2, ambulance konsisten paling rendah (F1 0.66 → 0.70) dan tidak
terangkat oleh lever apa pun sejauh ini. Firetruck & police lebih responsif. Traffic hampir
sempurna (0.97) di semua kondisi — mudah dipisah dari sirine.

### 2.5 Tweak murah tidak membantu — plateau makin tegas

class_weight, ensemble 5-seed, dan gabungannya **semua ≤ meanstd** (0.783 / 0.765 / 0.787).
Karena imbalance D2 ringan, class_weight hanya menggeser bobot tanpa untung bersih. Semua
lever murah (harness, fitur, augmentasi, tweak) sudah dicoba → **langit-langit fitur beku
YAMNet ~0.78–0.80** untuk tugas 4-kelas noisy ini semakin tegas.

### 2.6 Varians antar-seed — 0.7983 adalah seed yang menguntungkan

Ensemble 5-seed justru **turun** ke 0.765 (biasanya ensemble membantu). Ini menyingkap bahwa
seed 42 kebetulan seed bagus; seed lain berkisar ~0.76–0.77. **Performa tipikal model beku
lebih dekat ~0.77–0.78**, dengan 0.7983 sebagai satu run menguntungkan. Angka 0.7983 tetap
sah dilaporkan (model nyata, reproducible seed 42) **asalkan disertai catatan varians ini**.
Untuk rigor, laporan sebaiknya menyebut kisaran, bukan satu angka.

### 2.7 Fine-tuning YAMNet menembus target (0.80 → 0.88)

Membuka bobot YAMNet dan melatihnya (Kaggle GPU) **berhasil menembus target**: frozen 0.80 →
fine-tune **0.88**. Ini lompatan terbesar dan mengonfirmasi bahwa untuk data kecil pun,
menyesuaikan extractor audio-pretrained mengalahkan sekadar memakai embedding beku. Yang
menentukan keberhasilannya:

- **Two-phase**: warm-up head (core beku) → buka sebagian core (LR kecil 1e-5). Membuka
  seluruh backbone langsung = overfit ganas (val ambruk).
- **Buka sebagian + regularisasi**: hanya blok atas (layer10-14), BatchNorm beku,
  L2 + dropout 0.5. Kapasitas fine-tune cukup tanpa overfit fatal.
- **Simpan terbaik lintas fase** + early-stop pada val macro-F1: hasil tak pernah lebih
  buruk dari warm-up.
- **Jebakan numerik**: `tf.math.reduce_std` di pooling → NaN gradient saat std=0 (hanya
  muncul ketika core dilatih). Fix: `sqrt(var + 1e-6)`. Gradient clipping saja tidak cukup.

**Augmentasi TIDAK membantu di sini** (0.88 → 0.85): test set audio asli, jadi menambah
banyak noise ke train menggeser distribusi menjauh dari test. (Berbeda dari dugaan bahwa
augmentasi membantu saat fine-tune.)

### 2.8 Pelajaran deployment: `.keras` terkunci versi → pakai SavedModel

Model dilatih di Kaggle (tf_keras **2.20**). File `model.keras`-nya **gagal dimuat** di env
lokal (TF 2.16) — error "expected 1 variables, received 0" pada layer nested. Penyebab: layout
bobot model nested berbeda antar versi tf_keras. **Solusi: ekspor TF SavedModel**
(`model.save(path, save_format="tf")`) — format serving yang **tahan beda versi** dan tak butuh
kelas custom layer saat load. SavedModel terbukti dimuat & inferensi di TF 2.16 lokal. Ini
artefak yang dipakai deployment: `ml/artifacts/d2_yamnet_finetune/siren_savedmodel/`.

---

## 3. Catatan untuk tahap berikut

- **Kalibrasi ditunda ke pra-deploy.** D2 overconfident (val_loss besar) — relevan karena
  web akan memicu alert berbasis ambang keyakinan. Rencana: **temperature scaling** setelah
  model final. Detail desain alert di [`PLANNING.md`](PLANNING.md) decision log 2026-07-24.
- **Lever tersisa** (urut): tweak murah (class weight, ensemble seed) → fine-tune YAMNet
  (Kaggle GPU).
- **Model produksi FINAL**: `ml/artifacts/d2_yamnet_finetune/siren_savedmodel/` — YAMNet
  fine-tune, macro-F1 **0.8830**, format SavedModel (siap deploy, teruji load di lokal).

---

## 4. Reproduksi

Notebook berurutan di [`../notebooks/`](../notebooks/):

| Notebook | Peran |
|---|---|
| `01`–`02` | EDA D1 & D2 |
| `03_preprocessing_dataset{1,2}` | manifest + split group-aware |
| `04_features_yamnet` | embedding mean-pool (1024-d) |
| `05_train_dataset{1,2}` | baseline |
| `06_experiment_earlystop_f1` | eksperimen #1 (esf1) |
| `07_features_yamnet_stats` | embedding mean+std (2048-d) |
| `08_experiment_meanstd` | eksperimen #2 (meanstd) |
| `09_features_yamnet_aug` | embedding augmentasi train D2 |
| `10_experiment_augment` | eksperimen #3 (augmentasi) |
| `11_experiment_tweaks` | eksperimen #4 (class_weight, ensemble seed) |
