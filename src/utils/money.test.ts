import { describe, it, expect } from 'vitest';
import { kronerTilOre, oreTilKroner, formatDKK, parseDKK } from './money';

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
});
