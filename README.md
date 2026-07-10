# Unswipe

[![CI](https://github.com/blabassi/unswipe/actions/workflows/ci.yml/badge.svg)](https://github.com/blabassi/unswipe/actions/workflows/ci.yml)
[![Pages](https://github.com/blabassi/unswipe/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/blabassi/unswipe/actions/workflows/deploy-pages.yml)

A high-performance, zero-dependency carousel library for the modern web. Unswipe delegates physics, layout, and snapping to native browser APIs — **CSS Scroll Snap** for hardware-accelerated kinetic scrolling and **Intersection Observer** for dynamic accessibility — keeping the core bundle under **2 KB** minified.

**[Docs](https://blabassi.github.io/unswipe/)** — Astro Starlight guide with live carousel playgrounds

## Why Unswipe?

| Concern       | Approach                                                       |
| ------------- | -------------------------------------------------------------- |
| Bundle size   | Core &lt; 2 KB minified, no runtime dependencies               |
| Physics       | Native compositor scrolling — no `requestAnimationFrame` loops |
| Layout        | Variable-width, asymmetrical slides via flexbox + scroll-snap  |
| Accessibility | Automatic `role`, `aria-hidden`, `tabindex` via IO             |
| Extensibility | Tree-shakeable plugins for autoplay, nav, pagination           |

## Install

```bash
npm install unswipe
```

Or use a CDN / copy `dist/unswipe.js` directly.

## Quick start

```html
<div id="carousel">
  <div>Slide 1</div>
  <div>Slide 2</div>
  <div>Slide 3</div>
</div>

<script type="module">
  import { Unswipe } from 'unswipe';

  const slider = new Unswipe(document.getElementById('carousel'), {
    align: 'start', // 'start' | 'center' | 'end'
    axis: 'x', // 'x' | 'y'
    label: 'Featured', // aria-label
    threshold: 0.5, // IO visibility threshold
    behavior: 'smooth', // programmatic scroll behavior
  });

  slider.on('select', ({ index, slide }) => {
    console.log('Active:', index, slide);
  });
</script>
```

Slides default to **direct children** of the root element. Use the `slide` option to target a custom selector.

## API

### `new Unswipe(root, options?, plugins?)`

Returns a `Slider` instance.

### Control methods

| Method                            | Description                                              |
| --------------------------------- | -------------------------------------------------------- |
| `next()`                          | Scroll to the next slide                                 |
| `prev()`                          | Scroll to the previous slide                             |
| `scrollToIndex(index, behavior?)` | Scroll to a specific slide                               |
| `update()`                        | Re-scan DOM after slides are added or removed            |
| `destroy()`                       | Disconnect observers, tear down plugins, clear listeners |

### Properties

| Property | Type            | Description            |
| -------- | --------------- | ---------------------- |
| `root`   | `HTMLElement`   | Carousel container     |
| `slides` | `HTMLElement[]` | Current slide elements |
| `index`  | `number`        | Active slide index     |

### Events

```ts
slider.on('select', ({ index, slide }) => {
  /* ... */
});
slider.on('update', () => {
  /* DOM mutated */
});
```

All handlers return an unsubscribe function.

## Plugins

Plugins implement the `SliderPlugin` interface and ship as separate entry points so they never bloat the core.

```ts
import { Unswipe } from 'unswipe';
import { autoplay } from 'unswipe/plugins/autoplay';
import { drag } from 'unswipe/plugins/drag';
import { navigation } from 'unswipe/plugins/navigation';
import { pagination } from 'unswipe/plugins/pagination';

const slider = new Unswipe(root, options, [
  drag(),
  navigation(),
  pagination(),
  autoplay({ delay: 5000, pauseOnHover: true }),
]);
```

| Plugin       | Import                       | Purpose                                       |
| ------------ | ---------------------------- | --------------------------------------------- |
| `drag`       | `unswipe/plugins/drag`       | Mouse/pen drag-to-scroll (touch stays native) |
| `autoplay`   | `unswipe/plugins/autoplay`   | Interval advance with pause-on-interact       |
| `navigation` | `unswipe/plugins/navigation` | Prev/next controls                            |
| `pagination` | `unswipe/plugins/pagination` | Dot indicators                                |

### Writing a plugin

```ts
import type { SliderPlugin } from 'unswipe';

export function myPlugin(): SliderPlugin {
  return {
    name: 'my-plugin',
    init(slider) {
      slider.on('select', ({ index }) => console.log(index));
    },
    destroy(slider) {
      // cleanup
    },
  };
}
```

## Accessibility

Unswipe automatically applies:

- `role="carousel"` on the root
- `aria-roledescription="slide"` on each slide
- Dynamic `aria-hidden` and `tabindex="-1"` on off-screen slides
- `aria-label` with position (`"2 of 5"`)

Provide a descriptive `label` option for screen-reader context.

## Dynamic slides

```ts
carousel.appendChild(newSlide);
slider.update(); // re-observes slides, preserves tracking
```

## Development

Requires [pnpm](https://pnpm.io/) 11+ (`corepack enable` on Node 22).

```bash
pnpm install
pnpm run ci             # format + lint + typecheck + build + test + docs site
pnpm test               # vitest unit tests (core, plugins, bundle budget)
pnpm run docs:dev       # Astro Starlight docs at http://localhost:4321/unswipe/
pnpm run preview:site   # production docs build at http://localhost:4173/unswipe/
pnpm run lint
pnpm run format
pnpm run build          # library + size check only
pnpm run typecheck
```

Docs live in [`docs/`](docs/) (Astro Starlight). Edit MDX under `docs/src/content/docs/` and live playground components under `docs/src/components/`.

This repo is a **pnpm workspace**: the library at the root and the `docs` package share one lockfile (`pnpm-lock.yaml`).

### CI/CD

| Workflow                                                 | Trigger             | Purpose                                                                                |
| -------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| [`ci.yml`](.github/workflows/ci.yml)                     | Push & PR to `main` | Format, lint, typecheck, build, Vitest, Starlight build, responsive + framework audits |
| [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) | Push to `main`      | Build Starlight site artifact and deploy to GitHub Pages                               |

### GitHub Pages

The Starlight docs site deploys via **GitHub Actions** on every push to `main` that changes docs or library source. Built artifacts live in `site/` during CI only — they are not committed to the repository.

**One-time setup:** In the repository **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**.

| URL                                          | Page                       |
| -------------------------------------------- | -------------------------- |
| https://blabassi.github.io/unswipe/          | Starlight docs             |
| https://blabassi.github.io/unswipe/docs.html | Redirects to docs (legacy) |

To preview locally:

```bash
pnpm run docs:dev
# or
pnpm run preview:site
```

## License

MIT
