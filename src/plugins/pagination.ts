import type { SelectDetail, Slider, SliderPlugin } from '../types';

export interface PaginationOptions {
  /** Container for dots; defaults to a sibling wrapper inserted after root. */
  container?: HTMLElement;
  /** CSS class applied to the list and buttons. */
  className?: string;
  /** Accessible label for the tablist (default: "Carousel pagination"). */
  label?: string;
}

/** Pagination dots plugin — one button per slide, synced via `select` events. */
export function pagination(options: PaginationOptions = {}): SliderPlugin {
  const className = options.className ?? 'unswipe-pagination';
  const label = options.label ?? 'Carousel pagination';

  let list: HTMLElement | null = null;
  let ownedContainer: HTMLElement | null = null;
  let buttons: HTMLButtonElement[] = [];
  let unbindSelect: (() => void) | null = null;
  let unbindUpdate: (() => void) | null = null;

  const sync = (index: number) => {
    for (let i = 0; i < buttons.length; i++) {
      const selected = i === index;
      buttons[i]!.setAttribute('aria-selected', String(selected));
      buttons[i]!.setAttribute('tabindex', selected ? '0' : '-1');
    }
  };

  const build = (slider: Slider) => {
    list?.remove();
    buttons = [];

    const container =
      options.container ??
      (() => {
        if (!ownedContainer) {
          ownedContainer = document.createElement('div');
          ownedContainer.className = `${className}__container`;
          slider.root.insertAdjacentElement('afterend', ownedContainer);
        }
        return ownedContainer;
      })();

    list = document.createElement('div');
    list.className = className;
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', label);

    slider.slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `${className}__dot`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
      btn.addEventListener('click', () => slider.scrollToIndex(i));
      buttons.push(btn);
      list!.append(btn);
    });

    container.append(list);
    sync(slider.index);
  };

  return {
    name: 'pagination',
    init(slider) {
      build(slider);
      unbindSelect = slider.on('select', ({ index }: SelectDetail) =>
        sync(index),
      );
      unbindUpdate = slider.on('update', () => build(slider));
    },
    destroy() {
      unbindSelect?.();
      unbindUpdate?.();
      unbindSelect = null;
      unbindUpdate = null;
      list?.remove();
      ownedContainer?.remove();
      list = null;
      ownedContainer = null;
      buttons = [];
    },
  };
}
