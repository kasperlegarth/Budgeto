<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { initAppState, shouldShowOnboarding } from './utils/storage';
import type { AppState } from './types';
import MoneyText from './components/MoneyText.vue';
import UiIcon from './components/UiIcon.vue';
import EmptyState from './components/EmptyState.vue';
import FabMenu from './components/FabMenu.vue';
import SheetNewEntry from './components/SheetNewEntry.vue';
import SheetFixedEntries from './components/SheetFixedEntries.vue';
import SheetSettings from './components/SheetSettings.vue';
import Onboarding from './components/Onboarding.vue';
import VariableEntriesList from './components/VariableEntriesList.vue';

const state = ref<AppState | null>(null);
const showNewEntry = ref(false);
const showFixedEntries = ref(false);
const showSettings = ref(false);
const showOnboarding = ref(false);

onMounted(() => {
  showOnboarding.value = shouldShowOnboarding();
  state.value = initAppState();
});

const refreshState = () => {
  state.value = initAppState();
};

const handleOnboardingComplete = () => {
  showOnboarding.value = false;
  refreshState();
};

// KPI beregninger
const getTilbageIMåneden = () => {
  if (!state.value) return 0;

  // Sum faste indtægter
  const fasteIndtaegter = state.value.faste
    .filter((e) => e.type === 'indtægt')
    .reduce((sum, e) => sum + e.beloeb_ore, 0);

  // Sum faste udgifter
  const fasteUdgifter = state.value.faste
    .filter((e) => e.type === 'udgift')
    .reduce((sum, e) => sum + e.beloeb_ore, 0);

  // Sum variable udgifter
  const variableUdgifter = state.value.variable
    .filter((e) => e.type === 'udgift')
    .reduce((sum, e) => sum + e.beloeb_ore, 0);

  // Sum variable indtægter
  const variableIndtaegter = state.value.variable
    .filter((e) => e.type === 'indtægt')
    .reduce((sum, e) => sum + e.beloeb_ore, 0);

  return fasteIndtaegter - fasteUdgifter - variableUdgifter + variableIndtaegter;
};

const getBrugtIMåneden = () => {
  if (!state.value) return 0;

  return state.value.variable
    .filter((e) => e.type === 'udgift')
    .reduce((sum, e) => sum + e.beloeb_ore, 0);
};

const hasVariableEntries = () => {
  return state.value && state.value.variable.length > 0;
};
</script>

<template>
  <div class="min-h-screen pb-24">
    <!-- Header -->
    <header class="surface safe-area-inset-top px-4 py-6 shadow-sm">
      <h1 class="text-2xl font-semibold text-center">Budgeto</h1>
    </header>

    <!-- KPI Cards -->
    <div class="px-4 py-6 space-y-3">
      <!-- KPI 1: Tilbage i måneden -->
      <div class="surface rounded-2xl p-5 shadow-md">
        <div class="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-1">
          Tilbage i måneden
        </div>
        <MoneyText :amount="getTilbageIMåneden()" size="xl" variant="accent" />
      </div>

      <!-- KPI 2: Brugt denne måned -->
      <div class="surface rounded-2xl p-5 shadow-md">
        <div class="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-1">
          Brugt denne måned
        </div>
        <MoneyText :amount="getBrugtIMåneden()" size="xl" variant="negative" />
      </div>
    </div>

    <!-- Kategorier Section -->
    <div class="px-4 py-2">
      <h2 class="text-lg font-semibold mb-3">Kategorier</h2>

      <!-- Vis kategorier hvis der er data -->
      <div v-if="state && state.kategorier.length > 0" class="space-y-2">
        <div
          v-for="kategori in state.kategorier.slice(0, 5)"
          :key="kategori.id"
          class="surface rounded-xl p-4 shadow-sm flex items-center gap-3 touch-feedback"
        >
          <div class="w-10 h-10 rounded-full bg-[var(--color-primary-light)] dark:bg-[var(--color-surface-dark)] flex items-center justify-center">
            <UiIcon
              :name="kategori.icon"
              :size="20"
              class="text-[var(--color-primary)] dark:text-[var(--color-primary-dark)]"
            />
          </div>
          <div class="flex-1">
            <div class="text-base font-medium">{{ kategori.navn }}</div>
            <div class="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mt-0.5">
              <MoneyText :amount="0" size="sm" />
            </div>
          </div>
          <UiIcon
            name="chevron-right"
            :size="20"
            class="text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]"
          />
        </div>
      </div>

      <!-- Empty state hvis ingen kategorier -->
      <EmptyState
        v-else
        icon="shopping-bag-01"
        title="Ingen kategorier"
        description="Tryk på + for at tilføje din første postering"
      />
    </div>

    <!-- Variable posteringer -->
    <div class="px-4 py-2">
      <h2 class="text-lg font-semibold mb-3">Posteringer denne måned</h2>

      <VariableEntriesList
        v-if="hasVariableEntries()"
        :entries="state?.variable || []"
        :kategorier="state?.kategorier || []"
        @deleted="refreshState"
      />

      <EmptyState
        v-else
        icon="restaurant"
        title="Ingen posteringer endnu"
        description="Tryk på + knappen for at tilføje din første udgift eller indtægt"
      />
    </div>

    <!-- FAB Menu -->
    <FabMenu
      @new-entry="showNewEntry = true"
      @fixed-entries="showFixedEntries = true"
      @settings="showSettings = true"
    />

    <!-- Sheets -->
    <SheetNewEntry
      v-model="showNewEntry"
      :kategorier="state?.kategorier || []"
      @saved="refreshState"
    />

    <SheetFixedEntries
      v-model="showFixedEntries"
      :faste="state?.faste || []"
      :kategorier="state?.kategorier || []"
      @updated="refreshState"
    />

    <SheetSettings
      v-model="showSettings"
      @reset="refreshState"
    />

    <!-- Onboarding -->
    <Onboarding
      v-if="showOnboarding"
      @complete="handleOnboardingComplete"
    />
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .touch-feedback {
    transition: none;
  }
}
</style>
