import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import catppuccin from '@catppuccin/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://blabassi.github.io',
  base: '/unswipe',
  outDir: '../site',
  integrations: [
    starlight({
      title: 'Unswipe',
      description: 'Zero-dependency carousel powered by CSS Scroll Snap.',
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
      plugins: [
        catppuccin({
          dark: { flavor: 'mocha' },
          light: { flavor: 'latte' },
        }),
      ],
      sidebar: [
        { label: 'Home', slug: '' },
        {
          label: 'Get Started',
          items: [
            { label: 'Overview', slug: 'get-started' },
            { label: 'Module', slug: 'get-started/module' },
            { label: 'React', slug: 'get-started/react' },
            { label: 'Vue', slug: 'get-started/vue' },
            { label: 'Svelte', slug: 'get-started/svelte' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Overview', slug: 'guides' },
            { label: 'How Unswipe works', slug: 'guides/how-unswipe-works' },
            { label: 'Required setup', slug: 'guides/required-setup' },
            { label: 'Slide sizes', slug: 'guides/slide-sizes' },
            { label: 'Slide gaps', slug: 'guides/slide-gaps' },
            { label: 'Alignments', slug: 'guides/alignments' },
            { label: 'Grouping slides', slug: 'guides/grouping-slides' },
            {
              label: 'Previous and next buttons',
              slug: 'guides/previous-and-next-buttons',
            },
            { label: 'Dot buttons', slug: 'guides/dot-buttons' },
            { label: 'Accessibility', slug: 'guides/accessibility' },
            { label: 'Compared to Embla', slug: 'guides/compared-to-embla' },
          ],
        },
        {
          label: 'API',
          items: [
            { label: 'Overview', slug: 'api' },
            { label: 'Options', slug: 'api/options' },
            { label: 'Methods', slug: 'api/methods' },
            { label: 'Events', slug: 'api/events' },
            { label: 'Plugins', slug: 'api/plugins' },
          ],
        },
        {
          label: 'Plugins',
          items: [
            { label: 'Overview', slug: 'plugins' },
            { label: 'Drag', slug: 'plugins/drag' },
            { label: 'Loop', slug: 'plugins/loop' },
            { label: 'Autoplay', slug: 'plugins/autoplay' },
            { label: 'Auto scroll', slug: 'plugins/auto-scroll' },
            { label: 'Navigation', slug: 'plugins/navigation' },
            { label: 'Pagination', slug: 'plugins/pagination' },
            { label: 'Class names', slug: 'plugins/class-names' },
            { label: 'Wheel', slug: 'plugins/wheel' },
            { label: 'Fade', slug: 'plugins/fade' },
            { label: 'Slides per view', slug: 'plugins/slides-per-view' },
          ],
        },
        {
          label: 'Examples',
          items: [
            { label: 'Overview', slug: 'examples' },
            { label: 'Playground', slug: 'examples/playground' },
          ],
        },
      ],
      customCss: ['../src/style.css', './src/styles/carousel.css'],
    }),
  ],
});
