"""Verifikasi paling kritis: pipeline `ml/src` mereproduksi macro-F1 training untuk KEDUA model.

Kalau angka meleset dari metrics.json, berarti ada bug preprocessing (peak-norm? standardize?
patches?) � HARUS diperbaiki sebelum lanjut ke backend. Ini bukti refactor identik training.

Jalankan cepat (tanpa pytest):
    .venv/Scripts/python.exe tests/test_inference.py
Atau via pytest:
    .venv/Scripts/python.exe -m pytest tests/test_inference.py -s
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import f1_score

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from ml.src.inference import ModelRegistry     # noqa: E402

TOL = 0.005
EXPECTED = {"d1": 0.9762, "d2": 0.8830}


def _macro_f1_for(reg: ModelRegistry, model_key: str) -> float:
    df = pd.read_csv(ROOT / "ml" / f"split_{model_key}_test.csv")
    classes = reg.cfg.models[model_key].classes
    idx = {c: i for i, c in enumerate(classes)}
    y_true, y_pred = [], []
    t0 = time.time()
    for i, row in enumerate(df.itertuples(index=False)):
        y = reg.decode(str(ROOT / row.path))
        res = reg.predict_one(y, model_key)
        y_true.append(idx[row.label])
        y_pred.append(classes.index(res.label))
        if (i + 1) % 50 == 0 or i + 1 == len(df):
            print(f"  [{model_key}] {i + 1:>3}/{len(df)}  ({(i + 1) / (time.time() - t0):.1f} file/s)")
    return f1_score(y_true, y_pred, average="macro")


def test_reproduce_macro_f1():
    reg = ModelRegistry()

    # sanity bentuk & probabilitas pada 1 file per model
    for key in ("d1", "d2"):
        df = pd.read_csv(ROOT / "ml" / f"split_{key}_test.csv")
        y = reg.decode(str(ROOT / df.iloc[0].path))
        res = reg.predict_one(y, key)
        n_cls = len(reg.cfg.models[key].classes)
        assert len(res.probs) == n_cls, f"{key}: harus {n_cls} probs"
        assert abs(sum(res.probs) - 1.0) < 1e-4, f"{key}: probs harus jumlah ~1"

    for key, expected in EXPECTED.items():
        got = _macro_f1_for(reg, key)
        print(f"[{key}] macro-F1 = {got:.4f}  (target {expected:.4f}, tol +-{TOL})")
        assert abs(got - expected) <= TOL, \
            f"{key}: macro-F1 {got:.4f} meleset dari {expected:.4f} (tol {TOL}) � cek preprocessing!"


if __name__ == "__main__":
    test_reproduce_macro_f1()
    print("\nOK � kedua model mereproduksi macro-F1 training. Pipeline ml/src identik.")
