
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // base: '/ui/',   // asta spune Vite să servească toate resursele sub /ui/
  build: {
    outDir: 'dist/ui',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve( __dirname, './src'),
    },
  },
  server: {
    port: 3000,     // 👈 Portul dorit
    open: true,
    host:true,// opțional, deschide browserul automat
    allowedHosts: [
      'localhost', // pentru rulare locală
      '127.0.0.1',
      'edge',
      'client'// pentru rulare în container (numele serviciului)
    ],
    cors: true, // 🔓 opțional, dar util dacă faci API calls

  },
});
