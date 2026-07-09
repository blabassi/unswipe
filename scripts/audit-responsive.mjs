#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.SITE_URL ?? 'http://localhost:4173/';
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
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - doc.clientWidth;
    const offenders = [];

    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.carousel, unswipe-carousel, .toc--side ul, pre'))
        continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const right = rect.right;
      const left = rect.left;
      const vw = window.innerWidth;
      if (right > vw + 1 || left < -1) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const cls =
          el.className && typeof el.className === 'string'
            ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
            : '';
        offenders.push({
          selector: `${tag}${id}${cls}`,
          left: Math.round(left),
          right: Math.round(right),
          vw,
        });
      }
    }

    return {
      overflow: Math.round(overflow),
      offenders: offenders.slice(0, 8),
      tocVisible: !!document.querySelector('.toc--side'),
      playgroundCount: document.querySelectorAll('.playground').length,
    };
  });

  if (metrics.overflow > 0 || metrics.offenders.length > 0) {
    issues.push({
      viewport: vp.name,
      size: `${vp.width}x${vp.height}`,
      ...metrics,
    });
  }

  console.log(
    `${vp.name.padEnd(16)} ${vp.width}x${vp.height}  overflow=${metrics.overflow}px  offenders=${metrics.offenders.length}`,
  );
}

await browser.close();

if (issues.length) {
  console.log('\nIssues found:');
  console.log(JSON.stringify(issues, null, 2));
  process.exit(1);
}

console.log('\nAll viewports OK');
