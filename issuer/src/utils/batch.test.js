import { describe, it, expect } from 'vitest';
import { getZipFilename } from './batch.js';

describe('getZipFilename', () => {
  it('returns a string matching cards_YYYY-YYYY.zip format', () => {
    const filename = getZipFilename();
    expect(filename).toMatch(/^cards_\d{4}-\d{4}\.zip$/);
  });

  it('contains the current school year', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const filename = getZipFilename();

    if (month >= 8) {
      // Sep-Dec: current-next
      expect(filename).toBe(`cards_${year}-${year + 1}.zip`);
    } else {
      // Jan-Aug: previous-current
      expect(filename).toBe(`cards_${year - 1}-${year}.zip`);
    }
  });
});
