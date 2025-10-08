<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { initAppState, shouldShowOnboarding, isDevMode } from './utils/storage';
import { useTheme } from './composables/useTheme';
import { getCategoryName } from './utils/category';
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

// Initialize theme
useTheme();

const { t } = useI18n();

const state = ref<AppState | null>(null);
const showNewEntry = ref(false);
const showFixedEntries = ref(false);
const showSettings = ref(false);
const showOnboarding = ref(false);
const devMode = ref(false);

onMounted(() => {
  showOnboarding.value = shouldShowOnboarding();
  state.value = initAppState();
  devMode.value = isDevMode();
});

const refreshState = () => {
  state.value = initAppState();
};

const handleOnboardingComplete = () => {
  showOnboarding.value = false;
  refreshState();
};

// KPI beregninger - bruger Money objekt eller fallback til beloeb_ore
const getTilbageIMåneden = () => {
  if (!state.value) return 0;

  // Sum faste indtægter
  const fasteIndtaegter = state.value.faste
    .filter((e) => e.type === 'indtægt')
    .reduce((sum, e) => sum + (e.beloeb?.amount ?? e.beloeb_ore), 0);

  // Sum faste udgifter
  const fasteUdgifter = state.value.faste
    .filter((e) => e.type === 'udgift')
    .reduce((sum, e) => sum + (e.beloeb?.amount ?? e.beloeb_ore), 0);

  // Sum variable udgifter
  const variableUdgifter = state.value.variable
    .filter((e) => e.type === 'udgift')
    .reduce((sum, e) => sum + (e.beloeb?.amount ?? e.beloeb_ore), 0);

  // Sum variable indtægter
  const variableIndtaegter = state.value.variable
    .filter((e) => e.type === 'indtægt')
    .reduce((sum, e) => sum + (e.beloeb?.amount ?? e.beloeb_ore), 0);

  return fasteIndtaegter - fasteUdgifter - variableUdgifter + variableIndtaegter;
};

// Unused for now, but may be used later for KPI display
// const getBrugtIMåneden = () => {
//   if (!state.value) return 0;
//
//   return state.value.variable
//     .filter((e) => e.type === 'udgift')
//     .reduce((sum, e) => sum + e.beloeb_ore, 0);
// };

const hasVariableEntries = () => {
  return state.value && state.value.variable.length > 0;
};

// Kategorier med udgifter
const getKategorierMedUdgifter = () => {
  if (!state.value) return [];

  // Beregn total udgift for hver kategori
  const kategoriTotaler = new Map<string, number>();

  // Variable udgifter
  state.value.variable
    .filter((e) => e.type === 'udgift')
    .forEach((e) => {
      const current = kategoriTotaler.get(e.kategoriId) || 0;
      kategoriTotaler.set(e.kategoriId, current + (e.beloeb?.amount ?? e.beloeb_ore));
    });

  // Faste udgifter
  state.value.faste
    .filter((e) => e.type === 'udgift')
    .forEach((e) => {
      const current = kategoriTotaler.get(e.kategoriId) || 0;
      kategoriTotaler.set(e.kategoriId, current + (e.beloeb?.amount ?? e.beloeb_ore));
    });

  // Map kategorier med deres totaler
  return state.value.kategorier
    .filter((k) => kategoriTotaler.has(k.id))
    .map((k) => ({
      kategori: k,
      total: kategoriTotaler.get(k.id) || 0,
    }))
    .sort((a, b) => b.total - a.total); // Sortér efter højeste forbrug
};

// Hjælpefunktioner til farver
const getCategoryColor = (index: number) => {
  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f97316'];
  return colors[index % colors.length];
};

const getCategoryColorClass = (index: number) => {
  const classes = ['purple', 'cyan', 'green', 'orange'];
  return classes[index % classes.length];
};
</script>

