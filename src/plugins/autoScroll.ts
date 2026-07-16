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
  let hovering = false;
  let focused = false;

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

  // Hover/focus each latch an independent pause reason so a pointerup that
  // ends a drag doesn't resume scrolling while the pointer is still hovering
  // (or focus is still inside) the carousel.
  const onEnter = () => {
    hovering = true;
    stop();
  };
  const onLeave = () => {
    hovering = false;
    if (!focused) play();
  };
  const onFocusIn = () => {
    focused = true;
    stop();
  };
  const onFocusOut = () => {
    focused = false;
    if (!hovering) play();
  };
  const onPointerUp = () => {
    if (!hovering && !focused) play();
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
        instance.root.addEventListener('pointerenter', onEnter);
        instance.root.addEventListener('pointerleave', onLeave);
        instance.root.addEventListener('focusin', onFocusIn);
        instance.root.addEventListener('focusout', onFocusOut);
      }
      // Pause for the duration of a pointer drag regardless of pauseOnHover —
      // otherwise autoScroll and the drag plugin fight over scrollLeft/scrollTop.
      instance.root.addEventListener('pointerdown', stop);
      instance.root.addEventListener('pointerup', onPointerUp);
      instance.root.addEventListener('pointercancel', onPointerUp);
      return { play, stop };
    },
    destroy(instance) {
      stop();
      if (pauseOnHover) {
        instance.root.removeEventListener('pointerenter', onEnter);
        instance.root.removeEventListener('pointerleave', onLeave);
        instance.root.removeEventListener('focusin', onFocusIn);
        instance.root.removeEventListener('focusout', onFocusOut);
      }
      instance.root.removeEventListener('pointerdown', stop);
      instance.root.removeEventListener('pointerup', onPointerUp);
      instance.root.removeEventListener('pointercancel', onPointerUp);
      hovering = false;
      focused = false;
      slider = undefined;
    },
  };
}
