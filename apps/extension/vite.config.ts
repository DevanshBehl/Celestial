import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
  },
  // Needed so that the popup can import shared workspace packages
  // without hitting Node.js-only resolution paths.
  resolve: {
    conditions: ['browser', 'import', 'module', 'default'],
  },
});
