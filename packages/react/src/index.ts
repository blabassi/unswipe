import { useEffect, useRef, useState, type RefObject } from 'react';
import { Unswipe } from 'unswipe';
import type { Slider, SliderOptions, SliderPlugin } from 'unswipe';

export interface UseUnswipeResult {
  ref: RefObject<HTMLDivElement | null>;
  slider: Slider | null;
}

/**
 * Mount Unswipe on a div ref; destroys on unmount.
 *
 * Re-inits automatically when `options` or `plugins` change identity —
 * matches the Vue/Svelte bindings. Memoize both (`useMemo`, module-level
 * constants, etc.) to avoid a `reInit` on every render.
 */
export function useUnswipe(
  options: SliderOptions = {},
  plugins: SliderPlugin[] = [],
): UseUnswipeResult {
  const ref = useRef<HTMLDivElement>(null);
  const [slider, setSlider] = useState<Slider | null>(null);
  const instanceRef = useRef<Slider | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const instance = new Unswipe(el, options, plugins);
    instanceRef.current = instance;
    setSlider(instance);
    return () => {
      instance.destroy();
      instanceRef.current = null;
      setSlider(null);
      mountedRef.current = false;
    };
    // Mount/unmount only — option and plugin updates are applied by the
    // effect below via reInit(), not by remounting the instance.
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    instanceRef.current?.reInit(options, plugins);
  }, [options, plugins]);

  return { ref, slider };
}

export type { Slider, SliderOptions, SliderPlugin };
export { Unswipe };
