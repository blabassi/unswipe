import { describe, expect, it, vi } from 'vitest';
import Unswipe from '../slider.js';
import { drag } from './drag.js';
import { createCarousel } from '../test/helpers.js';

function pointerEvent(
  type: string,
  init: PointerEventInit & { clientX?: number; clientY?: number },
): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    ...init,
  });
}

describe('drag plugin', () => {
  it('sets a grab cursor on init', () => {
    const root = createCarousel(3, { width: 200 });
    void new Unswipe(root, { behavior: 'auto' }, [drag()]);
    expect(root.style.cursor).toBe('grab');
  });

  it('scrolls horizontally while dragging with the mouse', () => {
    const root = createCarousel(3, { width: 200 });
    Object.defineProperty(root, 'scrollLeft', {
      writable: true,
      value: 0,
    });
    void new Unswipe(root, { behavior: 'auto' }, [drag({ threshold: 3 })]);

    root.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 200, clientY: 10 }),
    );
    root.dispatchEvent(
      pointerEvent('pointermove', { clientX: 140, clientY: 10 }),
    );

    expect(root.style.scrollSnapType).toBe('none');
    expect(root.style.cursor).toBe('grabbing');
    expect(root.scrollLeft).toBe(60);

    root.dispatchEvent(
      pointerEvent('pointerup', { clientX: 140, clientY: 10 }),
    );
    expect(root.style.scrollSnapType).toBe('x mandatory');
    expect(root.style.cursor).toBe('grab');
  });

  it('scrolls vertically on the y axis', () => {
    const root = createCarousel(3);
    Object.defineProperty(root, 'scrollTop', {
      writable: true,
      value: 0,
    });
    void new Unswipe(root, { axis: 'y', behavior: 'auto' }, [
      drag({ threshold: 3 }),
    ]);

    root.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 10, clientY: 200 }),
    );
    root.dispatchEvent(
      pointerEvent('pointermove', { clientX: 10, clientY: 120 }),
    );

    expect(root.scrollTop).toBe(80);

    root.dispatchEvent(
      pointerEvent('pointerup', { clientX: 10, clientY: 120 }),
    );
    expect(root.style.scrollSnapType).toBe('y mandatory');
  });

  it('ignores touch pointers when mouseOnly is enabled', () => {
    const root = createCarousel(3, { width: 200 });
    Object.defineProperty(root, 'scrollLeft', {
      writable: true,
      value: 0,
    });
    void new Unswipe(root, { behavior: 'auto' }, [drag()]);

    root.dispatchEvent(
      pointerEvent('pointerdown', {
        clientX: 200,
        pointerType: 'touch',
      }),
    );
    root.dispatchEvent(
      pointerEvent('pointermove', {
        clientX: 100,
        pointerType: 'touch',
      }),
    );

    expect(root.scrollLeft).toBe(0);
    expect(root.style.scrollSnapType).toBe('x mandatory');
  });

  it('does not start dragging until the threshold is crossed', () => {
    const root = createCarousel(3, { width: 200 });
    Object.defineProperty(root, 'scrollLeft', {
      writable: true,
      value: 0,
    });
    void new Unswipe(root, { behavior: 'auto' }, [drag({ threshold: 10 })]);

    root.dispatchEvent(pointerEvent('pointerdown', { clientX: 200 }));
    root.dispatchEvent(pointerEvent('pointermove', { clientX: 195 }));

    expect(root.scrollLeft).toBe(0);
    expect(root.style.scrollSnapType).toBe('x mandatory');
  });

  it('suppresses the following click after a drag', () => {
    const root = createCarousel(3, { width: 200 });
    Object.defineProperty(root, 'scrollLeft', {
      writable: true,
      value: 0,
    });
    void new Unswipe(root, { behavior: 'auto' }, [drag({ threshold: 3 })]);

    root.dispatchEvent(pointerEvent('pointerdown', { clientX: 200 }));
    root.dispatchEvent(pointerEvent('pointermove', { clientX: 140 }));
    root.dispatchEvent(pointerEvent('pointerup', { clientX: 140 }));

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const prevent = vi.spyOn(click, 'preventDefault');
    root.dispatchEvent(click);

    expect(prevent).toHaveBeenCalled();
  });

  it('removes listeners and restores cursor on destroy', () => {
    const root = createCarousel(3, { width: 200 });
    Object.defineProperty(root, 'scrollLeft', {
      writable: true,
      value: 0,
    });
    const slider = new Unswipe(root, { behavior: 'auto' }, [drag()]);

    slider.destroy();
    expect(root.style.cursor).toBe('');

    root.dispatchEvent(pointerEvent('pointerdown', { clientX: 200 }));
    root.dispatchEvent(pointerEvent('pointermove', { clientX: 100 }));
    expect(root.scrollLeft).toBe(0);
  });
});
