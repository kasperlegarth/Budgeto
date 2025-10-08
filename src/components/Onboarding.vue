<script setup lang="ts">
/**
 * Onboarding - Velkomst flow for nye brugere
 * Vises ved første åbning eller efter total reset
 */

import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiIcon from './UiIcon.vue';
import OnboardingTheme from './OnboardingTheme.vue';
import OnboardingLanguage from './OnboardingLanguage.vue';
import OnboardingCurrency from './OnboardingCurrency.vue';
import { completeOnboarding } from '../utils/storage';
import type { Theme } from '../composables/useTheme';
import type { Locale } from '../composables/useLocale';
import type { Currency } from '../types';

interface Emits {
  (e: 'complete'): void;
}

const emit = defineEmits<Emits>();
const { t } = useI18n();

const step = ref(0);

// Step types
type StepType = 'info' | 'theme' | 'language' | 'currency';

interface Step {
  type: StepType;
  icon?: string;
  title?: string;
  description?: string;
}

const steps = computed<Step[]>(() => [
  {
    type: 'info',
    icon: 'money-bag-01',
    title: t('onboarding.step1.title'),
    description: t('onboarding.step1.description'),
  },
  {
    type: 'theme',
  },
  {
    type: 'language',
  },
  {
    type: 'currency',
  },
  {
    type: 'info',
    icon: 'restaurant',
    title: t('onboarding.step2.title'),
    description: t('onboarding.step2.description'),
  },
  {
    type: 'info',
    icon: 'home-01',
    title: t('onboarding.step3.title'),
    description: t('onboarding.step3.description'),
  },
  {
    type: 'info',
    icon: 'lightning-01',
    title: t('onboarding.step4.title'),
    description: t('onboarding.step4.description'),
  },
]);

const handleNext = () => {
  if (step.value < steps.value.length - 1) {
    step.value++;
  } else {
    completeOnboarding();
    emit('complete');
  }
};

const handleSkip = () => {
  completeOnboarding();
  emit('complete');
};

// Handlers for interactive steps
const handleThemeSelected = (theme: Theme) => {
  console.log('Theme selected:', theme);
  // Auto-advance after selection
  setTimeout(() => handleNext(), 300);
};

const handleLanguageSelected = (locale: Locale) => {
  console.log('Language selected:', locale);
  // Auto-advance after selection
  setTimeout(() => handleNext(), 300);
};

const handleCurrencySelected = (currency: Currency) => {
  console.log('Currency selected:', currency);
  // Auto-advance after selection
  setTimeout(() => handleNext(), 300);
};
</script>

<template>
  <div class="onboarding-overlay">
    <div class="onboarding-container">
      <!-- Info steps (med logo) -->
      <template v-if="steps[step]?.type === 'info'">
        <!-- Logo -->
        <div class="logo-container">
          <div class="logo-circle">
            <UiIcon :name="steps[step]?.icon || 'menu-circle'" :size="48" class="text-white" />
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <h1 class="title">{{ steps[step]?.title || '' }}</h1>
          <p class="description">{{ steps[step]?.description || '' }}</p>
        </div>

        <!-- Progress dots -->
        <div class="dots">
          <div
            v-for="(_, idx) in steps"
            :key="idx"
            :class="['dot', idx === step && 'dot-active']"
          ></div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button v-if="step < steps.length - 1" class="btn-secondary" @click="handleSkip">
            {{ t('common.skip') }}
          </button>
          <button class="btn-primary" @click="handleNext">
            {{ step < steps.length - 1 ? t('common.next') : t('onboarding.getStarted') }}
          </button>
        </div>
      </template>

      <!-- Interactive steps -->
      <template v-else>
        <!-- Theme selection -->
        <OnboardingTheme v-if="steps[step]?.type === 'theme'" @selected="handleThemeSelected" />

        <!-- Language selection -->
        <OnboardingLanguage
          v-if="steps[step]?.type === 'language'"
          @selected="handleLanguageSelected"
        />

        <!-- Currency selection -->
        <OnboardingCurrency
          v-if="steps[step]?.type === 'currency'"
          @selected="handleCurrencySelected"
        />

        <!-- Progress dots for interactive steps -->
        <div class="dots" style="margin-top: 2rem">
          <div
            v-for="(_, idx) in steps"
            :key="idx"
            :class="['dot', idx === step && 'dot-active']"
          ></div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, #1e5a40 100%);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

:global(.dark) .onboarding-overlay {
  background: linear-gradient(135deg, var(--color-primary) 0%, #2a7d5a 100%);
}

.onboarding-container {
  width: 100%;
  max-width: 480px;
  text-align: center;
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-container {
  margin-bottom: 3rem;
}

.logo-circle {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.content {
  margin-bottom: 3rem;
  padding: 0 1rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.description {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  max-width: 400px;
  margin: 0 auto;
}

.dots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.dot-active {
  width: 24px;
  border-radius: 4px;
  background-color: white;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
  min-width: 140px;
}

.btn-primary {
  background-color: white;
  color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background-color: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

@media (max-width: 480px) {
  .title {
    font-size: 1.75rem;
  }

  .description {
    font-size: 1rem;
  }

  .logo-circle {
    width: 100px;
    height: 100px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-container {
    animation: none;
  }

  .dot {
    transition: none;
  }
}
</style>
