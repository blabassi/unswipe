import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  type Ref,
  type ShallowRef,
} from 'vue';
import { Unswipe } from 'unswipe';
import type { Slider, SliderOptions, SliderPlugin } from 'unswipe';

export function useUnswipe(
  options: SliderOptions = {},
  plugins: SliderPlugin[] = [],
): {
  el: Ref<HTMLElement | null>;
  slider: ShallowRef<Slider | null>;
} {
  const el = ref<HTMLElement | null>(null);
  const slider = shallowRef<Slider | null>(null);

  onMounted(() => {
    if (!el.value) return;
    slider.value = new Unswipe(el.value, options, plugins);
  });

  onBeforeUnmount(() => {
    slider.value?.destroy();
    slider.value = null;
  });

  watch(
    () => [options, plugins] as const,
    () => {
      slider.value?.reInit(options, plugins);
    },
    { deep: true },
  );

  return { el, slider };
}

export type { Slider, SliderOptions, SliderPlugin };
export { Unswipe };
