export default function Dashboard({ history }) {
  return (
    <div className="page">
      <span className="eyebrow">Ringkasan</span>
      <h2>Dashboard</h2>
      <p className="intro">Riwayat klasifikasi terbaru dari kedua model.</p>

      <div className="stats">
        <div className="stat"><div className="k" style={{ color: "var(--ink-2)" }}>Hari ini</div><div className="v">{history.length + 122}</div><div className="c">total klasifikasi</div></div>
        <div className="stat"><div className="k" style={{ color: "var(--red)" }}>Alert</div><div className="v" style={{ color: "var(--red-700)" }}>{history.filter((h) => h.status === "ALERT").length + 34}</div><div className="c">sirine terdeteksi</div></div>
        <div className="stat"><div className="k" style={{ color: "var(--green-600)" }}>Kesepakatan</div><div className="v" style={{ color: "var(--green-700)" }}>94<span style={{ fontSize: 22 }}>%</span></div><div className="c">D1 &amp; D2 setuju</div></div>
      </div>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Waktu</th><th>Sumber</th><th>D1 (3 kelas)</th><th>D2 (4 kelas)</th>
              <th style={{ textAlign: "right" }}>OOD</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td className="tnum">{h.time}</td>
                <td style={{ color: "var(--ink-2)" }}>{h.src}</td>
                <td>{h.d1}</td>
                <td>{h.d2}</td>
                <td className="tnum" style={{ textAlign: "right" }}>{h.ood}</td>
                <td><span className={"sbadge " + (h.status === "ALERT" ? "alert" : "safe")}>{h.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
