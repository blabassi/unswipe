/** Snap alignment along the scroll axis. */
export type SnapAlign = 'start' | 'center' | 'end';

/** Scroll axis for the carousel track. */
export type SliderAxis = 'x' | 'y';

/** Writing direction for the track. */
export type SliderDirection = 'ltr' | 'rtl';

/** CSS scroll-snap strictness. */
export type SnapMode = 'mandatory' | 'proximity' | 'none';

/** How edge snaps are contained within the scrollport. */
export type ContainScroll = 'trimSnaps' | 'keepSnaps' | false;

/** Options for programmatic `scrollToIndex`. */
export interface ScrollToOptions {
  /** Skip intermediate `select` while scrolling (used by loop teleports). */
  silent?: boolean;
}

/** Carousel configuration. */
export interface SliderOptions {
  /** CSS selector for slides relative to root (default: direct children). */
  slide?: string;
  /** Snap alignment anchor (default: `start`). */
  align?: SnapAlign;
  /** Scroll axis (default: `x`). */
  axis?: SliderAxis;
  /** Track direction (default: `ltr`). */
  direction?: SliderDirection;
  /** Accessible name for the carousel region. */
  label?: string;
  /** @deprecated Unused — active slide is derived from scroll position. */
  threshold?: number;
  /** Scroll behavior for programmatic navigation (default: `smooth`). */
  behavior?: ScrollBehavior;
  /** Initial slide index (default: `0`). */
  startIndex?: number;
  /** Slides advanced by `next`/`prev` (default: `1`). */
  slidesToScroll?: number;
  /** Scroll-snap mode (default: `proximity`). `dragFree` forces `none`. */
  snap?: SnapMode;
  /** Free-scroll mode — equivalent to `snap: 'none'` (default: `false`). */
  dragFree?: boolean;
  /** Edge snap containment (default: `trimSnaps`). */
  containScroll?: ContainScroll;
  /** Allow skipping intermediate snaps during fast scroll (best-effort). */
  skipSnaps?: boolean;
  /**
   * Media-query keyed option overrides, e.g.
   * `{ '(min-width: 768px)': { slidesToScroll: 2 } }`.
   */
  breakpoints?: Record<string, Partial<SliderOptions>>;
}

/** Payload emitted on the `select` event. */
export interface SelectDetail {
  index: number;
  slide: HTMLElement;
}

/** Payload emitted on the `scroll` event. */
export interface ScrollDetail {
  progress: number;
}

/** Carousel event names. */
export type SliderEvent =
  | 'init'
  | 'select'
  | 'scroll'
  | 'settle'
  | 'resize'
  | 'pointerDown'
  | 'pointerUp'
  | 'reInit'
  | 'destroy'
  | 'update';

/** Plugin contract — decoupled from core for tree-shakeable extensions. */
export interface SliderPlugin {
  readonly name: string;
  /** Return an optional public API object exposed via `slider.plugins()`. */
  init(slider: Slider): void | Record<string, unknown>;
  destroy?(slider: Slider): void;
}

/** Public carousel instance API. */
export interface Slider {
  readonly root: HTMLElement;
  /** Logical slides (excludes `[data-unswipe-clone]` nodes). */
  readonly slides: readonly HTMLElement[];
  readonly index: number;

  next(): void;
  prev(): void;
  scrollToIndex(
    index: number,
    behavior?: ScrollBehavior,
    opts?: ScrollToOptions,
  ): void;
  update(): void;
  /** Re-scan slides and apply snap styles without emitting `update`. */
  resync(): void;
  destroy(): void;
  reInit(options?: SliderOptions, plugins?: SliderPlugin[]): void;

  canScrollNext(): boolean;
  canScrollPrev(): boolean;
  scrollProgress(): number;
  slidesInView(): number[];
  getOptions(): Readonly<SliderOptions>;
  plugins(): Record<string, unknown>;

  /** Enable wrap-around navigation (used by the loop plugin). */
  setLoopMode(enabled: boolean): void;
  /** Emit a carousel event (used by plugins such as drag). */
  emit(event: SliderEvent, detail?: SelectDetail | ScrollDetail): void;

  on(event: 'select', handler: (detail: SelectDetail) => void): () => void;
  on(event: 'scroll', handler: (detail: ScrollDetail) => void): () => void;
  on(
    event: Exclude<SliderEvent, 'select' | 'scroll'>,
    handler: () => void,
  ): () => void;
}
