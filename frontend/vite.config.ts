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
      // Ensure .nojekyll exists for GitHub Pages deployment
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
      }
    }
  };
}

export default defineConfig({
  base: './',
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
