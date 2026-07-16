import { CLONE_ATTR, INDEX_ATTR } from './constants';
import type {
  ContainScroll,
  ScrollToOptions,
  Slider,
  SliderEvent,
  SliderEventDetail,
  SliderEventMap,
  SliderOptions,
  SliderPlugin,
  SnapMode,
} from './types';

type Listener = (detail: SliderEventDetail) => void;

const DEFAULTS: Required<
  Pick<
    SliderOptions,
    | 'align'
    | 'axis'
    | 'direction'
    | 'behavior'
    | 'startIndex'
    | 'slidesToScroll'
    | 'snap'
    | 'dragFree'
    | 'containScroll'
    | 'skipSnaps'
  >
> = {
  align: 'start',
  axis: 'x',
  direction: 'ltr',
  behavior: 'smooth',
  startIndex: 0,
  slidesToScroll: 1,
  snap: 'proximity',
  dragFree: false,
  containScroll: 'trimSnaps',
  skipSnaps: false,
};

function resolveSnap(o: SliderOptions): SnapMode {
  if (o.dragFree) return 'none';
  return o.snap ?? 'proximity';
}

/** Native scroll-snap carousel with scroll-driven active slide tracking. */
export default class Unswipe implements Slider {
  readonly root: HTMLElement;

  private o: SliderOptions = { ...DEFAULTS };
  private pluginList: SliderPlugin[] = [];
  private readonly listeners = new Map<SliderEvent, Set<Listener>>();
  private pluginApis: Record<string, unknown> = {};
  private s: HTMLElement[] = [];
  private i = 0;
  private settling = false;
  private silent = false;
  private loopMode = false;
  private resizeObs: ResizeObserver | undefined;
  private mediaQueries: { mq: MediaQueryList; handler: () => void }[] = [];
  private baseOptions: SliderOptions = {};
  private destroyed = false;
  /** Snapshot of logical slides for `slidesChanged` detection. */
  private slideSnapshot: HTMLElement[] = [];

  constructor(
    root: HTMLElement,
    options: SliderOptions = {},
    plugins: SliderPlugin[] = [],
  ) {
    this.root = root;
    this.baseOptions = { ...options };
    this.pluginList = plugins;
    this.applyOptions(options);
    this.mount();
    this.initPlugins();
    this.fire('init', {});
  }

  get slides(): readonly HTMLElement[] {
    return this.s;
  }

  get index(): number {
    return this.i;
  }

  next(): void {
    const step = this.o.slidesToScroll ?? 1;
    const last = this.s.length - 1;
    if (this.loopMode) {
      this.go((this.i + step) % this.s.length);
      return;
    }
    if (this.i < last) this.go(Math.min(this.i + step, last));
  }

  prev(): void {
    const step = this.o.slidesToScroll ?? 1;
    if (this.loopMode) {
      const n = this.s.length;
      this.go((this.i - step + n * 10) % n);
      return;
    }
    if (this.i > 0) this.go(Math.max(this.i - step, 0));
  }

  scrollToIndex(
    index: number,
    behavior?: ScrollBehavior,
    opts?: ScrollToOptions,
  ): void {
    this.go(index, behavior, opts?.silent);
  }

  update(): void {
    this.refresh();
    if (this.slidesDiffer()) {
      this.fire('slidesChanged', { length: this.s.length });
    }
    this.rememberSlides();
    this.fire('update', { length: this.s.length });
  }

  resync(): void {
    this.refresh();
    this.rememberSlides();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.teardownPlugins();
    this.teardownObservers();
    this.root.removeEventListener('scroll', this.onScroll);
    this.root.removeEventListener('scrollend', this.settled);
    this.fire('destroy', {});
    this.listeners.clear();
    this.pluginApis = {};
  }

