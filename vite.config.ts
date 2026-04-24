import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages deploys to /entropy-edge/; local dev stays at /.
const base = process.env.GITHUB_PAGES === 'true' ? '/entropy-edge/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Rapier3D compat build ships its WASM binary bundled via base64 in the
  // JS module, so no vite-plugin-wasm is needed. Three.js + JollyPixel each
  // contribute ~300-400 KB gzipped, pushing the total past the default
  // 500 KB chunk warning.
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
  },
});
