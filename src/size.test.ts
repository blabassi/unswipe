import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

describe('bundle size budget', () => {
  it('keeps the minified core at or below 8500 bytes', () => {
    const raw = readFileSync('dist/unswipe.js');
    expect(raw.length).toBeLessThanOrEqual(8500);
    expect(gzipSync(raw).length).toBeGreaterThan(0);
  });
});
