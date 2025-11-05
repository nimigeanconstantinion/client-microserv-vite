
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/ui',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/ui/', // ✅ frontendul e servit sub /ui prin gateway
  server: {
    host: '0.0.0.0', // ✅ merge în container și local
    port: 3000,
    allowedHosts: [
      'localhost', // pentru rulare locală
      'client',    // pentru rulare în container (numele serviciului)
    ],
    cors: true, // 🔓 opțional, dar util dacă faci API calls
  },
}) ;
//   build: {
//     outDir: 'dist/ui',
//     emptyOutDir: true
//   },
//   resolve: {
//     alias: {
//       '@': path.resolve( __dirname, './src'),
//     },
//   },
//   server: {
//     port: 3000,     // 👈 Portul dorit
//     open: true,
//     host:true// opțional, deschide browserul automat
//   },
// });
