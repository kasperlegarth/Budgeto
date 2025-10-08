/**
 * useCurrency composable
 * Håndterer valuta-switching med integration til AppState
 */

import { ref, computed } from 'vue';
import type { Currency } from '../types';
import { getAppState, saveAppState } from '../utils/storage';
import { getCurrencyInfo, convertCurrency } from '../utils/money';

// Global reactive state
const currentCurrency = ref<Currency>('DKK');

/**
 * Initialiserer currency fra AppState
 */
function initCurrency(): Currency {
  const state = getAppState();
  return state?.defaultCurrency || 'DKK';
}

// Initialize on first import
let initialized = false;

function initialize() {
  if (!initialized) {
    initialized = true;
    currentCurrency.value = initCurrency();
  }
}

/**
 * Liste over understøttede valutaer med info
 */
export const SUPPORTED_CURRENCIES: Currency[] = ['DKK', 'EUR', 'USD', 'GBP', 'SEK', 'NOK'];

export function useCurrency() {
  // Initialize on first call
  initialize();

  /**
   * Sætter default currency og gemmer til AppState
   * Konverterer alle eksisterende entries til den nye valuta
   */
  function setCurrency(currency: Currency) {
    const state = getAppState();
    if (state) {
      const oldCurrency = state.defaultCurrency || 'DKK';

      // Hvis valutaen er den samme, gør ingenting
      if (oldCurrency === currency) return;

      // Konverter alle faste entries
      state.faste = state.faste.map((entry) => {
        if (entry.beloeb) {
          const convertedMoney = convertCurrency(entry.beloeb, currency);
          return {
            ...entry,
            beloeb: convertedMoney,
            beloeb_ore: convertedMoney.amount, // Opdater legacy felt også
          };
        }
        return entry;
      });

      // Konverter alle variable entries
      state.variable = state.variable.map((entry) => {
        if (entry.beloeb) {
          const convertedMoney = convertCurrency(entry.beloeb, currency);
          return {
            ...entry,
            beloeb: convertedMoney,
            beloeb_ore: convertedMoney.amount, // Opdater legacy felt også
          };
        }
        return entry;
      });

      // Opdater default currency
      state.defaultCurrency = currency;
      saveAppState(state);
      currentCurrency.value = currency;
      console.log(`Currency skiftet fra ${oldCurrency} til ${currency} - alle beløb omregnet`);
    }
  }

  /**
   * Henter currency info for en given currency
   */
  function getCurrencyMeta(currency: Currency) {
    return getCurrencyInfo(currency);
  }

  /**
   * Henter liste af alle understøttede valutaer med metadata
   */
  const supportedCurrencies = computed(() => {
    return SUPPORTED_CURRENCIES.map((currency) => getCurrencyInfo(currency));
  });

  return {
    currentCurrency,
    setCurrency,
    getCurrencyMeta,
    supportedCurrencies,
  };
}
