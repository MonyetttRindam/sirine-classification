"""Backend FastAPI � inferensi sirine dua model (D1 vs D2) + gerbang OOD + alert.

Jalankan (dari root project):
    .venv/Scripts/python.exe -m uvicorn backend.main:app --reload --port 8000

Endpoint:
    GET  /health        � status + info model
    POST /predict       � upload 1 audio, KEDUA model jalan (side-by-side) + flag alert
    POST /stream-file    � upload audio panjang, timeline alert per model (simulasi streaming)
    WS   /stream        � streaming real-time (binary float32 PCM 16k mono) [best-effort]
"""
from __future__ import annotations

import sys
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

# Hasil build React (Vite). Ada saat produksi/Docker (`npm run build`); tidak ada saat dev
# (pakai Vite :5173 terpisah). Kalau ada -> backend sekaligus menyajikan web (single-container).
STATIC_DIR = ROOT / "frontend-web" / "dist"
SERVE_SPA = STATIC_DIR.is_dir()

from ml.src.alert import AlertEngine          # noqa: E402
from ml.src.audio import decode_16k           # noqa: E402
from ml.src.inference import ModelRegistry    # noqa: E402
from backend.schemas import (                 # noqa: E402
    HealthResponse, ModelInfo, ModelResult, PredictResponse, StreamFileResponse,
)

STATE: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    reg = ModelRegistry()                      # muat YAMNet + D1 + D2 + gerbang OOD sekali
    STATE["registry"] = reg
    STATE["alert_engines"] = {
        key: AlertEngine.from_config(spec.classes, reg.cfg.alert, reg.cfg.ood.threshold)
        for key, spec in reg.cfg.models.items()
    }
    yield
    STATE.clear()


app = FastAPI(title="Siren Classifier API", version="1.0", lifespan=lifespan)

# CORS: izinkan frontend web (Vite dev :5173, dll) memanggil API dari browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # dev; persempit ke origin produksi saat deploy
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- util ----------
def _decode_upload(file: UploadFile) -> np.ndarray:
    """Simpan upload ke file sementara (robust untuk mp3/wav/ogg) lalu decode 16k mono."""
    suffix = Path(file.filename or "audio").suffix or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name
    try:
        return decode_16k(tmp_path)
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def _is_alert(reg: ModelRegistry, label: str, confidence: float, is_siren: bool) -> bool:
    """Alert klip tunggal (tanpa persistensi): gerbang OOD + kelas sirine + confidence."""
    a = reg.cfg.alert
    return bool(is_siren and label in a.siren_classes and confidence >= a.confidence_threshold)


# ---------- endpoints ----------
# Info API dipindah ke /api saat SPA disajikan (root "/" dipakai index.html React).
# Saat dev (tanpa build) root "/" tetap balas JSON biar tidak 404.
@app.get("/api")
def api_info() -> dict:
    """Info endpoint API (JSON)."""
    return {
        "service": "Siren Classifier API",
        "status": "ok",
        "endpoints": {
            "GET /health": "status + info dua model",
            "POST /predict": "upload 1 audio -> prediksi D1 & D2 side-by-side + alert",
            "POST /stream-file": "upload audio panjang -> timeline alert per model",
            "WS /stream": "streaming real-time (binary float32 PCM 16k mono)",
            "GET /docs": "dokumentasi interaktif (Swagger UI)",
        },
    }


if not SERVE_SPA:
    @app.get("/")
    def root() -> dict:
        """Dev only: root JSON biar buka http://localhost:8000/ tidak 404."""
        return api_info()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    reg: ModelRegistry = STATE["registry"]
    return HealthResponse(
        status="ok",
        models=[ModelInfo(key=k, name=s.name, classes=s.classes, macro_f1=s.macro_f1)
                for k, s in reg.cfg.models.items()],
        ood_threshold=reg.cfg.ood.threshold,
        confidence_threshold=reg.cfg.alert.confidence_threshold,
    )


