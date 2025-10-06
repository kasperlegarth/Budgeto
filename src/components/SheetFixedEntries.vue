<script setup lang="ts">
/**
 * SheetFixedEntries - CRUD for faste posteringer
 * Liste + Add/Edit/Delete
 */

import { ref, computed } from 'vue';
import BottomSheet from './BottomSheet.vue';
import UiIcon from './UiIcon.vue';
import MoneyText from './MoneyText.vue';
import EmptyState from './EmptyState.vue';
import { parseDKK } from '../utils/money';
import { withLock } from '../utils/storage';
import type { EntryType, Category, FixedEntry } from '../types';

interface Props {
  modelValue: boolean;
  faste: FixedEntry[];
  kategorier: Category[];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showForm = ref(false);
const editingId = ref<string | null>(null);

// Form state
const formType = ref<EntryType>('udgift');
const formBeloeb = ref('');
const formKategoriId = ref('');
const formUnderkategoriId = ref('');
const formNote = ref('');
const formError = ref('');

const fasteIndtaegter = computed(() => props.faste.filter((e) => e.type === 'indtægt'));
const fasteUdgifter = computed(() => props.faste.filter((e) => e.type === 'udgift'));

const getKategoriNavn = (kategoriId: string) => {
  return props.kategorier.find((k) => k.id === kategoriId)?.navn || 'Ukendt';
};

const resetForm = () => {
  formType.value = 'udgift';
  formBeloeb.value = '';
  formKategoriId.value = '';
  formUnderkategoriId.value = '';
  formNote.value = '';
  formError.value = '';
  editingId.value = null;
  showForm.value = false;
};

const openAddForm = () => {
  resetForm();
  showForm.value = true;
};

const openEditForm = (entry: FixedEntry) => {
  editingId.value = entry.id;
  formType.value = entry.type;
  formBeloeb.value = (entry.beloeb_ore / 100).toString().replace('.', ',');
  formKategoriId.value = entry.kategoriId;
  formUnderkategoriId.value = entry.underkategoriId || '';
  formNote.value = entry.note || '';
  formError.value = '';
  showForm.value = true;
};

const handleSave = async () => {
  formError.value = '';

  const beloeb_ore = parseDKK(formBeloeb.value);
  if (beloeb_ore === null || beloeb_ore <= 0) {
    formError.value = 'Indtast et gyldigt beløb';
    return;
  }

  if (!formKategoriId.value) {
    formError.value = 'Vælg en kategori';
    return;
  }

  try {
    await withLock((state) => {
      if (editingId.value) {
        // Edit existing
        const idx = state.faste.findIndex((e) => e.id === editingId.value);
        if (idx !== -1) {
          state.faste[idx] = {
            id: editingId.value,
            type: formType.value,
            kategoriId: formKategoriId.value,
            underkategoriId: formUnderkategoriId.value || undefined,
            beloeb_ore,
            note: formNote.value.trim() || undefined,
          };
        }
      } else {
        // Add new
        state.faste.push({
          id: crypto.randomUUID(),
          type: formType.value,
          kategoriId: formKategoriId.value,
          underkategoriId: formUnderkategoriId.value || undefined,
          beloeb_ore,
          note: formNote.value.trim() || undefined,
        });
      }
    });

    emit('updated');
    resetForm();
  } catch (err) {
    formError.value = 'Kunne ikke gemme';
    console.error('Save fixed entry error:', err);
  }
};

const handleDelete = async (id: string) => {
  if (!confirm('Er du sikker på at du vil slette denne faste postering?')) return;

  try {
    await withLock((state) => {
      state.faste = state.faste.filter((e) => e.id !== id);
    });
    emit('updated');
  } catch (err) {
    console.error('Delete fixed entry error:', err);
  }
};

const handleClose = () => {
  emit('update:modelValue', false);
  resetForm();
};
</script>

<template>
  <BottomSheet
    :model-value="modelValue"
    title="Faste posteringer"
    @update:model-value="handleClose"
  >
    <!-- Form view -->
    <div v-if="showForm" class="space-y-4">
      <div class="flex gap-2">
        <button
          type="button"
          :class="['type-btn', formType === 'udgift' && 'type-btn-active type-btn-negative']"
          @click="formType = 'udgift'"
        >
          Udgift
        </button>
        <button
          type="button"
          :class="['type-btn', formType === 'indtægt' && 'type-btn-active type-btn-accent']"
          @click="formType = 'indtægt'"
        >
          Indtægt
        </button>
      </div>

      <div>
        <label class="label">Beløb</label>
        <input v-model="formBeloeb" type="text" inputmode="decimal" placeholder="0,00" class="input" />
      </div>

