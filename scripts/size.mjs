#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const core = 'dist/unswipe.js';
const limit = 2048;

const raw = readFileSync(core);
const min = raw.length;
const gz = gzipSync(raw).length;

console.log(`Core bundle: ${min} bytes minified, ${gz} bytes gzipped`);
console.log(`Target: ≤ ${limit} bytes minified`);

if (min > limit) {
  console.error(
    `FAIL: core exceeds ${limit} byte budget by ${min - limit} bytes`,
  );
  process.exit(1);
}

console.log('PASS: core within budget');
