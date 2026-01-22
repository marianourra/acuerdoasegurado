import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Use "/acuerdoasegurado/" for GitHub Pages, "/" for custom domain (default)
  const base = mode === "github" || process.env.VITE_BASE_PATH === "github" 
    ? "/acuerdoasegurado/" 
    : "/";

  return {
    plugins: [react()],
    base,
  };
});
