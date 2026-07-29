"""Skema respons API (Pydantic)."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class ModelInfo(BaseModel):
    key: str
    name: str
    classes: list[str]
    macro_f1: float


class HealthResponse(BaseModel):
    status: str
    models: list[ModelInfo]
    ood_threshold: float
    confidence_threshold: float


class ModelResult(BaseModel):
    model_key: str
    name: str
    classes: list[str]
    probs: list[float]
    label: str
    confidence: float
    is_alert: bool                 # gerbang OOD + kelas sirine + confidence (tanpa persistensi)


class PredictResponse(BaseModel):
    siren_score: float
    is_siren: bool                 # lolos gerbang OOD
    duration: float
    models: dict[str, ModelResult]


class StreamFileResponse(BaseModel):
    duration: float
    hop_seconds: float
    window_seconds: float
    # timeline per model: list langkah {t, state, label, confidence, siren_score, triggered, ...}
    timelines: dict[str, list[dict[str, Any]]]
    # ringkasan event alert (rising edge) per model
    events: dict[str, list[dict[str, Any]]]
