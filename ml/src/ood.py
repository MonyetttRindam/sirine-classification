"""Gerbang OOD (out-of-distribution): "ada suara sirine atau tidak?".

Classifier 4-kelas kita selalu memilih 1 dari 4, jadi pada audio non-sirine (musik, ngobrol,
hening) argmax = alarm palsu. Gerbang ini memakai YAMNet AudioSet (521 kelas bawaan) sebagai
penyaring tahap-1: ambil skor kelas terkait sirine, kalau di bawah ambang -> tolak sebelum
classifier menentukan jenis. Lihat decision log PLANNING 2026-07-24.
"""
from __future__ import annotations

import numpy as np

from .config import OODSpec
from .yamnet_hub import YamnetHub


class SirenGate:
    def __init__(self, hub: YamnetHub, spec: OODSpec):
        self.hub = hub
        self.idx = list(spec.siren_class_indices)
        self.threshold = float(spec.threshold)

    def siren_score(self, y: np.ndarray) -> float:
        """Skor keberadaan sirine [0..1]: PEAK atas frame & kelas sirine.

        Peak (bukan mean) supaya sirine yang muncul sebentar/tertimbun noise tetap tertangkap.
        Catatan penting (terukur di D2 noisy): skor AudioSet untuk **police** bisa serendah
        ~0.02 saat noise berat, hampir menyentuh level traffic. Karena itu gerbang ini dipakai
        LONGGAR sebagai filter kasar (menolak hening/noise/musik/speech yang skornya ~0), bukan
        penentu jenis sirine. Pertahanan utama alert tetap confidence threshold classifier.
        """
        scores = self.hub.scores(y)                    # (n_frames, 521)
        return float(scores[:, self.idx].max())        # peak antar-frame & kelas sirine

    def is_siren(self, y: np.ndarray) -> bool:
        return self.siren_score(y) >= self.threshold
