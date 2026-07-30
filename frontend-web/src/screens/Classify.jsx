import { useEffect, useRef, useState } from "react";
import { SAMPLES } from "../data.js";
import { classifySample, classifyFile, classifyStream, streamUrl, labelOf } from "../api.js";
import { encodeWAV, fmtTime } from "../lib/wav.js";

const nowHM = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const cssVar = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

const DEMO_STREAM = {
  live: false, duration: 15, hop: 1, win: 3, thresholdPct: 5,
  points: [[0,.10,0],[1,.72,1],[2,.78,1],[3,.30,1],[4,.03,0],[5,.02,0],[6,.22,0],[7,.66,1],[8,.71,1],[9,.16,0],[10,.03,0],[11,.02,0],[12,.05,0],[13,.03,0],[14,.02,0]]
    .map(([t, s, on], i) => ({ t, score: s, on: !!on, triggered: i === 1 || i === 7, label: t < 4 ? "police" : "ambulance" })),
  events: [{ t: 1, label: "police" }, { t: 7, label: "ambulance" }],
};

// Warna kendaraan darurat per jenis (tampak atas).
const SIREN_SIM = {
  ambulance: { body: "#eef1f7", cabin: "#c4cee0", stripe: "#e5233a", label: "Ambulans" },
  firetruck: { body: "#e5233a", cabin: "#8f1420", stripe: "#ffd54a", label: "Pemadam" },
  police:    { body: "#16233f", cabin: "#0c1526", stripe: "#eaf0ff", label: "Polisi" },
};

// Mobil tampak-atas (SVG kecil), menghadap kanan (arah laju).
function TopCar({ body = "#2f5bff", cabin = "#cfe0ff", stripe, beacon = false }) {
  return (
    <svg className="topcar" viewBox="0 0 64 30" width="58" height="27" aria-hidden="true">
      <rect x="3" y="4" width="58" height="22" rx="7" fill={body} stroke="rgba(0,0,0,.18)" />
      {stripe && <rect x="3" y="12" width="58" height="5" fill={stripe} opacity=".9" />}
      <rect x="22" y="7" width="16" height="16" rx="3.5" fill={cabin} />
      <rect x="55" y="9" width="4" height="12" rx="2" fill="rgba(255,255,255,.55)" />
      <rect x="6" y="9" width="3" height="12" rx="1.5" fill="rgba(0,0,0,.22)" />
      {beacon && <rect className="beacon" x="14" y="11" width="7" height="8" rx="2" fill="#ff3b47" />}
    </svg>
  );
}

// Simulasi "beri jalan": mobil biru menepi ketika sirine terdeteksi, kendaraan darurat lewat.
function CarSim({ active, type }) {
  const key = (type || "").toLowerCase();
  const em = SIREN_SIM[key];
  const on = !!active && !!em;
  return (
    <div className={"carsim" + (on ? " active" : "")}>
      <div className="road" role="img" aria-label={on ? `Memberi jalan untuk ${em.label}` : "Lalu lintas normal"}>
        <div className="ego"><TopCar /></div>
        {on && (
          <div className="emv"><TopCar body={em.body} cabin={em.cabin} stripe={em.stripe} beacon /></div>
        )}
      </div>
      <div className="carsim-cap">
        {on
          ? <><b style={{ color: "var(--red-700)" }}>Beri jalan</b> — {em.label} melintas, mobil menepi.</>
          : "Lalu lintas normal — kendaraan tetap di jalur kanan."}
      </div>
    </div>
  );
}

function ModelCard({ tag, model, winColor }) {
  if (!model) return null;
  const others = model.rows.filter((r) => r.n !== model.pred);
  return (
    <div className="mcard">
      <div className="hd">
        <span className={"bd " + tag}>{tag.toUpperCase()}</span>
        <span className="nm-model">Model {tag.toUpperCase()}</span>
        <span className="sub">· {tag === "d1" ? "3 kelas" : "4 kelas"}</span>
      </div>
      <div className="pred-top">
        <div className="pt-hd">
          <span className="lbl">Prediksi teratas</span>
          <span className="calib"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="var(--green-600)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>terkalibrasi</span>
        </div>
        <div className="pt-row">
          <span className="pt-name">{model.pred}</span>
          <span className="pt-conf" style={{ color: winColor }}>{model.conf}%</span>
        </div>
        <div className="conf-bar"><div className="lv" style={{ width: model.conf + "%", background: winColor }} /></div>
      </div>
      <div className="other-label">Kelas lain</div>
      {others.map((r) => (
        <div className="mrow" key={r.n}>
          <span className="nm">{r.n}</span>
          <div className="tk"><div className="lv" style={{ width: Math.round(r.v * 100) + "%", background: "#c9d0de" }} /></div>
          <span className="n tnum">{Math.round(r.v * 100)}</span>
        </div>
      ))}
    </div>
  );
}

