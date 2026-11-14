import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'node:fs';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss(), {
      name: 'exclude-local-translation-backups',
      closeBundle() {
        const packs = path.resolve('dist/data/lang-packs');
        if (!fs.existsSync(packs)) return;
        for (const entry of fs.readdirSync(packs, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const backup = path.join(packs, entry.name, 'level-texts.pre-bulk-mt-backup.json');
          if (fs.existsSync(backup)) fs.unlinkSync(backup);
        }
      },
    }],
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            // React + recharts + d3 + motion must share a chunk (recharts init).
            if (id.includes('node_modules')) {
              return 'vendor-misc';
            }
          },
        },
      },
    },
  };
});
