/**
 * Money utilities for Budgeto
 * All amounts are stored as integers in minor units (øre, cents, etc.)
 */

import type { Currency, Money, DKK_ore } from '../types';

export type { DKK_ore, Money, Currency };

/**
 * Currency info for formatting and conversion
 */
export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  minorUnits: number; // Antal decimaler (2 for de fleste, 0 for JPY, osv.)
  symbolPosition: 'before' | 'after';
  decimalSeparator: string;
  thousandSeparator: string;
}

/**
 * Currency information database
 */
const CURRENCY_INFO: Record<Currency, CurrencyInfo> = {
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    name: 'Danske kroner',
    minorUnits: 2,
    symbolPosition: 'after',
    decimalSeparator: ',',
    thousandSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    minorUnits: 2,
    symbolPosition: 'before',
    decimalSeparator: ',',
    thousandSeparator: '.',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    minorUnits: 2,
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'Britiske pund',
    minorUnits: 2,
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Svenske kroner',
    minorUnits: 2,
    symbolPosition: 'after',
    decimalSeparator: ',',
    thousandSeparator: ' ',
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norske kroner',
    minorUnits: 2,
    symbolPosition: 'after',
    decimalSeparator: ',',
    thousandSeparator: ' ',
  },
};

/**
 * Fixed exchange rates (DKK som base)
 * Disse er hardcoded indtil live rates implementeres senere
 */
const FIXED_EXCHANGE_RATES: Record<Currency, number> = {
  DKK: 1,
  EUR: 0.134, // 1 DKK = 0.134 EUR (ca. 7.46 DKK per EUR)
  USD: 0.145, // 1 DKK = 0.145 USD (ca. 6.90 DKK per USD)
  GBP: 0.115, // 1 DKK = 0.115 GBP (ca. 8.70 DKK per GBP)
  SEK: 1.52, // 1 DKK = 1.52 SEK (ca. 0.66 DKK per SEK)
  NOK: 1.55, // 1 DKK = 1.55 NOK (ca. 0.65 DKK per NOK)
};

/**
 * Henter currency info
 */
export function getCurrencyInfo(currency: Currency): CurrencyInfo {
  return CURRENCY_INFO[currency];
}

/**
 * Konverterer major units (kroner, euros, etc.) til minor units (øre, cents, etc.)
 */
export function toMinorUnits(amount: number, currency: Currency): number {
  const info = getCurrencyInfo(currency);
  return Math.round(amount * Math.pow(10, info.minorUnits));
}

/**
 * Konverterer minor units (øre, cents, etc.) til major units (kroner, euros, etc.)
 */
export function toMajorUnits(amount: number, currency: Currency): number {
  const info = getCurrencyInfo(currency);
  return amount / Math.pow(10, info.minorUnits);
}

/**
 * Legacy: Konverterer kroner til øre (bevar for backward compatibility)
 */
export function kronerTilOre(kroner: number): DKK_ore {
  return toMinorUnits(kroner, 'DKK');
}

/**
 * Legacy: Konverterer øre til kroner (bevar for backward compatibility)
 */
export function oreTilKroner(ore: DKK_ore): number {
  return toMajorUnits(ore, 'DKK');
}

/**
 * Formaterer Money objekt til læsbar string
 */
export function formatMoney(
  money: Money,
  includeCurrency = true,
  locale: 'da' | 'en' = 'da'
): string {
  const info = getCurrencyInfo(money.currency);
  const majorUnits = toMajorUnits(money.amount, money.currency);

  const localeString = locale === 'da' ? 'da-DK' : 'en-US';
  const formatted = new Intl.NumberFormat(localeString, {
    minimumFractionDigits: info.minorUnits,
    maximumFractionDigits: info.minorUnits,
  }).format(majorUnits);

  if (!includeCurrency) return formatted;

  // Tilpas format baseret på currency og locale
  if (money.currency === 'DKK' || money.currency === 'SEK' || money.currency === 'NOK') {
    return `${formatted} ${info.symbol}`;
  } else {
    // EUR, USD, GBP vises som symbol før beløb
    return `${info.symbol}${formatted}`;
  }
}

/**
 * Legacy: Formaterer DKK_ore til DKK-format (bevar for backward compatibility)
 */
export function formatDKK(
  ore: DKK_ore,
  includeCurrency = true,
  locale: 'da' | 'en' = 'da'
): string {
  return formatMoney({ amount: ore, currency: 'DKK' }, includeCurrency, locale);
}

/**
 * Parser input string til Money objekt
 */
export function parseMoney(input: string, currency: Currency): Money | null {
  if (!input || input.trim() === '') return null;

  const info = getCurrencyInfo(currency);

  // Fjern currency symbol, whitespace og andre ikke-numeriske tegn
  let cleaned = input
    .replace(new RegExp(info.symbol, 'gi'), '')
    .replace(/\s/g, '')
    .trim();

  // Håndter negativt fortegn
  const isNegative = cleaned.startsWith('-');
  if (isNegative) {
    cleaned = cleaned.substring(1);
  }

  // Find sidste komma eller punktum (decimal separator)
  const lastCommaIdx = cleaned.lastIndexOf(',');
  const lastDotIdx = cleaned.lastIndexOf('.');

  let decimalPart = '0'.repeat(info.minorUnits);
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

  // Pad eller trim decimal part til korrekt antal cifre
  while (decimalPart.length < info.minorUnits) {
    decimalPart += '0';
  }
  if (decimalPart.length > info.minorUnits) {
    decimalPart = decimalPart.substring(0, info.minorUnits);
  }

  const numberStr = integerPart + decimalPart;
  const amount = parseInt(numberStr, 10);

  if (isNaN(amount)) return null;

  return {
    amount: isNegative ? -amount : amount,
    currency,
  };
}

/**
 * Legacy: Parser DKK input til øre (bevar for backward compatibility)
 */
export function parseDKK(input: string): DKK_ore | null {
  const money = parseMoney(input, 'DKK');
  return money ? money.amount : null;
}

/**
 * Konverterer beløb fra en valuta til en anden
 * Bruger fixed exchange rates indtil live rates implementeres
 */
export function convertCurrency(
  money: Money,
  targetCurrency: Currency
): Money {
  if (money.currency === targetCurrency) {
    return money;
  }

  // Konverter til DKK først, derefter til target currency
  const rateFromSource = FIXED_EXCHANGE_RATES[money.currency];
  const rateToTarget = FIXED_EXCHANGE_RATES[targetCurrency];

  const amountInDKK = money.amount / rateFromSource;
  const amountInTarget = amountInDKK * rateToTarget;

  return {
    amount: Math.round(amountInTarget),
    currency: targetCurrency,
  };
}

/**
 * Helper: Konverterer legacy DKK_ore til Money objekt
 */
export function dkkOreToMoney(ore: DKK_ore): Money {
  return {
    amount: ore,
    currency: 'DKK',
  };
}

/**
 * Helper: Konverterer Money objekt til DKK_ore (kun hvis currency er DKK)
 */
export function moneyToDkkOre(money: Money): DKK_ore {
  if (money.currency !== 'DKK') {
    throw new Error('Kan kun konvertere DKK Money til DKK_ore');
  }
  return money.amount;
}

/**
 * Henter exchange rate mellem to valutaer
 */
export function getExchangeRate(from: Currency, to: Currency): number {
  if (from === to) return 1;

  const rateFrom = FIXED_EXCHANGE_RATES[from];
  const rateTo = FIXED_EXCHANGE_RATES[to];

  return rateTo / rateFrom;
}