function Results({ result }) {
  if (!result) return null;
  const winColor = result.gateOpen ? "var(--red)" : "var(--green)";
  const badgeText = result.alert ? `ALERT — ${result.d2Label} terdeteksi` : "AMAN — tidak ada sirine";
  const badgeSub = result.alert ? "Gerbang OOD di atas ambang" : "Gerbang OOD di bawah ambang — kemungkinan lalu lintas biasa";
  return (
    <div>
      <div className={"banner " + (result.alert ? "alert" : "safe")}>
        <span className="d blink" /><span className="ttl">{badgeText}</span><span className="sub">{badgeSub}</span>
      </div>
      <div className="ood">
        <div className="top">
          <span className="field-label" style={{ margin: 0 }}>Gerbang OOD — kehadiran sirine</span>
          <span className="v tnum">{result.oodPct}%</span>
        </div>
        <div className="bar"><div className="lv" style={{ width: result.oodPct + "%", background: winColor }} /></div>
        <div className="mark"><div className="t" style={{ left: result.thresholdPct + "%" }} /></div>
        <div className="cap">{result.gateOpen ? "Sirine terdeteksi" : "Tidak ada sirine"} · ambang keputusan {result.thresholdPct}%</div>
      </div>
      <div className="twin"><ModelCard tag="d1" model={result.d1} winColor={winColor} /><ModelCard tag="d2" model={result.d2} winColor={winColor} /></div>
      <CarSim active={result.alert} type={result.d2Label} />
    </div>
  );
}

