import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});
