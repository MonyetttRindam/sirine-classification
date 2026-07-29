"""Kalibrasi temperature scaling untuk model D2 (yang overconfident).

Temperature scaling = melunakkan softmax dengan membagi logit oleh T (skalar) supaya angka
keyakinan lebih JUJUR. T dicari di **validation set** (bukan test) dengan meminimalkan NLL.
D2 hanya keluarkan probabilitas (bukan logit), tapi `softmax(log(p)/T) == softmax(z/T)` karena
softmax invarian terhadap pergeseran konstan � jadi `log(p)` sah sebagai pengganti logit.

Melaporkan NLL & ECE sebelum/sesudah, lalu menulis T terbaik ke `config/inference.yaml`
(`models.d2.temperature`). Idempoten.

    .venv/Scripts/python.exe scripts/calibrate_temperature.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.optimize import minimize_scalar

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from ml.src.config import load_config           # noqa: E402
from ml.src.classifiers import D2Classifier     # noqa: E402
from ml.src.audio import decode_16k             # noqa: E402

EPS = 1e-9


def _softmax_T(logits: np.ndarray, T: float) -> np.ndarray:
    z = logits / T
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)


def _nll(probs: np.ndarray, y: np.ndarray) -> float:
    return float(-np.mean(np.log(probs[np.arange(len(y)), y] + EPS)))


def _ece(probs: np.ndarray, y: np.ndarray, n_bins: int = 10) -> float:
    """Expected Calibration Error � selisih rata-rata keyakinan vs akurasi per-bin."""
    conf = probs.max(axis=1)
    pred = probs.argmax(axis=1)
    correct = (pred == y).astype(float)
    bins = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for lo, hi in zip(bins[:-1], bins[1:]):
        m = (conf > lo) & (conf <= hi)
        if m.any():
            ece += abs(correct[m].mean() - conf[m].mean()) * m.mean()
    return float(ece)


def main() -> None:
    cfg = load_config()
    spec = cfg.models["d2"]
    spec.temperature = 1.0                              # ambil probs mentah dulu
    clf = D2Classifier(spec)

    df = pd.read_csv(ROOT / "ml" / "split_d2_val.csv")
    classes = spec.classes
    idx = {c: i for i, c in enumerate(classes)}

    print(f"Menjalankan D2 atas {len(df)} file val ...")
    probs, y = [], []
    for i, row in enumerate(df.itertuples(index=False)):
        p = clf.predict(decode_16k(str(ROOT / row.path))).probs
        probs.append(p)
        y.append(idx[row.label])
    probs = np.array(probs)
    y = np.array(y)
    logits = np.log(np.clip(probs, EPS, None))          # setara logit utk temperature

    nll0, ece0 = _nll(probs, y), _ece(probs, y)

    res = minimize_scalar(lambda T: _nll(_softmax_T(logits, T), y),
                          bounds=(0.5, 5.0), method="bounded")
    T = float(res.x)
    cal = _softmax_T(logits, T)
    nll1, ece1 = _nll(cal, y), _ece(cal, y)

    print(f"\n  T optimal      : {T:.3f}")
    print(f"  NLL  val       : {nll0:.4f} -> {nll1:.4f}")
    print(f"  ECE  val       : {ece0:.4f} -> {ece1:.4f}")
    print(f"  keyakinan rata2: {probs.max(1).mean():.3f} -> {cal.max(1).mean():.3f} "
          f"(akurasi val = {(probs.argmax(1) == y).mean():.3f})")

    # tulis T ke config (ganti baris temperature d2 saja, jaga komentar lain)
    cfg_path = ROOT / "config" / "inference.yaml"
    lines = cfg_path.read_text(encoding="utf-8").splitlines()
    for k, ln in enumerate(lines):
        if ln.strip().startswith("temperature:"):
            indent = ln[: len(ln) - len(ln.lstrip())]
            lines[k] = f"{indent}temperature: {T:.4f}                      # hasil kalibrasi val (calibrate_temperature.py)"
            break
    cfg_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\n  T ditulis -> {cfg_path} (models.d2.temperature)")


if __name__ == "__main__":
    main()
