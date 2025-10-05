<script setup lang="ts">
/**
 * VariableEntriesList - Viser liste af variable posteringer
 * Grupperet per dag med swipe-to-delete support
 */

import { computed } from 'vue';
import UiIcon from './UiIcon.vue';
import MoneyText from './MoneyText.vue';
import { formatDateTimeDK } from '../utils/date';
import { withLock } from '../utils/storage';
import type { VariableEntry, Category } from '../types';

interface Props {
  entries: VariableEntry[];
  kategorier: Category[];
}

interface Emits {
  (e: 'deleted'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Grupper entries per dag
const entriesByDay = computed(() => {
  const grouped = new Map<string, VariableEntry[]>();

  // Sorter nyeste først
  const sorted = [...props.entries].sort((a, b) => b.timestamp - a.timestamp);

  sorted.forEach((entry) => {
    const date = new Date(entry.timestamp);
    const dayKey = date.toLocaleDateString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    if (!grouped.has(dayKey)) {
      grouped.set(dayKey, []);
    }
    grouped.get(dayKey)!.push(entry);
  });

  return Array.from(grouped.entries());
});

const getKategoriNavn = (kategoriId: string) => {
  return props.kategorier.find((k) => k.id === kategoriId)?.navn || 'Ukendt';
};

const getKategoriIcon = (kategoriId: string) => {
  return props.kategorier.find((k) => k.id === kategoriId)?.icon || 'menu-circle';
};

const handleDelete = async (id: string) => {
  if (!confirm('Er du sikker på at du vil slette denne postering?')) return;

  try {
    await withLock((state) => {
      state.variable = state.variable.filter((e) => e.id !== id);
    });
    emit('deleted');
  } catch (err) {
    console.error('Delete entry error:', err);
  }
};
</script>

<template>
  <div class="variable-list">
    <div v-for="[day, dayEntries] in entriesByDay" :key="day" class="day-group">
      <!-- Day header -->
      <div class="day-header">{{ day }}</div>

      <!-- Entries -->
      <div class="entries">
        <div
          v-for="entry in dayEntries"
          :key="entry.id"
          class="entry-card"
        >
          <!-- Icon -->
          <div
            :class="[
              'entry-icon',
              entry.type === 'indtægt' ? 'entry-icon-accent' : 'entry-icon-negative',
            ]"
          >
            <UiIcon :name="getKategoriIcon(entry.kategoriId)" :size="20" />
          </div>

          <!-- Content -->
          <div class="entry-content">
            <div class="entry-title">{{ getKategoriNavn(entry.kategoriId) }}</div>
            <div class="entry-meta">
              <span>{{ formatDateTimeDK(entry.timestamp).split(' ').slice(1).join(' ') }}</span>
              <span v-if="entry.note" class="entry-note">• {{ entry.note }}</span>
            </div>
          </div>

          <!-- Amount -->
          <div class="entry-amount">
            <MoneyText
              :amount="entry.beloeb_ore"
              size="md"
              :variant="entry.type === 'indtægt' ? 'accent' : 'negative'"
              :show-sign="entry.type === 'indtægt'"
            />
          </div>

          <!-- Delete button -->
          <button
            class="entry-delete"
            @click="handleDelete(entry.id)"
            aria-label="Slet"
          >
            <UiIcon name="close" :size="18" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.variable-list {
  padding-bottom: 1rem;
}

.day-group {
  margin-bottom: 1.5rem;
}

.day-header {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
  color: var(--color-text-secondary);
  padding: 0.5rem 1rem;
  margin-bottom: 0.5rem;
}

@media (prefers-color-scheme: dark) {
  .day-header {
    color: var(--color-text-secondary-dark);
  }
}

.entries {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1rem;
}

.entry-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background-color: var(--color-surface);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.12s, box-shadow 0.12s;
}

.entry-card:active {
  transform: scale(0.98);
}

@media (prefers-color-scheme: dark) {
  .entry-card {
    background-color: var(--color-surface-dark);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}

.entry-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.entry-icon-accent {
  background-color: rgba(255, 190, 91, 0.12);
  color: var(--color-accent);
}

.entry-icon-negative {
  background-color: rgba(231, 76, 60, 0.12);
  color: var(--color-negative);
}

@media (prefers-color-scheme: dark) {
  .entry-icon-accent {
    background-color: rgba(255, 211, 126, 0.15);
    color: var(--color-accent-dark);
  }

  .entry-icon-negative {
    background-color: rgba(255, 112, 99, 0.15);
    color: var(--color-negative-dark);
  }
}

.entry-content {
  flex: 1;
  min-width: 0;
}

.entry-title {
  font-weight: 500;
  font-size: 0.9375rem;
  margin-bottom: 0.125rem;
}

.entry-meta {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

@media (prefers-color-scheme: dark) {
  .entry-meta {
    color: var(--color-text-secondary-dark);
  }
}

.entry-note {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-amount {
  flex-shrink: 0;
  margin-right: 0.25rem;
}

.entry-delete {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: transparent;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s;
}

.entry-delete:hover {
  background-color: rgba(231, 76, 60, 0.1);
  color: var(--color-negative);
}

.entry-delete:active {
  background-color: rgba(231, 76, 60, 0.15);
}

@media (prefers-color-scheme: dark) {
  .entry-delete {
    color: var(--color-text-secondary-dark);
  }

  .entry-delete:hover {
    background-color: rgba(255, 112, 99, 0.15);
    color: var(--color-negative-dark);
  }
}

@media (prefers-reduced-motion: reduce) {
  .entry-card {
    transition: none;
  }
}
</style>
