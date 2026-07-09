import { Unswipe } from './assets/unswipe.js';
import { autoplay } from './assets/plugins/autoplay.js';
import { navigation } from './assets/plugins/navigation.js';
import { pagination } from './assets/plugins/pagination.js';

function setCode(id, code) {
  const el = document.getElementById(id);
  if (el) el.textContent = code;
}

function logEvent(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  const line = document.createElement('div');
  line.textContent = message;
  el.prepend(line);
  while (el.children.length > 4) el.lastChild?.remove();
}

// Quick start
{
  const root = document.getElementById('ex-quick');
  if (root) {
    const slider = new Unswipe(root, {
      align: 'start',
      label: 'Featured products',
      threshold: 0.5,
    });
    slider.on('select', ({ index }) => {
      const status = document.getElementById('ex-quick-status');
      if (status) status.textContent = `Active slide: ${index + 1}`;
    });
  }
}

// Alignment playground
{
  const root = document.getElementById('ex-align');
  const codeId = 'ex-align-code';
  if (root) {
    let align = 'start';
    let slider = new Unswipe(root, { align, label: 'Alignment demo' });

    const render = () => {
      setCode(
        codeId,
        `const slider = new Unswipe(root, {
  align: '${align}',
  label: 'Alignment demo',
});`,
      );
    };

    document.querySelectorAll('[data-align]').forEach((btn) => {
      btn.addEventListener('click', () => {
        align = btn.getAttribute('data-align') ?? 'start';
        document.querySelectorAll('[data-align]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        slider.destroy();
        slider = new Unswipe(root, { align, label: 'Alignment demo' });
        render();
      });
    });

    render();
  }
}

// Events playground
{
  const root = document.getElementById('ex-events');
  const logId = 'ex-events-log';
  if (root) {
    const slider = new Unswipe(root, { label: 'Events demo' });
    slider.on('select', ({ index, slide }) => {
      logEvent(
        logId,
        `select → index: ${index}, slide: "${slide.textContent}"`,
      );
    });
    slider.on('update', () => {
      logEvent(logId, 'update → slides re-scanned');
    });
  }
}

// Plugins playground
{
  const root = document.getElementById('ex-plugins');
  if (root) {
    const slider = new Unswipe(
      root,
      { align: 'start', label: 'Plugin demo', threshold: 0.6 },
      [navigation(), pagination(), autoplay({ delay: 4500 })],
    );
    void slider;
  }
}

// Mutations playground
{
  const root = document.getElementById('ex-mutate');
  const codeId = 'ex-mutate-code';
  if (root) {
    let count = root.children.length;
    const slider = new Unswipe(root, { label: 'Mutable carousel' });

    const render = () => {
      setCode(
        codeId,
        `const slide = document.createElement('div');
slide.className = 'docs-slide';
slide.textContent = 'Slide ${count}';
root.appendChild(slide);
slider.update();`,
      );
    };

    document.getElementById('ex-mutate-add')?.addEventListener('click', () => {
      count += 1;
      const slide = document.createElement('div');
      slide.className = 'docs-slide';
      slide.textContent = `Slide ${count}`;
      root.append(slide);
      slider.update();
      render();
    });

    document
      .getElementById('ex-mutate-remove')
      ?.addEventListener('click', () => {
        if (slider.slides.length <= 1) return;
        slider.slides[slider.slides.length - 1]?.remove();
        slider.update();
        render();
      });

    render();
  }
}

// Vertical playground
{
  const root = document.getElementById('ex-vertical');
  if (root) {
    new Unswipe(root, {
      axis: 'y',
      align: 'start',
      label: 'Timeline',
    });
  }
}

// Custom selector playground
{
  const root = document.getElementById('ex-selector');
  if (root) {
    new Unswipe(root, {
      slide: '.article-slide',
      label: 'Articles',
    });
  }
}

// Programmatic API playground
{
  const root = document.getElementById('ex-api');
  const status = document.getElementById('ex-api-status');
  if (root) {
    const slider = new Unswipe(root, { label: 'API controls' });

    slider.on('select', ({ index }) => {
      if (status) status.textContent = `slider.index === ${index}`;
    });

    document.getElementById('ex-api-prev')?.addEventListener('click', () => {
      slider.prev();
    });
    document.getElementById('ex-api-next')?.addEventListener('click', () => {
      slider.next();
    });
    document.getElementById('ex-api-jump')?.addEventListener('click', () => {
      slider.scrollToIndex(2, 'smooth');
    });
  }
}