<template>
  <div class="app-container">
    <!-- Dev Mode Badge -->
    <div v-if="devMode" class="dev-mode-badge">
      <UiIcon name="code-circle" :size="16" />
      <span>Dev Mode</span>
    </div>

    <!-- Main Balance -->
    <div class="main-balance">
      <div class="balance-label">{{ t('kpi.mainBalance') }}</div>
      <div class="balance-amount">
        <MoneyText :amount="getTilbageIMåneden()" size="3xl" :show-sign="false" />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button class="action-btn">
        <UiIcon name="add" :size="20" />
        <span>{{ t('quickActions.add') }}</span>
      </button>
      <button class="action-btn">
        <UiIcon name="shopping-cart-02" :size="20" />
        <span>{{ t('quickActions.move') }}</span>
      </button>
      <button class="action-btn">
        <UiIcon name="lightning-01" :size="20" />
        <span>{{ t('quickActions.send') }}</span>
      </button>
      <button class="action-btn">
        <UiIcon name="menu-circle" :size="20" />
        <span>{{ t('quickActions.details') }}</span>
      </button>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <div class="section-header">
        <h2>{{ t('quickActions.title') }}</h2>
        <button class="edit-button">{{ t('common.edit') }}</button>
      </div>

      <div v-if="getKategorierMedUdgifter().length > 0" class="category-grid">
        <div
          v-for="(item, index) in getKategorierMedUdgifter()"
          :key="item.kategori.id"
          class="category-card touch-feedback"
          :class="[`category-card-${getCategoryColorClass(index)}`]"
          :style="{ backgroundColor: item.kategori.color || getCategoryColor(index) }"
        >
          <div class="category-icon">
            <UiIcon :name="item.kategori.icon" :size="24" />
          </div>
          <div class="category-name">{{ getCategoryName(item.kategori, t) }}</div>
          <div class="category-amount">
            <MoneyText :amount="item.total" size="lg" :show-sign="false" variant="white" />
          </div>
        </div>
      </div>

      <div v-else class="empty-categories">
        <EmptyState
          icon="shopping-bag-01"
          :title="t('emptyState.noExpenses.title')"
          :description="t('emptyState.noExpenses.description')"
        />
      </div>
    </div>

    <!-- Variable posteringer -->
    <div class="px-4 py-2">
      <h2 class="text-lg font-semibold mb-3">{{ t('entriesList.title') }}</h2>

      <VariableEntriesList
        v-if="hasVariableEntries()"
        :entries="state?.variable || []"
        :kategorier="state?.kategorier || []"
        @deleted="refreshState"
      />

      <EmptyState
        v-else
        icon="restaurant"
        :title="t('emptyState.noEntries.title')"
        :description="t('emptyState.noEntries.description')"
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
      :kategorier="state?.kategorier || []"
      @reset="refreshState"
      @updated="refreshState"
    />

    <!-- Onboarding -->
    <Onboarding
      v-if="showOnboarding"
      @complete="handleOnboardingComplete"
    />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  padding-bottom: 7rem;
  background-color: var(--color-background);
}

.dev-mode-badge {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.375rem 0.875rem;
  border-radius: 0 0 0.5rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  letter-spacing: 0.025em;
}

.main-balance {
  padding: 2rem 1rem 2rem;
  padding-top: max(2rem, env(safe-area-inset-top));
  text-align: left;
}

.balance-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.balance-amount {
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  padding: 0 1rem 2rem;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  background-color: var(--color-surface);
  border: none;
  border-radius: 1rem;
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}


.quick-actions {
  padding: 0 1rem 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.edit-button {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.category-card {
  background-color: var(--color-purple);
  border-radius: 1.25rem;
  padding: 1.25rem;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 140px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}


.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-name {
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.95;
  flex: 1;
}

.category-amount {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.empty-categories {
  padding: 2rem 0;
}

@media (prefers-reduced-motion: reduce) {
  .touch-feedback,
  .action-btn,
  .category-card {
    transition: none;
  }
}
</style>
