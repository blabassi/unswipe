import { describe, expect, it } from 'vitest';
import { Unswipe } from './index.js';

describe('package exports', () => {
  it('re-exports the Unswipe constructor', () => {
    expect(typeof Unswipe).toBe('function');
  });
});
