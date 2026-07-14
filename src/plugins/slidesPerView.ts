import type { Slider, SliderPlugin } from '../types';

export interface SlidesPerViewOptions {
  /** How many slides fit in the viewport. Fractions allowed (e.g. `1.25`). */
  count: number;
  /**
   * Media-query overrides for `count`, e.g.
   * `{ '(min-width: 768px)': { count: 2 } }`.
   */
  breakpoints?: Record<string, { count: number }>;
}

function normalize(
  options: number | SlidesPerViewOptions,
): SlidesPerViewOptions {
  return typeof options === 'number' ? { count: options } : options;
}

function sizeFor(count: number): string {
  return `calc((100% - (${count} - 1) * var(--unswipe-gap, 0px)) / ${count})`;
}

function slideElements(slider: Slider): HTMLElement[] {
  const sel = slider.getOptions().slide;
  if (sel) {
    return Array.from(slider.root.querySelectorAll<HTMLElement>(sel));
  }
  return Array.from(slider.root.children) as HTMLElement[];
}

/**
 * Size slides so *N* fit in the viewport (gap-aware).
 *
 * Prefer CSS (`--unswipe-slide-min-width`) when you can — this plugin is the
 * JS convenience layer for equal-width pages / peeks.
 *
 * @example
 * new Unswipe(root, { slidesToScroll: 3 }, [slidesPerView(3)]);
 * new Unswipe(root, {}, [slidesPerView({ count: 1.25 })]);
 */
export function slidesPerView(
  options: number | SlidesPerViewOptions,
): SliderPlugin {
  let opts = normalize(options);
  let unbinds: (() => void)[] = [];
  let media: { mq: MediaQueryList; handler: () => void }[] = [];
  let active = false;

  const resolveCount = (): number => {
    let n = opts.count;
    const bps = opts.breakpoints ?? {};
    if (typeof matchMedia === 'function') {
      for (const query of Object.keys(bps)) {
        if (matchMedia(query).matches && bps[query]?.count != null) {
          n = bps[query]!.count;
        }
      }
    }
    return n;
  };

  const clear = (slider: Slider) => {
    if (!active) return;
    active = false;
    const st = slider.root.style;
    st.removeProperty('--unswipe-slide-min-width');
    st.removeProperty('--unswipe-slide-min-height');
    for (const el of slideElements(slider)) {
      el.style.removeProperty('flex-grow');
      el.style.removeProperty('min-width');
      el.style.removeProperty('max-width');
      el.style.removeProperty('min-height');
      el.style.removeProperty('max-height');
    }
  };

  const apply = (slider: Slider) => {
    const n = resolveCount();
    if (!(n > 0)) {
      clear(slider);
      return;
    }
    active = true;
    const size = sizeFor(n);
    const x = (slider.getOptions().axis ?? 'x') === 'x';
    const st = slider.root.style;
    if (x) {
      st.setProperty('--unswipe-slide-min-width', size);
      st.removeProperty('--unswipe-slide-min-height');
    } else {
      st.setProperty('--unswipe-slide-min-height', size);
      st.removeProperty('--unswipe-slide-min-width');
    }
    for (const el of slideElements(slider)) {
      el.style.flexGrow = '0';
      if (x) {
        el.style.minWidth = size;
        el.style.maxWidth = size;
        el.style.removeProperty('min-height');
        el.style.removeProperty('max-height');
      } else {
        el.style.minHeight = size;
        el.style.maxHeight = size;
        el.style.removeProperty('min-width');
        el.style.removeProperty('max-width');
      }
    }
  };

  const bindBreakpoints = (slider: Slider) => {
    const bps = opts.breakpoints;
    if (!bps || typeof matchMedia !== 'function') return;
    for (const query of Object.keys(bps)) {
      const mq = matchMedia(query);
      const handler = () => apply(slider);
      mq.addEventListener('change', handler);
      media.push({ mq, handler });
    }
  };

  return {
    name: 'slidesPerView',
    init(slider) {
      apply(slider);
      bindBreakpoints(slider);
      unbinds = [
        slider.on('update', () => apply(slider)),
        slider.on('reInit', () => apply(slider)),
        slider.on('slidesChanged', () => apply(slider)),
      ];
      return {
        /** Current resolved count (after breakpoints). */
        get: () => resolveCount(),
        /** Update count and re-apply. */
        set(next: number | SlidesPerViewOptions) {
          opts = normalize(next);
          for (const { mq, handler } of media) {
            mq.removeEventListener('change', handler);
          }
          media = [];
          bindBreakpoints(slider);
          apply(slider);
        },
      };
    },
    destroy(slider) {
      for (const off of unbinds) off();
      unbinds = [];
      for (const { mq, handler } of media) {
        mq.removeEventListener('change', handler);
      }
      media = [];
      clear(slider);
    },
  };
}
