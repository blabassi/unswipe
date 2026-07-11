import type { Slider, SliderPlugin } from '../types';

export interface DragOptions {
  /**
   * Only handle mouse/pen pointers and leave touch to native scroll
   * (default: `true`).
   */
  mouseOnly?: boolean;
  /** Movement in px before a drag starts (default: `10`). */
  threshold?: number;
}

function resolveAxis(slider: Slider): 'x' | 'y' {
  return slider.getOptions().axis ?? 'x';
}

function resolveSnapType(slider: Slider): string {
  const opts = slider.getOptions();
  const axis = opts.axis ?? 'x';
  if (opts.dragFree || opts.snap === 'none') return 'none';
  return `${axis} ${opts.snap ?? 'proximity'}`;
}

/** Mouse/pen drag-to-scroll — complements native touch and trackpad scrolling. */
export function drag(options: DragOptions = {}): SliderPlugin {
  const mouseOnly = options.mouseOnly ?? true;
  const threshold = options.threshold ?? 10;

  let slider: Slider | null = null;
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
    if (!root || !slider) return;
    if (mouseOnly && event.pointerType === 'touch') return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    active = true;
    dragging = false;
    pointerId = event.pointerId;
    axis = resolveAxis(slider);
    startPos = axis === 'x' ? event.clientX : event.clientY;
    startScroll = axis === 'x' ? root.scrollLeft : root.scrollTop;
    snapType = root.style.scrollSnapType || resolveSnapType(slider);
    prevCursor = root.style.cursor;
    prevUserSelect = root.style.userSelect;

    root.setPointerCapture?.(event.pointerId);
    slider.emit('pointerDown');
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
      event.preventDefault();
    }

    const next = startScroll - delta;
    if (axis === 'x') root.scrollLeft = next;
    else root.scrollTop = next;
  };

  const end = (event: PointerEvent) => {
    if (!root || !slider || !active || event.pointerId !== pointerId) return;

    active = false;
    if (root.hasPointerCapture?.(pointerId)) {
      root.releasePointerCapture?.(pointerId);
    }
    pointerId = -1;

    root.style.scrollSnapType = snapType;
    root.style.cursor = prevCursor || 'grab';
    root.style.userSelect = prevUserSelect;
    slider.emit('pointerUp');
  };

  const onClick = (event: MouseEvent) => {
    if (!dragging) return;
    event.preventDefault();
    event.stopPropagation();
    dragging = false;
  };

  return {
    name: 'drag',
    init(instance: Slider) {
      slider = instance;
      root = instance.root;
      axis = resolveAxis(instance);
      root.style.cursor = 'grab';
      root.addEventListener('pointerdown', onDown);
      root.addEventListener('pointermove', onMove);
      root.addEventListener('pointerup', end);
      root.addEventListener('pointercancel', end);
      root.addEventListener('lostpointercapture', end);
      root.addEventListener('click', onClick, true);
    },
    destroy(instance: Slider) {
      const el = instance.root;
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
      el.removeEventListener('lostpointercapture', end);
      el.removeEventListener('click', onClick, true);
      if (prevCursor) el.style.cursor = prevCursor;
      else el.style.removeProperty('cursor');
      el.style.userSelect = prevUserSelect;
      el.style.scrollSnapType = snapType || resolveSnapType(instance);
      root = null;
      slider = null;
      active = false;
      dragging = false;
    },
  };
}
