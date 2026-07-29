"""Demo Gradio � perbandingan D1 vs D2 berdampingan + simulasi alert streaming.

Memanggil backend FastAPI (env BACKEND_URL, default http://localhost:8000). Jalankan backend
dulu, lalu:
    .venv/Scripts/python.exe frontend-gradio/app.py

Tab 1 (Bandingkan): 1 audio -> kedua model jalan, panel D1 | D2 berdampingan + badge alert.
Tab 2 (Simulasi):    audio panjang -> timeline alert per model (grafik siren_score + state).
"""
from __future__ import annotations

import os

import gradio as gr
import httpx
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# --- Patch bug gradio_client 1.3.0 (bundled gradio 4.44): get_type/_json_schema_to_python_type
# crash "argument of type 'bool' is not iterable" saat skema JSON punya nilai boolean
# (additionalProperties: true). Bikin startup-check gagal -> "localhost is not accessible".
# Guard input non-dict/bool. Lihat gradio issue #7297. ---
import gradio_client.utils as _gcu  # noqa: E402

_orig_get_type = _gcu.get_type
_orig_js2pt = _gcu._json_schema_to_python_type


def _safe_get_type(schema):
    if not isinstance(schema, dict):
        return "Any"
    return _orig_get_type(schema)


def _safe_js2pt(schema, defs=None):
    if isinstance(schema, bool):
        return "Any"
    return _orig_js2pt(schema, defs)


_gcu.get_type = _safe_get_type
_gcu._json_schema_to_python_type = _safe_js2pt

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
TIMEOUT = httpx.Timeout(120.0)

from pathlib import Path  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / "demo_samples"
EX_COMPARE = [[str(SAMPLES / f"contoh_{c}.wav")]
              for c in ("police", "ambulance", "firetruck", "traffic")
              if (SAMPLES / f"contoh_{c}.wav").exists()]
EX_STREAM = [[str(SAMPLES / "demo_streaming_15s.wav")]] if (SAMPLES / "demo_streaming_15s.wav").exists() else []


