import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import './style.css';
import App from './App.vue';
import da from './locales/da.json';
import en from './locales/en.json';

// Detect initial locale
const STORAGE_KEY = 'budgeto.locale';
function detectBrowserLocale(): 'da' | 'en' {
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('da') ? 'da' : 'en';
}

const savedLocale = localStorage.getItem(STORAGE_KEY) as 'da' | 'en' | 'auto' | null;
const initialLocale =
  savedLocale === 'auto' || !savedLocale
    ? detectBrowserLocale()
    : savedLocale === 'da' || savedLocale === 'en'
      ? savedLocale
      : detectBrowserLocale();

// Create i18n instance
const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'da',
  messages: {
    da,
    en,
  },
});

const app = createApp(App);
app.use(i18n);
app.mount('#app');
