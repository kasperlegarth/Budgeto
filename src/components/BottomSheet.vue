<script setup lang="ts">
/**
 * BottomSheet - Base komponent til iOS-agtige bottom sheets
 * Håndterer overlay, animations og swipe-to-dismiss
 */

import { ref, watch, onMounted, onUnmounted } from 'vue';
import UiIcon from './UiIcon.vue';

interface Props {
  modelValue: boolean;
  title: string;
  showClose?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showClose: true,
});

const emit = defineEmits<Emits>();

const sheetRef = ref<HTMLElement | null>(null);
const startY = ref(0);
const currentY = ref(0);
const isDragging = ref(false);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

// Håndter ESC key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    close();
  }
};

// Touch handlers for swipe-to-dismiss (kun på header)
const handleHeaderTouchStart = (e: TouchEvent) => {
  startY.value = e.touches[0]?.clientY || 0;
  isDragging.value = true;
};

const handleHeaderTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return;
  currentY.value = (e.touches[0]?.clientY || 0) - startY.value;
  if (currentY.value < 0) currentY.value = 0; // Kun tillad swipe ned
};

const handleHeaderTouchEnd = () => {
  if (currentY.value > 100) {
    // Swipe threshold: 100px
    close();
  }
  isDragging.value = false;
  currentY.value = 0;
};

// Lock body scroll når sheet er åben
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="sheet-overlay" @click="close">
        <div
          ref="sheetRef"
          class="sheet-container"
          :style="{ transform: isDragging ? `translateY(${currentY}px)` : '' }"
          @click.stop
        >
          <!-- Handle bar -->
          <div
            class="sheet-handle-container"
            @touchstart="handleHeaderTouchStart"
            @touchmove="handleHeaderTouchMove"
            @touchend="handleHeaderTouchEnd"
          >
            <div class="sheet-handle"></div>
          </div>

          <!-- Header -->
          <div
            class="sheet-header"
            @touchstart="handleHeaderTouchStart"
            @touchmove="handleHeaderTouchMove"
            @touchend="handleHeaderTouchEnd"
          >
            <h2 class="sheet-title">{{ title }}</h2>
            <button v-if="showClose" class="sheet-close" @click="close" aria-label="Luk">
              <UiIcon name="close" :size="24" />
            </button>
          </div>

          <!-- Content -->
          <div class="sheet-content">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet-container {
  background-color: var(--color-surface);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  border-radius: 1.5rem 1.5rem 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-out;
}

.sheet-handle-container {
  padding: 0.75rem 0 0.5rem;
  display: flex;
  justify-content: center;
  cursor: grab;
}

.sheet-handle-container:active {
  cursor: grabbing;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background-color: var(--color-text-secondary);
  opacity: 0.3;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:global(.dark) .sheet-header {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.sheet-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.sheet-close {
  background: none;
  border: none;
  padding: 0.5rem;
  margin-right: -0.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.15s;
}

.sheet-close {
  color: var(--color-text-secondary);
}


.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  overscroll-behavior: contain;
}

/* Transitions */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}

.sheet-enter-active .sheet-container,
.sheet-leave-active .sheet-container {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet-container {
  transform: translateY(100%);
}

.sheet-leave-to .sheet-container {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active .sheet-container,
  .sheet-leave-active .sheet-container {
    transition: none;
  }
}
</style>
