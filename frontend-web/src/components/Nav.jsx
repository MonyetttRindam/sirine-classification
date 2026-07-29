const Logo = () => (
  <span className="logo">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M4 12h2l2-6 4 12 3-8 2 4h3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

export default function Nav({ screen, go }) {
  const cls = (s) => "nav-link" + (screen === s ? " on" : "");
  return (
    <div className="nav">
      <div className="nav-in">
        <a className="brand" onClick={() => go("landing")}>
          <Logo />
          <span className="nm">Sirine</span>
        </a>
        <div className="nav-menu">
          <a className={cls("landing")} onClick={() => go("landing")}>Beranda</a>
          <a className={cls("classify")} onClick={() => go("classify")}>Demo Langsung</a>
          <a className={cls("dashboard")} onClick={() => go("dashboard")}>Dashboard</a>
        </div>
        <div className="nav-right">
          <button className="btn btn-primary" onClick={() => go("classify", "upload")}>Coba Demo</button>
        </div>
      </div>
    </div>
  );
}
