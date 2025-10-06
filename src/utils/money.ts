/**
 * Money utilities for Budgeto
 * All amounts are stored as integers in øre (1 kr = 100 øre)
 */

import type { DKK_ore } from '../types';

export type { DKK_ore };

/**
 * Konverterer kroner (med decimaler) til øre (heltal)
 * @param kroner - Beløb i kroner (fx 123.45)
 * @returns Beløb i øre (fx 12345)
 */
export function kronerTilOre(kroner: number): DKK_ore {
  return Math.round(kroner * 100);
}

/**
 * Konverterer øre (heltal) til kroner (med decimaler)
 * @param ore - Beløb i øre (fx 12345)
 * @returns Beløb i kroner (fx 123.45)
 */
export function oreTilKroner(ore: DKK_ore): number {
  return ore / 100;
}

/**
 * Formaterer beløb i øre til DKK-format med tusind-separatorer
 * @param ore - Beløb i øre
 * @param includeCurrency - Om currency symbol skal inkluderes (default: true)
 * @param locale - Locale for formatering ('da' eller 'en', default: 'da')
 * @returns Formateret string (fx "12.345,67 kr" (da) eller "DKK 12,345.67" (en))
 */
export function formatDKK(
  ore: DKK_ore,
  includeCurrency = true,
  locale: 'da' | 'en' = 'da'
): string {
  const kroner = oreTilKroner(ore);

  const localeString = locale === 'da' ? 'da-DK' : 'en-US';
  const formatted = new Intl.NumberFormat(localeString, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kroner);

  if (!includeCurrency) return formatted;

  // Dansk: "123,45 kr"
  // Engelsk: "DKK 123.45"
  return locale === 'da' ? `${formatted} kr` : `DKK ${formatted}`;
}

/**
 * Parser dansk DKK-input til øre
 * Accepterer formater som: "1234,56", "1.234,56", "1234.56" osv.
 * @param input - String med beløb
 * @returns Beløb i øre eller null ved fejl
 */
export function parseDKK(input: string): DKK_ore | null {
  if (!input || input.trim() === '') return null;

  // Fjern "kr", whitespace og andre ikke-numeriske tegn (bortset fra , . -)
  let cleaned = input
    .replace(/kr\.?/gi, '')
    .replace(/\s/g, '')
    .trim();

  // Håndter negativt fortegn
  const isNegative = cleaned.startsWith('-');
  if (isNegative) {
    cleaned = cleaned.substring(1);
  }

  // Håndter dansk format: sidste komma/punktum er decimal separator
  // Find sidste komma eller punktum
  const lastCommaIdx = cleaned.lastIndexOf(',');
  const lastDotIdx = cleaned.lastIndexOf('.');

  let decimalPart = '00';
  let integerPart = cleaned;

  if (lastCommaIdx > lastDotIdx && lastCommaIdx !== -1) {
    // Komma er decimal separator
    integerPart = cleaned.substring(0, lastCommaIdx).replace(/[.,]/g, '');
    decimalPart = cleaned.substring(lastCommaIdx + 1);
  } else if (lastDotIdx !== -1) {
    // Punktum er decimal separator
    integerPart = cleaned.substring(0, lastDotIdx).replace(/[.,]/g, '');
    decimalPart = cleaned.substring(lastDotIdx + 1);
  } else {
    // Ingen decimal separator
    integerPart = cleaned.replace(/[.,]/g, '');
  }

  // Sørg for at decimal har præcis 2 cifre
  if (decimalPart.length === 1) {
    decimalPart += '0';
  } else if (decimalPart.length > 2) {
    decimalPart = decimalPart.substring(0, 2);
  }

  const numberStr = integerPart + decimalPart;
  const ore = parseInt(numberStr, 10);

  if (isNaN(ore)) return null;

  return isNegative ? -ore : ore;
}
