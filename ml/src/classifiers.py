"""Classifier per model dengan antarmuka seragam `predict(y) -> PredictResult`.

Backend/demo memperlakukan D1 & D2 sama walau pipeline internalnya beda:
- **D1Classifier**: peak-norm -> YAMNet meanstd -> standardize (train stats) -> MLP (.keras).
- **D2Classifier**: pad/crop -> log-mel patches -> SavedModel fine-tune (+ temperature hook).
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import tensorflow as tf

from .audio import N_SAMPLES, prep_clip, to_patches_input
from .config import ModelSpec
from .yamnet_hub import YamnetHub


@dataclass
class PredictResult:
    model_key: str
    classes: list[str]
    probs: list[float]
    label: str
    confidence: float

    def as_dict(self) -> dict:
        return {
            "model_key": self.model_key,
            "classes": self.classes,
            "probs": [round(float(p), 6) for p in self.probs],
            "label": self.label,
            "confidence": round(float(self.confidence), 6),
        }


def _result(spec: ModelSpec, probs: np.ndarray) -> PredictResult:
    probs = np.asarray(probs, dtype=np.float64).ravel()
    idx = int(probs.argmax())
    return PredictResult(
        model_key=spec.key,
        classes=spec.classes,
        probs=probs.tolist(),
        label=spec.classes[idx],
        confidence=float(probs[idx]),
    )


class BaseClassifier:
    def __init__(self, spec: ModelSpec):
        self.spec = spec

    def predict(self, y: np.ndarray) -> PredictResult:      # pragma: no cover - abstrak
        raise NotImplementedError


class D1Classifier(BaseClassifier):
    """YAMNet beku -> mean+std -> standardize -> MLP (3 kelas). Butuh YamnetHub bersama."""

    def __init__(self, spec: ModelSpec, hub: YamnetHub):
        super().__init__(spec)
        self.hub = hub
        self.model = tf.keras.models.load_model(spec.model_path)
        stats = np.load(spec.standardize_path, allow_pickle=True)
        self.mean = stats["mean"].astype(np.float32)         # (1, 2048)
        self.std = stats["std"].astype(np.float32)

    def predict(self, y: np.ndarray) -> PredictResult:
        clip = prep_clip(y, peak_norm=self.spec.peak_norm)   # D1: peak_norm=True
        feat = self.hub.embed_meanstd(clip)[None, :]         # (1, 2048)
        z = (feat - self.mean) / self.std                    # standardize (train stats)
        probs = self.model.predict(z, verbose=0)[0]
        return _result(self.spec, probs)


class D2Classifier(BaseClassifier):
    """Fine-tune YAMNet SavedModel end-to-end (4 kelas). Input = log-mel patches."""

    def __init__(self, spec: ModelSpec):
        super().__init__(spec)
        self.loaded = tf.saved_model.load(str(spec.model_path))
        self.infer = self.loaded.signatures["serving_default"]
        # nama input/output diambil DINAMIS (jangan hard-code "input_2"/"dense_1")
        self.in_name = list(self.infer.structured_input_signature[1].keys())[0]
        self.out_name = list(self.infer.structured_outputs.keys())[0]
        self.temperature = float(spec.temperature)

    def predict(self, y: np.ndarray) -> PredictResult:
        clip = prep_clip(y, peak_norm=self.spec.peak_norm)   # D2: peak_norm=False
        x = to_patches_input(clip)                           # (1, n_patch, 96, 64, 1)
        out = self.infer(**{self.in_name: tf.constant(x)})
        probs = out[self.out_name].numpy()[0]
        if self.temperature != 1.0:                          # hook kalibrasi (T=1 -> no-op)
            logits = np.log(np.clip(probs, 1e-9, None)) / self.temperature
            e = np.exp(logits - logits.max())
            probs = e / e.sum()
        return _result(self.spec, probs)


def build_classifier(spec: ModelSpec, hub: YamnetHub) -> BaseClassifier:
    if spec.type == "d1_meanstd_mlp":
        return D1Classifier(spec, hub)
    if spec.type == "d2_savedmodel":
        return D2Classifier(spec)
    raise ValueError(f"tipe model tak dikenal: {spec.type}")
