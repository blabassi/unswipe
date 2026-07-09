/** Snap alignment along the scroll axis. */
export type SnapAlign = 'start' | 'center' | 'end';

/** Scroll axis for the carousel track. */
export type SliderAxis = 'x' | 'y';

/** Carousel configuration. */
export interface SliderOptions {
  /** CSS selector for slides relative to root (default: direct children). */
  slide?: string;
  /** Snap alignment anchor (default: `start`). */
  align?: SnapAlign;
  /** Scroll axis (default: `x`). */
  axis?: SliderAxis;
  /** Accessible name for the carousel region. */
  label?: string;
  /** Intersection ratio (0–1) at which a slide is considered visible (default: `0.5`). */
  threshold?: number;
  /** Scroll behavior for programmatic navigation (default: `smooth`). */
  behavior?: ScrollBehavior;
}

/** Payload emitted on the `select` event. */
export interface SelectDetail {
  index: number;
  slide: HTMLElement;
}

/** Carousel event names. */
export type SliderEvent = 'select' | 'update';

/** Plugin contract — decoupled from core for tree-shakeable extensions. */
export interface SliderPlugin {
  readonly name: string;
  init(slider: Slider): void;
  destroy?(slider: Slider): void;
}

/** Public carousel instance API. */
export interface Slider {
  readonly root: HTMLElement;
  readonly slides: readonly HTMLElement[];
  readonly index: number;

  next(): void;
  prev(): void;
  scrollToIndex(index: number, behavior?: ScrollBehavior): void;
  update(): void;
  destroy(): void;

  on(event: 'select', handler: (detail: SelectDetail) => void): () => void;
  on(event: 'update', handler: () => void): () => void;
}
