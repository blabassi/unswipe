import type { Slider, SliderPlugin } from '../types';

export interface WheelOptions {
  /** Multiply wheel delta before applying (default: `1`). */
  speed?: number;
}

/** Map vertical wheel gestures to horizontal carousel scrolling. */
export function wheel(options: WheelOptions = {}): SliderPlugin {
  const speed = options.speed ?? 1;

  const onWheel = (event: WheelEvent, slider: Slider) => {
    const opts = slider.getOptions();
    if ((opts.axis ?? 'x') !== 'x') return;
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;

    event.preventDefault();
    slider.root.scrollLeft += event.deltaY * speed;
  };

  let handler: ((e: WheelEvent) => void) | null = null;

  return {
    name: 'wheel',
    init(slider) {
      handler = (e) => onWheel(e, slider);
      slider.root.addEventListener('wheel', handler, { passive: false });
    },
    destroy(slider) {
      if (handler) slider.root.removeEventListener('wheel', handler);
      handler = null;
    },
  };
}
