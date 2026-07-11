import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Unswipe from '../slider.js';
import { autoplay } from './autoplay.js';
import {
  activateSlide,
  createCarousel,
  mockScrollTo,
} from '../test/helpers.js';

describe('autoplay plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances slides on an interval', () => {
    const root = createCarousel(3, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [
      autoplay({ delay: 1000, pauseOnHover: false }),
    ]);
    mockScrollTo(root, slider.slides);
    activateSlide(0, slider.slides);

    vi.advanceTimersByTime(1000);
    expect(slider.index).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(slider.index).toBe(2);
  });

  it('loops to the first slide when enabled', () => {
    const root = createCarousel(2, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [
      autoplay({ delay: 500, loop: true, pauseOnHover: false }),
    ]);
    mockScrollTo(root, slider.slides);
    activateSlide(1, slider.slides);

    vi.advanceTimersByTime(500);
    expect(slider.index).toBe(0);
  });

  it('stops at the last slide when loop is disabled', () => {
    const root = createCarousel(2, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [
      autoplay({ delay: 500, loop: false, pauseOnHover: false }),
    ]);
    mockScrollTo(root, slider.slides);
    activateSlide(1, slider.slides);

    vi.advanceTimersByTime(500);
    expect(slider.index).toBe(1);
  });

  it('pauses on pointer interaction and resumes after delay', () => {
    const root = createCarousel(3, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [
      autoplay({ delay: 1000, pauseOnHover: false }),
    ]);
    mockScrollTo(root, slider.slides);
    activateSlide(0, slider.slides);

    root.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(1000);
    expect(slider.index).toBe(0);

    vi.advanceTimersByTime(1000);
    expect(slider.index).toBe(1);
  });

  it('pauses on hover when pauseOnHover is enabled', () => {
    const root = createCarousel(2, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [
      autoplay({ delay: 500 }),
    ]);
    mockScrollTo(root, slider.slides);
    activateSlide(0, slider.slides);

    root.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(500);
    expect(slider.index).toBe(0);

    root.dispatchEvent(new Event('pointerleave'));
    vi.advanceTimersByTime(500);
    expect(slider.index).toBe(1);
  });

  it('reschedules after external navigation via select', () => {
    const root = createCarousel(3, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [
      autoplay({ delay: 1000, pauseOnHover: false }),
    ]);
    mockScrollTo(root, slider.slides);
    activateSlide(0, slider.slides);

    vi.advanceTimersByTime(600);
    activateSlide(2, slider.slides);
    expect(slider.index).toBe(2);

    // Interval was reset on select — should not advance until a full delay elapses.
    vi.advanceTimersByTime(600);
    expect(slider.index).toBe(2);

    vi.advanceTimersByTime(400);
    expect(slider.index).toBe(0);
  });

  it('cleans up timers and listeners on destroy', () => {
    const root = createCarousel(2, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [
      autoplay({ delay: 500 }),
    ]);
    mockScrollTo(root, slider.slides);
    activateSlide(0, slider.slides);

    slider.destroy();
    vi.advanceTimersByTime(2000);
    expect(slider.index).toBe(0);
  });
});
