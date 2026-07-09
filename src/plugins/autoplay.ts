import type { Slider, SliderPlugin } from '../types';

export interface AutoplayOptions {
  /** Interval between slides in ms (default: 3000). */
  delay?: number;
  /** Pause while pointer is over the carousel (default: true). */
  pauseOnHover?: boolean;
  /** Loop to first slide after the last (default: true). */
  loop?: boolean;
}

/** Autoplay plugin — advances slides on an interval. */
export function autoplay(options: AutoplayOptions = {}): SliderPlugin {
  const delay = options.delay ?? 3000;
  const pauseOnHover = options.pauseOnHover ?? true;
  const loop = options.loop ?? true;

  let slider: Slider | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let paused = false;

  const stop = () => {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };

  const start = () => {
    if (!slider || paused) return;
    stop();
    timer = setInterval(() => {
      if (!slider) return;
      const { index } = slider;
      if (index < slider.slides.length - 1) {
        slider.scrollToIndex(index + 1);
      } else if (loop && slider.slides.length > 0) {
        slider.scrollToIndex(0);
      }
    }, delay);
  };

  const pause = () => {
    paused = true;
    stop();
  };

  const resume = () => {
    paused = false;
    start();
  };

  return {
    name: 'autoplay',
    init(instance) {
      slider = instance;
      start();
      if (pauseOnHover) {
        instance.root.addEventListener('mouseenter', pause);
        instance.root.addEventListener('mouseleave', resume);
        instance.root.addEventListener('focusin', pause);
        instance.root.addEventListener('focusout', resume);
      }
    },
    destroy(instance) {
      stop();
      if (pauseOnHover) {
        instance.root.removeEventListener('mouseenter', pause);
        instance.root.removeEventListener('mouseleave', resume);
        instance.root.removeEventListener('focusin', pause);
        instance.root.removeEventListener('focusout', resume);
      }
      slider = undefined;
    },
  };
}
