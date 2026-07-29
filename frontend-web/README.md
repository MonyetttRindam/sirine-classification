# Frontend Web — SirenNet (React + Vite)

Implementasi frontend dari desain Claude Design **"Sirine Classification UI Mockup"**
(`Sirine Classification.dc.html`). Tiga layar: **Beranda**, **Demo Langsung**, **Dashboard**.

Layar **Demo** memanggil backend FastAPI (`/predict`) untuk klasifikasi **nyata**; bila backend
mati, otomatis jatuh ke **data contoh** desain agar tetap bisa dipresentasikan.

## Jalankan (dev)

Butuh **dua proses**:

```powershell
# 1) Backend (dari root project, .venv aktif)
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000

# 2) Frontend (dari folder ini)
cd frontend-web
npm install        # sekali saja
npm run dev        # buka http://localhost:5173
```

Indikator di layar Demo menunjukkan **"Terhubung ke model"** (backend online) atau
**"Mode contoh"** (offline).

## Konfigurasi

- URL backend: env `VITE_API_URL` (default `http://localhost:8000`). Contoh:
  `VITE_API_URL=http://192.168.1.10:8000 npm run dev`.
- Audio contoh: `public/samples/contoh_*.wav` (disalin dari `demo_samples/`). Klik chip contoh →
  file dikirim ke `/predict` untuk hasil nyata (fallback ke angka contoh bila backend mati).
- Ganti ilustrasi ambulans hero dengan foto asli: taruh file di `public/` lalu ganti
  `<AmbulanceArt/>` di `src/screens/Landing.jsx` dengan `<img src="/nama-foto.jpg" .../>`.

## Struktur

```
src/
├── App.jsx              # routing 3 layar (state) + health check + riwayat
├── api.js              # /predict + /health, normalisasi respons, fallback contoh
├── data.js             # SAMPLES + riwayat awal
├── styles.css          # token & gaya (port dari desain; Manrope + Space Grotesk)
├── components/         # Nav, Waveform, AmbulanceArt
└── screens/            # Landing, Classify (demo), Dashboard
```

## Build produksi

```powershell
npm run build     # -> dist/
```

Untuk deploy: sajikan `dist/` sebagai statis (Nginx/HF Spaces/dll) dan arahkan `VITE_API_URL`
ke URL backend produksi. Backend sudah mengaktifkan CORS (`allow_origins=["*"]` — persempit
saat produksi).
