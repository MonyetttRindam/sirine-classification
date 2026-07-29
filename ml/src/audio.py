"""Preprocessing audio untuk kedua pipeline inferensi.

Dua model butuh preprocessing BERBEDA (jangan disatukan):
- **D1**: peak-normalize, lalu YAMNet asli -> embedding per-frame -> mean+std.
- **D2**: TANPA peak-normalize, pad/crop 3 s -> log-mel patches (96x64) ala YAMNet.

Fungsi `_wave_to_patches` & param `P` di-vendor VERBATIM dari notebook fine-tune
(`notebooks/kaggle/finetune_yamnet_d2.ipynb`, sel 5 & 1) supaya identik dengan training.
`decode_16k`/peak-norm mengikuti `load_16k` notebook 07 (fitur D1).
"""
from __future__ import annotations

from types import SimpleNamespace

import librosa
import numpy as np
import tensorflow as tf

YAMNET_SR = 16000
DURATION = 3.0
N_SAMPLES = int(YAMNET_SR * DURATION)          # 48000 -> 5 patch untuk D2

# --- Param log-mel YAMNet resmi (params.py) untuk patches D2 ---
P = SimpleNamespace(
    sample_rate=16000.0, stft_window_seconds=0.025, stft_hop_seconds=0.010,
    mel_bands=64, mel_min_hz=125.0, mel_max_hz=7500.0, log_offset=0.001,
    patch_window_seconds=0.96, patch_hop_seconds=0.48)
P.patch_frames = int(round(P.patch_window_seconds / P.stft_hop_seconds))    # 96
P.patch_bands = P.mel_bands                                                 # 64


def decode_16k(source) -> np.ndarray:
    """Muat audio PENUH jadi 16 kHz mono float32 (tanpa crop/normalisasi).

    `source` bisa path (str/Path) atau file-like (mis. BytesIO dari upload).
    """
    y, _ = librosa.load(source, sr=YAMNET_SR, mono=True)
    return y.astype(np.float32)


def prep_clip(y: np.ndarray, peak_norm: bool, n_samples: int = N_SAMPLES) -> np.ndarray:
    """Rapikan 1 klip ke panjang tetap `n_samples`; peak-normalize opsional (khusus D1)."""
    if len(y) < n_samples:
        y = np.pad(y, (0, n_samples - len(y)))
    y = y[:n_samples].astype(np.float32)
    if peak_norm:
        peak = float(np.abs(y).max())
        if peak > 0:
            y = y / peak
    return y


def iter_windows(y_full: np.ndarray, win_samples: int, hop_samples: int) -> list[np.ndarray]:
    """Pecah audio panjang jadi window (untuk streaming/timeline).

    Window terakhir di-pad kalau kurang; klip <= 1 window tetap menghasilkan 1 window.
    """
    if len(y_full) <= win_samples:
        return [y_full]
    starts = list(range(0, len(y_full) - win_samples + 1, hop_samples))
    windows = [y_full[s:s + win_samples] for s in starts]
    if starts[-1] + win_samples < len(y_full):     # ekor yang belum tercakup
        windows.append(y_full[-win_samples:])
    return windows


def _wave_to_patches(waveform):
    """Vendored dari yamnet/features.py: waveform 16k -> patches (n, 96, 64)."""
    win = int(round(P.sample_rate * P.stft_window_seconds))
    hop = int(round(P.sample_rate * P.stft_hop_seconds))
    fft_len = 2 ** int(np.ceil(np.log(win) / np.log(2.0)))
    nbins = fft_len // 2 + 1
    mag = tf.abs(tf.signal.stft(waveform, frame_length=win, frame_step=hop,
                                fft_length=fft_len))
    mel_w = tf.signal.linear_to_mel_weight_matrix(
        num_mel_bins=P.mel_bands, num_spectrogram_bins=nbins,
        sample_rate=P.sample_rate, lower_edge_hertz=P.mel_min_hz,
        upper_edge_hertz=P.mel_max_hz)
    mel = tf.matmul(mag, mel_w)
    log_mel = tf.math.log(mel + P.log_offset)
    spec_rate = P.sample_rate / hop
    pw = int(round(spec_rate * P.patch_window_seconds))
    ph = int(round(spec_rate * P.patch_hop_seconds))
    feats = tf.signal.frame(log_mel, frame_length=pw, frame_step=ph, axis=0)
    return feats                                           # (n_patches, 96, 64)


def to_patches_input(y_fixed: np.ndarray) -> np.ndarray:
    """Klip 3 s (peak_norm=False) -> input SavedModel D2: (1, n_patch, 96, 64, 1)."""
    patches = _wave_to_patches(tf.constant(y_fixed)).numpy()       # (n, 96, 64)
    return patches[None, ..., None].astype(np.float32)             # (1, n, 96, 64, 1)
