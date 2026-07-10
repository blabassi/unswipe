import type {
  SelectDetail,
  Slider,
  SliderEvent,
  SliderOptions,
  SliderPlugin,
} from './types';

type ResolvedOptions = Required<
  Pick<SliderOptions, 'align' | 'axis' | 'threshold' | 'behavior'>
> &
  SliderOptions;

type Listener = (detail?: SelectDetail) => void;
type TrackedSlide = HTMLElement & { __u?: number };

const DEF: ResolvedOptions = {
  align: 'start',
  axis: 'x',
  threshold: 0.5,
  behavior: 'smooth',
};

/** Native scroll-snap carousel with IO-driven accessibility. */
export default class Unswipe implements Slider {
  readonly root: HTMLElement;

  private readonly o: ResolvedOptions;
  private readonly plugins: SliderPlugin[];
  private readonly listeners = new Map<SliderEvent, Set<Listener>>();
  private s: HTMLElement[] = [];
  private i = 0;
  private io: IntersectionObserver | null = null;

  constructor(
    root: HTMLElement,
    options: SliderOptions = {},
    plugins: SliderPlugin[] = [],
  ) {
    this.root = root;
    this.o = { ...DEF, ...options };
    this.plugins = plugins;

    const st = root.style;
    const x = this.o.axis === 'x';
    st.display = 'flex';
    st.flexDirection = x ? 'row' : 'column';
    st.overflowX = x ? 'auto' : 'hidden';
    st.overflowY = x ? 'hidden' : 'auto';
    st.scrollSnapType = (x ? 'x' : 'y') + ' mandatory';

    root.setAttribute('role', 'carousel');
    if (this.o.label) root.setAttribute('aria-label', this.o.label);

    this.refresh();
    for (const p of plugins) p.init(this);
  }

  get slides(): readonly HTMLElement[] {
    return this.s;
  }

  get index(): number {
    return this.i;
  }

  next(): void {
    if (this.i < this.s.length - 1) this.go(this.i + 1);
  }

  prev(): void {
    if (this.i > 0) this.go(this.i - 1);
  }

  scrollToIndex(index: number, behavior?: ScrollBehavior): void {
    this.go(index, behavior);
  }

  update(): void {
    this.refresh();
    this.fire('update');
  }

  destroy(): void {
    this.io?.disconnect();
    this.io = null;
    for (const p of this.plugins) p.destroy?.(this);
    this.listeners.clear();
  }

  on(event: 'select', handler: (detail: SelectDetail) => void): () => void;
  on(event: 'update', handler: () => void): () => void;
  on(
    event: SliderEvent,
    handler: ((detail: SelectDetail) => void) | (() => void),
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as Listener);
    return () => set.delete(handler as Listener);
  }

  private go(index: number, behavior?: ScrollBehavior): void {
    const el = this.s[index];
    if (!el) return;
    el.scrollIntoView({
      behavior: behavior ?? this.o.behavior,
      block: 'nearest',
      inline: 'nearest',
    });
  }

  private refresh(): void {
    const sel = this.o.slide;
    this.s = sel
      ? Array.from(this.root.querySelectorAll<HTMLElement>(sel))
      : (Array.from(this.root.children) as HTMLElement[]);

    const a = this.o.align;
    for (const el of this.s) {
      el.style.flexShrink = '0';
      el.style.scrollSnapAlign = a;
      el.setAttribute('aria-roledescription', 'slide');
    }

    this.io?.disconnect();
    if (!this.s.length) {
      this.io = null;
      return;
    }

    this.io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          (e.target as TrackedSlide).__u = e.intersectionRatio;
        this.pick();
      },
      { root: this.root, threshold: this.o.threshold },
    );

    for (const el of this.s) {
      (el as TrackedSlide).__u = 0;
      this.io.observe(el);
    }

    this.pick();
  }

  private pick(): void {
    let n = -1;
    let top = -1;

    for (let j = 0; j < this.s.length; j++) {
      const r = (this.s[j] as TrackedSlide).__u ?? 0;
      if (r > top) {
        top = r;
        n = j;
      }
    }

    if (n < 0 || top < this.o.threshold) return;

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
      this.i = n;
      this.fire('select', { index: n, slide: this.s[n]! });
    }
  }

  private fire(event: SliderEvent, detail?: SelectDetail): void {
    this.listeners.get(event)?.forEach((fn) => fn(detail));
  }
}
