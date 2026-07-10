import { Unswipe } from './assets/unswipe.js';
import { autoplay } from './assets/plugins/autoplay.js';
import { drag } from './assets/plugins/drag.js';
import { navigation } from './assets/plugins/navigation.js';
import { pagination } from './assets/plugins/pagination.js';

function setCode(id, code) {
  const el = document.getElementById(id);
  if (el) el.textContent = code;
}

function logEvent(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  const line = document.createElement('div');
  line.textContent = message;
  el.prepend(line);
  while (el.children.length > 4) el.lastChild?.remove();
}

// Quick start
{
  const root = document.getElementById('ex-quick');
  if (root) {
    const slider = new Unswipe(root, {
      align: 'start',
      label: 'Featured products',
      threshold: 0.5,
    });
    slider.on('select', ({ index }) => {
      const status = document.getElementById('ex-quick-status');
      if (status) status.textContent = `Active slide: ${index + 1}`;
    });
  }
}

// Full-featured demo (plugins + variable width)
{
  const root = document.getElementById('ex-featured');
  if (root) {
    const slider = new Unswipe(
      root,
      { align: 'start', label: 'Featured items', threshold: 0.6 },
      [drag(), navigation(), pagination(), autoplay({ delay: 4500 })],
    );
    slider.on('select', ({ index }) => {
      const status = document.getElementById('ex-featured-status');
      if (status)
        status.textContent = `Active slide: ${index + 1} of ${slider.slides.length}`;
    });
    document
      .getElementById('ex-featured-add')
      ?.addEventListener('click', () => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.textContent = `Slide ${root.children.length + 1}`;
        root.append(slide);
        slider.update();
      });
    document
      .getElementById('ex-featured-remove')
      ?.addEventListener('click', () => {
        if (slider.slides.length <= 1) return;
        slider.slides[slider.slides.length - 1]?.remove();
        slider.update();
      });
  }
}

// Alignment
{
  const root = document.getElementById('ex-align');
  const codeId = 'ex-align-code';
  if (root) {
    let align = 'start';
    const slider = new Unswipe(root, { align, label: 'Alignment demo' });

    const render = () => {
      setCode(
        codeId,
        `new Unswipe(root, {
  align: '${align}',
  label: 'Alignment demo',
});`,
      );
    };

    document.querySelectorAll('[data-align]').forEach((btn) => {
      btn.addEventListener('click', () => {
        align = btn.getAttribute('data-align') ?? 'start';
        document.querySelectorAll('[data-align]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        for (const slide of slider.slides) {
          slide.style.scrollSnapAlign = align;
        }
        render();
      });
    });

    render();
  }
}

// Events
{
  const root = document.getElementById('ex-events');
  const logId = 'ex-events-log';
  if (root) {
    const slider = new Unswipe(root, { label: 'Events demo' });
    slider.on('select', ({ index, slide }) => {
      logEvent(
        logId,
        `select → index: ${index}, slide: "${slide.textContent}"`,
      );
    });
    slider.on('update', () => {
      logEvent(logId, 'update → slides re-scanned');
    });
  }
}

// Mutations
{
  const root = document.getElementById('ex-mutate');
  const codeId = 'ex-mutate-code';
  if (root) {
    let count = root.children.length;
    const slider = new Unswipe(root, { label: 'Mutable carousel' });

    const render = () => {
      setCode(
        codeId,
        `const slide = document.createElement('div');
slide.className = 'slide';
slide.textContent = 'Slide ${count}';
root.appendChild(slide);
slider.update();`,
      );
    };

    document.getElementById('ex-mutate-add')?.addEventListener('click', () => {
      count += 1;
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.textContent = `Slide ${count}`;
      root.append(slide);
      slider.update();
      render();
    });

    document
      .getElementById('ex-mutate-remove')
      ?.addEventListener('click', () => {
        if (slider.slides.length <= 1) return;
        slider.slides[slider.slides.length - 1]?.remove();
        slider.update();
        render();
      });

    render();
  }
}

// Vertical
{
  const root = document.getElementById('ex-vertical');
  if (root) {
    const slider = new Unswipe(root, {
      axis: 'y',
      align: 'start',
      label: 'Timeline',
    });
    void slider;
  }
}

// Custom selector
{
  const root = document.getElementById('ex-selector');
  if (root) {
    const slider = new Unswipe(root, {
      slide: '.article-slide',
      label: 'Articles',
    });
    void slider;
  }
}

// Programmatic API
{
  const root = document.getElementById('ex-api');
  const status = document.getElementById('ex-api-status');
  if (root) {
    const slider = new Unswipe(root, { label: 'API controls' });
    slider.on('select', ({ index }) => {
      if (status) status.textContent = `slider.index === ${index}`;
    });
    document.getElementById('ex-api-prev')?.addEventListener('click', () => {
      slider.prev();
    });
    document.getElementById('ex-api-next')?.addEventListener('click', () => {
      slider.next();
    });
    document.getElementById('ex-api-jump')?.addEventListener('click', () => {
      slider.scrollToIndex(2, 'smooth');
    });
  }
}

