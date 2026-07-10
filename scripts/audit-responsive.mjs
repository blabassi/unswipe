#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.SITE_URL ?? 'http://localhost:4173/unswipe/';
const VIEWPORTS = [
  { name: 'iphone-se', width: 320, height: 568 },
  { name: 'iphone-14', width: 390, height: 844 },
  { name: 'pixel-7', width: 412, height: 915 },
  { name: 'ipad', width: 768, height: 1024 },
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1920, height: 1080 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
const issues = [];

for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const metrics = await page.evaluate(() => {
    const vw = window.innerWidth;
    const offenders = [];

    for (const el of document.querySelectorAll('body *')) {
      // Ignore intentional overflow: carousels, code, Starlight chrome/sidebar
      if (
        el.closest(
          '.carousel, unswipe-carousel, pre, code, .sidebar, nav, dialog, [aria-modal="true"], .social-icons, .sl-markdown-content table',
        )
      ) {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.right > vw + 1 || rect.left < -1) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const cls =
          el.className && typeof el.className === 'string'
            ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
            : '';
        offenders.push({
          selector: `${tag}${id}${cls}`,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          vw,
        });
      }
    }

    const main = document.querySelector('main') ?? document.documentElement;
    const mainOverflow = Math.max(0, main.scrollWidth - main.clientWidth);

    return {
      mainOverflow: Math.round(mainOverflow),
      offenders: offenders.slice(0, 8),
      playgroundCount: document.querySelectorAll('.carousel, unswipe-carousel')
        .length,
    };
  });

  // Fail only on concrete element overflow outside ignored regions
  if (metrics.offenders.length > 0) {
    issues.push({
      viewport: vp.name,
      size: `${vp.width}x${vp.height}`,
      ...metrics,
    });
  }

  console.log(
    `${vp.name.padEnd(16)} ${vp.width}x${vp.height}  mainOverflow=${metrics.mainOverflow}px  offenders=${metrics.offenders.length}`,
  );
}

await browser.close();

if (issues.length) {
  console.log('\nIssues found:');
  console.log(JSON.stringify(issues, null, 2));
  process.exit(1);
}

console.log('\nAll viewports OK');
