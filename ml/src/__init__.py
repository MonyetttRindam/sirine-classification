"""Paket inferensi produksi model sirine (Fase 4 deployment).

Mengangkat logika preprocessing + inferensi dari notebook ke modul yang bisa di-import
backend (FastAPI) maupun demo (Gradio). Dua model didukung berdampingan:

- **D1** (clean, 3 kelas): YAMNet beku -> mean+std -> standardize -> MLP.
- **D2** (noisy/produksi, 4 kelas): fine-tune YAMNet end-to-end (SavedModel).

Entry point utama: `ModelRegistry` (memuat kedua model + YAMNet + gerbang OOD sekali).
"""
import os

# TF verbose logging diperkecil. TIDAK memakai legacy Keras: model D1 (model.keras) disimpan
# dengan Keras 3 default TF 2.16, dan D2 (SavedModel) + YAMNet hub bersifat keras-agnostic.
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

from .config import InferenceConfig, load_config          # noqa: E402

__all__ = ["InferenceConfig", "load_config"]
