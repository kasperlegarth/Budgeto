/**
 * useLocale composable
 * Håndterer sprog-switching med localStorage persistence og auto-detection
 */

import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

export type Locale = 'da' | 'en' | 'auto';

const STORAGE_KEY = 'budgeto.locale';

// Global reactive state
const currentLocale = ref<Locale>('auto');

/**
 * Detect browser preferred language
 */
function detectBrowserLocale(): 'da' | 'en' {
  const browserLang = navigator.language.toLowerCase();

  // Tjek for dansk
  if (browserLang.startsWith('da')) {
    return 'da';
  }

  // Default til engelsk
  return 'en';
}

/**
 * Get effective locale (resolve 'auto' to actual locale)
 */
function getEffectiveLocale(locale: Locale): 'da' | 'en' {
  if (locale === 'auto') {
    return detectBrowserLocale();
  }
  return locale;
}

/**
 * Initialize locale from localStorage or default to auto
 */
function initLocale() {
  const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
  const locale = saved && ['da', 'en', 'auto'].includes(saved) ? saved : 'auto';
  currentLocale.value = locale;
  return getEffectiveLocale(locale);
}

// Initialize immediately on first import
let initialized = false;
let effectiveLocale: 'da' | 'en' = 'da';

function initialize() {
  if (!initialized) {
    initialized = true;
    effectiveLocale = initLocale();
  }
}

export function useLocale() {
  // Initialize on first call
  initialize();

  const { locale: i18nLocale } = useI18n();

  /**
   * Set locale and persist to localStorage
   */
  function setLocale(locale: Locale) {
    currentLocale.value = locale;
    localStorage.setItem(STORAGE_KEY, locale);

    const effective = getEffectiveLocale(locale);
    effectiveLocale = effective;
    i18nLocale.value = effective;
  }

  return {
    currentLocale,
    effectiveLocale: () => effectiveLocale,
    setLocale,
  };
}
