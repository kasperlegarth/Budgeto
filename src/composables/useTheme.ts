/**
 * useTheme composable
 * Håndterer light/dark/auto theme switching med localStorage persistence
 */

import { ref } from 'vue';

export type Theme = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'budgeto.theme';

// Global reactive state
const currentTheme = ref<Theme>('auto');
const isDark = ref(false);

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === 'auto') {
    // Follow system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDark.value = prefersDark;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } else if (theme === 'dark') {
    isDark.value = true;
    root.classList.add('dark');
  } else {
    isDark.value = false;
    root.classList.remove('dark');
  }
}

/**
 * Set theme and persist to localStorage
 */
function setTheme(theme: Theme) {
  currentTheme.value = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

/**
 * Initialize theme from localStorage or default to auto
 */
function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  const theme = saved && ['light', 'dark', 'auto'].includes(saved) ? saved : 'auto';
  currentTheme.value = theme;
  applyTheme(theme);
}

/**
 * Listen for system theme changes when in auto mode
 */
function watchSystemTheme() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = () => {
    if (currentTheme.value === 'auto') {
      applyTheme('auto');
    }
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
  }
}

// Initialize immediately on first import
let initialized = false;

function initialize() {
  if (!initialized) {
    initialized = true;
    initTheme();
    watchSystemTheme();
  }
}

export function useTheme() {
  // Initialize on first call (don't wait for onMounted)
  initialize();

  return {
    currentTheme,
    isDark,
    setTheme,
  };
}
