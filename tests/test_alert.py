"""Uji AlertEngine: hysteresis anti-flicker + gerbang OOD + confidence threshold.

Murni logika (tanpa model) � cepat. Jalankan:
    .venv/Scripts/python.exe tests/test_alert.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from ml.src.alert import AlertEngine     # noqa: E402

CLASSES = ["ambulance", "firetruck", "police", "traffic"]
SIREN = ["ambulance", "firetruck", "police"]

# probs "yakin ambulance" vs "yakin traffic"
AMB = [0.90, 0.04, 0.03, 0.03]
TRA = [0.03, 0.03, 0.04, 0.90]
HIGH_OOD = 0.5
LOW_OOD = 0.0


def _engine(smooth=1, n_on=2, n_off=2, conf=0.85, ood=0.05):
    return AlertEngine(CLASSES, SIREN, conf, ood, smooth, n_on, n_off)


def test_requires_n_on_consecutive_to_turn_on():
    e = _engine(n_on=2)
    s1 = e.step(AMB, HIGH_OOD)
    assert s1.state == "off" and not s1.triggered, "1 hit belum cukup"
    s2 = e.step(AMB, HIGH_OOD)
    assert s2.state == "on" and s2.triggered, "hit ke-2 harus memicu ON"


def test_single_flicker_does_not_trigger():
    e = _engine(n_on=2)
    e.step(AMB, HIGH_OOD)      # hit
    e.step(TRA, LOW_OOD)       # miss -> reset streak
    e.step(AMB, HIGH_OOD)      # hit (streak=1 lagi)
    assert e.state == "off", "kedipan tunggal tak boleh menyalakan alert"


def test_requires_n_off_consecutive_to_turn_off():
    e = _engine(n_on=2, n_off=2)
    e.step(AMB, HIGH_OOD); e.step(AMB, HIGH_OOD)     # -> ON
    assert e.state == "on"
    s = e.step(TRA, LOW_OOD)                          # 1 miss
    assert s.state == "on", "1 miss belum mematikan"
    s = e.step(TRA, LOW_OOD)                          # 2 miss
    assert s.state == "off", "2 miss berturut harus OFF"


def test_ood_gate_blocks_even_high_confidence():
    e = _engine(n_on=1)                               # 1 hit cukup kalau lolos
    s = e.step(AMB, LOW_OOD)                           # yakin ambulance TAPI OOD gagal
    assert not s.is_hit and s.state == "off", "OOD rendah harus memblokir alert"


def test_traffic_never_alerts():
    e = _engine(n_on=1)
    s = e.step(TRA, HIGH_OOD)                          # traffic bukan kelas sirine
    assert not s.is_hit and s.state == "off"


def test_low_confidence_blocks():
    e = _engine(n_on=1, conf=0.85)
    s = e.step([0.5, 0.2, 0.2, 0.1], HIGH_OOD)        # argmax ambulance tapi conf 0.5 < 0.85
    assert not s.is_hit, "keyakinan di bawah threshold harus blokir"


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"  OK  {name}")
    print("\nSemua uji AlertEngine lolos.")
