<script setup lang="ts">
/**
 * EmptyState - Viser empty state med ikon, titel og beskrivelse
 */

import UiIcon from './UiIcon.vue';

interface Props {
  icon?: string;
  title: string;
  description?: string;
}

withDefaults(defineProps<Props>(), {
  icon: 'menu-circle',
});
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div
      class="mb-4 rounded-full bg-[var(--color-primary-light)] dark:bg-[var(--color-surface-dark)] p-4"
    >
      <UiIcon
        :name="icon"
        :size="32"
        class="text-[var(--color-primary)] dark:text-[var(--color-primary-dark)]"
      />
    </div>
    <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
    <p v-if="description" class="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] max-w-xs">
      {{ description }}
    </p>
  </div>
</template>
