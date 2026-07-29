"""Ekspor artefak standardisasi untuk model D1 (deployment).

Model D1 (`d1_yamnet_mlp_meanstd/model.keras`) dilatih atas embedding YAMNet mean+std
yang **distandardisasi memakai statistik train** (lihat notebook 08, sel 1). Statistik itu
tidak ikut tersimpan saat training � dihitung ulang on-the-fly dari cache. Tanpa statistik ini,
inferensi D1 di produksi akan salah.

Skrip ini menghitung ulang `mean`/`std` PERSIS seperti notebook 08 (dari cache mean+std D1 +
split train D1) lalu menyimpannya sebagai `standardize.npz` di folder artefak D1. Idempoten �
aman dijalankan berulang.

Jalankan:  .venv/Scripts/python.exe scripts/export_d1_artifacts.py
"""
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
ML_DIR = ROOT / "ml"
CACHE = ML_DIR / "cache" / "yamnet_stats_d1.npz"
TRAIN_SPLIT = ML_DIR / "split_d1_train.csv"
OUT = ML_DIR / "artifacts" / "d1_yamnet_mlp_meanstd" / "standardize.npz"


def main() -> None:
    data = np.load(CACHE, allow_pickle=True)
    emb_by_file = {fn: e for fn, e in zip(data["filename"], data["emb"])}
    classes = sorted(set(data["label"]))                     # ['ambulance','firetruck','traffic']

    # Susun X_train PERSIS urutan/isi seperti load_dataset() notebook 08.
    df_train = pd.read_csv(TRAIN_SPLIT)
    Xtr = np.stack([emb_by_file[fn] for fn in df_train.filename]).astype(np.float32)

    # Statistik train + guard kolom near-constant (identik notebook 08).
    mean = Xtr.mean(0, keepdims=True)                        # (1, 2048)
    std = Xtr.std(0, keepdims=True)
    std = np.where(std < 1e-6, 1.0, std)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    np.savez(
        OUT,
        mean=mean.astype(np.float32),
        std=std.astype(np.float32),
        classes=np.array(classes),
        feature=np.array("yamnet_meanstd_2048"),
    )
    print(f"train file       : {len(df_train)}")
    print(f"mean/std shape   : {mean.shape}")
    print(f"kolom di-guard   : {int((std == 1.0).sum())} (std<1e-6 -> 1.0)")
    print(f"classes          : {classes}")
    print(f"tersimpan        -> {OUT}")


if __name__ == "__main__":
    main()
