import type { Slider, SliderPlugin } from '../types';

export interface NavigationOptions {
  /** Container for buttons; defaults to a sibling wrapper inserted after root. */
  container?: HTMLElement;
  /** Previous button label (default: "Previous slide"). */
  prevLabel?: string;
  /** Next button label (default: "Next slide"). */
  nextLabel?: string;
  /** CSS class applied to both buttons. */
  className?: string;
}

/** Navigation arrows plugin — prev/next controls wired to the carousel API. */
export function navigation(options: NavigationOptions = {}): SliderPlugin {
  const prevLabel = options.prevLabel ?? 'Previous slide';
  const nextLabel = options.nextLabel ?? 'Next slide';
  const className = options.className ?? 'unswipe-nav';

  let prevBtn: HTMLButtonElement | null = null;
  let nextBtn: HTMLButtonElement | null = null;
  let ownedContainer: HTMLElement | null = null;
  let unbindSelect: (() => void) | null = null;
  let unbindReInit: (() => void) | null = null;

  const sync = (slider: Slider) => {
    if (prevBtn) prevBtn.disabled = !slider.canScrollPrev();
    if (nextBtn) nextBtn.disabled = !slider.canScrollNext();
  };

  return {
    name: 'navigation',
    init(slider) {
      const container =
        options.container ??
        (() => {
          ownedContainer = document.createElement('div');
          ownedContainer.className = `${className}__container`;
          slider.root.insertAdjacentElement('afterend', ownedContainer);
          return ownedContainer;
        })();

      prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = `${className}__prev`;
      prevBtn.setAttribute('aria-label', prevLabel);
      prevBtn.textContent = '‹';

      nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = `${className}__next`;
      nextBtn.setAttribute('aria-label', nextLabel);
      nextBtn.textContent = '›';

      const onPrev = () => slider.prev();
      const onNext = () => slider.next();

      prevBtn.addEventListener('click', onPrev);
      nextBtn.addEventListener('click', onNext);

      container.append(prevBtn, nextBtn);
      sync(slider);
      unbindSelect = slider.on('select', () => sync(slider));
      unbindReInit = slider.on('reInit', () => sync(slider));
    },
    destroy() {
      unbindSelect?.();
      unbindReInit?.();
      unbindSelect = null;
      unbindReInit = null;
      prevBtn?.remove();
      nextBtn?.remove();
      ownedContainer?.remove();
      prevBtn = null;
      nextBtn = null;
      ownedContainer = null;
    },
  };
}
