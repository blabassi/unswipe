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
  let resumeTimer: ReturnType<typeof setTimeout> | undefined;
  let paused = false;
  let unbindSelect: (() => void) | undefined;

  const stop = () => {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };

  const clearResume = () => {
    if (resumeTimer !== undefined) {
      clearTimeout(resumeTimer);
      resumeTimer = undefined;
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
    clearResume();
  };

  const resume = () => {
    paused = false;
    start();
  };

  const resumeLater = () => {
    clearResume();
    resumeTimer = setTimeout(resume, delay);
  };

  /** Pause and reschedule — root gestures only. */
  const onInteract = () => {
    pause();
    resumeLater();
  };

  /** Restart the interval after any slide change (nav/dots live outside the root). */
  const onSelect = () => {
    if (!paused) {
      stop();
      start();
    }
  };

  return {
    name: 'autoplay',
    init(instance) {
      slider = instance;
      start();
      if (pauseOnHover) {
        instance.root.addEventListener('pointerenter', pause);
        instance.root.addEventListener('pointerleave', resume);
        instance.root.addEventListener('focusin', pause);
        instance.root.addEventListener('focusout', resume);
      }
      instance.root.addEventListener('pointerdown', onInteract);
      instance.root.addEventListener('wheel', onInteract, { passive: true });
      unbindSelect = instance.on('select', onSelect);
    },
    destroy(instance) {
      stop();
      clearResume();
      unbindSelect?.();
      unbindSelect = undefined;
      if (pauseOnHover) {
        instance.root.removeEventListener('pointerenter', pause);
        instance.root.removeEventListener('pointerleave', resume);
        instance.root.removeEventListener('focusin', pause);
        instance.root.removeEventListener('focusout', resume);
      }
      instance.root.removeEventListener('pointerdown', onInteract);
      instance.root.removeEventListener('wheel', onInteract);
      slider = undefined;
    },
  };
}
