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
      let apiUrl = (process.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
      if (apiUrl.startsWith('http://') && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1')) {
        apiUrl = apiUrl.replace(/^http:\/\//, 'https://');
      }

      if (fs.existsSync(configDistPath)) {
        let content = fs.readFileSync(configDistPath, 'utf8');
        content = `window.__API_BASE_URL__ = ${JSON.stringify(apiUrl)};\n` + content;
        fs.writeFileSync(configDistPath, content, 'utf8');
      }

      // Ensure .nojekyll, 404.html, and inline base URL exist for GitHub Pages SPA deployment
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
        const indexHtml = path.join(distDir, 'index.html');
        if (fs.existsSync(indexHtml)) {
          let html = fs.readFileSync(indexHtml, 'utf8');
          if (apiUrl && !html.includes('window.__API_BASE_URL__')) {
            html = html.replace(
              '<script src="js/config.js"></script>',
              `<script>window.__API_BASE_URL__ = ${JSON.stringify(apiUrl)};</script>\n  <script src="js/config.js"></script>`
            );
            fs.writeFileSync(indexHtml, html, 'utf8');
          }
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
