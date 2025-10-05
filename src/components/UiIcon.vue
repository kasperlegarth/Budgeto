<script setup lang="ts">
/**
 * UiIcon - Inline SVG icon component med Hugeicons
 * Understøtter dynamisk icon loading og sizing
 */

import { computed } from 'vue';

interface Props {
  name: string;
  size?: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  class: '',
});

// Hugeicons SVG paths (subset - udvid efter behov)
const iconPaths: Record<string, string> = {
  // UI icons
  'add': 'M12 5v14m-7-7h14',
  'menu': 'M4 6h16M4 12h16M4 18h16',
  'close': 'M18 6L6 18M6 6l12 12',
  'chevron-right': 'M9 18l6-6-6-6',
  'chevron-down': 'M6 9l6 6 6-6',
  'settings-02': 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',

  // Kategori icons
  'restaurant': 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3z',
  'restaurant-02': 'M16 4h2a2 2 0 011.73 3L16 14v6M6 2v8M2 7.5L6 6l4 1.5M6 10v12',
  'coffee-01': 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3',
  'shopping-cart-02': 'M9 2L7.79 5.24M20.49 9H5.5l-1.38 5.18A3 3 0 006.95 18h10.1a3 3 0 002.83-3.82L20.49 9zM9 22a1 1 0 100-2 1 1 0 000 2zM20 22a1 1 0 100-2 1 1 0 000 2z',
  'car-01': 'M5 13l1.25-3.75A2 2 0 018.16 8h7.68a2 2 0 011.91 1.25L19 13m-14 0h14M5 13v5a2 2 0 002 2h1m11-7v5a2 2 0 01-2 2h-1m-9-6h.01M18 14h.01',
  'fuel-01': 'M3 7h10a2 2 0 012 2v9a1 1 0 001 1 1 1 0 001-1v-5.5a3.5 3.5 0 117 0V19a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 0V4a1 1 0 011-1h8a1 1 0 011 1v3M5 11h8',
  'bus-01': 'M8 16h.01M16 16h.01M3 6h18M7 19v2M17 19v2M5 21h14a2 2 0 002-2V8a4 4 0 00-4-4H7a4 4 0 00-4 4v11a2 2 0 002 2z',
  'parking-area-square': 'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm6-1v12m0-7h3a2 2 0 100-4H9',
  'home-01': 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
  'home-02': 'M9 22V12h6v10M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
  'lightning-01': 'M13 2L3 14h8l-1 8 10-12h-8l1-8z',
  'wifi-01': 'M5 12.55a11 11 0 0114 0M8.5 16.5a6 6 0 017 0M12 20h.01',
  'shopping-bag-01': 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0',
  'shirt-01': 'M16 3l4 4-1 9h-2V9h-2M8 3L4 7l1 9h2V9h2m4 12v-5',
  'laptop-01': 'M4 16V5a1 1 0 011-1h14a1 1 0 011 1v11M2 20h20',
  'shopping-basket-01': 'M2 12h20l-2 8H4L2 12zm0 0l2-4m16 4l-2-4M9 16h6',
  'football': 'M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 0v20M2 12h20m-6.5-9.5l-7 7m7 5l-7 7',
  'dumbbell-01': 'M6.5 6L3 9.5v5L6.5 18M17.5 6L21 9.5v5L17.5 18M9.5 9.5L12 12m0 0l2.5 2.5M12 12l2.5-2.5M12 12l-2.5 2.5m9.5-3v2a1 1 0 01-1 1h-1a1 1 0 01-1-1v-2a1 1 0 011-1h1a1 1 0 011 1zm-14 0v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1h1a1 1 0 011 1z',
  'tv-01': 'M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM17 2l-5 5-5-5',
  'paint-board': 'M12 2a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h8zm8 8a4 4 0 11-8 0 4 4 0 018 0z',
  'hospital-01': 'M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm9-2v18m-5-9h10',
  'medicine-01': 'M4.5 3h15M6 3v2a2 2 0 002 2h8a2 2 0 002-2V3M10 11h4m-2-2v4m-6 2l1 6h10l1-6',
  'stethoscope': 'M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 0012 0V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3m7 1a2 2 0 012 2v6a5 5 0 01-9.33 2.5M18 15v2a3 3 0 01-6 0M6.5 2V4',
  'money-bag-01': 'M8 6h8M12 2c-2 2.5-3 3.5-4 6h8c-1-2.5-2-3.5-4-6zm0 6a6 6 0 00-6 6c0 4 2.5 8 6 8s6-4 6-8a6 6 0 00-6-6z',
  'menu-circle': 'M12 13a1 1 0 100-2 1 1 0 000 2zM12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2z',
};

const svgPath = computed(() => iconPaths[props.name] || iconPaths['menu-circle']);
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="class"
  >
    <path :d="svgPath" />
  </svg>
</template>
