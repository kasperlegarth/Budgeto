<script setup lang="ts">
/**
 * MoneyText - Formaterer og viser beløb i DKK
 * Understøtter accent/negative farver og forskellige størrelser
 */

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatDKK, type DKK_ore } from '../utils/money';

interface Props {
  amount: DKK_ore;
  variant?: 'default' | 'accent' | 'negative';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '3xl';
  showSign?: boolean; // Vis + for positive beløb
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  showSign: false,
});

const { locale } = useI18n();

const formatted = computed(() => {
  const currentLocale = locale.value as 'da' | 'en';
  const base = formatDKK(props.amount, true, currentLocale);
  if (props.showSign && props.amount > 0) {
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
