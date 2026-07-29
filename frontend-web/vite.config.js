import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server di :5173. Backend FastAPI diasumsikan di :8000 (lihat src/api.js VITE_API_URL).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
});
