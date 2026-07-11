import { vi } from 'vitest';

export function createCarousel(
  count = 3,
  options?: { className?: string; width?: number },
): HTMLDivElement {
  const root = document.createElement('div');
  if (options?.className) root.className = options.className;

  const slideSize = options?.width ?? 200;
  let scrollLeft = 0;
  let scrollTop = 0;

  Object.defineProperty(root, 'scrollLeft', {
    configurable: true,
    get: () => scrollLeft,
    set: (v: number) => {
      scrollLeft = v;
    },
  });
  Object.defineProperty(root, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (v: number) => {
      scrollTop = v;
    },
  });
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

  for (let i = 0; i < count; i++) {
    const slide = document.createElement('div');
    slide.textContent = `Slide ${i + 1}`;
    slide.style.width = `${slideSize}px`;
    slide.style.height = '100px';
    slide.style.flexShrink = '0';
    const offset = slideSize * i;
    Object.defineProperty(slide, 'offsetLeft', { get: () => offset });
    Object.defineProperty(slide, 'offsetTop', { get: () => offset });
    Object.defineProperty(slide, 'offsetWidth', { get: () => slideSize });
    Object.defineProperty(slide, 'offsetHeight', { get: () => 100 });
    slide.getBoundingClientRect = () =>
      ({
        left: offset - scrollLeft,
        top: offset - scrollTop,
        right: offset - scrollLeft + slideSize,
        bottom: offset - scrollTop + 100,
        width: slideSize,
        height: 100,
        x: offset - scrollLeft,
        y: offset - scrollTop,
        toJSON() {},
      }) as DOMRect;
    root.append(slide);
  }

  root.style.width = '400px';
  root.style.overflow = 'auto';
  document.body.append(root);
  return root;
}

export function slideScrollOffset(
  root: HTMLElement,
  slide: HTMLElement,
  axis: 'x' | 'y' = 'x',
): number {
  const key = axis === 'x' ? 'left' : 'top';
  return (
    slide.getBoundingClientRect()[key] -
    root.getBoundingClientRect()[key] +
    (axis === 'x' ? root.scrollLeft : root.scrollTop)
  );
}

/** Move the carousel to a slide and fire `scroll` so Unswipe recomputes index. */
export function activateSlide(
  index: number,
  slides: readonly HTMLElement[],
  axis: 'x' | 'y' = 'x',
): void {
  const slide = slides[index];
  if (!slide) throw new Error(`Slide ${index} does not exist`);
  const root = slide.parentElement;
  if (!root) throw new Error('Slide has no parent carousel');

  const pos = slideScrollOffset(root, slide, axis);
  if (axis === 'x') root.scrollLeft = pos;
  else root.scrollTop = pos;
  root.dispatchEvent(new Event('scroll'));
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

      if (axis === 'x') root.scrollLeft = pos;
      else root.scrollTop = pos;
      root.dispatchEvent(new Event('scroll'));
    });
}
