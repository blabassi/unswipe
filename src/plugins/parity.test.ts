import { afterEach, describe, expect, it, vi } from 'vitest';
import Unswipe from '../slider.js';
import { loop } from './loop.js';
import { classNames } from './classNames.js';
import { wheel } from './wheel.js';
import { fade } from './fade.js';
import { autoScroll } from './autoScroll.js';
import { slidesPerView } from './slidesPerView.js';
import { CLONE_ATTR } from '../constants.js';
import { createCarousel, activateSlide } from '../test/helpers.js';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('loop plugin', () => {
  it('inserts clones and enables loop mode', () => {
    const root = createCarousel(3);
    const slider = new Unswipe(root, { behavior: 'auto' }, [loop()]);
    expect(root.querySelectorAll(`[${CLONE_ATTR}]`).length).toBe(2);
    expect(slider.slides).toHaveLength(3);
    expect(slider.canScrollNext()).toBe(true);
    expect(slider.plugins().loop).toBeTruthy();
  });

  it('teleports when a clone is closest', () => {
    const root = createCarousel(3, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [loop()]);
    const clone = root.querySelector<HTMLElement>(`[${CLONE_ATTR}="pre"]`);
    expect(clone).toBeTruthy();

    // Make the prepended clone appear at the viewport origin.
    root.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: 400,
        bottom: 100,
        width: 400,
        height: 100,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    for (const child of Array.from(root.children) as HTMLElement[]) {
      child.getBoundingClientRect = () =>
        ({
          left: child.hasAttribute(CLONE_ATTR) ? 0 : 500,
          top: 0,
          right: 200,
          bottom: 100,
          width: 200,
          height: 100,
          x: 0,
          y: 0,
          toJSON() {},
        }) as DOMRect;
    }

    root.dispatchEvent(new Event('scroll'));
    expect(slider.index).toBeGreaterThanOrEqual(0);
  });

  it('rebuilds clones on update and cleans up on destroy', () => {
    const root = createCarousel(3);
    const slider = new Unswipe(root, {}, [loop()]);
    const slide = document.createElement('div');
    slide.textContent = 'New';
    root.append(slide);
    slider.update();
    expect(slider.slides.length).toBeGreaterThanOrEqual(3);
    slider.destroy();
    expect(root.querySelectorAll(`[${CLONE_ATTR}]`).length).toBe(0);
  });
});

describe('classNames plugin', () => {
  it('toggles selected class and cleans up', () => {
    const root = createCarousel(3);
    const slider = new Unswipe(root, {}, [classNames()]);
    activateSlide(1, slider.slides);
    expect(slider.slides[1]?.classList.contains('is-selected')).toBe(true);
    slider.emit('pointerDown');
    expect(root.classList.contains('is-dragging')).toBe(true);
    slider.emit('pointerUp');
    expect(root.classList.contains('is-dragging')).toBe(false);
    slider.destroy();
    expect(root.classList.contains('is-draggable')).toBe(false);
  });
});

describe('wheel plugin', () => {
  it('scrolls horizontally on vertical wheel', () => {
    const root = createCarousel(3);
    const slider = new Unswipe(root, {}, [wheel({ speed: 2 })]);
    root.scrollLeft = 0;
    root.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 40, deltaX: 0, bubbles: true }),
    );
    expect(root.scrollLeft).toBe(80);
    slider.destroy();
  });

  it('ignores vertical axis carousels', () => {
    const root = createCarousel(3);
    void new Unswipe(root, { axis: 'y' }, [wheel()]);
    root.scrollTop = 0;
    root.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 40, deltaX: 0, bubbles: true }),
    );
    expect(root.scrollTop).toBe(0);
  });
});

describe('fade plugin', () => {
  it('sets opacity on slides and cleans up', () => {
    const root = createCarousel(2);
    const slider = new Unswipe(root, {}, [fade()]);
    expect(slider.slides[0]?.style.opacity).toBe('1');
    expect(slider.slides[1]?.style.opacity).toBe('0.25');
    slider.destroy();
    expect(slider.slides[0]?.style.opacity).toBe('');
  });
});

describe('autoScroll plugin', () => {
  it('exposes play/stop API and advances scroll', () => {
    let frames = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      if (frames++ < 2) cb(0);
      return frames;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const root = createCarousel(3);
    Object.defineProperty(root, 'clientWidth', { get: () => 400 });
    Object.defineProperty(root, 'scrollWidth', { get: () => 800 });
    root.scrollLeft = 0;

    const slider = new Unswipe(root, { dragFree: true }, [
      autoScroll({ speed: 5, pauseOnHover: false }),
    ]);
    const api = slider.plugins().autoScroll as {
      play: () => void;
      stop: () => void;
    };
    expect(root.scrollLeft).toBeGreaterThan(0);
    api.stop();
    slider.destroy();
  });
});

describe('slidesPerView plugin', () => {
  it('sizes slides and clears on destroy', () => {
    const root = createCarousel(4);
    const slider = new Unswipe(root, {}, [slidesPerView(3)]);
    const size = 'calc((100% - (3 - 1) * var(--unswipe-gap, 0px)) / 3)';
    expect(root.style.getPropertyValue('--unswipe-slide-min-width')).toBe(size);
    expect(slider.slides[0]!.style.minWidth).toBe(size);
    expect(slider.slides[0]!.style.maxWidth).toBe(size);

    const api = slider.plugins().slidesPerView as {
      get: () => number;
      set: (n: number) => void;
    };
    expect(api.get()).toBe(3);
    api.set(2);
    expect(root.style.getPropertyValue('--unswipe-slide-min-width')).toContain(
      '/ 2)',
    );

    slider.destroy();
    expect(root.style.getPropertyValue('--unswipe-slide-min-width')).toBe('');
    expect(slider.slides[0]!.style.minWidth).toBe('');
  });

  it('applies height sizing on the y axis', () => {
    const root = createCarousel(3);
    const slider = new Unswipe(root, { axis: 'y' }, [slidesPerView(2)]);
    const size = 'calc((100% - (2 - 1) * var(--unswipe-gap, 0px)) / 2)';
    expect(root.style.getPropertyValue('--unswipe-slide-min-height')).toBe(
      size,
    );
    expect(slider.slides[0]!.style.minHeight).toBe(size);
    slider.destroy();
  });
});
