import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = fileURLToPath(new URL('../dist', import.meta.url));

export default defineConfig({
  root: frontendRoot,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: outputDir,
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020'
  }
});
