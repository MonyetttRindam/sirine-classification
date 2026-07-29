# Fine-tuning D2 di Kaggle — Panduan

Dua notebook untuk **fine-tune model D2 di Kaggle GPU** (tidak praktis di CPU lokal), lalu
dibandingkan dengan model beku terbaik (frozen YAMNet mean+std, macro-F1 **0.7983**).

| Notebook | Pendekatan |
|---|---|
| `finetune_yamnet_d2.ipynb` | Fine-tune **YAMNet** (rebuild Keras + bobot pretrained, TimeDistributed, two-phase) |
| `finetune_cnn_d2.ipynb` | Fine-tune **CNN ImageNet** (MobileNetV2 di log-mel spektrogram, two-phase) |

Keduanya **sudah di-smoke-test di CPU lokal** (bebas bug). Di Kaggle akan berjalan penuh
otomatis (deteksi `/kaggle/input` → `SMOKE=False`).

> **Penting:** test set diambil dari split CSV kita (240 file) → hasil **sebanding langsung**
> dengan angka lokal. Jangan meregenerasi split di Kaggle.

---

## Langkah

### 1. Buat Kaggle Dataset dari split kita (sekali saja)

Upload 4 file ini sebagai satu Kaggle Dataset (kaggle.com → **Datasets → New Dataset**):

```
ml/manifest_d2.csv
ml/split_d2_train.csv
ml/split_d2_val.csv
ml/split_d2_test.csv
```

Beri nama bebas, mis. `siren-d2-splits`.

### 2. Buat Notebook + tambahkan data

- **New Notebook** → **Add Data**, tambahkan **dua** dataset:
  1. Publik: **"Emergency Vehicle Sirens with Traffic Noise"** (santhoshkumarv) — audio D2.
  2. `siren-d2-splits` (dari langkah 1).
- **Settings**:
  - **Accelerator → GPU** (T4 cukup).
  - **Internet → On** (wajib — untuk mengunduh bobot pretrained `yamnet.h5` / MobileNetV2).

### 3. Jalankan notebook

Upload/tempel isi salah satu notebook, lalu **Run All**. Notebook otomatis:
- mendeteksi lingkungan Kaggle (`SMOKE=False`, run penuh);
- mencari folder audio (`ambulance/firetruck/police/traffic`) di `/kaggle/input` via `rglob`;
- mencari `split_d2_train.csv` di `/kaggle/input`;
- men-join audio ↔ split via `(label, filename)` → menjamin split identik dgn lokal
  (assert 1195/240/240).

Jalankan **kedua** notebook (satu per satu) untuk membandingkan.

### 4. Ambil hasil

Tiap notebook mencetak `TEST macro-F1` dan menulis:
```
/kaggle/working/model.keras
/kaggle/working/metrics.json
```
Unduh keduanya dari tab **Output**.

### 5. Lapor balik

Kirim dua angka `test_macro_f1` (YAMNet vs CNN). Kita akan:
- catat ke `ml/experiments.csv`,
- tarik model pemenang ke `ml/artifacts/`,
- kalau ada yang ≥ 0.85 (atau jelas > 0.7983) → jadikan model produksi, ekspor **end-to-end**
  (`waveform → 4 probabilitas`) untuk deployment (Fase 4).

---

## Perkiraan waktu (T4)

Masing-masing ~10–30 menit (ekstraksi fitur + two-phase training). YAMNet lebih berat karena
core-nya ikut dilatih di fase 2.

## Troubleshooting

- **Audio tak ketemu / assert split gagal**: struktur folder dataset publik mungkin beda.
  Cek `DATA_ROOT` yang tercetak; pastikan ada subfolder bernama `ambulance` dll. `rglob`
  seharusnya menemukannya di kedalaman berapa pun selama nama folder = nama kelas.
- **Bobot YAMNet tak termuat (assert di sel rebuild)**: pastikan Internet On. Notebook set
  `TF_USE_LEGACY_KERAS=1` agar cocok dengan `yamnet.h5` (Keras 2); aman di TF versi Kaggle.
- **Out of memory**: kecilkan `batch_size` (YAMNet: `BS`; CNN: `batch_size` di `fit`).

## Catatan desain (untuk laporan)

- Augmentasi **tidak** dipakai di run pertama (jaga interpretasi). Karena extractor kini
  dilatih, augmentasi *bisa* membantu (kebalikan temuan frozen) — bisa jadi eksperimen lanjut.
- Kalibrasi (temperature scaling) ditunda ke pra-deploy — lihat `docs/PLANNING.md` &
  `docs/TEMUAN_EKSPERIMEN.md`.
