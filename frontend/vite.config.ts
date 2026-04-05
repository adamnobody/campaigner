import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('reactflow') || id.includes('@reactflow')) return 'reactflow';
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
          if (id.includes('react-router')) return 'router';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules\\react-dom')) return 'react-core';
          if (id.includes('node_modules/react/') || id.includes('node_modules\\react\\')) return 'react-core';
          if (id.includes('scheduler')) return 'react-core';
          if (id.includes('@dnd-kit')) return 'dnd';
          if (id.includes('dagre')) return 'dagre';
          // Markdown stack stays in vendor: a separate chunk caused Rollup
          // "markdown <-> vendor" circular chunk warnings with the default bucket.
          if (id.includes('axios') || id.includes('zustand') || id.includes('zod')) return 'app-utils';
          return 'vendor';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@campaigner/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});