  reInit(options?: SliderOptions, plugins?: SliderPlugin[]): void {
    this.teardownPlugins();
    this.teardownObservers();
    if (options) this.baseOptions = { ...this.baseOptions, ...options };
    if (plugins) this.pluginList = plugins;
    this.applyOptions(this.baseOptions);
    this.mount(false);
    this.initPlugins();
    this.fire('reInit', {});
  }

  canScrollNext(): boolean {
    if (this.loopMode) return this.s.length > 1;
    return this.i < this.s.length - 1;
  }

  canScrollPrev(): boolean {
    if (this.loopMode) return this.s.length > 1;
    return this.i > 0;
  }

  scrollProgress(): number {
    const x = this.o.axis === 'x';
    const max = x
      ? this.root.scrollWidth - this.root.clientWidth
      : this.root.scrollHeight - this.root.clientHeight;
    if (max <= 0) return 0;
    const pos = x ? this.root.scrollLeft : this.root.scrollTop;
    return Math.min(1, Math.max(0, pos / max));
  }

  slidesInView(): number[] {
    const rootBox = this.root.getBoundingClientRect();
    const x = this.o.axis === 'x';
    const out: number[] = [];
    for (let j = 0; j < this.s.length; j++) {
      const box = this.s[j]!.getBoundingClientRect();
      const overlap = x
        ? box.right > rootBox.left && box.left < rootBox.right
        : box.bottom > rootBox.top && box.top < rootBox.bottom;
      if (overlap) out.push(j);
    }
    return out;
  }

  getOptions(): Readonly<SliderOptions> {
    return { ...this.o };
  }

  plugins(): Record<string, unknown> {
    return { ...this.pluginApis };
  }

  setLoopMode(enabled: boolean): void {
    this.loopMode = enabled;
  }

  emit<E extends SliderEvent>(event: E, detail?: SliderEventMap[E]): void {
    this.fire(event, (detail ?? {}) as SliderEventMap[E]);
  }

