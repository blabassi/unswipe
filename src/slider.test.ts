import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Unswipe from './slider.js';
import type { SliderPlugin } from './types.js';
import { MockIntersectionObserver } from './test/setup.js';
import { activateSlide, createCarousel, mockScrollTo } from './test/helpers.js';

describe('Unswipe', () => {
  beforeEach(() => {
    window.scrollTo(0, 800);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('applies horizontal carousel styles and role', () => {
      const root = createCarousel();
      void new Unswipe(root, { label: 'Products' });

      expect(root.getAttribute('role')).toBe('carousel');
      expect(root.getAttribute('aria-label')).toBe('Products');
      expect(root.style.display).toBe('flex');
      expect(root.style.flexDirection).toBe('row');
      expect(root.style.overflowX).toBe('auto');
      expect(root.style.overflowY).toBe('hidden');
      expect(root.style.scrollSnapType).toBe('x mandatory');
    });

    it('applies vertical carousel styles', () => {
      const root = createCarousel();
      void new Unswipe(root, { axis: 'y' });

      expect(root.style.flexDirection).toBe('column');
      expect(root.style.overflowX).toBe('hidden');
      expect(root.style.overflowY).toBe('auto');
      expect(root.style.scrollSnapType).toBe('y mandatory');
    });

    it('uses a custom slide selector', () => {
      const root = document.createElement('div');
      root.innerHTML =
        '<article class="slide">A</article><article class="slide">B</article>';
      document.body.append(root);

      const slider = new Unswipe(root, { slide: '.slide' });
      expect(slider.slides).toHaveLength(2);
    });

    it('initializes plugins', () => {
      const root = createCarousel();
      const init = vi.fn();
      const plugin: SliderPlugin = { name: 'test', init };
      void new Unswipe(root, {}, [plugin]);
      expect(init).toHaveBeenCalledOnce();
    });
  });

  describe('slides and accessibility', () => {
    it('marks slides with roledescription and snap alignment', () => {
      const root = createCarousel(2);
      void new Unswipe(root, { align: 'center' });

      for (const slide of root.children) {
        expect(slide.getAttribute('aria-roledescription')).toBe('slide');
        expect((slide as HTMLElement).style.scrollSnapAlign).toBe('center');
        expect((slide as HTMLElement).style.flexShrink).toBe('0');
      }
    });

    it('sets aria-hidden on inactive slides after intersection', () => {
      const root = createCarousel(3);
      const slider = new Unswipe(root, { threshold: 0.5 });
      activateSlide(1, slider.slides);

      expect(slider.slides[0]?.getAttribute('aria-hidden')).toBe('true');
      expect(slider.slides[1]?.hasAttribute('aria-hidden')).toBe(false);
      expect(slider.slides[2]?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('events', () => {
    it('emits select when the active slide changes', () => {
      const root = createCarousel(3);
      const slider = new Unswipe(root, { threshold: 0.5 });
      const handler = vi.fn();

      slider.on('select', handler);
      activateSlide(0, slider.slides);
      expect(handler).not.toHaveBeenCalled();

      activateSlide(1, slider.slides);
      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({
        index: 1,
        slide: slider.slides[1],
      });
    });

    it('unsubscribes from select events', () => {
      const root = createCarousel(2);
      const slider = new Unswipe(root, { threshold: 0.5 });
      const handler = vi.fn();
      const off = slider.on('select', handler);

      activateSlide(0, slider.slides);
      off();
      activateSlide(1, slider.slides);

      expect(handler).not.toHaveBeenCalled();
    });

    it('emits update when the DOM is rescanned', () => {
      const root = createCarousel(2);
      const slider = new Unswipe(root);
      const handler = vi.fn();
      slider.on('update', handler);

      const slide = document.createElement('div');
      root.append(slide);
      slider.update();

      expect(handler).toHaveBeenCalledOnce();
      expect(slider.slides).toHaveLength(3);
    });
  });

  describe('navigation', () => {
    it('scrolls the carousel root without moving the page', () => {
      const root = createCarousel(3, { width: 200 });
      const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');

      const slider = new Unswipe(root, { behavior: 'auto' });
      const scrollTo = mockScrollTo(root, slider.slides);
      activateSlide(0, slider.slides);

      const pageY = window.scrollY;
      slider.scrollToIndex(2, 'auto');

      expect(scrollTo).toHaveBeenCalledWith({
        left: slider.slides[2]!.offsetLeft,
        behavior: 'auto',
      });
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(window.scrollY).toBe(pageY);
    });

    it('next and prev respect bounds and scroll targets', () => {
      const root = createCarousel(3, { width: 200 });
      const slider = new Unswipe(root, { behavior: 'auto' });
      const scrollTo = mockScrollTo(root, slider.slides);
      activateSlide(0, slider.slides);

      slider.next();
      expect(scrollTo).toHaveBeenLastCalledWith({
        left: slider.slides[1]!.offsetLeft,
        behavior: 'auto',
      });

      activateSlide(1, slider.slides);
      scrollTo.mockClear();

      slider.next();
      expect(scrollTo).toHaveBeenLastCalledWith({
        left: slider.slides[2]!.offsetLeft,
        behavior: 'auto',
      });

      activateSlide(2, slider.slides);
      scrollTo.mockClear();

      slider.next();
      expect(scrollTo).not.toHaveBeenCalled();

      slider.prev();
      expect(scrollTo).toHaveBeenLastCalledWith({
        left: slider.slides[1]!.offsetLeft,
        behavior: 'auto',
      });

      activateSlide(0, slider.slides);
      scrollTo.mockClear();

      slider.prev();
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('scrolls vertically on y axis', () => {
      const root = createCarousel(3);
      const slider = new Unswipe(root, { axis: 'y', behavior: 'auto' });
      const scrollTo = mockScrollTo(root, slider.slides, 'y');
      activateSlide(0, slider.slides);

      slider.scrollToIndex(1, 'auto');
      expect(scrollTo).toHaveBeenCalledWith({
        top: slider.slides[1]!.offsetTop,
        behavior: 'auto',
      });
    });
  });

  describe('destroy', () => {
    it('disconnects observers, destroys plugins, and clears listeners', () => {
      const root = createCarousel(2);
      const destroy = vi.fn();
      const plugin: SliderPlugin = { name: 'test', init: vi.fn(), destroy };
      const slider = new Unswipe(root, {}, [plugin]);
      const handler = vi.fn();
      slider.on('select', handler);

      slider.destroy();

      expect(MockIntersectionObserver.latest?.disconnect).toHaveBeenCalled();
      expect(destroy).toHaveBeenCalledOnce();

      activateSlide(1, slider.slides);
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
