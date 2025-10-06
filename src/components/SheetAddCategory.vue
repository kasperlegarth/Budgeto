<script setup lang="ts">
/**
 * SheetAddCategory - Bottom sheet til at tilføje ny kategori
 */

import { ref, computed } from 'vue';
import BottomSheet from './BottomSheet.vue';
import UiIcon from './UiIcon.vue';
import { withLock } from '../utils/storage';
import type { Category } from '../types';

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

// Form state
const navn = ref('');
const selectedIcon = ref('menu-circle');
const selectedColor = ref('#FF6B6B');
const isSubmitting = ref(false);
const error = ref('');

// Tilgængelige ikoner (kun dem der eksisterer i UiIcon)
const availableIcons = [
  'shopping-bag-01',
  'restaurant',
  'restaurant-02',
  'coffee-01',
  'shopping-cart-02',
  'car-01',
  'fuel-01',
  'bus-01',
  'parking-area-square',
  'home-01',
  'home-02',
  'lightning-01',
  'wifi-01',
  'shirt-01',
  'LaptopIcon',
  'shopping-basket-01',
  'football',
  'dumbbell-01',
  'tv-01',
  'paint-board',
  'hospital-01',
  'medicine-01',
  'stethoscope',
  'money-bag-01',
  'menu-circle',
];

// Tilgængelige farver
const availableColors = [
  '#FF6B6B', // Rød
  '#4ECDC4', // Turkis
  '#95E1D3', // Mint
  '#FFB84D', // Orange
  '#A8E6CF', // Lysegrøn
  '#F7B7D5', // Pink
  '#B8B8D1', // Lilla
  '#FFD93D', // Gul
  '#6C5CE7', // Lilla/Blå
  '#00B894', // Grøn
  '#E17055', // Coral
  '#74B9FF', // Lyseblå
];

const canSubmit = computed(() => {
  return navn.value.trim() !== '';
});

const reset = () => {
  navn.value = '';
  selectedIcon.value = 'menu-circle';
  selectedColor.value = '#FF6B6B';
  error.value = '';
  isSubmitting.value = false;
};

const handleSubmit = async () => {
  if (!canSubmit.value || isSubmitting.value) return;

  error.value = '';
  isSubmitting.value = true;

  try {
    const newCategory: Category = {
      id: crypto.randomUUID(),
      navn: navn.value.trim(),
      icon: selectedIcon.value,
      color: selectedColor.value,
      underkategorier: [],
    };

    // Gem til storage
    await withLock((state) => {
      state.kategorier.push(newCategory);
    });

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(8);
    }

    emit('saved');
    emit('update:modelValue', false);
    reset();
  } catch (err) {
    error.value = 'Kunne ikke gemme kategori';
    console.error('Save error:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => {
  emit('update:modelValue', false);
  reset();
};
</script>

<template>
  <BottomSheet :model-value="modelValue" title="Ny kategori" @update:model-value="handleClose">
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Navn -->
      <div>
        <label for="navn" class="label">Navn</label>
        <input
          id="navn"
          v-model="navn"
          type="text"
          placeholder="f.eks. Abonnementer"
          class="input"
          autofocus
        />
      </div>

      <!-- Ikon vælger -->
      <div>
        <label class="label">Vælg ikon</label>
        <div class="icon-grid">
          <button
            v-for="icon in availableIcons"
            :key="icon"
            type="button"
            :class="['icon-option', selectedIcon === icon && 'icon-option-active']"
            @click="selectedIcon = icon"
          >
            <UiIcon :name="icon" :size="24" />
          </button>
        </div>
      </div>

      <!-- Farve vælger -->
      <div>
        <label class="label">Vælg farve</label>
        <div class="color-grid">
          <button
            v-for="color in availableColors"
            :key="color"
            type="button"
            :class="['color-option', selectedColor === color && 'color-option-active']"
            :style="{ backgroundColor: color }"
            @click="selectedColor = color"
          >
            <UiIcon v-if="selectedColor === color" name="check" :size="20" class="text-white" />
          </button>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="!canSubmit || isSubmitting"
        class="btn-primary"
      >
        {{ isSubmitting ? 'Gemmer...' : 'Gem kategori' }}
      </button>
    </form>
  </BottomSheet>
</template>

<style scoped>
.label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.75rem;
  background-color: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

:global(.dark) .input {
  border-color: rgba(255, 255, 255, 0.15);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 0.5rem;
  max-width: 100%;
}

.icon-option {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  background-color: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s;
}

.icon-option-active {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

:global(.dark) .icon-option {
  border-color: rgba(255, 255, 255, 0.1);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
  gap: 0.5rem;
  max-width: 100%;
}

.color-option {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border: 3px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}

.color-option-active {
  border-color: var(--color-text);
  transform: scale(1.05);
}

:global(.dark) .color-option-active {
  border-color: var(--color-text);
}

.btn-primary {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: var(--color-primary);
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.12s;
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 0.75rem 1rem;
  background-color: rgba(231, 76, 60, 0.1);
  color: var(--color-negative);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

:global(.dark) .error-message {
  background-color: rgba(255, 112, 99, 0.15);
}
</style>
