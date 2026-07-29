"""Uji gerbang OOD: file sirine -> siren_score tinggi; noise putih & hening -> rendah.

Membuktikan YAMNet memisahkan "ada sirine" dari "bukan sirine", sekaligus mencetak nilai
nyata untuk kalibrasi `ood.threshold` di config.

    .venv/Scripts/python.exe tests/test_ood.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from ml.src.audio import N_SAMPLES                 # noqa: E402
from ml.src.config import load_config              # noqa: E402
from ml.src.ood import SirenGate                   # noqa: E402
from ml.src.yamnet_hub import YamnetHub            # noqa: E402


def _sample_paths(model_key: str, label: str, n: int) -> list[Path]:
    df = pd.read_csv(ROOT / "ml" / f"split_{model_key}_test.csv")
    sub = df[df.label == label].head(n)
    return [ROOT / p for p in sub.path]


def test_ood_separates_siren_from_nonsiren():
    cfg = load_config()
    hub = YamnetHub(cfg.yamnet_hub_url)
    gate = SirenGate(hub, cfg.ood)
    import librosa

    def score_file(path: Path) -> float:
        y, _ = librosa.load(str(path), sr=cfg.sample_rate, mono=True)
        return gate.siren_score(y.astype(np.float32))

    siren_scores = []
    for lbl in ("ambulance", "firetruck", "police"):
        for p in _sample_paths("d2", lbl, 5):
            s = score_file(p)
            siren_scores.append(s)
            print(f"  sirine/{lbl:9s} {p.name:24s} score={s:.3f}")

    rng = np.random.default_rng(0)
    noise = (rng.standard_normal(N_SAMPLES) * 0.1).astype(np.float32)
    silence = np.zeros(N_SAMPLES, dtype=np.float32)
    s_noise = gate.siren_score(noise)
    s_silence = gate.siren_score(silence)
    print(f"  noise putih            score={s_noise:.3f}")
    print(f"  hening                 score={s_silence:.3f}")

    siren_scores = np.array(siren_scores)
    passed = float((siren_scores >= gate.threshold).mean())
    print(f"\n  median(sirine)={np.median(siren_scores):.3f}  "
          f"lolos_gerbang={passed:.0%}  ambang={gate.threshold}")

    # non-sirine (noise/hening) harus jelas di bawah ambang � benteng lawan silence/noise
    assert s_noise < gate.threshold and s_silence < gate.threshold, \
        "noise/hening harus ditolak gerbang"
    # gerbang longgar: MAYORITAS sirine (median + minimal 60% sampel) lolos
    assert np.median(siren_scores) > gate.threshold, "median sirine harus lolos gerbang"
    assert passed >= 0.6, f"minimal 60% sirine lolos (dapat {passed:.0%})"


if __name__ == "__main__":
    test_ood_separates_siren_from_nonsiren()
    print("\nOK � gerbang OOD memisahkan sirine dari non-sirine.")
