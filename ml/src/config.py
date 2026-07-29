"""Loader konfigurasi inferensi (config/inference.yaml) ke dataclass yang rapi.

Path model di YAML relatif terhadap root project; loader me-resolve-nya jadi absolut supaya
backend/demo bisa dijalankan dari direktori mana pun.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

# ml/src/config.py -> parents[2] = root project ("Siren Classification")
ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = ROOT / "config" / "inference.yaml"


@dataclass
class ModelSpec:
    key: str                       # "d1" | "d2"
    name: str
    type: str                      # "d1_meanstd_mlp" | "d2_savedmodel"
    model_path: Path
    classes: list[str]
    peak_norm: bool
    macro_f1: float
    standardize_path: Path | None = None
    temperature: float = 1.0


@dataclass
class OODSpec:
    siren_class_indices: list[int]
    threshold: float


@dataclass
class AlertSpec:
    siren_classes: list[str]
    confidence_threshold: float
    window_seconds: float
    hop_seconds: float
    smooth_window: int
    n_on: int
    n_off: int


@dataclass
class InferenceConfig:
    yamnet_hub_url: str
    sample_rate: int
    duration: float
    models: dict[str, ModelSpec]
    ood: OODSpec
    alert: AlertSpec
    root: Path = field(default=ROOT)

    @property
    def n_samples(self) -> int:
        return int(self.sample_rate * self.duration)


def _resolve(p: str | None) -> Path | None:
    if p is None:
        return None
    path = Path(p)
    return path if path.is_absolute() else (ROOT / path)


def load_config(path: str | Path = DEFAULT_CONFIG) -> InferenceConfig:
    raw: dict[str, Any] = yaml.safe_load(Path(path).read_text(encoding="utf-8"))

    models: dict[str, ModelSpec] = {}
    for key, m in raw["models"].items():
        models[key] = ModelSpec(
            key=key,
            name=m["name"],
            type=m["type"],
            model_path=_resolve(m["model_path"]),
            classes=list(m["classes"]),
            peak_norm=bool(m["peak_norm"]),
            macro_f1=float(m["macro_f1"]),
            standardize_path=_resolve(m.get("standardize_path")),
            temperature=float(m.get("temperature", 1.0)),
        )

    ood = OODSpec(
        siren_class_indices=list(raw["ood"]["siren_class_indices"]),
        threshold=float(raw["ood"]["threshold"]),
    )
    a = raw["alert"]
    alert = AlertSpec(
        siren_classes=list(a["siren_classes"]),
        confidence_threshold=float(a["confidence_threshold"]),
        window_seconds=float(a["window_seconds"]),
        hop_seconds=float(a["hop_seconds"]),
        smooth_window=int(a["smooth_window"]),
        n_on=int(a["n_on"]),
        n_off=int(a["n_off"]),
    )
    return InferenceConfig(
        yamnet_hub_url=raw["yamnet_hub_url"],
        sample_rate=int(raw["sample_rate"]),
        duration=float(raw["duration"]),
        models=models,
        ood=ood,
        alert=alert,
    )
