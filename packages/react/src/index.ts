import { useEffect, useRef, useState, type RefObject } from 'react';
import { Unswipe } from 'unswipe';
import type { Slider, SliderOptions, SliderPlugin } from 'unswipe';

export interface UseUnswipeResult {
  ref: RefObject<HTMLDivElement | null>;
  slider: Slider | null;
}

/** Mount Unswipe on a div ref; destroys on unmount. Call `slider.reInit()` to update. */
export function useUnswipe(
  options: SliderOptions = {},
  plugins: SliderPlugin[] = [],
): UseUnswipeResult {
  const ref = useRef<HTMLDivElement>(null);
  const [slider, setSlider] = useState<Slider | null>(null);
  const optionsRef = useRef(options);
  const pluginsRef = useRef(plugins);
  optionsRef.current = options;
  pluginsRef.current = plugins;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const instance = new Unswipe(el, optionsRef.current, pluginsRef.current);
    setSlider(instance);
    return () => {
      instance.destroy();
      setSlider(null);
    };
  }, []);

  return { ref, slider };
}

export type { Slider, SliderOptions, SliderPlugin };
export { Unswipe };
