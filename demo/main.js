import { Unswipe } from './assets/unswipe.js';
import { autoplay } from './assets/plugins/autoplay.js';
import { navigation } from './assets/plugins/navigation.js';
import { pagination } from './assets/plugins/pagination.js';

const status = document.getElementById('status');
const carousel = document.getElementById('carousel');
const addBtn = document.getElementById('add-slide');
const removeBtn = document.getElementById('remove-slide');

let slideCount = carousel.children.length;

const slider = new Unswipe(
  carousel,
  { align: 'start', label: 'Featured items', threshold: 0.6 },
  [navigation(), pagination(), autoplay({ delay: 4500 })],
);

slider.on('select', ({ index }) => {
  status.textContent = `Active slide: ${index + 1} of ${slider.slides.length}`;
});

addBtn.addEventListener('click', () => {
  slideCount += 1;
  const slide = document.createElement('div');
  slide.className = 'slide';
  slide.textContent = `Dynamic slide ${slideCount}`;
  carousel.append(slide);
  slider.update();
  status.textContent = `Added slide — now ${slider.slides.length} total`;
});

removeBtn.addEventListener('click', () => {
  if (slider.slides.length <= 1) return;
  slider.slides[slider.slides.length - 1]?.remove();
  slider.update();
  status.textContent = `Removed slide — now ${slider.slides.length} total`;
});
