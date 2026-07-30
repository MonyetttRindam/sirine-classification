// Lapisan API: memanggil backend FastAPI, dengan fallback ke data contoh saat offline.
import { SAMPLES } from "./data.js";

// Base URL backend:
// - VITE_API_URL (build-time) menang kalau di-set (mis. backend dipisah ke host lain).
// - Dev (Vite :5173): default ke backend lokal :8000.
// - Produksi (satu container, frontend disajikan backend): "" = same-origin (path relatif).
const API =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8000" : "");

const CLASS_LABEL = { ambulance: "Ambulance", firetruck: "Firetruck", police: "Police", traffic: "Traffic" };

export const labelOf = (c) => CLASS_LABEL[c] || c;

// URL WebSocket untuk /stream (live mic). Turunkan dari API base: http->ws, https->wss.
// API "" (same-origin, produksi) -> pakai origin halaman; API "http://host:port" (dev) -> ws://...
export function streamUrl() {
  const base = API || (typeof location !== "undefined" ? location.origin : "");
  return base.replace(/^http/, "ws") + "/stream";
}

export async function checkHealth() {
  try {
    const r = await fetch(`${API}/health`, { signal: AbortSignal.timeout(2500) });
    if (!r.ok) return { online: false };
    const j = await r.json();
    return { online: true, info: j };
  } catch {
    return { online: false };
  }
}

// Bentuk hasil yang dikonsumsi UI (sama untuk jalur nyata & fallback).
function shapeFromBackend(resp, meta) {
  const mk = (m) => {
    const rows = m.classes.map((c, i) => ({ n: CLASS_LABEL[c] || c, v: m.probs[i] }));
    const top = rows.reduce((a, b) => (b.v > a.v ? b : a));
    return { rows, pred: top.n, conf: Math.round(top.v * 100) };
  };
  const d1 = mk(resp.models.d1);
  const d2 = mk(resp.models.d2);
  return {
    live: true,
    label: meta.label,
    dur: meta.dur || "—",
    oodPct: Math.round(resp.siren_score * 100),
    thresholdPct: 5, // gerbang OOD nyata: siren_score >= 0.05
    gateOpen: resp.is_siren,
    alert: !!resp.models.d2.is_alert,
    d1, d2,
    d2Label: d2.pred,
  };
}

function shapeFromSample(s) {
  const mk = (arr) => {
    const rows = arr.map((r) => ({ n: r.n, v: r.v }));
    const top = rows.reduce((a, b) => (b.v > a.v ? b : a));
    return { rows, pred: top.n, conf: Math.round(top.v * 100) };
  };
  const gateOpen = s.ood >= 0.5;
  const d2 = mk(s.d2);
  return {
    live: false,
    label: s.label, dur: s.dur,
    oodPct: Math.round(s.ood * 100),
    thresholdPct: 50,
    gateOpen,
    alert: gateOpen && d2.pred !== "Traffic",
    d1: mk(s.d1), d2,
    d2Label: d2.pred,
  };
}

async function postPredict(blob, filename, meta) {
  const fd = new FormData();
  fd.append("file", blob, filename);
  const r = await fetch(`${API}/predict`, { method: "POST", body: fd, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error("predict failed " + r.status);
  return shapeFromBackend(await r.json(), meta);
}

// Klasifikasi contoh: coba backend (ambil wav dari public/samples), kalau gagal pakai data contoh.
export async function classifySample(key) {
  const s = SAMPLES[key];
  try {
    const wav = await fetch(s.file, { signal: AbortSignal.timeout(4000) });
    if (!wav.ok) throw new Error("no sample file");
    const blob = await wav.blob();
    return await postPredict(blob, key + ".wav", { label: s.label, dur: s.dur });
  } catch {
    return shapeFromSample(s);
  }
}

// Klasifikasi file yang diunggah user (selalu jalur nyata; kalau backend mati → error ditangani UI).
export async function classifyFile(file) {
  return postPredict(file, file.name, { label: file.name, dur: "—" });
}

// ---- Streaming: audio panjang → timeline siren_score per window (backend /stream-file) ----
function demoStream() {
  const pts = [
    [0, .10, 0], [1, .72, 1], [2, .78, 1], [3, .30, 1], [4, .03, 0], [5, .02, 0], [6, .22, 0],
    [7, .66, 1], [8, .71, 1], [9, .16, 0], [10, .03, 0], [11, .02, 0], [12, .05, 0], [13, .03, 0], [14, .02, 0],
  ];
  return {
    live: false, duration: 15, hop: 1, win: 3, thresholdPct: 5,
    points: pts.map(([t, s, on], i) => ({ t, score: s, on: !!on, triggered: (i === 1 || i === 7), label: t < 4 ? "police" : "ambulance" })),
    events: [{ t: 1, label: "police" }, { t: 7, label: "ambulance" }],
  };
}

export async function classifyStream(file) {
  try {
    const fd = new FormData();
    fd.append("file", file, file.name);
    const r = await fetch(`${API}/stream-file`, { method: "POST", body: fd, signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw new Error("stream failed");
    const j = await r.json();
    const tl = j.timelines?.d2 || [];
    const events = (j.events?.d2 || []).map((e) => ({ t: e.t, label: e.label }));
    return {
      live: true, duration: j.duration, hop: j.hop_seconds, win: j.window_seconds, thresholdPct: 5,
      points: tl.map((s) => ({ t: s.t, score: s.siren_score, on: s.state === "on", triggered: s.triggered, label: s.label })),
      events,
    };
  } catch {
    return demoStream();
  }
}
