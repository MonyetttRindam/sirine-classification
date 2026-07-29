import { useReveal } from "../hooks/useReveal.js";

export default function Landing({ go }) {
  useReveal();
  return (
    <div>
      {/* HERO — full-bleed photo */}
      <section className="hero-photo">
        <img className="hero-bg" src="/hero-ambulance.jpg" alt="Paramedis di dalam ambulans" />
        <div className="hero-scrim" />
        <div className="hero-photo-in">
          <div className="hero-copy">
            <span className="pill dark"><span className="d blink" /> Deteksi sirine darurat berbasis AI</span>
            <h1>Deteksi sirine<br />darurat, <span className="b">seketika.</span></h1>
            <p className="lede">Dua model AI bekerja paralel mengklasifikasi suara Ambulans, Polisi, dan Damkar — dengan gerbang OOD yang memastikan benar ada sirine sebelum peringatan dinyalakan.</p>
            <div className="hero-cta">
              <button className="btn btn-blue btn-lg" onClick={() => go("classify", "upload")}>Coba demo langsung</button>
              <button className="btn btn-glass btn-lg" onClick={() => go("classify", "stream")}>Lihat monitoring live</button>
              <button className="btn btn-glass btn-lg" onClick={() => go("dashboard")}>Buka dashboard</button>
            </div>
            <div className="hero-collab">
              <div className="lbl">Sebuah kolaborasi oleh</div>
              <div className="row">
                <span className="org">PT VINIX<span className="b">7</span></span>
                <span className="sep" />
                <span className="prog">Program Kerja Praktik<br /><small>Teknik Informatika</small></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES — tiga pilar */}
      <section className="section">
        <div className="feat-head">
          <span className="eyebrow-blue">Kenapa Sirine</span>
          <h2>Tiga pilar untuk deteksi yang bisa dipercaya.</h2>
          <p>Arsitektur yang dirancang bukan sekadar menebak kelas suara, tapi memberi keputusan terkalibrasi yang siap dipakai di lapangan.</p>
        </div>
        <div className="grid3">
          <div className="fcard reveal d1"><span className="bar" style={{ background: "var(--blue)" }} />
            <div className="fc-top">
              <div className="ic" style={{ background: "var(--blue-050)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="14" height="10" rx="2" fill="var(--blue)" opacity=".3" /><rect x="7" y="4" width="14" height="10" rx="2" fill="none" stroke="var(--blue)" strokeWidth="2" /></svg>
              </div>
              <span className="num">01</span>
            </div>
            <div className="fc-viz twin">
              <div className="col"><div className="tag" style={{ color: "var(--blue-700)" }}>D1 · 3 kelas</div>
                <span className="b" style={{ width: "88%", background: "var(--blue)" }} /><span className="b" style={{ width: "34%" }} /><span className="b" style={{ width: "18%" }} /></div>
              <div className="vline" />
              <div className="col"><div className="tag" style={{ color: "#7c3aed" }}>D2 · 4 kelas</div>
                <span className="b" style={{ width: "82%", background: "#7c3aed" }} /><span className="b" style={{ width: "30%" }} /><span className="b" style={{ width: "22%" }} /><span className="b" style={{ width: "16%" }} /></div>
            </div>
            <h4>Dua model paralel</h4>
            <p>D1 (3 kelas) dan D2 (4 kelas) menilai audio yang sama dan ditampilkan berdampingan — Anda melihat langsung ketika keduanya sepakat.</p>
            <a onClick={() => go("classify", "upload")}>Lihat perbandingan →</a>
          </div>
          <div className="fcard reveal d2"><span className="bar" style={{ background: "var(--green)" }} />
            <div className="fc-top">
              <div className="ic" style={{ background: "var(--green-050)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3z" fill="var(--green)" opacity=".3" /><path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3z" stroke="var(--green-600)" strokeWidth="1.8" /><path d="M9 12l2 2 4-4" stroke="var(--green-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span className="num">02</span>
            </div>
            <div className="fc-viz gauge">
              <svg width="130" height="66" viewBox="0 0 130 66">
                <path d="M10 60 A55 55 0 0 1 120 60" fill="none" stroke="#e6e9f0" strokeWidth="10" strokeLinecap="round" />
                <path className="gauge-arc" d="M10 60 A55 55 0 0 1 111 33" fill="none" stroke="var(--green)" strokeWidth="10" strokeLinecap="round" />
                <text x="65" y="52" textAnchor="middle" style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, fill: "var(--ink)" }}>0.94</text>
              </svg>
              <div className="cap">Skor kehadiran sirine</div>
            </div>
            <h4>Gerbang OOD</h4>
            <p>Skor kehadiran sirine menyaring suara di luar distribusi, mencegah alarm palsu dari kebisingan lalu lintas biasa.</p>
            <a onClick={() => go("classify", "upload")} style={{ color: "var(--green-600)" }}>Uji ambang →</a>
          </div>
          <div className="fcard reveal d3"><span className="bar" style={{ background: "var(--red)" }} />
            <div className="fc-top">
              <div className="ic" style={{ background: "var(--red-050)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 13h3l2-7 4 14 3-9 2 4h4" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span className="num">03</span>
            </div>
            <div className="fc-viz line">
              <svg viewBox="0 0 260 66" preserveAspectRatio="none">
                <rect x="120" y="4" width="86" height="52" fill="var(--red)" opacity="0.07" />
                <line x1="0" y1="30" x2="260" y2="30" stroke="var(--red)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                <polyline className="mon-line" points="4,52 40,50 78,46 108,30 130,12 160,8 186,22 216,44 244,50 256,52" fill="none" stroke="var(--blue)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
                <circle className="mon-dot" cx="160" cy="8" r="3.5" fill="var(--red)" />
              </svg>
            </div>
            <h4>Monitoring real-time</h4>
            <p>Pantau siren_score sepanjang waktu dengan area alert dan penanda event — cocok untuk pusat kendali 24/7.</p>
            <a onClick={() => go("classify", "stream")} style={{ color: "var(--red-600)" }}>Buka konsol live →</a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="dark" id="cara-kerja">
        <div className="dark-in">
          <div className="center">
            <span className="eyebrow2">Arsitektur</span>
            <h2>Cara kerja Sirine</h2>
            <p className="sub">Empat tahap mengubah suara mentah menjadi keputusan terkalibrasi — dari penangkapan audio hingga badge peringatan.</p>
          </div>
          <div className="steps">
            <div className="stepc reveal d1">
              <div className="hd"><span className="n">1</span><span className="tag">Tangkap</span></div>
              <div className="viz" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 12px" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--blue)", flex: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 3, height: 26, flex: 1 }}>
                  {Array.from({ length: 22 }).map((_, i) => (
                    <span key={i} className="eqbar" style={{ height: 26, background: "#5f74a8", animationDelay: `${(i % 7) * 0.11}s` }} />
                  ))}
                </div>
              </div>
              <p>Audio direkam atau diunggah pada 16 kHz lalu dipotong menjadi segmen 3 detik.</p>
            </div>
            <div className="stepc reveal d2">
              <div className="hd"><span className="n">2</span><span className="tag">Spektrogram</span></div>
              <div className="viz" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 2, padding: 6, alignItems: "end" }}>
                {["#1b4fff","#3d6bff","#ff8a3b","#ffd23b","#ff5a3b","#3d6bff","#1b4fff","#ffb03b","#ff5a3b","#3d6bff","#1b4fff","#3d6bff"].map((c, i) => <div key={i} className="spcell" style={{ background: c, height: "100%", animationDelay: `${(i % 6) * 0.16}s` }} />)}
              </div>
              <p>Sinyal diubah menjadi Mel-spektrogram — pola frekuensi yang dibaca model.</p>
            </div>
            <div className="stepc reveal d3">
              <div className="hd"><span className="n">3</span><span className="tag">Dua model + OOD</span></div>
              <div className="viz" style={{ display: "flex", alignItems: "flex-end", gap: 4, padding: "8px 12px" }}>
                {[["80%","var(--red)"],["22%","#5f74a8"],["14%","#5f74a8"],["gap"],["70%","var(--red)"],["20%","#5f74a8"],["16%","#5f74a8"],["12%","#5f74a8"]].map((b, i) =>
                  b[0] === "gap" ? <div key={i} style={{ width: 14 }} /> : <div key={i} className="opbar" style={{ width: 8, height: b[0], background: b[1], animationDelay: `${i * 0.13}s` }} />)}
              </div>
              <p>D1 dan D2 memprediksi paralel; gerbang OOD menilai apakah benar ada sirine.</p>
            </div>
            <div className="stepc reveal d4">
              <div className="hd"><span className="n">4</span><span className="tag">Hasil</span></div>
              <div className="viz" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="popbadge" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--red)", color: "#fff", borderRadius: 8, padding: "7px 13px", fontFamily: "var(--display)", fontWeight: 700, fontSize: 13 }}><span className="blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />ALERT</span>
              </div>
              <p>Label terkalibrasi, perbandingan model, dan badge ALERT / AMAN yang jelas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TOOLKIT */}
      <section className="section">
        <div className="toolkit-grid">
          <div className="toolkit-left reveal">
            <span className="pill-eyebrow">Toolkit &amp; Riset</span>
            <h2>Toolkit AI untuk keselamatan jalan.</h2>
            <p className="lede2">Model dan antarmuka yang dirancang untuk berkembang — dari satu perekaman di lapangan hingga pemantauan seluruh kota.</p>
            <div className="feat-2x2">
              <div className="feat"><h5>Dua model paralel</h5><p>D1 tiga kelas dan D2 empat kelas dijalankan berdampingan untuk verifikasi silang.</p></div>
              <div className="feat"><h5>Gerbang OOD terkalibrasi</h5><p>Menyaring suara di luar distribusi untuk menekan alarm palsu.</p></div>
              <div className="feat"><h5>Model ringan</h5><p>Versi ringkas untuk perangkat edge berdaya rendah dan mikrofon jalan.</p></div>
              <div className="feat"><h5>Terbuka &amp; kolaboratif</h5><p>Kontribusi data dan kode untuk memperkuat model bersama tim.</p></div>
            </div>
            <div className="toolkit-btns">
              <button className="btn btn-blue btn-lg" onClick={() => go("classify", "upload")}>Jelajahi Analyzer →</button>
              <button className="btn btn-git btn-lg" onClick={() => go("classify", "stream")}>Konsol Live</button>
            </div>
          </div>
          <div className="toolkit-cards">
            <div className="ucard reveal d1">
              <div className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 12h4l3-8 4 16 3-8h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
              <h4>Operator &amp; Smart City</h4>
              <p>Prioritaskan lampu hijau otomatis saat sirine mendekat, dari feed CCTV atau mikrofon jalan.</p>
              <div className="ucard-links"><a onClick={() => go("classify", "stream")}>Konsol Live →</a><a onClick={() => document.getElementById("cara-kerja")?.scrollIntoView({ behavior: "smooth" })}>Cara kerja →</a></div>
            </div>
            <div className="ucard reveal d2">
              <div className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" /></svg></div>
              <h4>Layanan Darurat 112</h4>
              <p>Verifikasi dan catat otomatis jenis kendaraan darurat yang beroperasi di suatu area.</p>
              <div className="ucard-links"><a onClick={() => go("dashboard")}>Dashboard →</a><a onClick={() => go("classify", "stream")}>Streaming →</a></div>
            </div>
            <div className="ucard reveal d3">
              <div className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 9l-4 3 4 3M16 9l4 3-4 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
              <h4>Pengembang &amp; Edge</h4>
              <p>Modul Python <code>ml/src</code> + backend FastAPI siap diintegrasikan ke sistem lain.</p>
              <div className="ucard-links"><a onClick={() => go("classify", "upload")}>Coba Demo →</a><a onClick={() => document.getElementById("cara-kerja")?.scrollIntoView({ behavior: "smooth" })}>Cara kerja →</a></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ paddingTop: 30, paddingBottom: 88 }}>
        <div className="cta-box reveal">
          <h2>Siap mendengar lebih cepat?</h2>
          <p>Coba demo interaktif sekarang — tanpa instalasi, langsung di browser Anda.</p>
          <div className="row">
            <button className="btn btn-blue btn-lg" onClick={() => go("classify", "upload")}>Coba demo langsung</button>
            <button className="btn btn-white-ghost btn-lg" onClick={() => go("dashboard")}>Lihat dashboard</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div className="footer">
        <div className="footer-in">
          <span className="logo" />
          <span className="nm">Sirine</span>
          <span>· Klasifikasi Suara Darurat</span>
          <span style={{ marginLeft: "auto" }}>Proyek Kerja Praktik · PT VINIX7 · 2026</span>
        </div>
      </div>
    </div>
  );
}
