import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Builds the Chrome extension into dist/: load that folder with
// chrome://extensions → "Load unpacked". Files in public/ (manifest, icons)
// are copied as-is.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // Defuddle's self-contained browser bundle, injected into pages by chrome.scripting.
      name: 'vendor-defuddle',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'vendor/defuddle.js',
          source: fs.readFileSync(path.resolve(import.meta.dirname, 'node_modules/defuddle/dist/index.full.js'), 'utf8'),
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome116',
    rolldownOptions: {
      input: {
        sidepanel: path.resolve(import.meta.dirname, 'sidepanel.html'),
        background: path.resolve(import.meta.dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
});
