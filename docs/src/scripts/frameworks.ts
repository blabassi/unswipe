import Unswipe from '../../../src/slider';

/** Run `fn` once the element has a visible layout box (e.g. Starlight tab panels). */
function whenVisible(el: HTMLElement, fn: () => void) {
  if (el.getClientRects().length > 0) {
    fn();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting && e.intersectionRatio > 0)) {
        return;
      }
      io.disconnect();
      fn();
    },
    { threshold: 0.01 },
  );
  io.observe(el);
}

class UnswipeCarousel extends HTMLElement {
  #slider: Unswipe | undefined;
  #off: (() => void) | undefined;
  #started = false;

  connectedCallback() {
    this.classList.add('carousel');
    // Tab panels are often `hidden` on connect — wait until visible so flex/% sizes work.
    whenVisible(this, () => this.#mount());
  }

  #mount() {
    if (this.#started) return;
    this.#started = true;
    this.#slider = new Unswipe(this, {
      label: this.getAttribute('label') ?? 'Carousel',
      align: 'start',
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
    this.#slider = undefined;
    this.#off = undefined;
    this.#started = false;
  }
}

if (!customElements.get('unswipe-carousel')) {
  customElements.define('unswipe-carousel', UnswipeCarousel);
}

function mountPreview(
  host: HTMLElement,
  slides: string[],
  label: string,
  statusId: string,
  suffix: string,
) {
  const root = document.createElement('div');
  root.className = 'carousel';
  for (const text of slides) {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.textContent = text;
    root.append(slide);
  }
  host.replaceChildren(root);
  whenVisible(root, () => {
    const slider = new Unswipe(root, { label, align: 'start' });
    const status = document.getElementById(statusId);
    const sync = () => {
      if (!status) return;
      status.textContent = `Active slide: ${slider.index + 1} of ${slider.slides.length}${suffix}`;
    };
    sync();
    slider.on('select', sync);
  });
}

{
  const host = document.getElementById('ex-react');
  if (host && !host.dataset.ready) {
    host.dataset.ready = '1';
    const slides = ['React slide 1', 'React slide 2', 'React slide 3'];
    import('https://esm.sh/react@18.3.1')
      .then(async (React) => {
        const { createRoot } =
          await import('https://esm.sh/react-dom@18.3.1/client');
        const { useEffect, useRef } = React;
        function Carousel() {
          const ref = useRef(null);
          useEffect(() => {
            const root = ref.current as HTMLElement | null;
            if (!root) return;
            let slider: Unswipe | undefined;
            let off: (() => void) | undefined;
            whenVisible(root, () => {
              slider = new Unswipe(root, {
                label: 'React carousel',
                align: 'start',
              });
              const status = document.getElementById('ex-react-status');
              const sync = () => {
                if (!status || !slider) return;
                status.textContent = `Active slide: ${slider.index + 1} of ${slider.slides.length} · React`;
              };
              sync();
              off = slider.on('select', sync);
            });
            return () => {
              off?.();
              slider?.destroy();
            };
          }, []);
          return React.createElement(
            'div',
            { ref, className: 'carousel' },
            slides.map((text: string) =>
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
      .catch(() =>
        mountPreview(
          host,
          slides,
          'React carousel',
          'ex-react-status',
          ' · preview',
        ),
      );
  }
}

{
  const host = document.getElementById('ex-vue');
  if (host && !host.dataset.ready) {
    host.dataset.ready = '1';
    const slides = ['Vue slide 1', 'Vue slide 2', 'Vue slide 3'];
    import('https://esm.sh/vue@3.5.13')
      .then(({ createApp, h, onMounted, onUnmounted, ref }) => {
        createApp({
          setup() {
            const root = ref(null);
            let slider: Unswipe | undefined;
            onMounted(() => {
              if (!root.value) return;
              whenVisible(root.value, () => {
                slider = new Unswipe(root.value, {
                  label: 'Vue carousel',
                  align: 'start',
                });
                const status = document.getElementById('ex-vue-status');
                const sync = () => {
                  if (!status || !slider) return;
                  status.textContent = `Active slide: ${slider.index + 1} of ${slider.slides.length} · Vue`;
                };
                sync();
                slider.on('select', sync);
              });
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
      .catch(() =>
        mountPreview(
          host,
          slides,
          'Vue carousel',
          'ex-vue-status',
          ' · preview',
        ),
      );
  }
}

{
  const host = document.getElementById('ex-svelte');
  if (host && !host.dataset.ready) {
    host.dataset.ready = '1';
    mountPreview(
      host,
      ['Svelte A', 'Svelte B', 'Svelte C'],
      'Svelte carousel',
      'ex-svelte-status',
      ' · preview',
    );
  }
}
