# Unswipe

[![CI](https://github.com/blabassi/unswipe/actions/workflows/ci.yml/badge.svg)](https://github.com/blabassi/unswipe/actions/workflows/ci.yml)
[![Pages](https://github.com/blabassi/unswipe/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/blabassi/unswipe/actions/workflows/deploy-pages.yml)

A high-performance, zero-dependency carousel library for the modern web. Unswipe delegates physics, layout, and snapping to native browser APIs — **CSS Scroll Snap** for hardware-accelerated kinetic scrolling — while a lean plugin host brings Embla-level features (loop, drag-free, breakpoints, rich events) without bloating the core.

**[Docs](https://blabassi.github.io/unswipe/)** — Astro Starlight guide with live carousel playgrounds

## Why Unswipe?

| Concern       | Approach                                                         |
| ------------- | ---------------------------------------------------------------- |
| Bundle size   | Core ≈ 8 KB minified (~3 KB gzip), no runtime dependencies       |
| Physics       | Native compositor scrolling — no `requestAnimationFrame` loops   |
| Layout        | Variable-width, asymmetrical slides via flexbox + scroll-snap    |
| Accessibility | Automatic `role`, `aria-hidden`, `tabindex` from scroll position |
| Extensibility | Tree-shakeable plugins (loop, drag, autoplay, nav, fade, …)      |

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
  import { drag } from 'unswipe/plugins/drag';
  import { loop } from 'unswipe/plugins/loop';

  const slider = new Unswipe(
    document.getElementById('carousel'),
    {
      align: 'start',
      axis: 'x',
      label: 'Featured',
      slidesToScroll: 1,
      dragFree: false,
    },
    [loop(), drag()],
  );

  slider.on('select', ({ index, slide }) => {
    console.log('Active:', index, slide);
  });
</script>
```

Slides default to **direct children** of the root element. Use the `slide` option to target a custom selector.

## Styles (optional)

```js
import 'unswipe/style.css';
```

Visible slide count is **CSS** (Embla-style). With the stylesheet:

```css
[aria-roledescription='carousel'] {
  --unswipe-slide-min-width: calc((100% - 2 * var(--unswipe-gap)) / 3);
}
```

Prefer a JS helper? Use the optional plugin:

```js
import { slidesPerView } from 'unswipe/plugins/slidesPerView';
new Unswipe(root, { slidesToScroll: 3 }, [slidesPerView(3)]);
```

Full tables: [Options](https://blabassi.github.io/unswipe/api/options/) · [Slide sizes](https://blabassi.github.io/unswipe/guides/slide-sizes/).

## Plugins

| Plugin          | Import                          | Purpose                               |
| --------------- | ------------------------------- | ------------------------------------- |
| `loop`          | `unswipe/plugins/loop`          | Infinite scroll via clones + teleport |
| `drag`          | `unswipe/plugins/drag`          | Mouse/pen drag-to-scroll              |
| `autoplay`      | `unswipe/plugins/autoplay`      | Interval advance                      |
| `autoScroll`    | `unswipe/plugins/autoScroll`    | Continuous scroll                     |
| `navigation`    | `unswipe/plugins/navigation`    | Prev/next controls                    |
| `pagination`    | `unswipe/plugins/pagination`    | Dot indicators                        |
| `classNames`    | `unswipe/plugins/classNames`    | Selected / in-view classes            |
| `wheel`         | `unswipe/plugins/wheel`         | Vertical wheel → horizontal scroll    |
| `fade`          | `unswipe/plugins/fade`          | Opacity crossfade                     |
| `slidesPerView` | `unswipe/plugins/slidesPerView` | Equal-width slides from JS            |

## Frameworks

```ts
import { useUnswipe } from 'unswipe/react';
import { useUnswipe } from 'unswipe/vue';
import { unswipe } from 'unswipe/svelte';
```

## API highlights

- Options: `align`, `axis`, `direction`, `slidesToScroll`, `snap`, `dragFree`, `containScroll`, `skipSnaps`, `breakpoints`, …
- Methods: `next`, `prev`, `scrollToIndex`, `reInit`, `canScrollNext`, `scrollProgress`, `slidesInView`, `plugins`
- Events: `init`, `select`, `scroll`, `settle`, `resize`, `pointerDown`, `pointerUp`, `reInit`, `update`, `destroy`

See the [docs](https://blabassi.github.io/unswipe/) and [Compared to Embla](https://blabassi.github.io/unswipe/guides/compared-to-embla/) guide.

## Development

Requires [pnpm](https://pnpm.io/) 11+ (`corepack enable` on Node 22).

```bash
pnpm install
pnpm run ci             # format + lint + typecheck + build + coverage + docs site
pnpm test               # vitest unit tests
pnpm run docs:dev       # Astro Starlight docs
```

## License

MIT
