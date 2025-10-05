<script setup lang="ts">
/**
 * MoneyText - Formaterer og viser beløb i DKK
 * Understøtter accent/negative farver og forskellige størrelser
 */

import { computed } from 'vue';
import { formatDKK, type DKK_ore } from '../utils/money';

interface Props {
  amount: DKK_ore;
  variant?: 'default' | 'accent' | 'negative';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSign?: boolean; // Vis + for positive beløb
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  showSign: false,
});

const formatted = computed(() => {
  const base = formatDKK(props.amount);
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
