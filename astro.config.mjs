import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [
    tailwind(),
    react(),
    sitemap({
      filter: (page) => {
        // Exclude filter pages with query parameters
        return !page.includes('?') &&
               !page.includes('/filter/') &&
               !page.match(/\/(era|origin|beliefs|status)\/.*\/$/);
      },
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date()
    }),
  ],
  site: 'https://evolution-of-religion.netlify.app',
  output: 'hybrid',
  adapter: netlify(),
  vite: {
    build: {
      rollupOptions: {
        external: [
          'src/components/EditableSection',
          'src/components/EditableSection.tsx',
          './src/components/EditableSection',
          './src/components/EditableSection.tsx'
        ]
      }
    }
  },
});