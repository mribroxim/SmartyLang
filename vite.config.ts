import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'node:fs';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss(), process.env.ANALYZE ? {
      // ANALYZE=1 npm run build: list the biggest modules in the largest chunks.
      name: 'chunk-report',
      generateBundle(_opts: unknown, bundle: Record<string, { type: string; code?: string; modules?: Record<string, { renderedLength: number }> }>) {
        const chunks = Object.entries(bundle).filter(([, c]) => c.type === 'chunk').sort((a, b) => (b[1].code?.length ?? 0) - (a[1].code?.length ?? 0)).slice(0, 3);
        for (const [name, c] of chunks) {
          console.log(`
${name} ${Math.round((c.code?.length ?? 0) / 1024)} KB`);
          Object.entries(c.modules ?? {}).sort((a, b) => b[1].renderedLength - a[1].renderedLength).slice(0, 15)
            .forEach(([id, m]) => console.log(`  ${Math.round(m.renderedLength / 1024)} KB  ${id.replace(process.cwd(), '')}`));
        }
      },
    } : null, {
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
      host: process.env.HOST,
      hmr: process.env.DISABLE_HMR !== 'true',
      fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.tmp-local-demo/**'] },
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
