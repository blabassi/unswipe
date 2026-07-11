import type { Slider, SliderPlugin } from '../types';

export interface ClassNamesOptions {
  selected?: string;
  draggable?: string;
  dragging?: string;
  inView?: string;
}

/** Toggle CSS classes for selected / in-view / drag state. */
export function classNames(options: ClassNamesOptions = {}): SliderPlugin {
  const selected = options.selected ?? 'is-selected';
  const draggable = options.draggable ?? 'is-draggable';
  const dragging = options.dragging ?? 'is-dragging';
  const inView = options.inView ?? 'is-in-view';

  let unbinds: (() => void)[] = [];

  const sync = (slider: Slider) => {
    const visible = new Set(slider.slidesInView());
    slider.slides.forEach((slide, i) => {
      slide.classList.toggle(selected, i === slider.index);
      slide.classList.toggle(inView, visible.has(i));
    });
  };

  return {
    name: 'classNames',
    init(slider) {
      slider.root.classList.add(draggable);
      sync(slider);
      unbinds = [
        slider.on('select', () => sync(slider)),
        slider.on('scroll', () => sync(slider)),
        slider.on('settle', () => sync(slider)),
        slider.on('update', () => sync(slider)),
        slider.on('pointerDown', () => slider.root.classList.add(dragging)),
        slider.on('pointerUp', () => slider.root.classList.remove(dragging)),
      ];
    },
    destroy(slider) {
      for (const off of unbinds) off();
      unbinds = [];
      slider.root.classList.remove(draggable, dragging);
      for (const slide of slider.slides) {
        slide.classList.remove(selected, inView);
      }
    },
  };
}
