import { Unswipe } from 'unswipe';
import type { Slider, SliderOptions, SliderPlugin } from 'unswipe';

/** Svelte action: `<div use:unswipe={{ options, plugins }}>` */
export function unswipe(
  node: HTMLElement,
  params: { options?: SliderOptions; plugins?: SliderPlugin[] } = {},
) {
  let slider = new Unswipe(node, params.options ?? {}, params.plugins ?? []);

  return {
    update(next: { options?: SliderOptions; plugins?: SliderPlugin[] } = {}) {
      slider.reInit(next.options ?? {}, next.plugins);
    },
    destroy() {
      slider.destroy();
    },
  };
}

export type { Slider, SliderOptions, SliderPlugin };
export { Unswipe };
