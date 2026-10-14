import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react()],
    base: (env.VITE_BASE_PATH || '/').replace(/\/*$/, '/'),
    server: {
      port: 5173,
      strictPort: true,
      // Preserve the browser-facing Host so the API's origin check also works in development.
      proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false } },
    },
  };
});
