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
  // contribute ~300-400 KB gzipped — they lazy-load on CTA via dynamic
  // import of src/render/bridge/bootstrap so the cold landing stays small.
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@dimforge/rapier3d-compat')) return 'rapier';
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/@jolly-pixel')) return 'jollypixel';
          if (id.includes('node_modules/tone')) return 'tone';
          return undefined;
        },
      },
    },
  },
});
