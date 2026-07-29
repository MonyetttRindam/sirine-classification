// Data contoh (dari desain) — dipakai untuk chip contoh & fallback saat backend mati.
// Setiap contoh menunjuk ke file .wav di public/samples/ agar bisa dikirim ke /predict.

export const SAMPLES = {
  ambulans: {
    key: "ambulans", label: "Ambulans", dur: "0:04", file: "/samples/contoh_ambulance.wav", ood: 0.94,
    d1: [{ n: "Ambulance", v: 0.91 }, { n: "Police", v: 0.06 }, { n: "Firetruck", v: 0.03 }],
    d2: [{ n: "Ambulance", v: 0.88 }, { n: "Police", v: 0.05 }, { n: "Firetruck", v: 0.03 }, { n: "Traffic", v: 0.04 }],
  },
  polisi: {
    key: "polisi", label: "Polisi", dur: "0:06", file: "/samples/contoh_police.wav", ood: 0.91,
    d1: [{ n: "Ambulance", v: 0.08 }, { n: "Police", v: 0.86 }, { n: "Firetruck", v: 0.06 }],
    d2: [{ n: "Ambulance", v: 0.07 }, { n: "Police", v: 0.82 }, { n: "Firetruck", v: 0.05 }, { n: "Traffic", v: 0.06 }],
  },
  damkar: {
    key: "damkar", label: "Damkar", dur: "0:05", file: "/samples/contoh_firetruck.wav", ood: 0.89,
    d1: [{ n: "Ambulance", v: 0.05 }, { n: "Police", v: 0.10 }, { n: "Firetruck", v: 0.85 }],
    d2: [{ n: "Ambulance", v: 0.05 }, { n: "Police", v: 0.08 }, { n: "Firetruck", v: 0.81 }, { n: "Traffic", v: 0.06 }],
  },
  lalulintas: {
    key: "lalulintas", label: "Lalu lintas", dur: "0:08", file: "/samples/contoh_traffic.wav", ood: 0.12,
    d1: [{ n: "Ambulance", v: 0.14 }, { n: "Police", v: 0.11 }, { n: "Firetruck", v: 0.09 }],
    d2: [{ n: "Ambulance", v: 0.05 }, { n: "Police", v: 0.04 }, { n: "Firetruck", v: 0.03 }, { n: "Traffic", v: 0.88 }],
  },
};

export const SEED_HISTORY = [
  { time: "23:57", src: "Upload", d1: "Ambulance · 0.91", d2: "Ambulance · 0.88", ood: "0.94", status: "ALERT" },
  { time: "23:41", src: "Streaming", d1: "Police · 0.86", d2: "Police · 0.82", ood: "0.91", status: "ALERT" },
  { time: "23:20", src: "Mic", d1: "Firetruck · 0.85", d2: "Firetruck · 0.81", ood: "0.89", status: "ALERT" },
  { time: "22:58", src: "Upload", d1: "Ambulance · 0.14", d2: "Traffic · 0.88", ood: "0.12", status: "AMAN" },
  { time: "22:33", src: "Streaming", d1: "Ambulance · 0.79", d2: "Ambulance · 0.74", ood: "0.83", status: "ALERT" },
  { time: "22:10", src: "Upload", d1: "Police · 0.22", d2: "Traffic · 0.71", ood: "0.19", status: "AMAN" },
];

// Bar batang waveform (dekoratif) — ketinggian tetap agar konsisten dgn desain.
export const WF_BARS = [14,26,8,36,20,4,30,16,40,10,24,6,32,18,38,12,22,4,28,14,34,8,20,4,26,12,36,10,18,6,24,14,32,8];
