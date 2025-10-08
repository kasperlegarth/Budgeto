<script setup lang="ts">
/**
 * OnboardingLanguage - Sprog valg step i onboarding
 */

import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UiIcon from './UiIcon.vue';
import { useLocale, type Locale } from '../composables/useLocale';

interface Emits {
  (e: 'selected', locale: Locale): void;
}

const emit = defineEmits<Emits>();
const { t } = useI18n();
const { setLocale } = useLocale();

const selectedLocale = ref<Locale>('auto');

const locales = [
  { value: 'da' as Locale, icon: 'location-04', label: 'Dansk' },
  { value: 'en' as Locale, icon: 'location-04', label: 'English' },
  { value: 'auto' as Locale, icon: 'laptop-phone-sync', label: 'Auto' },
];

const handleSelect = (locale: Locale) => {
  selectedLocale.value = locale;
  setLocale(locale);
  emit('selected', locale);
};
</script>

<template>
  <div class="language-selector">
    <div class="icon-container">
      <UiIcon name="translate-02" :size="64" class="text-white opacity-90" />
    </div>

    <h2 class="title">{{ t('onboarding.language.title') }}</h2>
    <p class="description">{{ t('onboarding.language.description') }}</p>

    <div class="options">
      <button
        v-for="locale in locales"
        :key="locale.value"
        :class="['option-card', selectedLocale === locale.value && 'option-card-active']"
        @click="handleSelect(locale.value)"
      >
        <div class="option-icon">
          <UiIcon :name="locale.icon" :size="32" />
        </div>
        <div class="option-label">{{ locale.label }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.language-selector {
  width: 100%;
  text-align: center;
}

.icon-container {
  margin-bottom: 2rem;
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.75rem;
}

.description {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 2.5rem;
  max-width: 380px;
  margin-left: auto;
  margin-right: auto;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 320px;
  margin: 0 auto;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.option-card:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.option-card-active {
  background-color: rgba(255, 255, 255, 0.25);
  border-color: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.option-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.option-label {
  font-size: 1.125rem;
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .option-card {
    transition: none;
  }
}
</style>
