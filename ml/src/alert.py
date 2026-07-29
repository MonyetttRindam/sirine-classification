"""AlertEngine � logika alert 3 lapis (stateful, per model).

Per window streaming, gabungkan:
1. **Gerbang OOD**: `siren_score >= ood_threshold` (ada sirine sama sekali?).
2. **Confidence threshold**: label hasil smoothing = kelas sirine DAN keyakinan >= threshold.
3. **Persistensi/hysteresis**: butuh `n_on` window berturut untuk ON, `n_off` untuk OFF �
   mencegah alarm berkedip.

Engine bersifat per-model (menyimpan `classes` model itu) & stateful (buffer smoothing +
streak). Panggil `reset()` untuk memulai stream baru. `step()` menerima probs+siren_score satu
window (tidak menjalankan model sendiri � memisahkan logika alert dari inferensi supaya mudah
diuji).
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass

import numpy as np

from .config import AlertSpec


@dataclass
class AlertStep:
    state: str            # "on" | "off"
    label: str
    confidence: float
    siren_score: float
    is_hit: bool          # window ini memenuhi OOD + threshold + kelas sirine
    triggered: bool       # rising-edge: OFF -> ON tepat di window ini

    def as_dict(self) -> dict:
        return {
            "state": self.state,
            "label": self.label,
            "confidence": round(float(self.confidence), 6),
            "siren_score": round(float(self.siren_score), 6),
            "is_hit": bool(self.is_hit),
            "triggered": bool(self.triggered),
        }


class AlertEngine:
    def __init__(self, classes: list[str], siren_classes: list[str],
                 confidence_threshold: float, ood_threshold: float,
                 smooth_window: int, n_on: int, n_off: int):
        self.classes = list(classes)
        self.siren_idx = {c for c in siren_classes if c in self.classes}
        self.conf_th = float(confidence_threshold)
        self.ood_th = float(ood_threshold)
        self.smooth_window = max(1, int(smooth_window))
        self.n_on = max(1, int(n_on))
        self.n_off = max(1, int(n_off))
        self.reset()

    @classmethod
    def from_config(cls, classes: list[str], alert: AlertSpec, ood_threshold: float) -> "AlertEngine":
        return cls(classes, alert.siren_classes, alert.confidence_threshold, ood_threshold,
                   alert.smooth_window, alert.n_on, alert.n_off)

    def reset(self) -> None:
        self._buf: deque[np.ndarray] = deque(maxlen=self.smooth_window)
        self._on_streak = 0
        self._off_streak = 0
        self.state = "off"

    def step(self, probs, siren_score: float) -> AlertStep:
        self._buf.append(np.asarray(probs, dtype=np.float64).ravel())
        smoothed = np.mean(self._buf, axis=0)                 # moving-average antar-window
        k = int(smoothed.argmax())
        label = self.classes[k]
        confidence = float(smoothed[k])

        hit = (siren_score >= self.ood_th
               and label in self.siren_idx
               and confidence >= self.conf_th)

        if hit:
            self._on_streak += 1
            self._off_streak = 0
        else:
            self._off_streak += 1
            self._on_streak = 0

        triggered = False
        if self.state == "off" and self._on_streak >= self.n_on:
            self.state = "on"
            triggered = True                                  # rising edge -> event alert
        elif self.state == "on" and self._off_streak >= self.n_off:
            self.state = "off"

        return AlertStep(self.state, label, confidence, float(siren_score), hit, triggered)

    def process(self, windows: list[dict]) -> list[dict]:
        """Jalankan step() atas keluaran `ModelRegistry.predict_windows` (streaming penuh)."""
        self.reset()
        out = []
        for w in windows:
            s = self.step(w["probs"], w["siren_score"])
            out.append({"t": w.get("t"), **s.as_dict()})
        return out
