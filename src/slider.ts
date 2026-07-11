import type {
  SelectDetail,
  Slider,
  SliderEvent,
  SliderOptions,
  SliderPlugin,
} from './types';

type ResolvedOptions = Required<
  Pick<SliderOptions, 'align' | 'axis' | 'behavior'>
> &
  SliderOptions;

type Listener = (detail?: SelectDetail) => void;

/** Native scroll-snap carousel with scroll-driven active slide tracking. */
export default class Unswipe implements Slider {
  readonly root: HTMLElement;

  private readonly o: ResolvedOptions;
  private readonly plugins: SliderPlugin[];
  private readonly listeners = new Map<SliderEvent, Set<Listener>>();
  private s: HTMLElement[] = [];
  private i = 0;
  private settling = false;

  constructor(
    root: HTMLElement,
    options: SliderOptions = {},
    plugins: SliderPlugin[] = [],
  ) {
    this.root = root;
    this.o = { align: 'start', axis: 'x', behavior: 'smooth', ...options };
    this.plugins = plugins;

    const st = root.style;
    const x = this.o.axis === 'x';
    st.display = 'flex';
    st.flexDirection = x ? 'row' : 'column';
    st.overflow = x ? 'auto hidden' : 'hidden auto';
    st.scrollSnapType = (x ? 'x' : 'y') + ' mandatory';

    root.setAttribute('role', 'carousel');
    if (this.o.label) root.setAttribute('aria-label', this.o.label);

    this.refresh();
    root.addEventListener('scroll', this.onScroll, { passive: true });
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
    this.root.removeEventListener('scroll', this.onScroll);
    this.root.removeEventListener('scrollend', this.settled);
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

  private onScroll = () => {
    if (!this.settling) this.pick();
  };

  private settled = () => {
    this.settling = false;
    this.pick();
  };

  private axisKey(): 'left' | 'top' {
    return this.o.axis === 'x' ? 'left' : 'top';
  }

  private alignPos(box: DOMRect, start: number): number {
    const a = this.o.align;
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

  private go(i: number, b?: ScrollBehavior): void {
    const e = this.s[i];
    if (!e) return;
    const behavior = b ?? this.o.behavior;
    this.settling = behavior !== 'auto';
    this.root.scrollTo({
      behavior,
      [this.axisKey()]: this.offset(e),
    });
    this.commit(i);
    if (this.settling) {
      this.root.addEventListener('scrollend', this.settled, { once: true });
    }
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
    this.pick();
  }

  private pick(): void {
    if (!this.s.length) return;

    const x = this.o.axis === 'x';
    const scroll = x ? this.root.scrollLeft : this.root.scrollTop;
    const max = x
      ? this.root.scrollWidth - this.root.clientWidth
      : this.root.scrollHeight - this.root.clientHeight;

    // At the ends, align:start can't put the last slide flush left when it
    // is narrower than the viewport — prefer first/last over closest-edge.
    if (scroll <= 1) {
      this.commit(0);
      return;
    }
    if (max > 0 && scroll >= max - 1) {
      this.commit(this.s.length - 1);
      return;
    }

    const k = this.axisKey();
    const rootBox = this.root.getBoundingClientRect();
    const origin = this.alignPos(rootBox, rootBox[k]);

    let n = 0;
    let best = Infinity;
    for (let j = 0; j < this.s.length; j++) {
      const box = this.s[j]!.getBoundingClientRect();
      const d = Math.abs(this.alignPos(box, box[k]) - origin);
      if (d < best) {
        best = d;
        n = j;
      }
    }
    this.commit(n);
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
      this.i = n;
      this.fire('select', { index: n, slide: this.s[n]! });
    }
  }

  private fire(event: SliderEvent, detail?: SelectDetail): void {
    this.listeners.get(event)?.forEach((fn) => fn(detail));
  }
}
