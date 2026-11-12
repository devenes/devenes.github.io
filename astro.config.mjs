import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import fs from 'node:fs';
import path from 'node:path';

function serveAndCopyRootAssets() {
  return {
    name: 'serve-and-copy-root-assets',
    configureServer(server) {
      server.middlewares.use('/assets', (req, res, next) => {
        const cleanUrl = (req.url || '').split('?')[0].replace(/^\/+/, '');
        const filePath = path.resolve(process.cwd(), 'assets', cleanUrl);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
          };
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        next();
      });
      server.middlewares.use('/data/land.json', (_req, res, next) => {
        const landPath = path.resolve(process.cwd(), 'data', 'land.json');
        if (fs.existsSync(landPath)) {
          res.setHeader('Content-Type', 'application/json');
          fs.createReadStream(landPath).pipe(res);
          return;
        }
        next();
      });
    },
    closeBundle() {
      for (const subdir of ['events', 'profile']) {
        const srcDir = path.resolve(process.cwd(), 'assets', subdir);
        const destDir = path.resolve(process.cwd(), 'dist', 'assets', subdir);
        if (fs.existsSync(srcDir)) {
          fs.cpSync(srcDir, destDir, { recursive: true });
        }
      }
      const landSrc = path.resolve(process.cwd(), 'data', 'land.json');
      const landDest = path.resolve(process.cwd(), 'dist', 'data', 'land.json');
      if (fs.existsSync(landSrc)) {
        fs.mkdirSync(path.dirname(landDest), { recursive: true });
        fs.copyFileSync(landSrc, landDest);
      }
    },
  };
}

export default defineConfig({
  site: process.env.SITE_URL || 'https://devenes.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  integrations: [
    tailwind({
      applyBaseStyles: true,
    }),
  ],
  vite: {
    plugins: [serveAndCopyRootAssets()],
    build: {
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            gsap: ['gsap'],
          },
        },
      },
    },
  },
});
