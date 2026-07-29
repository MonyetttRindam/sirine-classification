"""Registry inferensi: memuat YAMNet + kedua model + gerbang OOD SEKALI, lalu melayani
prediksi side-by-side dan streaming.

Dipakai backend (FastAPI) & demo (Gradio). Muat instance ini sekali saat startup.
"""
from __future__ import annotations

import numpy as np

from .audio import decode_16k, iter_windows
from .classifiers import PredictResult, build_classifier
from .config import InferenceConfig, load_config
from .ood import SirenGate
from .yamnet_hub import YamnetHub


class ModelRegistry:
    def __init__(self, config: InferenceConfig | None = None):
        self.cfg = config or load_config()
        self.hub = YamnetHub(self.cfg.yamnet_hub_url)
        self.classifiers = {
            key: build_classifier(spec, self.hub)
            for key, spec in self.cfg.models.items()
        }
        self.gate = SirenGate(self.hub, self.cfg.ood)

    # ---- prediksi 1 klip ----
    def predict_one(self, y: np.ndarray, model_key: str) -> PredictResult:
        return self.classifiers[model_key].predict(y)

    def predict_both(self, y: np.ndarray) -> dict:
        """Jalankan KEDUA model + gerbang OOD pada satu klip (untuk web side-by-side)."""
        siren_score = self.gate.siren_score(y)
        return {
            "siren_score": round(float(siren_score), 6),
            "is_siren": bool(siren_score >= self.cfg.ood.threshold),
            "models": {k: c.predict(y).as_dict() for k, c in self.classifiers.items()},
        }

    # ---- windowing untuk audio panjang / streaming ----
    def predict_windows(self, y_full: np.ndarray, model_key: str) -> list[dict]:
        """Pecah audio panjang jadi window 3 s, prediksi tiap window + skor OOD."""
        win = int(self.cfg.sample_rate * self.cfg.alert.window_seconds)
        hop = int(self.cfg.sample_rate * self.cfg.alert.hop_seconds)
        out = []
        for i, w in enumerate(iter_windows(y_full, win, hop)):
            res = self.classifiers[model_key].predict(w)
            out.append({
                "t": round(i * self.cfg.alert.hop_seconds, 3),
                "siren_score": round(float(self.gate.siren_score(w)), 6),
                **res.as_dict(),
            })
        return out

    def decode(self, source) -> np.ndarray:
        return decode_16k(source)
