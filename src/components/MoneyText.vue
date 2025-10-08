<script setup lang="ts">
/**
 * MoneyText - Formaterer og viser beløb med valuta
 * Understøtter accent/negative farver og forskellige størrelser
 */

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatMoney, type Money, type DKK_ore, type Currency } from '../utils/money';
import { useCurrency } from '../composables/useCurrency';

interface Props {
  // Nyt: Money objekt (foretrukken)
  money?: Money;
  // Legacy: DKK_ore amount (backward compatibility)
  amount?: DKK_ore;
  // Tvungen currency (overskriver default)
  currency?: Currency;
  variant?: 'default' | 'accent' | 'negative' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '3xl';
  showSign?: boolean; // Vis + for positive beløb
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  showSign: false,
});

const { locale } = useI18n();
const { currentCurrency } = useCurrency();

const formatted = computed(() => {
  const currentLocale = locale.value as 'da' | 'en';

  let displayMoney: Money;

  // Brug money prop hvis den er sat
  if (props.money) {
    displayMoney = props.money;
  }
  // Ellers brug legacy amount prop
  else if (props.amount !== undefined) {
    const curr = props.currency || currentCurrency.value;
    displayMoney = { amount: props.amount, currency: curr };
  }
  // Fallback til 0
  else {
    displayMoney = { amount: 0, currency: currentCurrency.value };
  }

  const base = formatMoney(displayMoney, true, currentLocale);

  if (props.showSign && displayMoney.amount > 0) {
    return `+${base}`;
  }
  return base;
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-sm';
    case 'md':
      return 'text-base';
    case 'lg':
      return 'text-xl';
    case 'xl':
      return 'text-3xl';
    case '3xl':
      return 'text-5xl font-bold';
    default:
      return 'text-base';
  }
});

const colorClasses = computed(() => {
  switch (props.variant) {
    case 'accent':
      return 'text-[var(--color-accent)] dark:text-[var(--color-accent-dark)]';
    case 'negative':
      return 'text-[var(--color-negative)] dark:text-[var(--color-negative-dark)]';
    case 'white':
      return 'text-white';
    default:
      return 'text-[var(--color-text)] dark:text-[var(--color-text-dark)]';
  }
});
</script>

<template>
  <span :class="[sizeClasses, colorClasses, 'font-semibold tabular-nums']">
    {{ formatted }}
  </span>
</template>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
