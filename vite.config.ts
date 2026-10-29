import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE_URL?.trim();
    if (!apiUrl) throw new Error('VITE_API_BASE_URL is required for a production build.');
    const parsed = new URL(apiUrl);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.search || parsed.hash
      || !['', '/', '/api', '/api/'].includes(parsed.pathname)) {
      throw new Error('VITE_API_BASE_URL must be an HTTP(S) origin, optionally ending in /api.');
    }
  }
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
