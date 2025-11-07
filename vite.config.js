
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
      'localhost:5000', // pentru rulare locală
      'localhost:3000',
      'edge:5000',
      'client:3000'
//VITE_API_URL=http://edge:5000pentru rulare în container (numele serviciului)
    ],
    cors: true, // 🔓 opțional, dar util dacă faci API calls

  },
});