      <div>
        <label class="label">Kategori</label>
        <select v-model="formKategoriId" class="input">
          <option value="">Vælg kategori...</option>
          <option v-for="kat in kategorier" :key="kat.id" :value="kat.id">
            {{ kat.navn }}
          </option>
        </select>
      </div>

      <div>
        <label class="label">Note (valgfri)</label>
        <input v-model="formNote" type="text" placeholder="F.eks. husleje, løn..." class="input" />
      </div>

      <div v-if="formError" class="error-message">{{ formError }}</div>

      <div class="flex gap-2">
        <button type="button" class="btn-secondary" @click="resetForm">Annuller</button>
        <button type="button" class="btn-primary" @click="handleSave">Gem</button>
      </div>
    </div>

    <!-- List view -->
    <div v-else>
      <button class="btn-add mb-4" @click="openAddForm">
        <UiIcon name="add" :size="20" />
        Tilføj fast postering
      </button>

      <!-- Empty state -->
      <EmptyState
        v-if="faste.length === 0"
        icon="money-bag-01"
        title="Ingen faste posteringer"
        description="Tilføj faste indtægter (løn) og udgifter (husleje, el, etc.) der kommer hver måned"
      />

      <!-- Indtægter -->
      <div v-if="fasteIndtaegter.length > 0" class="mb-6">
        <h3 class="section-title">Indtægter</h3>
        <div class="space-y-2">
          <div v-for="entry in fasteIndtaegter" :key="entry.id" class="entry-card">
            <div class="flex-1">
              <div class="entry-title">{{ getKategoriNavn(entry.kategoriId) }}</div>
              <div v-if="entry.note" class="entry-note">{{ entry.note }}</div>
              <MoneyText :amount="entry.beloeb_ore" size="sm" variant="accent" />
            </div>
            <div class="flex gap-1">
              <button class="icon-btn" @click="openEditForm(entry)" aria-label="Rediger">
                <UiIcon name="settings-02" :size="18" />
              </button>
              <button class="icon-btn" @click="handleDelete(entry.id)" aria-label="Slet">
                <UiIcon name="close" :size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Udgifter -->
      <div v-if="fasteUdgifter.length > 0">
        <h3 class="section-title">Udgifter</h3>
        <div class="space-y-2">
          <div v-for="entry in fasteUdgifter" :key="entry.id" class="entry-card">
            <div class="flex-1">
              <div class="entry-title">{{ getKategoriNavn(entry.kategoriId) }}</div>
              <div v-if="entry.note" class="entry-note">{{ entry.note }}</div>
              <MoneyText :amount="entry.beloeb_ore" size="sm" variant="negative" />
            </div>
            <div class="flex gap-1">
              <button class="icon-btn" @click="openEditForm(entry)" aria-label="Rediger">
                <UiIcon name="settings-02" :size="18" />
              </button>
              <button class="icon-btn" @click="handleDelete(entry.id)" aria-label="Slet">
                <UiIcon name="close" :size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  transition: border-color 0.15s;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

:global(.dark) .input {
  border-color: rgba(255, 255, 255, 0.15);
}

.type-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.75rem;
  background: transparent;
  color: var(--color-text);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

:global(.dark) .type-btn {
  border-color: rgba(255, 255, 255, 0.15);
}

.type-btn-active.type-btn-negative {
  border-color: var(--color-negative);
  background-color: rgba(231, 76, 60, 0.08);
  color: var(--color-negative);
}

.type-btn-active.type-btn-accent {
  border-color: var(--color-accent);
  background-color: rgba(255, 190, 91, 0.08);
  color: #d69c3a;
}

:global(.dark) .type-btn-active.type-btn-negative {
  background-color: rgba(255, 112, 99, 0.12);
}

:global(.dark) .type-btn-active.type-btn-accent {
  background-color: rgba(255, 211, 126, 0.12);
  color: var(--color-accent);
}

.btn-add {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary {
  flex: 1;
  padding: 0.875rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
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
}

:global(.dark) .btn-secondary {
  border-color: rgba(255, 255, 255, 0.15);
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
}

.entry-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background-color: var(--color-background);
  border-radius: 0.75rem;
}

.entry-title {
  font-weight: 500;
  margin-bottom: 0.125rem;
}

.entry-note {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.icon-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 0.375rem;
  transition: background-color 0.15s;
}


.error-message {
  padding: 0.75rem;
  background-color: rgba(231, 76, 60, 0.1);
  color: var(--color-negative);
  border-radius: 0.75rem;
  font-size: 0.875rem;
}

:global(.dark) .error-message {
  background-color: rgba(255, 112, 99, 0.15);
}
</style>
