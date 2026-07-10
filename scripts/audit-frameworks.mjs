#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.SITE_URL ?? 'http://localhost:4173/unswipe/';
const TIMEOUT = Number(process.env.FRAMEWORK_TIMEOUT ?? 20000);

const browser = await chromium.launch();
const page = await browser.newPage();
const failures = [];

await page.goto(URL + 'guides/frameworks/', { waitUntil: 'networkidle' });

async function checkCarousel(name, targetSelector) {
  try {
    // Starlight tabs hide inactive panels — open the matching tab first
    const tab = page.getByRole('tab', { name: new RegExp(name, 'i') });
    if (await tab.count()) {
      await tab.first().click();
      await page.waitForTimeout(200);
    }

    const target = page.locator(targetSelector).first();
    await target.waitFor({ state: 'visible', timeout: TIMEOUT });

    const info = await target.evaluate((el) => {
      const style = getComputedStyle(el);
      const slides = [...el.children].filter(
        (child) =>
          child.classList?.contains('slide') ||
          child.getAttribute('aria-roledescription') === 'slide',
      );
      return {
        role: el.getAttribute('role'),
        display: style.display,
        slideCount: slides.length,
        gap: style.gap,
        width: Math.round(el.getBoundingClientRect().width),
      };
    });

    if (info.role !== 'carousel') {
      failures.push(`${name}: expected role=carousel, got ${info.role}`);
    }
    if (info.display !== 'flex') {
      failures.push(`${name}: expected display:flex, got ${info.display}`);
    }
    if (info.slideCount < 3) {
      failures.push(`${name}: expected ≥3 slides, got ${info.slideCount}`);
    }
    if (info.width < 100) {
      failures.push(`${name}: carousel too narrow (${info.width}px)`);
    }

    console.log(
      `${name.padEnd(16)} role=${info.role} display=${info.display} slides=${info.slideCount} gap=${info.gap} width=${info.width}px`,
    );
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : error}`);
    console.log(`${name.padEnd(16)} FAIL`);
  }
}

await checkCarousel('Web Component', 'unswipe-carousel.carousel');
await checkCarousel('React', '#ex-react .carousel');
await checkCarousel('Vue', '#ex-vue .carousel');
await checkCarousel('Svelte', '#ex-svelte .carousel');

for (const id of [
  'ex-wc-status',
  'ex-react-status',
  'ex-vue-status',
  'ex-svelte-status',
]) {
  const el = page.locator(`#${id}`);
  if ((await el.count()) === 0) continue;
  const text = await el.innerText();
  if (/mounting/i.test(text)) {
    failures.push(`${id}: still shows mounting state (${text})`);
  } else {
    console.log(`${id.padEnd(16)} ${text}`);
  }
}

await browser.close();

if (failures.length) {
  console.error('\nFramework demo failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nPASS: framework demos render');
