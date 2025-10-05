<script setup lang="ts">
/**
 * FabMenu - Floating Action Button med menu
 * 1) Ny postering 2) Faste posteringer 3) Indstillinger
 */

import { ref } from 'vue';
import UiIcon from './UiIcon.vue';

interface Emits {
  (e: 'newEntry'): void;
  (e: 'fixedEntries'): void;
  (e: 'settings'): void;
}

const emit = defineEmits<Emits>();

const isOpen = ref(false);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const handleAction = (action: 'new' | 'fixed' | 'settings') => {
  isOpen.value = false;

  switch (action) {
    case 'new':
      emit('newEntry');
      break;
    case 'fixed':
      emit('fixedEntries');
      break;
    case 'settings':
      emit('settings');
      break;
  }
};
</script>

<template>
  <div class="fab-container">
    <!-- Backdrop -->
    <Transition name="backdrop">
      <div v-if="isOpen" class="fab-backdrop" @click="toggle"></div>
    </Transition>

    <!-- Menu items -->
    <Transition name="menu">
      <div v-if="isOpen" class="fab-menu">
        <!-- Settings -->
        <button class="fab-menu-item" @click="handleAction('settings')">
          <div class="fab-menu-icon">
            <UiIcon name="settings-02" :size="20" />
          </div>
          <span class="fab-menu-label">Indstillinger</span>
        </button>

        <!-- Fixed entries -->
        <button class="fab-menu-item" @click="handleAction('fixed')">
          <div class="fab-menu-icon">
            <UiIcon name="money-bag-01" :size="20" />
          </div>
          <span class="fab-menu-label">Faste posteringer</span>
        </button>

        <!-- New entry -->
        <button class="fab-menu-item" @click="handleAction('new')">
          <div class="fab-menu-icon fab-menu-icon-primary">
            <UiIcon name="add" :size="20" />
          </div>
          <span class="fab-menu-label">Ny postering</span>
        </button>
      </div>
    </Transition>

    <!-- Main FAB -->
    <button
      class="fab"
      :class="{ 'fab-open': isOpen }"
      @click="toggle"
      aria-label="Menu"
    >
      <Transition name="icon" mode="out-in">
        <UiIcon v-if="isOpen" name="close" :size="24" class="text-white" />
        <UiIcon v-else name="add" :size="24" class="text-white" />
      </Transition>
    </button>
  </div>
</template>

<style scoped>
.fab-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 999;
}

.fab-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: -1;
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.2s;
}

.fab:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.fab:active {
  transform: scale(0.95);
}

.fab-open {
  transform: rotate(45deg);
}

@media (prefers-color-scheme: dark) {
  .fab {
    background-color: var(--color-primary-dark);
  }
}

.fab-menu {
  position: absolute;
  bottom: 72px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 200px;
}

.fab-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--color-surface);
  border: none;
  border-radius: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
  text-align: left;
}

.fab-menu-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.fab-menu-item:active {
  transform: scale(0.97);
}

@media (prefers-color-scheme: dark) {
  .fab-menu-item {
    background-color: var(--color-surface-dark);
  }
}

.fab-menu-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  flex-shrink: 0;
}

.fab-menu-icon-primary {
  background-color: var(--color-primary);
  color: white;
}

@media (prefers-color-scheme: dark) {
  .fab-menu-icon {
    background-color: var(--color-background-dark);
    color: var(--color-text-dark);
  }
  .fab-menu-icon-primary {
    background-color: var(--color-primary-dark);
  }
}

.fab-menu-label {
  font-weight: 500;
  font-size: 0.9375rem;
  color: var(--color-text);
}

@media (prefers-color-scheme: dark) {
  .fab-menu-label {
    color: var(--color-text-dark);
  }
}

/* Transitions */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.menu-enter-active {
  transition: all 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.menu-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.menu-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.menu-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.icon-enter-active,
.icon-leave-active {
  transition: transform 0.15s, opacity 0.15s;
}

.icon-enter-from {
  transform: rotate(-90deg) scale(0.8);
  opacity: 0;
}

.icon-leave-to {
  transform: rotate(90deg) scale(0.8);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fab,
  .fab-menu,
  .fab-menu-item,
  .backdrop-enter-active,
  .backdrop-leave-active,
  .menu-enter-active,
  .menu-leave-active,
  .icon-enter-active,
  .icon-leave-active {
    transition: none;
  }

  .fab-open {
    transform: none;
  }
}
</style>
