# Slide Presentasi — Klasifikasi Suara Sirine Kendaraan Darurat

> Bahan untuk PPT. Tiap `## Slide` = satu halaman. Poin = isi slide (ringkas).
> _Catatan pembicara_ = yang diucapkan, **tidak** ditulis di slide.
> Kerja Praktik PT VINIX7 · Kelompok 14 · 2026.

---

## Slide 1 — Judul

**Deteksi & Klasifikasi Suara Sirine Kendaraan Darurat Berbasis AI**

- Ambulans · Pemadam · Polisi · Lalu lintas
- Kerja Praktik PT VINIX7 — Kelompok 14
- 2026

_Catatan: Perkenalkan diri & tim, sebutkan ini proyek KP di PT VINIX7._

---

## Slide 2 — Latar Belakang & Masalah

- Sirine darurat penting, tapi **tidak selalu terdengar**: pengemudi tuli/kurang dengar,
  kabin kedap, sistem otomatis.
- Butuh **deteksi berbasis mesin**: dengar suara → tahu ada sirine apa.
- Manfaat: peringatan dini pengemudi, prioritas lampu lalu lintas.

_Catatan: Bangun motivasi — kenapa masalah ini layak diselesaikan._

---

## Slide 3 — Tujuan & Ruang Lingkup

- **Tujuan:** klasifikasi potongan audio 3 detik ke 4 kelas
  (ambulance, firetruck, police, traffic).
- **Metrik utama: macro-F1** (bukan accuracy) — adil untuk kelas tak seimbang.
- **Lingkup KP:** dari data → model → aplikasi web → deployment.

_Catatan: Tegaskan metrik macro-F1 dan alasannya._

---

## Slide 4 — Data: Dua Dataset

| | Dataset 1 (bersih) | Dataset 2 (berisik) |
|---|---|---|
| Peran | studi robustness | **produksi** |
| File | 600 | 1675 (dari 1048 rekaman unik) |
| Kelas | 3 (tanpa polisi) | 4 |
| Kondisi | ideal | mendekati lapangan |

_Catatan: D2 lebih realistis (berisik) → jadi model produksi._

---

## Slide 5 — Metodologi Jujur: 3 Jebakan Data

- **Penomoran file global** — bukan per kelas.
- **1 sirine punya 2 varian** (`mixed_sound_57` & `_57_1`) → split acak bocor **65%**.
  Solusi: **split group-aware** (per rekaman), 0 kebocoran (terverifikasi).
- **Traffic D1 = traffic D2** (file identik) → dibuang saat evaluasi silang.

_Catatan: Poin kunci integritas — tanpa ini, angka terlihat bagus tapi palsu._

---

## Slide 6 — Pendekatan: YAMNet + Dua Model

- **YAMNet** (jaringan audio Google, dilatih di AudioSet) sebagai *feature extractor*.
- **Dua model dibandingkan berdampingan:**
  - **D1** — data bersih, 3 kelas (pembanding).
  - **D2** — data berisik, 4 kelas (**produksi**).
- Nilai perbandingan: lihat pengaruh kualitas data ke performa.

_Catatan: Jelaskan kenapa dua model — perbandingan itu informatif._

---

## Slide 7 — Perjalanan Eksperimen

| Langkah | D2 macro-F1 |
|---|---|
| Baseline (mean-pool + MLP) | 0.764 |
| Fitur **mean + std** | 0.798 |
| Augmentasi | ~0 (tak membantu) |
| **Fine-tune YAMNet** 🏆 | **0.883** |

- Temuan: sirine dibedakan **pola temporal**, bukan spektrum rata-rata.
- Augmentasi tak membantu (YAMNet sudah robust).

_Catatan: Ceritakan perjalanan — apa yang menggerakkan angka & apa yang tidak._

---

## Slide 8 — Hasil Final

**Model D1 (bersih, 3 kelas): macro-F1 = 0.976**
**Model D2 (berisik, 4 kelas): macro-F1 = 0.883** ✅ (target > 0.85 tercapai)

- D2 per-kelas: ambulans 0.87 · pemadam 0.84 · polisi 0.82 · traffic 0.99
- Paket inferensi **mereproduksi** angka ini → pipeline = pelatihan (bukan karangan).

_Catatan: Tegaskan target tercapai & angka tervalidasi._

---

## Slide 9 — Arsitektur Sistem

- **Frontend React** → **Backend FastAPI** → **ml/src** (2 model + YAMNet + OOD + alert).
- YAMNet dimuat **sekali**, dipakai 3 hal: embedding D1, gerbang OOD, reuse.
- Dua pipeline berbeda per model (D1 peak-norm + MLP; D2 patches + SavedModel).

_Catatan: Tunjukkan diagram alur (audio → backend → dua model)._

---

## Slide 10 — Alert 3 Lapis + Kalibrasi

- **Lapis 1 — Gerbang OOD:** ada sirine sama sekali? (YAMNet AudioSet).
- **Lapis 2 — Ambang keyakinan** (terkalibrasi): kelas sirine & yakin?
- **Lapis 3 — Persistensi:** butuh 2 window berturut (anti alarm berkedip).
- **Kalibrasi** (temperature scaling): ECE 0.13 → **0.04** (keyakinan jadi jujur).

_Catatan: Alert dirancang agar tak asal bunyi — penting untuk aplikasi nyata._

---

## Slide 11 — Aplikasi Web

- **4 mode:** Upload · Rekam mic (+ putar ulang) · Streaming file · **Live mic real-time**.
- Dua model tampil **berdampingan** + badge alert.
- **Animasi "beri jalan":** mobil menepi saat sirine terdeteksi.

_Catatan: Ini slot DEMO — tunjukkan aplikasinya langsung kalau memungkinkan._

---

## Slide 12 — Deployment

- **Satu kontainer** (Docker): backend + React jadi satu, teruji end-to-end.
- **Online** lewat Cloudflare Tunnel (demo) — repo di GitHub, **siap ke Cloud Run** 24/7.
- Portabel: cukup `Dockerfile` yang sama untuk pindah host.

_Catatan: Tekankan sudah benar-benar bisa diakses, bukan cuma di laptop._

---

## Slide 13 — Kesimpulan & Pengembangan

- ✅ Target macro-F1 > 0.85 tercapai (D2 = **0.883**), metodologi anti-bocor.
- ✅ Sistem lengkap: **data → model → web → deployment**.
- **Ke depan:** deploy 24/7, data ambulans lebih beragam, estimasi arah sirine.

_Catatan: Tutup dengan capaian utama + arah lanjut. Ucapkan terima kasih._

---

## Slide 14 — Terima Kasih / Tanya Jawab

**Terima Kasih**

- Repo: github.com/MonyetttRindam/sirine-classification
- Kelompok 14 — PT VINIX7

_Catatan: Buka sesi tanya jawab._
