import { describe, it, expect } from 'vitest';
import { shouldResetVariable, firstDayOfMonth } from './date';

describe('date utilities', () => {
  describe('firstDayOfMonth', () => {
    it('returnerer første dag i måneden', () => {
      const result = firstDayOfMonth(new Date('2025-10-15'));
      const parsed = new Date(result);

      expect(parsed.getDate()).toBe(1);
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
      expect(parsed.getSeconds()).toBe(0);
    });
  });

  describe('shouldResetVariable', () => {
    it('returnerer false hvis sidsteResetISO er null', () => {
      expect(shouldResetVariable(null)).toBe(false);
    });

    it('returnerer false hvis samme måned', () => {
      const now = new Date();
      const lastReset = firstDayOfMonth(now);
      expect(shouldResetVariable(lastReset)).toBe(false);
    });

    it('returnerer true hvis ny måned', () => {
      // Simuler sidste reset var i september
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastReset = firstDayOfMonth(lastMonth);

      expect(shouldResetVariable(lastReset)).toBe(true);
    });

    it('returnerer true hvis nyt år', () => {
      // Simuler sidste reset var sidste år
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      const lastReset = firstDayOfMonth(lastYear);

      expect(shouldResetVariable(lastReset)).toBe(true);
    });
  });
});