# ---------- pemanggil backend ----------
def _post_file(endpoint: str, audio_path: str) -> dict:
    with open(audio_path, "rb") as f:
        r = httpx.post(f"{BACKEND_URL}{endpoint}",
                       files={"file": (os.path.basename(audio_path), f, "audio/wav")},
                       timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def _alert_badge(is_alert: bool, label: str) -> str:
    if is_alert:
        return (f"<div style='padding:10px;border-radius:8px;background:#c0392b;color:#fff;"
                f"font-weight:700;text-align:center'>&#9888; ALERT � {label.upper()}</div>")
    return ("<div style='padding:10px;border-radius:8px;background:#27ae60;color:#fff;"
            "font-weight:700;text-align:center'>&#10004; AMAN � tidak ada sirine</div>")


# ---------- Tab 1: perbandingan ----------
def compare(audio_path):
    if not audio_path:
        empty = {}
        return "Unggah audio dulu.", empty, "", empty, ""
    r = _post_file("/predict", audio_path)
    gate = ("&#9989; lolos gerbang OOD" if r["is_siren"] else "&#10060; ditolak gerbang OOD")
    head = (f"**Gerbang OOD YAMNet** � skor sirine = `{r['siren_score']:.3f}` "
            f"(ambang lolos, {gate})  �  durasi {r['duration']} s")

    def panel(key):
        m = r["models"][key]
        probs = {c: float(p) for c, p in zip(m["classes"], m["probs"])}
        return probs, _alert_badge(m["is_alert"], m["label"])

    d1_probs, d1_badge = panel("d1")
    d2_probs, d2_badge = panel("d2")
    return head, d1_probs, d1_badge, d2_probs, d2_badge


# ---------- Tab 2: simulasi streaming ----------
def _timeline_plot(r: dict):
    fig, axes = plt.subplots(len(r["timelines"]), 1, figsize=(9, 4.5), sharex=True)
    if len(r["timelines"]) == 1:
        axes = [axes]
    for ax, (key, tl) in zip(axes, r["timelines"].items()):
        t = [s["t"] for s in tl]
        score = [s["siren_score"] for s in tl]
        ax.plot(t, score, marker="o", color="#2980b9", label="siren_score")
        for s in tl:                                      # arsir window saat alert ON
            if s["state"] == "on":
                ax.axvspan(s["t"], s["t"] + r["hop_seconds"], color="#e74c3c", alpha=0.18)
        for s in tl:                                      # tanda event (rising edge)
            if s["triggered"]:
                ax.axvline(s["t"], color="#c0392b", ls="--", lw=1.5)
        ax.set_ylabel(f"{key}\nsiren_score"); ax.set_ylim(0, 1); ax.legend(loc="upper right", fontsize=8)
    axes[-1].set_xlabel("waktu (detik)")
    fig.suptitle("Timeline deteksi � area merah = ALERT ON, garis putus = event")
    fig.tight_layout()
    return fig


def simulate(audio_path):
    if not audio_path:
        return None, "Unggah audio dulu."
    r = _post_file("/stream-file", audio_path)
    lines = [f"**Durasi** {r['duration']} s � window {r['window_seconds']} s � hop {r['hop_seconds']} s\n"]
    for key, evs in r["events"].items():
        if evs:
            times = ", ".join(f"{e['t']}s ({e['label']})" for e in evs)
            lines.append(f"- **{key}**: {len(evs)} event alert � {times}")
        else:
            lines.append(f"- **{key}**: tidak ada alert")
    return _timeline_plot(r), "\n".join(lines)


# ---------- UI ----------
_INFO = """
**Apa yang dibandingkan?**
- **Model D1** � dilatih di data *bersih*, **3 kelas** (ambulance, firetruck, traffic) � **tanpa police**. macro-F1 **0.976**.
- **Model D2** � dilatih di data *ber-noise* (produksi), **4 kelas** (+ police). macro-F1 **0.883**.

Audio **police** paling menarik: D2 mengenalinya, sedangkan D1 (tak kenal police) menebak kelas paling mirip.

**Alert 3 lapis** (berlaku dua model): **① Gerbang OOD YAMNet** (ada sirine atau tidak) �
**② Ambang keyakinan** (terkalibrasi) � **③ Persistensi** (bertahan beberapa detik, anti-kedip).
Keyakinan D2 sudah dikalibrasi (*temperature scaling*) supaya angka %-nya jujur.
"""


def build_demo() -> gr.Blocks:
    with gr.Blocks(title="Klasifikasi Sirine � D1 vs D2", theme=gr.themes.Soft()) as demo:
        gr.Markdown("# &#128658; Klasifikasi Suara Sirine Kendaraan Darurat\n"
                    "### Perbandingan Model D1 (bersih, 3 kelas) vs D2 (noisy/produksi, 4 kelas)")
        with gr.Accordion("&#8505;&#65039;  Cara kerja & apa yang dibandingkan", open=False):
            gr.Markdown(_INFO)

        with gr.Tab("&#128266;  Bandingkan (Upload / Rekam Mic)"):
            with gr.Row():
                with gr.Column(scale=1):
                    inp = gr.Audio(sources=["upload", "microphone"], type="filepath",
                                   label="Audio (ideal ~3 detik) � unggah atau rekam via mic")
                    btn = gr.Button("&#128269;  Prediksi & Bandingkan", variant="primary", size="lg")
                    if EX_COMPARE:
                        gr.Examples(EX_COMPARE, inputs=inp, label="Contoh (klik untuk memuat)")
                with gr.Column(scale=1):
                    head = gr.Markdown()
            with gr.Row():
                with gr.Column():
                    gr.Markdown("### &#127973;  Model D1 � bersih (3 kelas) � F1 0.976")
                    d1_lab = gr.Label(num_top_classes=4, label="Probabilitas D1")
                    d1_badge = gr.HTML()
                with gr.Column():
                    gr.Markdown("### &#127981;  Model D2 � produksi (4 kelas) � F1 0.883")
                    d2_lab = gr.Label(num_top_classes=4, label="Probabilitas D2")
                    d2_badge = gr.HTML()
            btn.click(compare, inp, [head, d1_lab, d1_badge, d2_lab, d2_badge])

        with gr.Tab("&#128225;  Simulasi Streaming (audio panjang)"):
            gr.Markdown("Unggah audio panjang (mis. rekaman YouTube/TikTok). Sistem memindai "
                        "per window 3 detik dan **menyalakan alert saat sirine bertahan** � "
                        "area merah di grafik = ALERT ON.")
            with gr.Row():
                inp2 = gr.Audio(sources=["upload", "microphone"], type="filepath",
                                label="Audio panjang � unggah atau rekam via mic")
                with gr.Column():
                    btn2 = gr.Button("&#9654;&#65039;  Jalankan Simulasi", variant="primary", size="lg")
                    events = gr.Markdown()
            if EX_STREAM:
                gr.Examples(EX_STREAM, inputs=inp2, label="Contoh audio 15 detik (police � hening � ambulance � hening � traffic)")
            plot = gr.Plot(label="Timeline deteksi")
            btn2.click(simulate, inp2, [plot, events])

        gr.Markdown("<sub>Kerja Praktik PT VINIX7 � YAMNet transfer learning � "
                    "backend FastAPI + demo Gradio</sub>")
    return demo


if __name__ == "__main__":
    build_demo().launch()