// Web Component demo
{
  class UnswipeCarousel extends HTMLElement {
    #slider;
    #off;

    connectedCallback() {
      this.classList.add('carousel');
      this.#slider = new Unswipe(this, {
        label: this.getAttribute('label') ?? 'Carousel',
        align: 'start',
        threshold: 0.5,
      });
      const status = document.getElementById('ex-wc-status');
      const sync = () => {
        if (!status || !this.#slider) return;
        status.textContent = `Active slide: ${this.#slider.index + 1} of ${this.#slider.slides.length}`;
      };
      sync();
      this.#off = this.#slider.on('select', sync);
    }

    disconnectedCallback() {
      this.#off?.();
      this.#slider?.destroy();
      this.#off = undefined;
      this.#slider = undefined;
    }
  }

  if (!customElements.get('unswipe-carousel')) {
    customElements.define('unswipe-carousel', UnswipeCarousel);
  }
}

function mountCarouselPreview(host, slides, label) {
  const root = document.createElement('div');
  root.className = 'carousel';
  for (const text of slides) {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.textContent = text;
    root.append(slide);
  }
  host.replaceChildren(root);

  const slider = new Unswipe(root, {
    label,
    align: 'start',
    threshold: 0.5,
  });
  return { root, slider };
}

function bindStatus(slider, statusId, suffix = '') {
  const status = document.getElementById(statusId);
  if (!status) return;
  const sync = () => {
    status.textContent = `Active slide: ${slider.index + 1} of ${slider.slides.length}${suffix}`;
  };
  sync();
  slider.on('select', sync);
}

// React live demo (CDN mount with offline fallback)
{
  const host = document.getElementById('ex-react');
  if (host) {
    const slides = ['React slide 1', 'React slide 2', 'React slide 3'];
    const label = 'React carousel';

    const fallback = () => {
      const { slider } = mountCarouselPreview(host, slides, label);
      bindStatus(slider, 'ex-react-status', ' · preview');
    };

    import('https://esm.sh/react@18.3.1')
      .then(async (React) => {
        const { createRoot } =
          await import('https://esm.sh/react-dom@18.3.1/client');
        const { useEffect, useRef } = React;

        function Carousel() {
          const ref = useRef(null);

          useEffect(() => {
            const root = ref.current;
            if (!root) return undefined;
            const slider = new Unswipe(root, {
              label,
              align: 'start',
              threshold: 0.5,
            });
            bindStatus(slider, 'ex-react-status', ' · React');
            return () => slider.destroy();
          }, []);

          return React.createElement(
            'div',
            { ref, className: 'carousel' },
            slides.map((text) =>
              React.createElement(
                'div',
                { key: text, className: 'slide' },
                text,
              ),
            ),
          );
        }

        createRoot(host).render(React.createElement(Carousel));
      })
      .catch(fallback);
  }
}

// Vue 3 live demo (CDN mount with offline fallback)
{
  const host = document.getElementById('ex-vue');
  if (host) {
    const slides = ['Vue slide 1', 'Vue slide 2', 'Vue slide 3'];
    const label = 'Vue carousel';

    const fallback = () => {
      const { slider } = mountCarouselPreview(host, slides, label);
      bindStatus(slider, 'ex-vue-status', ' · preview');
    };

    import('https://esm.sh/vue@3.5.13')
      .then(({ createApp, h, onMounted, onUnmounted, ref }) => {
        createApp({
          setup() {
            const root = ref(null);
            let slider;

            onMounted(() => {
              if (!root.value) return;
              slider = new Unswipe(root.value, {
                label,
                align: 'start',
                threshold: 0.5,
              });
              bindStatus(slider, 'ex-vue-status', ' · Vue');
            });

            onUnmounted(() => slider?.destroy());

            return () =>
              h(
                'div',
                { ref: root, class: 'carousel' },
                slides.map((text) =>
                  h('div', { class: 'slide', key: text }, text),
                ),
              );
          },
        }).mount(host);
      })
      .catch(fallback);
  }
}

// Svelte live demo — same Unswipe mount the snippet uses (no Svelte compiler in-browser)
{
  const host = document.getElementById('ex-svelte');
  if (host) {
    const { slider } = mountCarouselPreview(
      host,
      ['Svelte A', 'Svelte B', 'Svelte C'],
      'Svelte carousel',
    );
    bindStatus(slider, 'ex-svelte-status', ' · preview');
  }
}

// Highlight active TOC link on scroll
{
  const links = document.querySelectorAll('.toc a');
  const sections = [...links]
    .map((a) => a.getAttribute('href'))
    .filter((href) => href)
    .map((href) => document.querySelector(href))
    .filter(Boolean);
  const visible = new Map();

  const setActive = (section) => {
    const id = `#${section.id}`;
    links.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === id);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visible.set(
          entry.target,
          entry.isIntersecting ? entry.intersectionRatio : 0,
        );
      }

      let best = null;
      let bestRatio = 0;
      for (const section of sections) {
        const ratio = visible.get(section) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = section;
        }
      }

      if (best) setActive(best);
    },
    {
      rootMargin: '-20% 0px -55% 0px',
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    },
  );

  sections.forEach((section) => observer.observe(section));

  document.querySelector('.toc')?.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    const section = href ? document.querySelector(href) : null;
    if (!section) return;

    event.preventDefault();
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', href);
    setActive(section);
  });
}
