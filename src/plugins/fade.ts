import type { Slider, SliderPlugin } from '../types';

export interface FadeOptions {
  /** Active slide opacity (default: `1`). */
  activeOpacity?: number;
  /** Inactive slide opacity (default: `0.25`). */
  inactiveOpacity?: number;
}

/**
 * Opacity crossfade between slides.
 * CSS-driven; works best with overlapping / full-width slides.
 */
export function fade(options: FadeOptions = {}): SliderPlugin {
  const activeOpacity = options.activeOpacity ?? 1;
  const inactiveOpacity = options.inactiveOpacity ?? 0.25;

  let unbinds: (() => void)[] = [];

  const sync = (slider: Slider) => {
    slider.slides.forEach((slide, i) => {
      slide.style.opacity =
        i === slider.index ? String(activeOpacity) : String(inactiveOpacity);
      slide.style.transition = 'opacity 280ms ease';
    });
  };

  return {
    name: 'fade',
    init(slider) {
      slider.root.classList.add('unswipe-fade');
      sync(slider);
      unbinds = [
        slider.on('select', () => sync(slider)),
        slider.on('update', () => sync(slider)),
        slider.on('reInit', () => sync(slider)),
      ];
    },
    destroy(slider) {
      for (const off of unbinds) off();
      unbinds = [];
      slider.root.classList.remove('unswipe-fade');
      for (const slide of slider.slides) {
        slide.style.removeProperty('opacity');
        slide.style.removeProperty('transition');
      }
    },
  };
}
