import { defineConfig, Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

function copyStaticPlugin(): Plugin {
  return {
    name: 'copy-static-dirs',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const dirs = ['js', 'css', 'assets'];
      for (const dir of dirs) {
        const src = path.resolve(__dirname, dir);
        const dest = path.resolve(distDir, dir);
        if (fs.existsSync(src)) {
          fs.cpSync(src, dest, { recursive: true });
        }
      }

      // Inject build-time API base URL into dist/js/config.js if provided
      const configDistPath = path.join(distDir, 'js', 'config.js');
      if (fs.existsSync(configDistPath)) {
        const apiUrl = process.env.VITE_API_BASE_URL || '';
        let content = fs.readFileSync(configDistPath, 'utf8');
        content = `window.__API_BASE_URL__ = ${JSON.stringify(apiUrl)};\n` + content;
        fs.writeFileSync(configDistPath, content, 'utf8');
      }

      // Ensure .nojekyll and 404.html exist for seamless GitHub Pages deployment & SPA refresh
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
        const indexHtml = path.join(distDir, 'index.html');
        if (fs.existsSync(indexHtml)) {
          fs.copyFileSync(indexHtml, path.join(distDir, '404.html'));
        }
      }
    }
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  define: {
    '__API_BASE_URL__': JSON.stringify(process.env.VITE_API_BASE_URL || '')
  },
  plugins: [copyStaticPlugin()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
});
