import { afterEach, beforeEach, vi } from 'vitest';

type IOCallback = IntersectionObserverCallback;

export class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];

  readonly observe = vi.fn((target: Element) => {
    this.targets.add(target);
  });
  readonly disconnect = vi.fn();
  readonly unobserve = vi.fn();

  readonly targets = new Set<Element>();

  static latest: MockIntersectionObserver | null = null;

  constructor(
    private readonly callback: IOCallback,
    options?: IntersectionObserverInit,
  ) {
    this.root = options?.root instanceof Element ? options.root : null;
    this.rootMargin = options?.rootMargin ?? '';
    this.thresholds = options?.threshold
      ? Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold]
      : [];
    MockIntersectionObserver.latest = this;
  }

  emit(target: Element, ratio: number): void {
    this.callback(
      [
        {
          target,
          intersectionRatio: ratio,
          isIntersecting: ratio > 0,
        } as IntersectionObserverEntry,
      ],
      this,
    );
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

beforeEach(() => {
  document.body.innerHTML = '';
  MockIntersectionObserver.latest = null;
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