  on<E extends SliderEvent>(
    event: E,
    handler: (detail: SliderEventMap[E]) => void,
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as Listener);
    return () => set!.delete(handler as Listener);
  }

  private applyOptions(raw: SliderOptions): void {
    const merged: SliderOptions = { ...DEFAULTS, ...raw };
    const bps = raw.breakpoints ?? {};
    for (const query of Object.keys(bps)) {
      if (typeof matchMedia === 'function' && matchMedia(query).matches) {
        Object.assign(merged, bps[query]);
      }
    }
    // Nested breakpoints from overrides are ignored to avoid recursion.
    delete merged.breakpoints;
    if (raw.breakpoints) merged.breakpoints = raw.breakpoints;
    merged.snap = resolveSnap(merged);
    if (typeof merged.slidesToScroll === 'number') {
      merged.slidesToScroll = Math.max(1, Math.floor(merged.slidesToScroll));
    }
    this.o = merged;
  }

  private mount(bindScroll = true): void {
    this.applyLayout();
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-roledescription', 'carousel');
    if (this.o.label) this.root.setAttribute('aria-label', this.o.label);
    else this.root.removeAttribute('aria-label');

    this.refresh();
    this.rememberSlides();

    const start = this.o.startIndex ?? 0;
    if (start > 0 && this.s[start]) {
      this.go(start, 'auto', true);
      this.commit(start);
    }

    if (bindScroll) {
      this.root.addEventListener('scroll', this.onScroll, { passive: true });
    }
    this.bindResize();
    this.bindBreakpoints();
  }

  private applyLayout(): void {
    const st = this.root.style;
    const x = this.o.axis === 'x';
    st.display = 'flex';
    st.flexDirection = x ? 'row' : 'column';
    // Explicit stretch — `normal` was leaving variable-width slides ragged.
    st.alignItems = 'stretch';
    st.overflow = x ? 'auto hidden' : 'hidden auto';
    st.direction = this.o.direction ?? 'ltr';
    this.applySnapType();
    this.applyContainScroll(this.o.containScroll ?? 'trimSnaps');
  }

  private applySnapType(): void {
    const snap = resolveSnap(this.o);
    if (snap === 'none') {
      this.root.style.scrollSnapType = 'none';
      return;
    }
    const axis = this.o.axis === 'x' ? 'x' : 'y';
    // Always write both keywords — some engines omit a defaulted strictness
    // when serializing the shorthand back to the style attribute.
    this.root.style.setProperty('scroll-snap-type', `${axis} ${snap}`);
  }

  private applyContainScroll(mode: ContainScroll): void {
    const st = this.root.style;
    if (mode === 'trimSnaps') {
      st.setProperty('--unswipe-contain', '1');
    } else {
      st.removeProperty('--unswipe-contain');
    }
    // keepSnaps / false: spacer handled via CSS when --unswipe-contain is unset
    if (mode === false) {
      st.scrollPadding = '0';
    }
  }

  private bindResize(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObs = new ResizeObserver(() => {
      this.fire('resize', {
        width: this.root.clientWidth,
        height: this.root.clientHeight,
      });
    });
    this.resizeObs.observe(this.root);
  }

  private bindBreakpoints(): void {
    const bps = this.baseOptions.breakpoints;
    if (!bps || typeof matchMedia !== 'function') return;
    for (const query of Object.keys(bps)) {
      const mq = matchMedia(query);
      const handler = () => {
        this.applyOptions(this.baseOptions);
        this.applyLayout();
        this.refresh();
        this.rememberSlides();
        this.fire('reInit', {});
      };
      mq.addEventListener('change', handler);
      this.mediaQueries.push({ mq, handler });
    }
  }

  private teardownObservers(): void {
    this.resizeObs?.disconnect();
    this.resizeObs = undefined;
    for (const { mq, handler } of this.mediaQueries) {
      mq.removeEventListener('change', handler);
    }
    this.mediaQueries = [];
  }

  private initPlugins(): void {
    this.pluginApis = {};
    for (const p of this.pluginList) {
      const api = p.init(this);
      if (api && typeof api === 'object') this.pluginApis[p.name] = api;
    }
  }

  private teardownPlugins(): void {
    for (const p of this.pluginList) p.destroy?.(this);
    this.pluginApis = {};
    this.loopMode = false;
  }

  private onScroll = () => {
    this.fire('scroll', {
      progress: this.scrollProgress(),
      slidesInView: this.slidesInView(),
    });
    if (!this.settling && !this.silent) this.pick();
  };

  private settled = () => {
    this.settling = false;
    this.silent = false;
    this.pick();
    this.fire('settle', { index: this.i });
  };

  private axisKey(): 'left' | 'top' {
    return this.o.axis === 'x' ? 'left' : 'top';
  }

  private alignPos(box: DOMRect, start: number): number {
    const a = this.o.align ?? 'start';
    if (a === 'start') return start;
    const size = this.o.axis === 'x' ? box.width : box.height;
    return start + (a === 'center' ? size / 2 : size);
  }

  private offset(el: HTMLElement): number {
    const k = this.axisKey();
    return (
      el.getBoundingClientRect()[k] -
      this.root.getBoundingClientRect()[k] +
      (this.o.axis === 'x' ? this.root.scrollLeft : this.root.scrollTop)
    );
  }

  private go(i: number, b?: ScrollBehavior, silent = false): void {
    const e = this.s[i];
    if (!e) return;
    const behavior = b ?? this.o.behavior ?? 'smooth';
    this.silent = silent;
    this.settling = behavior !== 'auto';
    this.root.scrollTo({
      behavior,
      [this.axisKey()]: this.offset(e),
    });
    if (!silent) this.commit(i);
    if (this.settling) {
      this.root.addEventListener('scrollend', this.settled, { once: true });
    } else {
      this.silent = false;
      if (silent) this.commit(i);
    }
  }

  private refresh(): void {
    const sel = this.o.slide;
    const all = sel
      ? Array.from(this.root.querySelectorAll<HTMLElement>(sel))
      : (Array.from(this.root.children) as HTMLElement[]);

    // Logical slides exclude clones; clones keep INDEX_ATTR for remapping.
    this.s = all.filter((el) => !el.hasAttribute(CLONE_ATTR));
    for (let j = 0; j < this.s.length; j++) {
      const el = this.s[j]!;
      el.setAttribute(INDEX_ATTR, String(j));
      el.setAttribute('role', 'group');
      el.setAttribute('aria-roledescription', 'slide');
    }

    const a = this.o.align ?? 'start';
    const snap = resolveSnap(this.o);
    const step = this.o.slidesToScroll ?? 1;

    for (const el of all) {
      el.style.flexShrink = '0';
      if (snap === 'none') {
        el.style.removeProperty('scroll-snap-align');
        continue;
      }
      const logical = Number(el.getAttribute(INDEX_ATTR) ?? 0);
      const isSnap =
        !this.o.skipSnaps ||
        logical % step === 0 ||
        logical === this.s.length - 1;
      el.style.scrollSnapAlign = isSnap ? a : 'none';
    }
    this.pick();
  }

  private pick(): void {
    if (!this.s.length) return;

    const x = this.o.axis === 'x';
    const scroll = x ? this.root.scrollLeft : this.root.scrollTop;
    const max = x
      ? this.root.scrollWidth - this.root.clientWidth
      : this.root.scrollHeight - this.root.clientHeight;

    // Prefer first/last at edges unless loop clones own the edges.
    const hasClones = this.root.querySelector(`[${CLONE_ATTR}]`);
    if (!hasClones) {
      if (scroll <= 1) {
        this.commit(0);
        return;
      }
      if (max > 0 && scroll >= max - 1) {
        this.commit(this.s.length - 1);
        return;
      }
    }

    const k = this.axisKey();
    const rootBox = this.root.getBoundingClientRect();
    const origin = this.alignPos(rootBox, rootBox[k]);

    // Consider all snap children (including clones) then map to logical index.
    const sel = this.o.slide;
    const all = sel
      ? Array.from(this.root.querySelectorAll<HTMLElement>(sel))
      : (Array.from(this.root.children) as HTMLElement[]);

    let bestEl: HTMLElement | null = null;
    let best = Infinity;
    for (const el of all) {
      if ((el.style.scrollSnapAlign || '') === 'none') continue;
      const box = el.getBoundingClientRect();
      const d = Math.abs(this.alignPos(box, box[k]) - origin);
      if (d < best) {
        best = d;
        bestEl = el;
      }
    }
    if (!bestEl) return;

    const mapped = bestEl.getAttribute(INDEX_ATTR);
    const n = mapped != null ? Number(mapped) : this.s.indexOf(bestEl);
    if (n >= 0 && n < this.s.length) this.commit(n);
  }

  private commit(n: number): void {
    for (let j = 0; j < this.s.length; j++) {
      const el = this.s[j]!;
      if (j === n) {
        el.removeAttribute('aria-hidden');
        el.removeAttribute('tabindex');
      } else {
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('tabindex', '-1');
      }
    }
    if (n !== this.i) {
      const previous = this.i;
      this.i = n;
      this.fire('select', { index: n, previous, slide: this.s[n]! });
    } else {
      this.i = n;
    }
  }

  private slidesDiffer(): boolean {
    if (this.slideSnapshot.length !== this.s.length) return true;
    for (let j = 0; j < this.s.length; j++) {
      if (this.slideSnapshot[j] !== this.s[j]) return true;
    }
    return false;
  }

  private rememberSlides(): void {
    this.slideSnapshot = this.s.slice();
  }

  private fire<E extends SliderEvent>(
    event: E,
    detail: SliderEventMap[E],
  ): void {
    this.listeners.get(event)?.forEach((fn) => fn(detail));
  }
}
