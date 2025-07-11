import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@devhelpr/react-forms': path.resolve(
        __dirname,
        'libs/react-forms/src/index.ts'
      ),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        vanilla: 'vanilla.html',
      },
    },
  },
});
