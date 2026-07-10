#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.SITE_URL ?? 'https://blabassi.github.io/unswipe/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(URL, { waitUntil: 'networkidle' });

const scrollY = () => page.evaluate(() => Math.round(window.scrollY));

console.log('Initial scrollY:', await scrollY());

// Scroll well past the autoplay featured demo
await page.evaluate(() => window.scrollTo(0, 2400));
await page.waitForTimeout(500);
const afterScroll = await scrollY();
console.log('After manual scroll to ~2400:', afterScroll);

// Wait for autoplay interval (4500ms) + buffer
await page.waitForTimeout(5500);
const afterAutoplay = await scrollY();
console.log('After 5.5s (autoplay window):', afterAutoplay);
if (afterAutoplay < afterScroll - 50) {
  console.log(
    'FAIL: page scrolled back up by',
    afterScroll - afterAutoplay,
    'px',
  );
}

// Scroll to controls section and click scrollToIndex
await page.evaluate(() =>
  document.getElementById('controls')?.scrollIntoView(),
);
await page.waitForTimeout(500);
const beforeClick = await scrollY();
await page.click('#ex-api-jump');
await page.waitForTimeout(800);
const afterClick = await scrollY();
console.log(
  'Before/after scrollToIndex(2) click:',
  beforeClick,
  '->',
  afterClick,
);
if (Math.abs(afterClick - beforeClick) > 80) {
  console.log('FAIL: page jumped on scrollToIndex button');
}

// Swipe carousel horizontally - check page scrollY during interaction
await page.evaluate(() => window.scrollTo(0, 1200));
await page.waitForTimeout(300);
const beforeSwipe = await scrollY();
const carousel = page.locator('#ex-quick');
const box = await carousel.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, {
    steps: 10,
  });
  await page.mouse.up();
}
await page.waitForTimeout(500);
const afterSwipe = await scrollY();
console.log('Before/after carousel swipe:', beforeSwipe, '->', afterSwipe);
if (Math.abs(afterSwipe - beforeSwipe) > 30) {
  console.log('FAIL: page vertical scroll changed during horizontal swipe');
}

// TOC click
await page.evaluate(() => window.scrollTo(0, 3000));
await page.waitForTimeout(300);
const beforeToc = await scrollY();
await page.click('.toc a[href="#intro"]');
await page.waitForTimeout(800);
const afterToc = await scrollY();
console.log('Before/after TOC click to intro:', beforeToc, '->', afterToc);

// Check programmatic scrollToIndex does not move the page
const progTest = await page.evaluate(async () => {
  window.scrollTo(0, 2400);
  const before = window.scrollY;
  const root = document.getElementById('ex-featured');
  const slide = root?.children[2];
  if (!root || !slide) return null;
  const max = Math.max(0, root.scrollWidth - root.clientWidth);
  root.scrollTo({ left: Math.min(slide.offsetLeft, max), behavior: 'instant' });
  const after = window.scrollY;
  return { before, after, delta: after - before };
});
console.log('root.scrollTo on featured (same as Unswipe.go):', progTest);
if (progTest && Math.abs(progTest.delta) > 5) {
  console.log('FAIL: root.scrollTo moved the page');
}

// Legacy scrollIntoView still moves page (why nearest was not a fix)
const legacyTest = await page.evaluate(() => {
  window.scrollTo(0, 2400);
  const before = window.scrollY;
  document.getElementById('ex-featured')?.children[2]?.scrollIntoView({
    behavior: 'instant',
    block: 'nearest',
    inline: 'nearest',
  });
  return { before, after: window.scrollY, delta: window.scrollY - before };
});
console.log('scrollIntoView nearest (broken legacy):', legacyTest);

await browser.close();
