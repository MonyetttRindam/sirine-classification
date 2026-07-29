"""Wrapper YAMNet asli (TF-Hub) yang dimuat SEKALI dan dipakai untuk dua hal:

1. **Embedding D1** � `frame_embeddings(y)` -> (n_frames, 1024) untuk fitur mean+std.
2. **Gerbang OOD** � `scores(y)` -> (n_frames, 521) skor AudioSet; kelas sirine dipakai
   `SirenGate` (lihat `ood.py`).

Muat satu kali (download YAMNet ~cache lokal), reuse antar-request.
"""
from __future__ import annotations

import numpy as np
import tensorflow as tf
import tensorflow_hub as hub


class YamnetHub:
    def __init__(self, hub_url: str = "https://tfhub.dev/google/yamnet/1"):
        self._model = hub.load(hub_url)

    def _run(self, y: np.ndarray):
        scores, embeddings, _spec = self._model(tf.constant(y, dtype=tf.float32))
        return scores.numpy(), embeddings.numpy()

    def frame_embeddings(self, y: np.ndarray) -> np.ndarray:
        """(n_frames, 1024) embedding per-frame untuk waveform 16 kHz."""
        _scores, emb = self._run(y)
        return emb

    def scores(self, y: np.ndarray) -> np.ndarray:
        """(n_frames, 521) skor AudioSet per-frame."""
        scores, _emb = self._run(y)
        return scores

    def embed_meanstd(self, y: np.ndarray) -> np.ndarray:
        """concat(mean, std) antar-frame -> 2048-d (fitur input MLP D1). Identik notebook 07."""
        emb = self.frame_embeddings(y)                     # (n, 1024)
        return np.concatenate([emb.mean(axis=0), emb.std(axis=0)]).astype(np.float32)