@app.post("/predict", response_model=PredictResponse)
def predict(file: UploadFile = File(...)) -> PredictResponse:
    reg: ModelRegistry = STATE["registry"]
    y = _decode_upload(file)
    siren_score = reg.gate.siren_score(y)
    is_siren = bool(siren_score >= reg.cfg.ood.threshold)

    models: dict[str, ModelResult] = {}
    for key, clf in reg.classifiers.items():
        res = clf.predict(y)
        models[key] = ModelResult(
            model_key=key,
            name=reg.cfg.models[key].name,
            classes=res.classes,
            probs=[round(float(p), 6) for p in res.probs],
            label=res.label,
            confidence=round(float(res.confidence), 6),
            is_alert=_is_alert(reg, res.label, res.confidence, is_siren),
        )
    return PredictResponse(
        siren_score=round(float(siren_score), 6),
        is_siren=is_siren,
        duration=round(len(y) / reg.cfg.sample_rate, 3),
        models=models,
    )


@app.post("/stream-file", response_model=StreamFileResponse)
def stream_file(file: UploadFile = File(...)) -> StreamFileResponse:
    reg: ModelRegistry = STATE["registry"]
    y = _decode_upload(file)

    timelines: dict[str, list[dict]] = {}
    events: dict[str, list[dict]] = {}
    for key in reg.classifiers:
        windows = reg.predict_windows(y, key)
        engine: AlertEngine = STATE["alert_engines"][key]
        timeline = engine.process(windows)
        timelines[key] = timeline
        events[key] = [step for step in timeline if step["triggered"]]
    return StreamFileResponse(
        duration=round(len(y) / reg.cfg.sample_rate, 3),
        hop_seconds=reg.cfg.alert.hop_seconds,
        window_seconds=reg.cfg.alert.window_seconds,
        timelines=timelines,
        events=events,
    )


@app.websocket("/stream")
async def stream(ws: WebSocket) -> None:
    """Streaming real-time best-effort. Klien kirim:
        - text JSON `{"model_key": "d2"}` sekali di awal (opsional; default d2), lalu
        - binary chunk float32 little-endian PCM 16 kHz mono.
    Server buffer sampai 1 window (3 s) lalu balas JSON langkah alert."""
    await ws.accept()
    reg: ModelRegistry = STATE["registry"]
    model_key = "d2"
    win = int(reg.cfg.sample_rate * reg.cfg.alert.window_seconds)
    hop = int(reg.cfg.sample_rate * reg.cfg.alert.hop_seconds)
    engine = AlertEngine.from_config(reg.cfg.models[model_key].classes,
                                     reg.cfg.alert, reg.cfg.ood.threshold)
    buf = np.zeros(0, dtype=np.float32)
    try:
        while True:
            msg = await ws.receive()
            if "text" in msg and msg["text"]:
                import json
                data = json.loads(msg["text"])
                model_key = data.get("model_key", model_key)
                engine = AlertEngine.from_config(reg.cfg.models[model_key].classes,
                                                 reg.cfg.alert, reg.cfg.ood.threshold)
                continue
            if "bytes" not in msg or msg["bytes"] is None:
                continue
            chunk = np.frombuffer(msg["bytes"], dtype=np.float32)
            buf = np.concatenate([buf, chunk])
            while len(buf) >= win:
                w = buf[:win]
                buf = buf[hop:]
                res = reg.classifiers[model_key].predict(w)
                sc = reg.gate.siren_score(w)
                step = engine.step(res.probs, sc)
                await ws.send_json({"model_key": model_key, "label": res.label,
                                    **step.as_dict()})
    except WebSocketDisconnect:
        return


# ---------- SPA (React build) ----------
# Didaftarkan PALING AKHIR: mount "/" menangkap semua path yang tidak cocok route API di atas
# (/, /assets/*, /hero-ambulance.jpg, dll). html=True -> sajikan index.html untuk "/".
if SERVE_SPA:
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="spa")
