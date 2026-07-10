import { describe, expect, it } from 'vitest';
import Unswipe from '../slider.js';
import { pagination } from './pagination.js';
import {
  activateSlide,
  createCarousel,
  mockScrollTo,
} from '../test/helpers.js';

describe('pagination plugin', () => {
  it('renders one dot per slide and marks the active slide', () => {
    const root = createCarousel(3, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [pagination()]);
    mockScrollTo(root, slider.slides);
    activateSlide(1, slider.slides);

    const list = root.nextElementSibling?.querySelector('.unswipe-pagination');
    const dots = list?.querySelectorAll('button.unswipe-pagination__dot');

    expect(list?.getAttribute('role')).toBe('tablist');
    expect(dots).toHaveLength(3);
    expect(dots?.[1]?.getAttribute('aria-selected')).toBe('true');
    expect(dots?.[0]?.getAttribute('aria-selected')).toBe('false');
  });

  it('scrolls to a slide when a dot is clicked', () => {
    const root = createCarousel(3, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [pagination()]);
    mockScrollTo(root, slider.slides);
    activateSlide(0, slider.slides);

    const dots = root.nextElementSibling?.querySelectorAll(
      'button.unswipe-pagination__dot',
    ) as NodeListOf<HTMLButtonElement>;
    dots[2]?.click();

    expect(slider.index).toBe(2);
  });

  it('rebuilds dots after update', () => {
    const root = createCarousel(2, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [pagination()]);

    root.append(document.createElement('div'));
    slider.update();

    const dots = root.nextElementSibling?.querySelectorAll(
      'button.unswipe-pagination__dot',
    );
    expect(dots).toHaveLength(3);
  });

  it('removes pagination on destroy', () => {
    const root = createCarousel(2, { width: 200 });
    const slider = new Unswipe(root, { behavior: 'auto' }, [pagination()]);

    slider.destroy();
    expect(root.nextElementSibling).toBeNull();
  });
});
