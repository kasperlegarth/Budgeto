<script setup lang="ts">
/**
 * OnboardingCurrency - Valuta valg step i onboarding
 */

import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UiIcon from './UiIcon.vue';
import { useCurrency } from '../composables/useCurrency';
import type { Currency } from '../types';

interface Emits {
  (e: 'selected', currency: Currency): void;
}

const emit = defineEmits<Emits>();
const { t } = useI18n();
const { setCurrency, supportedCurrencies } = useCurrency();

const selectedCurrency = ref<Currency>('DKK');

const handleSelect = (currency: Currency) => {
  selectedCurrency.value = currency;
  setCurrency(currency);
  emit('selected', currency);
};
</script>

<template>
  <div class="currency-selector">
    <div class="icon-container">
      <UiIcon name="money-03" :size="64" class="text-white opacity-90" />
    </div>

    <h2 class="title">{{ t('onboarding.currency.title') }}</h2>
    <p class="description">{{ t('onboarding.currency.description') }}</p>

    <div class="options">
      <button
        v-for="currency in supportedCurrencies"
        :key="currency.code"
        :class="['option-card', selectedCurrency === currency.code && 'option-card-active']"
        @click="handleSelect(currency.code)"
      >
        <div class="option-icon">
          <span class="currency-symbol">{{ currency.symbol }}</span>
        </div>
        <div class="option-content">
          <div class="option-label">{{ currency.code }}</div>
          <div class="option-sublabel">{{ currency.name }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.currency-selector {
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
  gap: 0.75rem;
  max-width: 320px;
  margin: 0 auto;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.options::-webkit-scrollbar {
  width: 6px;
}

.options::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.options::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
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

.currency-symbol {
  font-size: 1.5rem;
  font-weight: 700;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.option-label {
  font-size: 1.125rem;
  font-weight: 600;
}

.option-sublabel {
  font-size: 0.875rem;
  opacity: 0.8;
}

@media (prefers-reduced-motion: reduce) {
  .option-card {
    transition: none;
  }
}
</style>
