import { vi } from 'vitest';
import { MockIntersectionObserver } from './setup.js';

export function createCarousel(
  count = 3,
  options?: { className?: string; width?: number },
): HTMLDivElement {
  const root = document.createElement('div');
  if (options?.className) root.className = options.className;

  const slideSize = options?.width ?? 200;

  for (let i = 0; i < count; i++) {
    const slide = document.createElement('div');
    slide.textContent = `Slide ${i + 1}`;
    slide.style.width = `${slideSize}px`;
    slide.style.height = '100px';
    slide.style.flexShrink = '0';
    const offset = slideSize * i;
    Object.defineProperty(slide, 'offsetLeft', { get: () => offset });
    Object.defineProperty(slide, 'offsetTop', { get: () => offset });
    root.append(slide);
  }

  root.style.width = '400px';
  root.style.overflow = 'auto';
  document.body.append(root);
  return root;
}

export function activateSlide(
  index: number,
  slides: readonly HTMLElement[],
): void {
  const io = MockIntersectionObserver.latest;
  if (!io) throw new Error('IntersectionObserver was not created');

  slides.forEach((slide, i) => {
    io.emit(slide, i === index ? 1 : 0);
  });
}

export function mockScrollTo(
  root: HTMLElement,
  slides?: readonly HTMLElement[],
  axis: 'x' | 'y' = 'x',
) {
  return vi
    .spyOn(root, 'scrollTo')
    .mockImplementation((options?: ScrollToOptions | number) => {
      if (!slides || typeof options !== 'object' || options === null) return;

      const pos = axis === 'x' ? options.left : options.top;
      if (pos === undefined) return;

      const index = slides.findIndex((slide) =>
        axis === 'x' ? slide.offsetLeft === pos : slide.offsetTop === pos,
      );
      if (index >= 0) activateSlide(index, slides);
    });
}
