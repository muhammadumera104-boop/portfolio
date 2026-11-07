import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Renders the page body from src/data/content.js into index.html at build time
// (and on every request in dev), replacing the <!--app--> placeholder.
function renderContent() {
  let server;
  return {
    name: 'render-content',
    configureServer(s) {
      server = s;
    },
    async transformIndexHtml(html) {
      if (!html.includes('<!--app-->')) return html; // blog, post and admin pages build their own DOM
      const mod = server
        ? await server.ssrLoadModule('/src/render/index.js')
        : await import('./src/render/index.js');
      return html.replace('<!--app-->', mod.render());
    },
    handleHotUpdate({ file, server: s }) {
      if (/[\\/]src[\\/](data|render)[\\/]/.test(file)) s.ws.send({ type: 'full-reload' });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [renderContent()],
  build: {
    // Four pages: home (rendered at build time), blog list, single post, admin dashboard.
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        blog: resolve(import.meta.dirname, 'blog.html'),
        post: resolve(import.meta.dirname, 'post.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
  test: { include: ['tests/**/*.test.js'], environment: 'node' },
});
