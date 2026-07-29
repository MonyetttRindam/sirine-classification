import { WF_BARS } from "../data.js";

// Waveform dekoratif (bar batang) — meniru simbol #wf pada desain.
export default function Waveform({ color = "var(--blue)", height = 40 }) {
  return (
    <svg viewBox="0 0 240 44" preserveAspectRatio="none" style={{ width: "100%", height, color, display: "block" }}>
      <g fill="currentColor">
        {WF_BARS.map((h, i) => (
          <rect key={i} x={2 + i * 7} y={(44 - h) / 2} width="3" height={h} rx="1.5" />
        ))}
      </g>
    </svg>
  );
}
