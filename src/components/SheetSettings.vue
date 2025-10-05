<script setup lang="ts">
/**
 * SheetSettings - Indstillinger og reset funktionalitet
 */

import { ref } from 'vue';
import BottomSheet from './BottomSheet.vue';
import UiIcon from './UiIcon.vue';
import { resetAllData } from '../utils/storage';

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'reset'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const showResetConfirm = ref(false);

const handleReset = () => {
  resetAllData();
  emit('reset');
  emit('update:modelValue', false);
  showResetConfirm.value = false;

  // Reload page for clean state
  window.location.reload();
};

const handleClose = () => {
  emit('update:modelValue', false);
  showResetConfirm.value = false;
};
</script>

<template>
  <BottomSheet :model-value="modelValue" title="Indstillinger" @update:model-value="handleClose">
    <div class="space-y-6">
      <!-- App info -->
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Version</span>
          <span class="info-value">0.1.0 MVP</span>
        </div>
        <div class="info-row">
          <span class="info-label">Type</span>
          <span class="info-value">Offline PWA</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Reset section -->
      <div v-if="!showResetConfirm">
        <h3 class="section-title">Farligt område</h3>
        <p class="text-secondary mb-3">
          Nulstil al data og start forfra. Denne handling kan ikke fortrydes.
        </p>
        <button class="btn-danger" @click="showResetConfirm = true">
          <UiIcon name="close" :size="20" />
          Nulstil al data
        </button>
      </div>

      <!-- Confirm reset -->
      <div v-else class="confirm-box">
        <div class="confirm-icon">
          <UiIcon name="close" :size="32" />
        </div>
        <h3 class="confirm-title">Er du sikker?</h3>
        <p class="confirm-text">
          Dette vil slette ALLE dine posteringer, faste indtægter/udgifter og data. Handlingen kan ikke fortrydes.
        </p>
        <div class="confirm-actions">
          <button class="btn-secondary" @click="showResetConfirm = false">
            Annuller
          </button>
          <button class="btn-danger" @click="handleReset">
            Ja, nulstil alt
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Footer -->
      <div class="footer-text">
        <p class="text-center text-secondary">
          Budgeto — Simpel budgettering<br />
          Alle data gemmes lokalt på din enhed
        </p>
      </div>
    </div>
  </BottomSheet>
</template>

<style scoped>
.info-section {
  background-color: var(--color-background);
  border-radius: 0.75rem;
  overflow: hidden;
}

@media (prefers-color-scheme: dark) {
  .info-section {
    background-color: var(--color-background-dark);
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.info-row:last-child {
  border-bottom: none;
}

@media (prefers-color-scheme: dark) {
  .info-row {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
}

.info-label {
  font-weight: 500;
  color: var(--color-text);
}

.info-value {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

@media (prefers-color-scheme: dark) {
  .info-label {
    color: var(--color-text-dark);
  }
  .info-value {
    color: var(--color-text-secondary-dark);
  }
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

@media (prefers-color-scheme: dark) {
  .section-title {
    color: var(--color-text-secondary-dark);
  }
}

.text-secondary {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.5;
}

@media (prefers-color-scheme: dark) {
  .text-secondary {
    color: var(--color-text-secondary-dark);
  }
}

.text-center {
  text-align: center;
}

.divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.08);
}

@media (prefers-color-scheme: dark) {
  .divider {
    background-color: rgba(255, 255, 255, 0.08);
  }
}

.btn-danger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background-color: var(--color-negative);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.12s;
}

.btn-danger:hover {
  opacity: 0.9;
}

.btn-danger:active {
  transform: scale(0.98);
}

@media (prefers-color-scheme: dark) {
  .btn-danger {
    background-color: var(--color-negative-dark);
  }
}

.btn-secondary {
  flex: 1;
  padding: 0.875rem;
  background-color: transparent;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btn-secondary:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

@media (prefers-color-scheme: dark) {
  .btn-secondary {
    border-color: rgba(255, 255, 255, 0.15);
  }
  .btn-secondary:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }
}

.confirm-box {
  text-align: center;
  padding: 1rem 0;
}

.confirm-icon {
  margin: 0 auto 1rem;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: rgba(231, 76, 60, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-negative);
}

@media (prefers-color-scheme: dark) {
  .confirm-icon {
    background-color: rgba(255, 112, 99, 0.15);
    color: var(--color-negative-dark);
  }
}

.confirm-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.confirm-text {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

@media (prefers-color-scheme: dark) {
  .confirm-text {
    color: var(--color-text-secondary-dark);
  }
}

.confirm-actions {
  display: flex;
  gap: 0.75rem;
}

.footer-text {
  padding-top: 1rem;
}

.footer-text p {
  font-size: 0.875rem;
  line-height: 1.6;
}
</style>
