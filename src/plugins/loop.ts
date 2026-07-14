import { CLONE_ATTR, INDEX_ATTR } from '../constants';
import type { Slider, SliderPlugin } from '../types';

export interface LoopOptions {
  /** Number of slides cloned on each edge (default: `1`). */
  clones?: number;
}

function clearClones(root: HTMLElement) {
  root.querySelectorAll(`[${CLONE_ATTR}]`).forEach((el) => el.remove());
}

function offsetOf(instance: Slider, el: HTMLElement) {
  const opts = instance.getOptions();
  const axis = opts.axis ?? 'x';
  const k = axis === 'x' ? 'left' : 'top';
  return (
    el.getBoundingClientRect()[k] -
    instance.root.getBoundingClientRect()[k] +
    (axis === 'x' ? instance.root.scrollLeft : instance.root.scrollTop)
  );
}

/**
 * Infinite loop via edge clones + silent scroll teleports.
 * Keeps physics on CSS Scroll Snap.
 */
export function loop(options: LoopOptions = {}): SliderPlugin {
  const cloneCount = Math.max(1, options.clones ?? 1);
  let unbindScroll: (() => void) | undefined;
  let unbindSettle: (() => void) | undefined;
  let unbindUpdate: (() => void) | undefined;
  let teleporting = false;
  let rebuilding = false;

  const buildClones = (instance: Slider) => {
    const { root, slides } = instance;
    clearClones(root);
    if (slides.length < 2) return;

    const n = Math.min(cloneCount, slides.length);
    const prepend: HTMLElement[] = [];
    const append: HTMLElement[] = [];

    for (let i = 0; i < n; i++) {
      const src = slides[slides.length - n + i]!;
      const clone = src.cloneNode(true) as HTMLElement;
      clone.setAttribute(CLONE_ATTR, 'pre');
      clone.setAttribute(INDEX_ATTR, String(slides.length - n + i));
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      clone.removeAttribute('aria-roledescription');
      prepend.push(clone);
    }
    for (let i = 0; i < n; i++) {
      const src = slides[i]!;
      const clone = src.cloneNode(true) as HTMLElement;
      clone.setAttribute(CLONE_ATTR, 'post');
      clone.setAttribute(INDEX_ATTR, String(i));
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      clone.removeAttribute('aria-roledescription');
      append.push(clone);
    }

    for (const c of prepend) root.insertBefore(c, root.firstChild);
    for (const c of append) root.append(c);
  };

  const sync = (instance: Slider) => {
    if (rebuilding) return;
    rebuilding = true;
    buildClones(instance);
    instance.resync();
    rebuilding = false;
  };

  const maybeTeleport = (instance: Slider) => {
    if (teleporting || rebuilding) return;
    const { root } = instance;
    const opts = instance.getOptions();
    const axis = opts.axis ?? 'x';
    const k = axis === 'x' ? 'left' : 'top';
    const origin = root.getBoundingClientRect()[k];

    const nodes = Array.from(root.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement,
    );

    let closest: HTMLElement | null = null;
    let best = Infinity;
    for (const el of nodes) {
      const box = el.getBoundingClientRect();
      const d = Math.abs(box[k] - origin);
      if (d < best) {
        best = d;
        closest = el;
      }
    }

    if (!closest?.hasAttribute(CLONE_ATTR)) return;

    const logical = Number(closest.getAttribute(INDEX_ATTR) ?? 0);
    const target = instance.slides[logical];
    if (!target) return;

    teleporting = true;
    const pos = offsetOf(instance, target);
    if (axis === 'x') root.scrollLeft = pos;
    else root.scrollTop = pos;
    instance.scrollToIndex(logical, 'auto', { silent: true });
    teleporting = false;
  };

  return {
    name: 'loop',
    init(instance) {
      instance.setLoopMode(true);
      sync(instance);

      const first = instance.slides[0];
      if (first) {
        const opts = instance.getOptions();
        const axis = opts.axis ?? 'x';
        const pos = offsetOf(instance, first);
        if (axis === 'x') instance.root.scrollLeft = pos;
        else instance.root.scrollTop = pos;
      }

      unbindScroll = instance.on('scroll', () => maybeTeleport(instance));
      unbindSettle = instance.on('settle', () => maybeTeleport(instance));
      unbindUpdate = instance.on('update', () => sync(instance));

      return { rebuild: () => sync(instance) };
    },
    destroy(instance) {
      unbindScroll?.();
      unbindSettle?.();
      unbindUpdate?.();
      clearClones(instance.root);
      instance.setLoopMode(false);
      instance.resync();
    },
  };
}
