<script setup lang="ts">
/**
 * OnboardingTheme - Theme valg step i onboarding
 */

import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UiIcon from './UiIcon.vue';
import { useTheme, type Theme } from '../composables/useTheme';

interface Emits {
  (e: 'selected', theme: Theme): void;
}

const emit = defineEmits<Emits>();
const { t } = useI18n();
const { setTheme } = useTheme();

const selectedTheme = ref<Theme>('auto');

const themes = [
  { value: 'light' as Theme, icon: 'sun-03', label: t('settings.theme.light') },
  { value: 'dark' as Theme, icon: 'moon-02', label: t('settings.theme.dark') },
  { value: 'auto' as Theme, icon: 'laptop-phone-sync', label: t('settings.theme.auto') },
];

const handleSelect = (theme: Theme) => {
  selectedTheme.value = theme;
  setTheme(theme);
  emit('selected', theme);
};
</script>

<template>
  <div class="theme-selector">
    <div class="icon-container">
      <UiIcon name="paint-board" :size="64" class="text-white opacity-90" />
    </div>

    <h2 class="title">{{ t('onboarding.theme.title') }}</h2>
    <p class="description">{{ t('onboarding.theme.description') }}</p>

    <div class="options">
      <button
        v-for="theme in themes"
        :key="theme.value"
        :class="['option-card', selectedTheme === theme.value && 'option-card-active']"
        @click="handleSelect(theme.value)"
      >
        <div class="option-icon">
          <UiIcon :name="theme.icon" :size="32" />
        </div>
        <div class="option-label">{{ theme.label }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.theme-selector {
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
