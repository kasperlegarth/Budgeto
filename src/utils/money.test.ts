import { describe, it, expect } from 'vitest';
import {
  kronerTilOre,
  oreTilKroner,
  formatDKK,
  parseDKK,
  toMinorUnits,
  toMajorUnits,
  formatMoney,
  parseMoney,
  convertCurrency,
  getCurrencyInfo,
  getExchangeRate,
} from './money';

describe('money utilities', () => {
  describe('kronerTilOre', () => {
    it('konverterer kroner til øre korrekt', () => {
      expect(kronerTilOre(100)).toBe(10000);
      expect(kronerTilOre(123.45)).toBe(12345);
      expect(kronerTilOre(0.01)).toBe(1);
      expect(kronerTilOre(0)).toBe(0);
    });

    it('runder korrekt ved floating point unøjagtigheder', () => {
      expect(kronerTilOre(0.1 + 0.2)).toBe(30); // 0.30000000000000004 -> 30
    });
  });

  describe('oreTilKroner', () => {
    it('konverterer øre til kroner korrekt', () => {
      expect(oreTilKroner(10000)).toBe(100);
      expect(oreTilKroner(12345)).toBe(123.45);
      expect(oreTilKroner(1)).toBe(0.01);
      expect(oreTilKroner(0)).toBe(0);
    });
  });

  describe('formatDKK', () => {
    it('formaterer beløb korrekt med tusind-separatorer', () => {
      expect(formatDKK(12345)).toBe('123,45 kr');
      expect(formatDKK(1234567)).toBe('12.345,67 kr');
      expect(formatDKK(100)).toBe('1,00 kr');
      expect(formatDKK(0)).toBe('0,00 kr');
    });

    it('formaterer uden valuta når includeCurrency er false', () => {
      expect(formatDKK(12345, false)).toBe('123,45');
    });

    it('håndterer negative beløb', () => {
      expect(formatDKK(-12345)).toBe('-123,45 kr');
    });
  });

  describe('parseDKK', () => {
    it('parser dansk format korrekt', () => {
      expect(parseDKK('123,45')).toBe(12345);
      expect(parseDKK('1.234,56')).toBe(123456);
      expect(parseDKK('12.345,67')).toBe(1234567);
    });

    it('parser engelsk format korrekt', () => {
      expect(parseDKK('123.45')).toBe(12345);
      expect(parseDKK('1,234.56')).toBe(123456);
    });

    it('parser beløb uden decimaler', () => {
      expect(parseDKK('100')).toBe(10000);
      expect(parseDKK('1234')).toBe(123400);
    });

    it('håndterer "kr" suffix', () => {
      expect(parseDKK('123,45 kr')).toBe(12345);
      expect(parseDKK('123,45kr')).toBe(12345);
      expect(parseDKK('123,45 Kr')).toBe(12345);
    });

    it('håndterer negative beløb', () => {
      expect(parseDKK('-123,45')).toBe(-12345);
      expect(parseDKK('-1.234,56 kr')).toBe(-123456);
    });

    it('håndterer whitespace', () => {
      expect(parseDKK('  123,45  ')).toBe(12345);
      expect(parseDKK('1 234,56')).toBe(123456);
    });

    it('returnerer null ved ugyldigt input', () => {
      expect(parseDKK('')).toBe(null);
      expect(parseDKK('   ')).toBe(null);
      expect(parseDKK('abc')).toBe(null);
    });

    it('håndterer én decimal korrekt', () => {
      expect(parseDKK('123,5')).toBe(12350);
    });
  });

  describe('toMinorUnits', () => {
    it('konverterer til minor units for DKK', () => {
      expect(toMinorUnits(100, 'DKK')).toBe(10000);
      expect(toMinorUnits(123.45, 'DKK')).toBe(12345);
    });

    it('konverterer til minor units for EUR', () => {
      expect(toMinorUnits(100, 'EUR')).toBe(10000);
      expect(toMinorUnits(50.99, 'EUR')).toBe(5099);
    });

    it('konverterer til minor units for USD', () => {
      expect(toMinorUnits(25.50, 'USD')).toBe(2550);
    });
  });

  describe('toMajorUnits', () => {
    it('konverterer til major units for DKK', () => {
      expect(toMajorUnits(10000, 'DKK')).toBe(100);
      expect(toMajorUnits(12345, 'DKK')).toBe(123.45);
    });

    it('konverterer til major units for EUR', () => {
      expect(toMajorUnits(5099, 'EUR')).toBe(50.99);
    });
  });

  describe('formatMoney', () => {
    it('formaterer DKK korrekt (dansk locale)', () => {
      expect(formatMoney({ amount: 12345, currency: 'DKK' }, true, 'da')).toBe('123,45 kr');
      expect(formatMoney({ amount: 100000, currency: 'DKK' }, true, 'da')).toBe('1.000,00 kr');
    });

    it('formaterer EUR korrekt (dansk locale)', () => {
      expect(formatMoney({ amount: 12345, currency: 'EUR' }, true, 'da')).toBe('€123,45');
      expect(formatMoney({ amount: 100000, currency: 'EUR' }, true, 'da')).toBe('€1.000,00');
    });

    it('formaterer USD korrekt (engelsk locale)', () => {
      expect(formatMoney({ amount: 12345, currency: 'USD' }, true, 'en')).toBe('$123.45');
      expect(formatMoney({ amount: 100000, currency: 'USD' }, true, 'en')).toBe('$1,000.00');
    });

    it('formaterer GBP korrekt (engelsk locale)', () => {
      expect(formatMoney({ amount: 12345, currency: 'GBP' }, true, 'en')).toBe('£123.45');
    });

    it('formaterer SEK korrekt (dansk locale)', () => {
      expect(formatMoney({ amount: 12345, currency: 'SEK' }, true, 'da')).toBe('123,45 kr');
    });

    it('formaterer uden currency symbol', () => {
      expect(formatMoney({ amount: 12345, currency: 'EUR' }, false, 'da')).toBe('123,45');
    });
  });

  describe('parseMoney', () => {
    it('parser DKK korrekt', () => {
      expect(parseMoney('123,45', 'DKK')).toEqual({ amount: 12345, currency: 'DKK' });
      expect(parseMoney('1.234,56', 'DKK')).toEqual({ amount: 123456, currency: 'DKK' });
    });

    it('parser EUR korrekt', () => {
      expect(parseMoney('€123,45', 'EUR')).toEqual({ amount: 12345, currency: 'EUR' });
      expect(parseMoney('123.45', 'EUR')).toEqual({ amount: 12345, currency: 'EUR' });
    });

    it('parser USD korrekt', () => {
      // USD bruger punktum som decimal separator
      expect(parseMoney('123.45', 'USD')).toEqual({ amount: 12345, currency: 'USD' });
      expect(parseMoney('1234.56', 'USD')).toEqual({ amount: 123456, currency: 'USD' });
    });

    it('parser GBP korrekt', () => {
      expect(parseMoney('50.99', 'GBP')).toEqual({ amount: 5099, currency: 'GBP' });
      expect(parseMoney('£50.99', 'GBP')).toEqual({ amount: 5099, currency: 'GBP' });
    });

    it('returnerer null ved ugyldigt input', () => {
      expect(parseMoney('', 'DKK')).toBe(null);
      expect(parseMoney('abc', 'EUR')).toBe(null);
    });
  });

  describe('getCurrencyInfo', () => {
    it('returnerer korrekt info for DKK', () => {
      const info = getCurrencyInfo('DKK');
      expect(info.code).toBe('DKK');
      expect(info.symbol).toBe('kr');
      expect(info.minorUnits).toBe(2);
      expect(info.symbolPosition).toBe('after');
    });

    it('returnerer korrekt info for EUR', () => {
      const info = getCurrencyInfo('EUR');
      expect(info.code).toBe('EUR');
      expect(info.symbol).toBe('€');
      expect(info.minorUnits).toBe(2);
      expect(info.symbolPosition).toBe('before');
    });

    it('returnerer korrekt info for USD', () => {
      const info = getCurrencyInfo('USD');
      expect(info.code).toBe('USD');
      expect(info.symbol).toBe('$');
      expect(info.minorUnits).toBe(2);
    });
  });

  describe('convertCurrency', () => {
    it('returnerer samme beløb ved samme valuta', () => {
      const money = { amount: 10000, currency: 'DKK' as const };
      expect(convertCurrency(money, 'DKK')).toEqual(money);
    });

    it('konverterer DKK til EUR', () => {
      const money = { amount: 10000, currency: 'DKK' as const }; // 100 DKK
      const result = convertCurrency(money, 'EUR');
      expect(result.currency).toBe('EUR');
      expect(result.amount).toBeGreaterThan(0);
      // 100 DKK ≈ 13.4 EUR (1340 cents)
      expect(result.amount).toBeCloseTo(1340, -2);
    });

    it('konverterer EUR til DKK', () => {
      const money = { amount: 10000, currency: 'EUR' as const }; // 100 EUR
      const result = convertCurrency(money, 'DKK');
      expect(result.currency).toBe('DKK');
      expect(result.amount).toBeGreaterThan(10000); // EUR er mere værd end DKK
    });

    it('konverterer USD til GBP', () => {
      const money = { amount: 10000, currency: 'USD' as const }; // 100 USD
      const result = convertCurrency(money, 'GBP');
      expect(result.currency).toBe('GBP');
      expect(result.amount).toBeGreaterThan(0);
    });
  });

  describe('getExchangeRate', () => {
    it('returnerer 1 for samme valuta', () => {
      expect(getExchangeRate('DKK', 'DKK')).toBe(1);
      expect(getExchangeRate('EUR', 'EUR')).toBe(1);
    });

    it('returnerer korrekt rate mellem valutaer', () => {
      const rate = getExchangeRate('DKK', 'EUR');
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(1); // DKK er mindre værd end EUR

      const reverseRate = getExchangeRate('EUR', 'DKK');
      expect(reverseRate).toBeGreaterThan(1); // EUR er mere værd end DKK
    });

    it('inverse rates ganger til cirka 1', () => {
      const rate1 = getExchangeRate('DKK', 'USD');
      const rate2 = getExchangeRate('USD', 'DKK');
      expect(rate1 * rate2).toBeCloseTo(1, 5);
    });
  });
});
