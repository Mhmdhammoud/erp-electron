import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            format: 'cjs',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        entry: 'src/preload/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            format: 'cjs',
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@/components': path.resolve(__dirname, './src/renderer/components'),
      '@/pages': path.resolve(__dirname, './src/renderer/pages'),
      '@/hooks': path.resolve(__dirname, './src/renderer/hooks'),
      '@/store': path.resolve(__dirname, './src/renderer/store'),
      '@/graphql': path.resolve(__dirname, './src/renderer/graphql'),
      '@/utils': path.resolve(__dirname, './src/renderer/utils'),
      '@/types': path.resolve(__dirname, './src/renderer/types'),
      '@/lib': path.resolve(__dirname, './src/renderer/lib'),
    },
  },
  server: {
    port: 5173,
  },
});
