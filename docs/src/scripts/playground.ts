import Unswipe from '../../../src/slider';

type Slider = InstanceType<typeof Unswipe>;

function getSlider(id: string): Slider | null {
  const root = document.getElementById(id) as
    | (HTMLElement & { __unswipe?: Slider })
    | null;
  return root?.__unswipe ?? null;
}

document.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement | null)?.closest('button');
  if (!button) return;

  const target = button.getAttribute('data-target');
  const action = button.getAttribute('data-action');
  const api = button.getAttribute('data-api');
  const align = button.getAttribute('data-align');

  if (align && button.parentElement?.dataset.alignControls) {
    const id = button.parentElement.dataset.alignControls!;
    const root = document.getElementById(id) as
      | (HTMLElement & { __unswipe?: Slider })
      | null;
    if (!root) return;

    button.parentElement
      .querySelectorAll('button')
      .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));

    root.__unswipe?.destroy();
    root.dataset.align = align;
    const slider = new Unswipe(root, {
      align: align as 'start' | 'center' | 'end',
      label: root.dataset.label ?? 'Carousel',
      threshold: 0.5,
    });
    root.__unswipe = slider;
    const status = document.querySelector<HTMLElement>(
      `[data-unswipe-status="${id}"]`,
    );
    if (status) {
      const sync = () => {
        status.textContent = `Active slide: ${slider.index + 1} of ${slider.slides.length}`;
      };
      sync();
      slider.on('select', sync);
    }
    return;
  }

  if (!target) return;
  const root = document.getElementById(target);
  const slider = getSlider(target);
  if (!root || !slider) return;

  if (api === 'prev') slider.prev();
  if (api === 'next') slider.next();
  if (api === 'jump') slider.scrollToIndex(2, 'smooth');

  if (action === 'add') {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.textContent = `Slide ${root.children.length + 1}`;
    root.append(slide);
    slider.update();
  }

  if (action === 'remove' && root.children.length > 1) {
    root.lastElementChild?.remove();
    slider.update();
  }
});

function bindEventsLog() {
  const log = document.getElementById('ex-events-log');
  const slider = getSlider('ex-events');
  if (!log || !slider || log.dataset.bound === '1') return;
  log.dataset.bound = '1';
  slider.on('select', ({ index }) => {
    const line = document.createElement('div');
    line.textContent = `select → ${index}`;
    log.prepend(line);
    while (log.children.length > 4) log.lastChild?.remove();
  });
}

document.addEventListener('astro:page-load', () => {
  setTimeout(bindEventsLog, 50);
});
setTimeout(bindEventsLog, 50);
