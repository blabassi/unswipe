import { describe, expect, it } from 'vitest';
import Unswipe from '../slider.js';
import { navigation } from './navigation.js';
import {
  activateSlide,
  createCarousel,
  mockScrollTo,
} from '../test/helpers.js';

describe('navigation plugin', () => {
  it('renders prev/next controls and wires them to the slider', () => {
    const root = createCarousel(3, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [navigation()]);
    mockScrollTo(root, slider.slides);
    activateSlide(1, slider.slides);

    const container = root.nextElementSibling as HTMLElement;
    const prev = container.querySelector(
      'button.unswipe-nav__prev',
    ) as HTMLButtonElement;
    const next = container.querySelector(
      'button.unswipe-nav__next',
    ) as HTMLButtonElement;

    expect(prev.getAttribute('aria-label')).toBe('Previous slide');
    expect(next.getAttribute('aria-label')).toBe('Next slide');
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(false);

    prev.click();
    expect(slider.index).toBe(0);

    next.click();
    expect(slider.index).toBe(1);
  });

  it('disables prev on first slide and next on last slide', () => {
    const root = createCarousel(2, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [navigation()]);
    mockScrollTo(root, slider.slides);
    activateSlide(0, slider.slides);

    const container = root.nextElementSibling as HTMLElement;
    const prev = container.querySelector(
      'button.unswipe-nav__prev',
    ) as HTMLButtonElement;
    const next = container.querySelector(
      'button.unswipe-nav__next',
    ) as HTMLButtonElement;

    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    activateSlide(1, slider.slides);
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(true);
  });

  it('uses a custom container and labels', () => {
    const root = createCarousel(2);
    const container = document.createElement('div');
    document.body.append(container);

    void new Unswipe(root, { behavior: 'auto' }, [
      navigation({
        container,
        prevLabel: 'Back',
        nextLabel: 'Forward',
        className: 'custom-nav',
      }),
    ]);

    const prev = container.querySelector(
      '.custom-nav__prev',
    ) as HTMLButtonElement;
    expect(prev.getAttribute('aria-label')).toBe('Back');
  });

  it('removes controls on destroy', () => {
    const root = createCarousel(2, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [navigation()]);

    slider.destroy();
    expect(root.nextElementSibling).toBeNull();
  });
});
