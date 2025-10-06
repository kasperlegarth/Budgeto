<script setup lang="ts">
/**
 * SheetSettings - Indstillinger og reset funktionalitet
 */

import { ref } from 'vue';
import BottomSheet from './BottomSheet.vue';
import UiIcon from './UiIcon.vue';
import SheetAddCategory from './SheetAddCategory.vue';
import { resetAllData, withLock } from '../utils/storage';
import { useTheme, type Theme } from '../composables/useTheme';
import { useI18n } from 'vue-i18n';
import { getCategoryName } from '../utils/category';
import { useLocale, type Locale } from '../composables/useLocale';
import type { Category } from '../types';

interface Props {
  modelValue: boolean;
  kategorier: Category[];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'reset'): void;
  (e: 'updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { currentTheme, setTheme } = useTheme();
const { t } = useI18n();
const { currentLocale, setLocale } = useLocale();
const showResetConfirm = ref(false);
const showAddCategory = ref(false);

// Filtrer seed kategorier (kan ikke slettes)
const seedCategoryIds = ['mad', 'transport', 'bolig', 'shopping', 'fritid', 'sundhed', 'lon', 'andet'];
const customKategorier = props.kategorier.filter((k) => !seedCategoryIds.includes(k.id));

const handleDeleteCategory = async (id: string) => {
  if (seedCategoryIds.includes(id)) {
    return; // Kan ikke slette seed kategorier
  }

  await withLock((state) => {
    state.kategorier = state.kategorier.filter((k) => k.id !== id);
  });

  emit('updated');
};

const themeOptions: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: t('settings.themeLight'), icon: 'sun' },
  { value: 'dark', label: t('settings.themeDark'), icon: 'moon' },
  { value: 'auto', label: t('settings.themeAuto'), icon: 'settings-02' },
];

const localeOptions: { value: Locale; label: string; icon: string }[] = [
  { value: 'da', label: t('settings.languageDanish'), icon: 'flag-01' },
  { value: 'en', label: t('settings.languageEnglish'), icon: 'flag-02' },
  { value: 'auto', label: t('settings.languageAuto'), icon: 'settings-02' },
];

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
  <BottomSheet :model-value="modelValue" :title="t('settings.title')" @update:model-value="handleClose">
    <div class="space-y-6">
      <!-- App info -->
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">{{ t('settings.version') }}</span>
          <span class="info-value">0.1.0 MVP</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('settings.type') }}</span>
          <span class="info-value">{{ t('settings.typeValue') }}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Theme section -->
      <div>
        <h3 class="section-title">{{ t('settings.appearanceSection') }}</h3>
        <div class="theme-options">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            :class="['theme-option', currentTheme === option.value && 'theme-option-active']"
            @click="setTheme(option.value)"
          >
            <UiIcon :name="option.icon" :size="20" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Language section -->
      <div>
        <h3 class="section-title">{{ t('settings.languageSection') }}</h3>
        <div class="theme-options">
          <button
            v-for="option in localeOptions"
            :key="option.value"
            :class="['theme-option', currentLocale === option.value && 'theme-option-active']"
            @click="setLocale(option.value)"
          >
            <UiIcon :name="option.icon" :size="20" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Kategorier section -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="section-title mb-0">{{ t('settings.categoriesSection') }}</h3>
          <button class="btn-add-small" @click="showAddCategory = true">
            <UiIcon name="add" :size="16" />
            {{ t('common.add') }}
          </button>
        </div>

        <div v-if="customKategorier.length === 0" class="text-secondary text-center">
          {{ t('settings.noCategoriesYet') }}
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="kategori in customKategorier"
            :key="kategori.id"
            class="category-item"
          >
            <div class="flex items-center gap-3 flex-1">
              <div class="category-icon">
                <UiIcon :name="kategori.icon" :size="20" />
              </div>
              <span class="category-name">{{ getCategoryName(kategori, t) }}</span>
            </div>
            <button
              class="btn-delete-icon"
              @click="handleDeleteCategory(kategori.id)"
              aria-label="Slet kategori"
            >
              <UiIcon name="close" :size="18" />
            </button>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Reset section -->
      <div v-if="!showResetConfirm">
        <h3 class="section-title">{{ t('settings.dangerZone') }}</h3>
        <p class="text-secondary mb-3">
          {{ t('settings.resetDescription') }}
        </p>
        <button class="btn-danger" @click="showResetConfirm = true">
          <UiIcon name="close" :size="20" />
          {{ t('settings.resetButton') }}
        </button>
      </div>

      <!-- Confirm reset -->
      <div v-else class="confirm-box">
        <div class="confirm-icon">
          <UiIcon name="close" :size="32" />
        </div>
        <h3 class="confirm-title">{{ t('settings.resetConfirmTitle') }}</h3>
        <p class="confirm-text">
          {{ t('settings.resetConfirmText') }}
        </p>
        <div class="confirm-actions">
          <button class="btn-secondary" @click="showResetConfirm = false">
            {{ t('common.cancel') }}
          </button>
          <button class="btn-danger" @click="handleReset">
            {{ t('settings.resetConfirmButton') }}
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Footer -->
      <div class="footer-text">
        <p class="text-center text-secondary">
          {{ t('app.tagline') }}<br />
          {{ t('app.privacyNote') }}
        </p>
      </div>
    </div>

    <!-- Add Category Sheet -->
    <SheetAddCategory
      v-model="showAddCategory"
      @saved="emit('updated')"
    />
  </BottomSheet>
</template>

<style scoped>
.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  background-color: var(--color-background);
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text);
}

.theme-option-active {
  border-color: var(--color-primary);
  background-color: rgba(42, 108, 79, 0.08);
  color: var(--color-primary);
}

:global(.dark) .theme-option {
  border-color: rgba(255, 255, 255, 0.1);
}

:global(.dark) .theme-option-active {
  background-color: rgba(61, 153, 112, 0.12);
}

.info-section {
  background-color: var(--color-background);
  border-radius: 0.75rem;
  overflow: hidden;
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

:global(.dark) .info-row {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.info-label {
  font-weight: 500;
  color: var(--color-text);
}

.info-value {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.text-secondary {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.text-center {
  text-align: center;
}

.divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.08);
}

:global(.dark) .divider {
  background-color: rgba(255, 255, 255, 0.08);
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

.btn-danger:active {
  transform: scale(0.98);
}

.btn-secondary {
  flex: 1;
  padding: 0.875rem;
  background-color: transparent;
  color: var(--color-text);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

:global(.dark) .btn-secondary {
  border-color: rgba(255, 255, 255, 0.15);
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

:global(.dark) .confirm-icon {
  background-color: rgba(255, 112, 99, 0.15);
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

.btn-add-small {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-primary);
  background-color: transparent;
  border: 1px solid var(--color-primary);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--color-background);
  border-radius: 0.75rem;
}

.category-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-name {
  font-weight: 500;
}

.btn-delete-icon {
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.15s;
}

</style>
