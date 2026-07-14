import type { Slider, SliderPlugin } from '../types';

export interface AutoScrollOptions {
  /** Pixels per frame at 60fps (default: `1`). */
  speed?: number;
  /** Pause while pointer is over the carousel (default: `true`). */
  pauseOnHover?: boolean;
  /** Reverse direction (default: `false`). */
  reverse?: boolean;
}

/** Continuous auto-scroll (distinct from interval-based autoplay). */
export function autoScroll(options: AutoScrollOptions = {}): SliderPlugin {
  const speed = options.speed ?? 1;
  const pauseOnHover = options.pauseOnHover ?? true;
  const reverse = options.reverse ?? false;

  let slider: Slider | undefined;
  let raf = 0;
  let paused = false;

  const tick = () => {
    if (!slider || paused) {
      raf = 0;
      return;
    }
    const root = slider.root;
    const opts = slider.getOptions();
    const axis = opts.axis ?? 'x';
    const delta = reverse ? -speed : speed;
    if (axis === 'x') {
      const max = root.scrollWidth - root.clientWidth;
      let next = root.scrollLeft + delta;
      if (next >= max) next = 0;
      if (next < 0) next = max;
      root.scrollLeft = next;
    } else {
      const max = root.scrollHeight - root.clientHeight;
      let next = root.scrollTop + delta;
      if (next >= max) next = 0;
      if (next < 0) next = max;
      root.scrollTop = next;
    }
    raf = requestAnimationFrame(tick);
  };

  const play = () => {
    paused = false;
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    paused = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  return {
    name: 'autoScroll',
    init(instance) {
      slider = instance;
      if (
        !instance.getOptions().dragFree &&
        instance.getOptions().snap !== 'none'
      ) {
        instance.root.style.scrollSnapType = 'none';
      }
      play();
      if (pauseOnHover) {
        instance.root.addEventListener('pointerenter', stop);
        instance.root.addEventListener('pointerleave', play);
      }
      return { play, stop };
    },
    destroy(instance) {
      stop();
      if (pauseOnHover) {
        instance.root.removeEventListener('pointerenter', stop);
        instance.root.removeEventListener('pointerleave', play);
      }
      slider = undefined;
    },
  };
}
