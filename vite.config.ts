/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

// `npm run build`        → dist/ (Capacitor 앱 패키징용, 여러 파일)
// `npm run build:single` → dist-single/index.html (링크 공유용 단일 파일)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { chunkSizeWarningLimit: 2000, outDir: mode === 'single' ? 'dist-single' : 'dist', assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
}));
