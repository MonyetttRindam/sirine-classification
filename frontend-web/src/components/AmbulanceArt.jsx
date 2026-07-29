// Ilustrasi ambulans (vektor) untuk hero. Ganti dengan <img src="/samples/ambulance.jpg"/>
// bila ada foto asli.
export default function AmbulanceArt() {
  return (
    <svg viewBox="0 0 300 120" role="img" aria-label="Ilustrasi ambulans">
      <ellipse cx="150" cy="103" rx="132" ry="9" fill="#000" opacity=".12" />
      <g fill="#1c262e"><circle cx="86" cy="100" r="16" /><circle cx="214" cy="100" r="16" /></g>
      <circle cx="86" cy="100" r="7" fill="#c3ced6" /><circle cx="214" cy="100" r="7" fill="#c3ced6" />
      <path d="M26 94 V54 q0-8 8-8 H196 l14 4 q10 3 16 12 l14 14 q4 4 4 10 v8 z" fill="#ffffff" />
      <path d="M26 76 H272 v18 H26 z" fill="#e63946" />
      <path d="M26 76 H272 v4 H26 z" fill="#c92c39" />
      <rect x="196" y="56" width="42" height="20" rx="3" fill="#16303f" />
      <path d="M196 56 h30 l12 12 v8 h-42 z" fill="#22485c" />
      <rect x="40" y="56" width="30" height="30" rx="3" fill="#ffffff" stroke="#d0d9de" strokeWidth="1.5" />
      <path d="M52 60 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 v-6 h6 z" fill="#e63946" />
      <text x="150" y="70" fontFamily="Archivo, sans-serif" fontSize="12" fontWeight="800" fill="#16303f" textAnchor="middle" letterSpacing="1">AMBULANCE</text>
      <rect x="120" y="40" width="70" height="12" rx="4" fill="#20303a" />
      <rect x="124" y="42" width="20" height="8" rx="2" fill="#ff3b47" />
      <rect x="146" y="42" width="18" height="8" rx="2" fill="#f5f7f8" />
      <rect x="166" y="42" width="20" height="8" rx="2" fill="#2f5bff" />
      <rect x="248" y="82" width="12" height="8" rx="2" fill="#ffd166" />
    </svg>
  );
}