export default function Classify({ initialTab = "upload", online, onClassified }) {
  const [tab, setTab] = useState(initialTab);
  const [sample, setSample] = useState("ambulans");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [streamData, setStreamData] = useState(DEMO_STREAM);
  const [liveOn, setLiveOn] = useState(false);
  const [liveMsg, setLiveMsg] = useState(null);
  const [liveModel, setLiveModel] = useState("d2");

  const audioRef = useRef(null);
  const fileRef = useRef(null);
  const streamFileRef = useRef(null);
  const specRef = useRef(null);
  const micRef = useRef(null);
  const recPlayRef = useRef(null);
  const streamRef = useRef(null);
  const liveVizRef = useRef(null);
  const eng = useRef({});

  useEffect(() => { setTab(initialTab); }, [initialTab]);

  /* ---------- Web Audio ---------- */
  function ensureCtx() { if (!eng.current.ctx) eng.current.ctx = new (window.AudioContext || window.webkitAudioContext)(); return eng.current.ctx; }
  function stopDraw() { if (eng.current.raf) cancelAnimationFrame(eng.current.raf); eng.current.raf = 0; }

  function drawBars(canvas, data, color) {
    if (!canvas) return;
    const c = canvas.getContext("2d"), w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const N = 48, step = w / N; c.fillStyle = color;
    for (let i = 0; i < N; i++) {
      const v = data ? data[Math.floor(i * data.length / N)] / 255 : 0.05;
      const bh = Math.max(2, v * (h - 4));
      c.fillRect(i * step + step * 0.2, (h - bh) / 2, step * 0.6, bh);
    }
  }
  function loopBars(analyser, canvas, colorVar) {
    stopDraw();
    const color = cssVar(colorVar), buf = new Uint8Array(analyser.frequencyBinCount);
    const step = () => { analyser.getByteFrequencyData(buf); drawBars(canvas, buf, color); eng.current.raf = requestAnimationFrame(step); };
    step();
  }

  /* ---------- playback ---------- */
  function loadTrack(url) { const a = audioRef.current; if (a) { a.src = url; a.load(); } eng.current.loadedUrl = url; setPlaying(false); setCur(0); }
  async function togglePlay(canvasRef, colorVar = "--blue") {
    const a = audioRef.current; if (!a || !a.src) return;
    const ctx = ensureCtx();
    if (!eng.current.mediaConnected) {
      const src = ctx.createMediaElementSource(a);
      const an = ctx.createAnalyser(); an.fftSize = 512;
      src.connect(an); src.connect(ctx.destination);
      eng.current.playAnalyser = an; eng.current.mediaConnected = true;
    }
    await ctx.resume();
    if (a.paused) { await a.play(); setPlaying(true); loopBars(eng.current.playAnalyser, canvasRef?.current, colorVar); }
    else { a.pause(); setPlaying(false); stopDraw(); }
  }
  // Putar ulang hasil rekaman (pastikan track yang dimuat adalah rekaman).
  function playRecording() {
    if (recordedUrl && eng.current.loadedUrl !== recordedUrl) loadTrack(recordedUrl);
    togglePlay(recPlayRef, "--red");
  }

  /* ---------- mic → WAV → /predict ---------- */
  async function startMic() {
    setError("");
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setError("Tidak bisa mengakses mikrofon. Izinkan akses mic di browser."); return; }
    const ctx = ensureCtx(); await ctx.resume();
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser(); an.fftSize = 256; src.connect(an);
    const proc = ctx.createScriptProcessor(4096, 1, 1), mute = ctx.createGain(); mute.gain.value = 0;
    src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
    const chunks = [];
    proc.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    eng.current.mic = { stream, src, proc, mute, chunks, sr: ctx.sampleRate };
    setRecording(true); setRecTime(0);
    eng.current.recTimer = setInterval(() => setRecTime((t) => t + 1), 1000);
    loopBars(an, micRef.current, "--red");
    eng.current.micTimer = setTimeout(stopMic, 4500);
  }
  function stopMic() {
    const m = eng.current.mic; if (!m) return;
    clearTimeout(eng.current.micTimer); clearInterval(eng.current.recTimer); stopDraw(); setRecording(false);
    try { m.proc.disconnect(); m.mute.disconnect(); m.src.disconnect(); } catch {}
    m.stream.getTracks().forEach((t) => t.stop());
    eng.current.mic = null;
    const len = m.chunks.reduce((a, c) => a + c.length, 0); if (!len) return;
    const flat = new Float32Array(len); let o = 0; m.chunks.forEach((c) => { flat.set(c, o); o += c.length; });
    const blob = encodeWAV(flat, m.sr);
    const url = URL.createObjectURL(blob);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(url); loadTrack(url);
    runBlob(new File([blob], "rekaman.wav", { type: "audio/wav" }), "Mic");
  }

  /* ---------- classify ---------- */
  function log(res, src) {
    onClassified?.({ time: nowHM(), src,
      d1: `${res.d1.pred} · ${(res.d1.conf / 100).toFixed(2)}`, d2: `${res.d2.pred} · ${(res.d2.conf / 100).toFixed(2)}`,
      ood: (res.oodPct / 100).toFixed(2), status: res.alert ? "ALERT" : "AMAN" });
  }
  async function runSample(key) {
    const s = SAMPLES[key]; setSample(key); setError(""); setLoading(true); loadTrack(s.file);
    try { const res = await classifySample(key); setResult(res); log(res, "Upload"); }
    catch { setError("Gagal mengklasifikasi contoh."); } finally { setLoading(false); }
  }
  async function runBlob(file, src) {
    setError(""); setLoading(true);
    try { const res = await classifyFile(file); setResult(res); log(res, src); }
    catch { setError("Backend tidak merespons. Jalankan uvicorn untuk klasifikasi nyata, atau pilih contoh."); }
    finally { setLoading(false); }
  }
  function onFile(file) { if (!file) return; loadTrack(URL.createObjectURL(file)); runBlob(file, "Upload"); }

  async function runStream(file) {
    if (!file) return;
    loadTrack(URL.createObjectURL(file)); setLoading(true);
    try { const d = await classifyStream(file); setStreamData(d); } finally { setLoading(false); }
  }

  /* ---------- live mic real-time (WebSocket /stream) ---------- */
  // Downsample nearest-neighbor ke 16 kHz (backend & YAMNet pakai 16k).
  function downsampleTo16k(f32, inRate) {
    if (inRate === 16000) return f32;
    const ratio = inRate / 16000, outLen = Math.floor(f32.length / ratio), out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) out[i] = f32[Math.floor(i * ratio)] || 0;
    return out;
  }
  function drawLiveViz() {
    const canvas = liveVizRef.current; if (!canvas) return;
    const arr = eng.current.liveScores || [];
    const c = canvas.getContext("2d"), w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const thY = h - 0.05 * (h - 6) - 3;                       // garis ambang OOD 0.05
    c.strokeStyle = "rgba(255,59,71,.5)"; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(0, thY); c.lineTo(w, thY); c.stroke(); c.setLineDash([]);
    const N = 60, step = w / N, red = cssVar("--red"), blue = cssVar("--blue");
    arr.slice(-N).forEach((p, i) => {
      const bh = Math.max(2, Math.min(1, p.score) * (h - 6));
      c.fillStyle = p.on ? red : blue;
      c.fillRect(i * step + step * 0.15, h - bh - 2, step * 0.7, bh);
    });
  }
  async function startLive() {
    setError("");
    if (liveOn) return;
    if (!online) { setError("Live mic butuh backend online (mode contoh tidak mendukung streaming)."); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setError("Tidak bisa mengakses mikrofon. Izinkan akses mic di browser."); return; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume();
    const src = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(4096, 1, 1), mute = ctx.createGain(); mute.gain.value = 0;
    src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
    let ws;
    try { ws = new WebSocket(streamUrl()); } catch { setError("Gagal membuka koneksi streaming."); stream.getTracks().forEach((t) => t.stop()); ctx.close(); return; }
    ws.binaryType = "arraybuffer";
    ws.onopen = () => ws.send(JSON.stringify({ model_key: liveModel }));
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      setLiveMsg(m);
      const arr = eng.current.liveScores || [];
      arr.push({ score: m.siren_score, on: m.state === "on" });
      if (arr.length > 120) arr.shift();
      eng.current.liveScores = arr;
      drawLiveViz();
      if (m.triggered) onClassified?.({ time: nowHM(), src: "Live mic", d1: "—", d2: `${labelOf(m.label)} · ${(m.confidence).toFixed(2)}`, ood: (m.siren_score).toFixed(2), status: "ALERT" });
    };
    ws.onerror = () => setError("Koneksi streaming bermasalah.");
    proc.onaudioprocess = (e) => {
      if (ws.readyState !== 1) return;
      const ds = downsampleTo16k(new Float32Array(e.inputBuffer.getChannelData(0)), ctx.sampleRate);
      ws.send(ds.buffer);
    };
    eng.current.live = { stream, ctx, src, proc, mute, ws };
    eng.current.liveScores = [];
    setLiveMsg(null); setLiveOn(true);
  }
  function stopLive() {
    const L = eng.current.live;
    setLiveOn(false); setLiveMsg(null);
    if (!L) return;
    try { L.proc.onaudioprocess = null; L.proc.disconnect(); L.mute.disconnect(); L.src.disconnect(); } catch {}
    try { L.ws.close(); } catch {}
    try { L.stream.getTracks().forEach((t) => t.stop()); } catch {}
    try { L.ctx.close(); } catch {}
    eng.current.live = null;
  }

  useEffect(() => { if (!result) runSample("ambulans"); /* eslint-disable-next-line */ }, []);
  // Hentikan playback + live mic saat pindah tab supaya audio/mic tidak bocor ke tab lain.
  useEffect(() => {
    const a = audioRef.current; if (a && !a.paused) { a.pause(); setPlaying(false); stopDraw(); }
    if (tab !== "stream" && eng.current.live) stopLive();
    /* eslint-disable-next-line */
  }, [tab]);
  useEffect(() => {
    if (tab === "upload" && !playing) drawBars(specRef.current, null, cssVar("--blue"));
    if (tab === "record" && recording) drawBars(micRef.current, null, cssVar("--red"));
    if (tab === "record" && !recording && recordedUrl && !playing) drawBars(recPlayRef.current, null, cssVar("--red"));
  }, [tab, playing, recording, recordedUrl]);
  useEffect(() => { if (tab === "stream") drawStreamChart(streamRef.current, streamData, cur); /* eslint-disable-next-line */ }, [tab, streamData, cur]);
  useEffect(() => () => { stopDraw(); if (eng.current.mic) stopMic(); if (eng.current.live) stopLive(); if (eng.current.ctx) eng.current.ctx.close(); /* eslint-disable-next-line */ }, []);

  const showResults = tab === "upload" || tab === "record";

  return (
    <div>
      <audio ref={audioRef} hidden
        onEnded={() => { setPlaying(false); stopDraw(); }}
        onTimeUpdate={(e) => setCur(e.target.currentTime)}
        onLoadedMetadata={(e) => setDur(e.target.duration)} />

      {/* HERO header */}
      <section className="demo-hero">
        <svg className="demo-hero-wf" viewBox="0 0 240 44" preserveAspectRatio="none"><use href="#wf" /></svg>
        <div className="demo-hero-in">
          <span className="live-badge"><span className="d blink" />Live Inference · {online ? "backend online" : "mode contoh"}</span>
          <h2 className="demo-title">Demo Langsung</h2>
          <p className="demo-lede">Klasifikasi berjalan langsung di browser Anda — audio contoh diproses secara lokal, tidak ada yang diunggah ke server.</p>
          <p className="model-line">Model: <b>D1 · YAMNet-MLP</b> (3 kelas) &amp; <b>D2 · YAMNet fine-tune</b> (4 kelas) · gerbang OOD terkalibrasi</p>
        </div>
      </section>

      <div className="page">
        {/* info banner */}
        <div className="info-banner">
          <div className="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="3" width="12" height="18" rx="2.5" stroke="var(--blue)" strokeWidth="1.8" /><line x1="10" y1="18" x2="14" y2="18" stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" /></svg></div>
          <div className="tx"><b>Baru: monitoring lapangan.</b> Jalankan deteksi dari mikrofon perangkat, di pos jaga maupun kendaraan.</div>
          <a onClick={() => setTab("stream")}>Selengkapnya →</a>
        </div>

        <div className="tabs">
          <button className={"tab" + (tab === "upload" ? " on" : "")} onClick={() => setTab("upload")}>Upload Audio</button>
          <button className={"tab" + (tab === "record" ? " on" : "")} onClick={() => setTab("record")}>Rekam Mic</button>
          <button className={"tab" + (tab === "stream" ? " on" : "")} onClick={() => setTab("stream")}>Streaming</button>
        </div>

        {tab === "upload" && (
          <div>
            <div className="field-label">Contoh audio</div>
            <div className="chips">
              {Object.values(SAMPLES).map((s) => (
                <button key={s.key} className={"chip" + (sample === s.key ? " on" : "")} onClick={() => runSample(s.key)}>{s.label} · {s.dur}</button>
              ))}
              <span className="hint">atau unggah file .wav</span>
            </div>
            <div className={"dropzone" + (drag ? " drag" : "")}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}>
              Klik atau seret file audio (.wav / .mp3) ke sini untuk klasifikasi nyata
              <input ref={fileRef} type="file" accept="audio/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            <div className="player">
              <button className="play" onClick={() => togglePlay(specRef, "--blue")} aria-label={playing ? "Jeda" : "Putar"}>{playing ? "❚❚" : "▶"}</button>
              <canvas ref={specRef} className="viz-canvas" />
              <span className="dur tnum" style={{ flex: "none", minWidth: 78, textAlign: "right" }}>{fmtTime(cur)} / {fmtTime(dur)}</span>
            </div>
          </div>
        )}

        {tab === "record" && (
          <div>
            {recording ? (
              <div className="rec-card">
                <div className="mic mic-pulse"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="11" rx="3" stroke="#fff" strokeWidth="1.9" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" /></svg></div>
                <div className="rec-info">
                  <div className="line1"><span className="t1">Merekam</span><span className="rec-badge"><span className="d blink" />REC</span></div>
                  <div className="t2">Otomatis berhenti & diklasifikasi setelah ~4 detik.</div>
                </div>
                <span className="rec-timer tnum">{fmtTime(recTime)}</span>
                <button className="stop-btn" onClick={stopMic}><span className="sq" />Hentikan</button>
                <div className="rec-level"><span className="lv-lbl">Level</span><canvas ref={micRef} className="viz-canvas" style={{ height: 30 }} /></div>
              </div>
            ) : (
              <div className="record">
                <button className="mic" onClick={startMic} style={{ border: 0, cursor: "pointer" }}>●</button>
                <div style={{ flex: 1 }}>
                  <div className="t1">{recordedUrl ? "Rekaman siap — putar atau rekam ulang" : "Rekam suara di sekitar Anda"}</div>
                  <div className="t2">Klik tombol merah untuk merekam ~4 detik dari mikrofon, lalu otomatis diklasifikasi.</div>
                </div>
              </div>
            )}

            {recordedUrl && !recording && (
              <div className="player" style={{ marginTop: 16 }}>
                <button className="play red" onClick={playRecording} aria-label={playing ? "Jeda" : "Putar"}>{playing ? "❚❚" : "▶"}</button>
                <canvas ref={recPlayRef} className="viz-canvas" />
                <span className="dur tnum" style={{ flex: "none", minWidth: 78, textAlign: "right" }}>{fmtTime(cur)} / {fmtTime(dur)}</span>
                <button className="chip" style={{ flex: "none" }} onClick={startMic}>↻ Rekam ulang</button>
              </div>
            )}
          </div>
        )}

        {error && <div className="banner alert" style={{ marginTop: 20, marginBottom: 20 }}><span className="d" /><span className="ttl">{error}</span></div>}
        {loading && <div className="offline" style={{ marginTop: 20 }}><span className="spin" /> Memproses…</div>}

        {showResults && !loading && <div style={{ marginTop: 26 }}><Results result={result} /></div>}

        {tab === "stream" && (
          <div>
            {/* Live mic real-time (WebSocket) */}
            <div className="live-mic">
              <div className="lm-head">
                <button className={"lm-btn" + (liveOn ? " on" : "")} onClick={liveOn ? stopLive : startLive}>
                  {liveOn ? <><span className="sq" />Hentikan mic</> : <>● Mulai mic langsung</>}
                </button>
                <label className="lm-model">
                  Model
                  <select value={liveModel} onChange={(e) => setLiveModel(e.target.value)} disabled={liveOn}>
                    <option value="d2">D2 · 4 kelas</option>
                    <option value="d1">D1 · 3 kelas</option>
                  </select>
                </label>
                <span className="hint">{online ? "deteksi kontinu dari mikrofon perangkat" : "butuh backend online"}</span>
              </div>
              {liveOn && (
                <>
                  <div className={"banner " + (liveMsg?.state === "on" ? "alert" : "safe")} style={{ marginTop: 4 }}>
                    <span className="d blink" />
                    <span className="ttl">{liveMsg?.state === "on" ? `SIRINE — ${labelOf(liveMsg.label)} terdeteksi` : "Memantau… aman"}</span>
                    <span className="sub">{liveMsg ? `dugaan ${labelOf(liveMsg.label)} · keyakinan ${Math.round(liveMsg.confidence * 100)}% · OOD ${Math.round(liveMsg.siren_score * 100)}%` : "menunggu audio…"}</span>
                  </div>
                  <div className="lm-viz"><canvas ref={liveVizRef} style={{ width: "100%", height: 120, display: "block" }} /></div>
                  <div className="lm-cap">Bar merah = window dinyatakan alert (hysteresis {`${streamData.win}s`} window). Garis putus-putus = ambang gerbang OOD 5%.</div>
                  <CarSim active={liveMsg?.state === "on"} type={liveMsg?.label} />
                </>
              )}
            </div>

            <div className="stream-hd">
              <span className="live"><span className="d blink" />LIVE</span>
              <span className="stream-ttl">Monitoring siren_score (dari file)</span>
              <span className="stream-meta">window {streamData.win}s · hop {streamData.hop}s · {streamData.live ? "hasil backend" : "contoh"}</span>
            </div>
            <div className="chips" style={{ marginBottom: 14 }}>
              <button className="chip on" onClick={() => streamFileRef.current?.click()}>⤒ Unggah audio panjang</button>
              <button className="chip" onClick={() => togglePlay(null)}>{playing ? "❚❚ Jeda" : "▶ Putar & lacak"}</button>
              <span className="hint">unggah rekaman panjang (mis. suara jalan) → dipindai per {streamData.win} detik</span>
              <input ref={streamFileRef} type="file" accept="audio/*" hidden onChange={(e) => runStream(e.target.files?.[0])} />
            </div>
            <div className="chartbox"><canvas ref={streamRef} style={{ width: "100%", height: 220, display: "block" }} /></div>
            <div className="stream-foot">
              <div className="banner safe" style={{ flex: 1 }}>
                <span className="d" style={{ background: "var(--blue)" }} />
                <span className="ttl" style={{ color: "var(--ink)" }}>{streamData.events.length} event alert terdeteksi</span>
              </div>
              <div style={{ flex: "none", textAlign: "right" }}>
                <div className="field-label" style={{ margin: 0 }}>Event</div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 14 }}>
                  {streamData.events.map((e) => `${e.t}s ${e.label}`).join(" · ") || "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function drawStreamChart(canvas, data, curTime) {
    if (!canvas || !data) return;
    const w = canvas.clientWidth, H = 220, dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = w * dpr; canvas.height = H * dpr;
    const c = canvas.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, H);
    const pad = { l: 38, r: 14, t: 16, b: 26 }, pw = w - pad.l - pad.r, ph = H - pad.t - pad.b, D = data.duration || 15;
    const X = (t) => pad.l + (t / D) * pw, Y = (s) => pad.t + (1 - s) * ph;
    c.font = "10px Manrope, sans-serif"; c.textBaseline = "middle";
    [1, .5, 0].forEach((val) => { const yy = Y(val); c.strokeStyle = "#e6e9f0"; c.beginPath(); c.moveTo(pad.l, yy); c.lineTo(w - pad.r, yy); c.stroke(); c.fillStyle = "#8494a0"; c.textAlign = "right"; c.fillText(val.toFixed(1), pad.l - 6, yy); });
    c.strokeStyle = cssVar("--red"); c.globalAlpha = .55; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(pad.l, Y(0.05)); c.lineTo(w - pad.r, Y(0.05)); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    c.fillStyle = cssVar("--red"); c.globalAlpha = .10; data.points.forEach((p) => { if (p.on) { const x0 = X(p.t), x1 = X(Math.min(D, p.t + data.hop)); c.fillRect(x0, pad.t, x1 - x0, ph); } }); c.globalAlpha = 1;
    const P = data.points;
    const grad = c.createLinearGradient(0, pad.t, 0, pad.t + ph); grad.addColorStop(0, "rgba(47,91,255,.25)"); grad.addColorStop(1, "rgba(47,91,255,0)");
    c.beginPath(); P.forEach((p, i) => { const x = X(p.t), y = Y(p.score); i ? c.lineTo(x, y) : c.moveTo(x, y); });
    c.lineTo(X(P[P.length - 1].t), pad.t + ph); c.lineTo(X(P[0].t), pad.t + ph); c.closePath(); c.fillStyle = grad; c.fill();
    c.beginPath(); P.forEach((p, i) => { const x = X(p.t), y = Y(p.score); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.strokeStyle = cssVar("--blue"); c.lineWidth = 2.4; c.lineJoin = "round"; c.stroke();
    P.forEach((p) => { if (p.on) { c.beginPath(); c.arc(X(p.t), Y(p.score), 3, 0, 7); c.fillStyle = cssVar("--red"); c.fill(); } });
    data.events.forEach((e) => { c.strokeStyle = cssVar("--red"); c.setLineDash([3, 3]); c.beginPath(); c.moveTo(X(e.t), pad.t); c.lineTo(X(e.t), pad.t + ph); c.stroke(); c.setLineDash([]); });
    c.fillStyle = "#8494a0"; c.textAlign = "center"; c.textBaseline = "top"; [0, D / 2, D].forEach((t) => c.fillText(Math.round(t) + "s", X(t), H - pad.b + 6));
    if (curTime > 0) { c.strokeStyle = cssVar("--red"); c.lineWidth = 2; c.beginPath(); c.moveTo(X(curTime), pad.t); c.lineTo(X(curTime), pad.t + ph); c.stroke(); }
  }
}
