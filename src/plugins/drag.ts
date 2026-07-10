import type { Slider, SliderPlugin } from '../types';

export interface DragOptions {
  /**
   * Only handle mouse/pen pointers and leave touch to native scroll
   * (default: `true`).
   */
  mouseOnly?: boolean;
  /** Movement in px before a drag starts (default: `3`). */
  threshold?: number;
}

function resolveAxis(el: HTMLElement): 'x' | 'y' {
  return el.style.scrollSnapType.startsWith('y') ||
    el.style.overflowY === 'auto'
    ? 'y'
    : 'x';
}

/** Mouse/pen drag-to-scroll — complements native touch and trackpad scrolling. */
export function drag(options: DragOptions = {}): SliderPlugin {
  const mouseOnly = options.mouseOnly ?? true;
  const threshold = options.threshold ?? 3;

  let root: HTMLElement | null = null;
  let axis: 'x' | 'y' = 'x';
  let active = false;
  let dragging = false;
  let pointerId = -1;
  let startPos = 0;
  let startScroll = 0;
  let snapType = '';
  let prevCursor = '';
  let prevUserSelect = '';

  const onDown = (event: PointerEvent) => {
    if (!root) return;
    if (mouseOnly && event.pointerType === 'touch') return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    active = true;
    dragging = false;
    pointerId = event.pointerId;
    axis = resolveAxis(root);
    startPos = axis === 'x' ? event.clientX : event.clientY;
    startScroll = axis === 'x' ? root.scrollLeft : root.scrollTop;
    snapType = root.style.scrollSnapType;
    prevCursor = root.style.cursor;
    prevUserSelect = root.style.userSelect;

    root.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const onMove = (event: PointerEvent) => {
    if (!root || !active || event.pointerId !== pointerId) return;

    const pos = axis === 'x' ? event.clientX : event.clientY;
    const delta = pos - startPos;

    if (!dragging) {
      if (Math.abs(delta) < threshold) return;
      dragging = true;
      root.style.scrollSnapType = 'none';
      root.style.cursor = 'grabbing';
      root.style.userSelect = 'none';
    }

    const next = startScroll - delta;
    if (axis === 'x') root.scrollLeft = next;
    else root.scrollTop = next;
  };

  const onUp = (event: PointerEvent) => {
    if (!root || !active || event.pointerId !== pointerId) return;

    active = false;
    if (root.hasPointerCapture?.(pointerId)) {
      root.releasePointerCapture?.(pointerId);
    }
    pointerId = -1;

    root.style.scrollSnapType = snapType;
    root.style.cursor = prevCursor || 'grab';
    root.style.userSelect = prevUserSelect;
  };

  const onClick = (event: MouseEvent) => {
    if (!dragging) return;
    event.preventDefault();
    event.stopPropagation();
    dragging = false;
  };

  return {
    name: 'drag',
    init(slider: Slider) {
      root = slider.root;
      axis = resolveAxis(root);
      root.style.cursor = 'grab';
      root.addEventListener('pointerdown', onDown);
      root.addEventListener('pointermove', onMove);
      root.addEventListener('pointerup', onUp);
      root.addEventListener('pointercancel', onUp);
      root.addEventListener('click', onClick, true);
    },
    destroy(slider: Slider) {
      const el = slider.root;
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('click', onClick, true);
      if (prevCursor) el.style.cursor = prevCursor;
      else el.style.removeProperty('cursor');
      el.style.userSelect = prevUserSelect;
      el.style.scrollSnapType = snapType || el.style.scrollSnapType;
      root = null;
      active = false;
      dragging = false;
    },
  };
}
