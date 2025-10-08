/**
 * Mock Data Generator for Dev Mode
 * Genererer realistic test data til udvikling
 */

import type { FixedEntry, VariableEntry, Currency } from '../types';
import { nowInCopenhagen } from './date';

/**
 * Genererer mock data til dev mode
 */
export function generateMockData(): {
  faste: FixedEntry[];
  variable: VariableEntry[];
} {
  const now = nowInCopenhagen();

  // Faste posteringer (månedsvis)
  const faste: FixedEntry[] = [
    // Indtægter
    {
      id: 'mock-lon',
      type: 'indtægt',
      kategoriId: 'lon',
      beloeb_ore: 3500000, // 35.000 kr
      beloeb: { amount: 3500000, currency: 'DKK' },
      note: 'Månedsløn',
    },

    // Udgifter
    {
      id: 'mock-husleje',
      type: 'udgift',
      kategoriId: 'bolig',
      underkategoriId: 'husleje',
      beloeb_ore: 850000, // 8.500 kr
      beloeb: { amount: 850000, currency: 'DKK' },
      note: 'Husleje inkl. aconto',
    },
    {
      id: 'mock-el',
      type: 'udgift',
      kategoriId: 'bolig',
      underkategoriId: 'el',
      beloeb_ore: 45000, // 450 kr
      beloeb: { amount: 45000, currency: 'DKK' },
    },
    {
      id: 'mock-internet',
      type: 'udgift',
      kategoriId: 'bolig',
      underkategoriId: 'internet',
      beloeb_ore: 29900, // 299 kr
      beloeb: { amount: 29900, currency: 'DKK' },
      note: 'Fibernet 1000/1000',
    },
    {
      id: 'mock-streaming-netflix',
      type: 'udgift',
      kategoriId: 'fritid',
      underkategoriId: 'streaming',
      beloeb_ore: 11900, // 119 kr
      beloeb: { amount: 11900, currency: 'DKK' },
      note: 'Netflix Premium',
    },
    {
      id: 'mock-streaming-spotify',
      type: 'udgift',
      kategoriId: 'fritid',
      underkategoriId: 'streaming',
      beloeb_ore: 9900, // 99 kr
      beloeb: { amount: 9900, currency: 'DKK' },
      note: 'Spotify Family',
    },
    {
      id: 'mock-sport-fitness',
      type: 'udgift',
      kategoriId: 'fritid',
      underkategoriId: 'sport',
      beloeb_ore: 39900, // 399 kr
      beloeb: { amount: 39900, currency: 'DKK' },
      note: 'Fitness World',
    },
  ];

  // Variable posteringer (spredt over måneden)
  const variable: VariableEntry[] = [];
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  // Data templates til variable posteringer
  const templates: Array<{
    kategoriId: string;
    underkategoriId?: string;
    type: 'indtægt' | 'udgift';
    minAmount: number;
    maxAmount: number;
    currency: Currency;
    notes?: string[];
  }> = [
    // Mad & Dagligvarer
    {
      kategoriId: 'mad',
      underkategoriId: 'dagligvarer',
      type: 'udgift',
      minAmount: 15000,
      maxAmount: 45000,
      currency: 'DKK',
      notes: ['Netto', 'Rema 1000', 'Føtex', 'Aldi', 'Lidl'],
    },
    // Restaurant
    {
      kategoriId: 'mad',
      underkategoriId: 'restaurant',
      type: 'udgift',
      minAmount: 20000,
      maxAmount: 85000,
      currency: 'DKK',
      notes: [
        'Middag med venner',
        'Sushi',
        'Pizza',
        'Burger',
        'Thai takeaway',
      ],
    },
    // Cafe
    {
      kategoriId: 'mad',
      underkategoriId: 'cafe',
      type: 'udgift',
      minAmount: 3500,
      maxAmount: 7500,
      currency: 'DKK',
      notes: ['Kaffe', 'Latte', 'Morgenmad'],
    },
    // Benzin
    {
      kategoriId: 'transport',
      underkategoriId: 'benzin',
      type: 'udgift',
      minAmount: 40000,
      maxAmount: 65000,
      currency: 'DKK',
      notes: ['Shell', 'Q8', 'Circle K', 'OKQ8'],
    },
    // Kollektiv trafik
    {
      kategoriId: 'transport',
      underkategoriId: 'kollektiv',
      type: 'udgift',
      minAmount: 2400,
      maxAmount: 4800,
      currency: 'DKK',
      notes: ['Rejsekort', 'Bus', 'Metro'],
    },
    // Parkering
    {
      kategoriId: 'transport',
      underkategoriId: 'parkering',
      type: 'udgift',
      minAmount: 2000,
      maxAmount: 8000,
      currency: 'DKK',
      notes: ['P-billet', 'Parkeringshus'],
    },
    // Tøj
    {
      kategoriId: 'shopping',
      underkategoriId: 'toj',
      type: 'udgift',
      minAmount: 15000,
      maxAmount: 75000,
      currency: 'DKK',
      notes: ['H&M', 'Zara', 'Uniqlo', 'Jack & Jones'],
    },
    // Elektronik
    {
      kategoriId: 'shopping',
      underkategoriId: 'elektronik',
      type: 'udgift',
      minAmount: 30000,
      maxAmount: 400000,
      currency: 'DKK',
      notes: ['Elgiganten', 'Power', 'Computersalg'],
    },
    // Diverse shopping
    {
      kategoriId: 'shopping',
      underkategoriId: 'diverse',
      type: 'udgift',
      minAmount: 5000,
      maxAmount: 25000,
      currency: 'DKK',
    },
    // Hobby
    {
      kategoriId: 'fritid',
      underkategoriId: 'hobby',
      type: 'udgift',
      minAmount: 10000,
      maxAmount: 50000,
      currency: 'DKK',
      notes: ['Materialekøb', 'Bog', 'Spil'],
    },
    // Apotek
    {
      kategoriId: 'sundhed',
      underkategoriId: 'apotek',
      type: 'udgift',
      minAmount: 5000,
      maxAmount: 25000,
      currency: 'DKK',
      notes: ['Apoteket', 'Matas'],
    },
    // Multi-currency eksempler
    {
      kategoriId: 'mad',
      underkategoriId: 'restaurant',
      type: 'udgift',
      minAmount: 2500,
      maxAmount: 8000,
      currency: 'EUR',
      notes: ['Paris restaurant', 'Berlin cafe', 'Ferie middag'],
    },
    {
      kategoriId: 'shopping',
      underkategoriId: 'elektronik',
      type: 'udgift',
      minAmount: 5000,
      maxAmount: 50000,
      currency: 'USD',
      notes: ['Amazon.com', 'eBay'],
    },
  ];

  // Generer 35-45 variable posteringer
  const numEntries = Math.floor(Math.random() * 11) + 35;

  for (let i = 0; i < numEntries; i++) {
    // Vælg random template
    const template = templates[Math.floor(Math.random() * templates.length)];
    if (!template) continue;

    // Generer random dag i måneden (kun dage der er passeret)
    const day = Math.floor(Math.random() * Math.min(currentDay, daysInMonth)) + 1;
    const hour = Math.floor(Math.random() * 14) + 8; // 8-22
    const minute = Math.floor(Math.random() * 60);

    const timestamp = new Date(
      now.getFullYear(),
      now.getMonth(),
      day,
      hour,
      minute
    ).getTime();

    // Generer random beløb
    const amount =
      Math.floor(
        Math.random() * (template.maxAmount - template.minAmount + 1)
      ) + template.minAmount;

    // Vælg random note hvis tilgængelig
    const note =
      template.notes && Math.random() > 0.5
        ? template.notes[Math.floor(Math.random() * template.notes.length)]
        : undefined;

    // Konverter til DKK_ore for beloeb_ore felt (legacy)
    let beloeb_ore = amount;
    if (template.currency === 'EUR') {
      beloeb_ore = Math.floor(amount * 7.46); // EUR til DKK
    } else if (template.currency === 'USD') {
      beloeb_ore = Math.floor(amount * 6.9); // USD til DKK
    }

    variable.push({
      id: `mock-var-${i}-${Date.now()}`,
      type: template.type,
      kategoriId: template.kategoriId,
      underkategoriId: template.underkategoriId,
      beloeb_ore,
      beloeb: {
        amount,
        currency: template.currency,
      },
      note,
      timestamp,
      geo: null,
    });
  }

  // Sorter variable posteringer efter timestamp (nyeste først)
  variable.sort((a, b) => b.timestamp - a.timestamp);

  return { faste, variable };
}
