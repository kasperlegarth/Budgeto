<script setup lang="ts">
/**
 * UiIcon - Wrapper for Hugeicons
 * Simplifies icon usage across the app
 */

import { computed } from 'vue';
import { HugeiconsIcon } from '@hugeicons/vue';
import {
  Add01Icon,
  Menu01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  Settings02Icon,
  Sun03Icon,
  Moon02Icon,
  Restaurant01Icon,
  Restaurant02Icon,
  Coffee01Icon,
  ShoppingCart01Icon,
  Car01Icon,
  Fuel01Icon,
  Bus01Icon,
  ParkingAreaSquareIcon,
  Home01Icon,
  Home02Icon,
  FlashIcon,
  Wifi01Icon,
  ShoppingBag01Icon,
  TShirtIcon,
  ComputerIcon,
  ShoppingBasket01Icon,
  FootballIcon,
  Dumbbell01Icon,
  Tv01Icon,
  PaintBoardIcon,
  Hospital01Icon,
  Medicine01Icon,
  StethoscopeIcon,
  MoneyBag01Icon,
  MoreVerticalCircle01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';

interface Props {
  name: string;
  size?: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  class: '',
});

// Map icon names to Hugeicons components
const iconMap: Record<string, any> = {
  // UI icons
  'add': Add01Icon,
  'menu': Menu01Icon,
  'close': Cancel01Icon,
  'chevron-right': ArrowRight01Icon,
  'chevron-down': ArrowDown01Icon,
  'settings-02': Settings02Icon,
  'sun': Sun03Icon,
  'moon': Moon02Icon,
  'check': CheckmarkCircle01Icon,

  // Kategori icons
  'restaurant': Restaurant01Icon,
  'restaurant-02': Restaurant02Icon,
  'coffee-01': Coffee01Icon,
  'shopping-cart-02': ShoppingCart01Icon,
  'car-01': Car01Icon,
  'fuel-01': Fuel01Icon,
  'bus-01': Bus01Icon,
  'parking-area-square': ParkingAreaSquareIcon,
  'home-01': Home01Icon,
  'home-02': Home02Icon,
  'lightning-01': FlashIcon,
  'wifi-01': Wifi01Icon,
  'shopping-bag-01': ShoppingBag01Icon,
  'shirt-01': TShirtIcon,
  'laptop-01': ComputerIcon,
  'shopping-basket-01': ShoppingBasket01Icon,
  'football': FootballIcon,
  'dumbbell-01': Dumbbell01Icon,
  'tv-01': Tv01Icon,
  'paint-board': PaintBoardIcon,
  'hospital-01': Hospital01Icon,
  'medicine-01': Medicine01Icon,
  'stethoscope': StethoscopeIcon,
  'money-bag-01': MoneyBag01Icon,
  'menu-circle': MoreVerticalCircle01Icon,
};

const icon = computed(() => iconMap[props.name] || MoreVerticalCircle01Icon);
</script>

<template>
  <HugeiconsIcon
    :icon="icon"
    :size="size"
    color="currentColor"
    :strokeWidth="1.5"
    :class="class"
  />
</template>
