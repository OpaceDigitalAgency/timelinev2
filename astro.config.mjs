import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

export default defineConfig({
  integrations: [
    tailwind(),
    react(),
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