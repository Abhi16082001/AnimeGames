// @ts-check
import { defineConfig } from 'astro/config';
import { site } from './src/config.ts';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: site.url,
  vite: {
    plugins: [tailwindcss()]
  }
});
