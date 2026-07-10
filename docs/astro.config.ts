import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://blabassi.github.io',
  base: '/unswipe',
  outDir: '../site',
  integrations: [
    starlight({
      title: 'Unswipe',
      description:
        'Zero-dependency carousel powered by CSS Scroll Snap and Intersection Observer.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/blabassi/unswipe',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/blabassi/unswipe/edit/main/docs/',
      },
      sidebar: [
        { label: 'Introduction', slug: '' },
        {
          label: 'Guides',
          items: [
            { label: 'Getting started', slug: 'guides/getting-started' },
            { label: 'Live playground', slug: 'guides/playground' },
            { label: 'Plugins', slug: 'guides/plugins' },
            { label: 'Frameworks', slug: 'guides/frameworks' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API', slug: 'reference/api' },
            { label: 'Accessibility', slug: 'reference/accessibility' },
          ],
        },
      ],
      customCss: ['./src/styles/carousel.css'],
    }),
  ],
});
