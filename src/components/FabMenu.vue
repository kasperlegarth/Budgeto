<script setup lang="ts">
/**
 * FabMenu - Bottom Navigation Bar
 * Inspiration fra moderne fintech apps
 */

import UiIcon from './UiIcon.vue';

interface Emits {
  (e: 'newEntry'): void;
  (e: 'fixedEntries'): void;
  (e: 'settings'): void;
}

const emit = defineEmits<Emits>();

const handleAction = (action: 'new' | 'fixed' | 'settings') => {
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
  <nav class="bottom-nav">
    <button class="nav-btn" @click="handleAction('settings')">
      <div class="nav-icon">
        <UiIcon name="home-01" :size="24" />
      </div>
    </button>

    <button class="nav-btn" @click="handleAction('fixed')">
      <div class="nav-icon">
        <UiIcon name="money-bag-01" :size="24" />
      </div>
    </button>

    <button class="nav-btn nav-btn-add" @click="handleAction('new')">
      <div class="nav-icon-add">
        <UiIcon name="add" :size="28" />
      </div>
    </button>

    <button class="nav-btn" @click="handleAction('settings')">
      <div class="nav-icon">
        <UiIcon name="shopping-cart-02" :size="24" />
      </div>
    </button>

    <button class="nav-btn" @click="handleAction('settings')">
      <div class="nav-icon">
        <UiIcon name="settings-02" :size="24" />
      </div>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: var(--color-surface);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 1rem;
  padding-bottom: max(0px, env(safe-area-inset-bottom));
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

:global(.dark) .bottom-nav {
  border-top-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
}

.nav-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:active {
  transform: scale(0.9);
}

.nav-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition: all 0.2s;
}


.nav-btn-add {
  position: relative;
  margin-top: -20px;
}

.nav-icon-add {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, #6d28d9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  transition: all 0.2s;
}


.nav-btn-add:active .nav-icon-add {
  transform: scale(0.95);
}

@media (prefers-reduced-motion: reduce) {
  .nav-btn,
  .nav-icon,
  .nav-icon-add {
    transition: none;
  }
}
</style>
