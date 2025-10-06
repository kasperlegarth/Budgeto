<script setup lang="ts">
/**
 * SheetNewEntry - Bottom sheet til nye variable posteringer
 * Type / Beløb / Kategori + Underkategori / Note / Geo
 */

import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BottomSheet from './BottomSheet.vue';
import UiIcon from './UiIcon.vue';
import SheetAddCategory from './SheetAddCategory.vue';
import { parseDKK } from '../utils/money';
import { withLock } from '../utils/storage';
import { getCategoryName } from '../utils/category';
import type { EntryType, Category, VariableEntry } from '../types';

interface Props {
  modelValue: boolean;
  kategorier: Category[];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

// Form state
const entryType = ref<EntryType>('udgift');
const beloebInput = ref('');
const selectedKategoriId = ref('');
const selectedUnderkategoriId = ref('');
const note = ref('');
const isSubmitting = ref(false);
const error = ref('');
const showAddCategory = ref(false);

const selectedKategori = computed(() => {
  return props.kategorier.find((k) => k.id === selectedKategoriId.value);
});

const underkategorier = computed(() => {
  return selectedKategori.value?.underkategorier || [];
});

const canSubmit = computed(() => {
  const hasAmount = beloebInput.value.trim() !== '';
  const hasCategory = entryType.value === 'indtægt' || selectedKategoriId.value !== '';
  return hasAmount && hasCategory;
});

const reset = () => {
  entryType.value = 'udgift';
  beloebInput.value = '';
  selectedKategoriId.value = '';
  selectedUnderkategoriId.value = '';
  note.value = '';
  error.value = '';
  isSubmitting.value = false;
};

const getCurrentPosition = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Silent fail
        resolve(null);
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  });
};

const handleSubmit = async () => {
  if (!canSubmit.value || isSubmitting.value) return;

  error.value = '';
  isSubmitting.value = true;

  try {
    // Parse beløb
    const beloeb_ore = parseDKK(beloebInput.value);
    if (beloeb_ore === null || beloeb_ore <= 0) {
      error.value = t('newEntry.errorInvalidAmount');
      isSubmitting.value = false;
      return;
    }

    // Hent position (silent)
    const geo = await getCurrentPosition();

    // Opret entry
    const newEntry: VariableEntry = {
      id: crypto.randomUUID(),
      type: entryType.value,
      kategoriId: entryType.value === 'indtægt' ? 'lon' : selectedKategoriId.value,
      underkategoriId: selectedUnderkategoriId.value || undefined,
      beloeb_ore,
      note: note.value.trim() || undefined,
      timestamp: Date.now(),
      geo,
    };

    // Gem til storage
    await withLock((state) => {
      state.variable.push(newEntry);
    });

    // Haptic feedback (Android)
    if (navigator.vibrate) {
      navigator.vibrate(8);
    }

    emit('saved');
    emit('update:modelValue', false);
    reset();
  } catch (err) {
    error.value = t('newEntry.errorSaveFailed');
    console.error('Save error:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => {
  emit('update:modelValue', false);
  reset();
};

// Ryd kategori når man skifter til indtægt
watch(entryType, (newType) => {
  if (newType === 'indtægt') {
    selectedKategoriId.value = '';
    selectedUnderkategoriId.value = '';
  }
});
</script>

<template>
  <BottomSheet :model-value="modelValue" :title="t('newEntry.title')" @update:model-value="handleClose">
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Type selector -->
      <div>
        <label class="label">{{ t('newEntry.typeLabel') }}</label>
        <div class="flex gap-2">
          <button
            type="button"
            :class="['type-btn', entryType === 'udgift' && 'type-btn-active type-btn-negative']"
            @click="entryType = 'udgift'"
          >
            <UiIcon name="shopping-cart-02" :size="20" />
            {{ t('entryTypes.expense') }}
          </button>
          <button
            type="button"
            :class="['type-btn', entryType === 'indtægt' && 'type-btn-active type-btn-accent']"
            @click="entryType = 'indtægt'"
          >
            <UiIcon name="money-bag-01" :size="20" />
            {{ t('entryTypes.income') }}
          </button>
        </div>
      </div>

      <!-- Beløb -->
      <div>
        <label for="beloeb" class="label">{{ t('newEntry.amountLabel') }}</label>
        <input
          id="beloeb"
          v-model="beloebInput"
          type="text"
          inputmode="decimal"
          :placeholder="t('newEntry.amountPlaceholder')"
          class="input"
          autofocus
        />
      </div>

      <!-- Kategori (kun for udgifter) -->
      <div v-if="entryType === 'udgift'">
        <div class="flex items-center justify-between mb-2">
          <label for="kategori" class="label mb-0">{{ t('newEntry.categoryLabel') }}</label>
          <button
            type="button"
            class="btn-add-category"
            @click="showAddCategory = true"
          >
            <UiIcon name="add" :size="16" />
            {{ t('newEntry.addCategory') }}
          </button>
        </div>
        <select id="kategori" v-model="selectedKategoriId" class="input">
          <option value="">{{ t('newEntry.categoryPlaceholder') }}</option>
          <option v-for="kat in kategorier" :key="kat.id" :value="kat.id">
            {{ getCategoryName(kat, t) }}
          </option>
        </select>
      </div>

      <!-- Underkategori (hvis valgt kategori har nogen) -->
      <div v-if="entryType === 'udgift' && underkategorier.length > 0">
        <label for="underkategori" class="label">{{ t('newEntry.subcategoryLabel') }} ({{ t('common.optional') }})</label>
        <select id="underkategori" v-model="selectedUnderkategoriId" class="input">
          <option value="">{{ t('common.none') }}</option>
          <option v-for="underkat in underkategorier" :key="underkat.id" :value="underkat.id">
            {{ getCategoryName(underkat, t) }}
          </option>
        </select>
      </div>

      <!-- Note -->
      <div>
        <label for="note" class="label">{{ t('newEntry.noteLabel') }} ({{ t('common.optional') }})</label>
        <textarea
          id="note"
          v-model="note"
          :placeholder="t('newEntry.notePlaceholder')"
          class="input"
          rows="2"
        ></textarea>
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
        {{ isSubmitting ? t('newEntry.savingButton') : t('newEntry.saveButton') }}
      </button>
    </form>

    <!-- Add Category Sheet -->
    <SheetAddCategory
      v-model="showAddCategory"
      @saved="emit('saved')"
    />
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

.type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.75rem;
  background-color: transparent;
  color: var(--color-text);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.type-btn-active {
  border-width: 2px;
}

.type-btn-negative.type-btn-active {
  border-color: var(--color-negative);
  background-color: rgba(231, 76, 60, 0.08);
  color: var(--color-negative);
}

.type-btn-accent.type-btn-active {
  border-color: var(--color-accent);
  background-color: rgba(255, 190, 91, 0.08);
  color: #d69c3a;
}

:global(.dark) .type-btn {
  border-color: rgba(255, 255, 255, 0.15);
}

:global(.dark) .type-btn-negative.type-btn-active {
  background-color: rgba(255, 112, 99, 0.12);
}

:global(.dark) .type-btn-accent.type-btn-active {
  background-color: rgba(255, 211, 126, 0.12);
  color: var(--color-accent);
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

.btn-add-category {
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

.btn-add-category:active {
  transform: scale(0.97);
}
</style>
