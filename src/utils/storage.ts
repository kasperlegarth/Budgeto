/**
 * Storage utilities for Budgeto
 * Håndterer localStorage operations, seeding, auto-reset og locks
 */

import type { AppState, Category } from '../types';
import categoriesSeed from '../data/categories.seed.json';
import { shouldResetVariable, firstDayOfMonth, nowInCopenhagen } from './date';
import { dkkOreToMoney } from './money';
import { generateMockData } from './mockData';

// Storage keys
const STORAGE_KEYS = {
  APP_STATE: 'budgeto.appstate',
  SEED_APPLIED: 'budgeto.seed.applied',
  LAST_OPENED_ISO: 'budgeto.lastOpenedISO',
  LOCK: 'budgeto.lock',
  DEV_MODE: 'budgeto.devMode',
} as const;

const CURRENT_VERSION = 2;

/**
 * Henter app state fra localStorage
 * @returns AppState eller null hvis ikke fundet
 */
export function getAppState(): AppState | null {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.APP_STATE);
    if (!json) return null;
    return JSON.parse(json) as AppState;
  } catch (error) {
    console.error('Fejl ved hentning af app state:', error);
    return null;
  }
}

/**
 * Gemmer app state til localStorage
 * @param state - AppState at gemme
 */
export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Fejl ved gemning af app state:', error);
    throw new Error('Kunne ikke gemme data');
  }
}

/**
 * Tjekker om dev mode er aktiveret
 * Prioriterer environment variable, derefter localStorage
 * @returns true hvis dev mode er aktiv
 */
export function isDevMode(): boolean {
  // Tjek environment variable først (sæt via npm script)
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    return true;
  }

  // Fallback til localStorage (manuel aktivering)
  return localStorage.getItem(STORAGE_KEYS.DEV_MODE) === 'true';
}

/**
 * Opretter initial app state med seed data
 * @returns Ny AppState
 */
function createInitialState(): AppState {
  const devMode = isDevMode();

  if (devMode) {
    console.log('Dev Mode: Genererer mock data');
    const mockData = generateMockData();
    return {
      version: CURRENT_VERSION,
      faste: mockData.faste,
      variable: mockData.variable,
      kategorier: categoriesSeed as Category[],
      sidsteResetISO: firstDayOfMonth(),
      defaultCurrency: 'DKK',
    };
  }

  return {
    version: CURRENT_VERSION,
    faste: [],
    variable: [],
    kategorier: categoriesSeed as Category[],
    sidsteResetISO: firstDayOfMonth(),
    defaultCurrency: 'DKK',
  };
}

/**
 * Migrerer fra version 1 til version 2
 * Konverterer beloeb_ore til beloeb (Money objekt) og tilføjer defaultCurrency
 */
function migrateV1ToV2(state: AppState): void {
  console.log('Migration: Starter V1 → V2 migration');

  // Sæt default currency hvis mangler
  if (!state.defaultCurrency) {
    state.defaultCurrency = 'DKK';
  }

  // Migrer faste posteringer
  state.faste = state.faste.map((entry) => {
    if (!entry.beloeb && entry.beloeb_ore !== undefined) {
      return {
        ...entry,
        beloeb: dkkOreToMoney(entry.beloeb_ore),
      };
    }
    return entry;
  });

  // Migrer variable posteringer
  state.variable = state.variable.map((entry) => {
    if (!entry.beloeb && entry.beloeb_ore !== undefined) {
      return {
        ...entry,
        beloeb: dkkOreToMoney(entry.beloeb_ore),
      };
    }
    return entry;
  });

  // Opdater version
  state.version = 2;

  console.log('Migration: V1 → V2 gennemført');
}

/**
 * Migrerer kategorier fra gamle `navn` felt til `nameKey` felt
 * Tilføjer nameKey baseret på kategori ID hvis det mangler
 */
function migrateCategories(state: AppState): void {
  let migrated = false;

  state.kategorier = state.kategorier.map((kategori) => {
    // Hvis nameKey mangler, tilføj det baseret på ID
    if (!kategori.nameKey && kategori.id) {
      migrated = true;
      const updated = { ...kategori, nameKey: `categories.${kategori.id}` };

      // Migrer underkategorier
      if (updated.underkategorier) {
        updated.underkategorier = updated.underkategorier.map((underkat) => {
          if (!underkat.nameKey && underkat.id) {
            return { ...underkat, nameKey: `categories.${underkat.id}` };
          }
          return underkat;
        });
      }

      return updated;
    }

    // Migrer underkategorier selv hvis kategori har nameKey
    if (kategori.underkategorier) {
      const updatedUnderkategorier = kategori.underkategorier.map((underkat) => {
        if (!underkat.nameKey && underkat.id) {
          migrated = true;
          return { ...underkat, nameKey: `categories.${underkat.id}` };
        }
        return underkat;
      });

      if (migrated) {
        return { ...kategori, underkategorier: updatedUnderkategorier };
      }
    }

    return kategori;
  });

  if (migrated) {
    console.log('Migration: Kategorier opdateret med nameKey felter');
  }
}

/**
 * Initialiserer app state
 * - Opretter ny state hvis ikke eksisterer
 * - Auto-reset variable posteringer ved månedsskifte
 * - Migrerer fra ældre versioner
 * - Generer mock data hvis dev mode er aktiveret
 * @returns AppState
 */
export function initAppState(): AppState {
  let state = getAppState();
  const devModeActive = isDevMode();

  // Første kørsel: opret initial state
  if (!state) {
    state = createInitialState();
    saveAppState(state);
    localStorage.setItem(STORAGE_KEYS.SEED_APPLIED, 'true');
    return state;
  }

  // Hvis dev mode er aktiveret og vi ikke har mock data endnu, generer det
  if (devModeActive && !localStorage.getItem('budgeto.mockDataGenerated')) {
    console.log('Dev Mode: Regenererer mock data');
    const mockData = generateMockData();
    state.faste = mockData.faste;
    state.variable = mockData.variable;
    localStorage.setItem('budgeto.mockDataGenerated', 'true');
    saveAppState(state);
    localStorage.setItem(STORAGE_KEYS.LAST_OPENED_ISO, nowInCopenhagen().toISOString());
    return state;
  }

  // Hvis dev mode er slået fra, fjern mock data flag
  if (!devModeActive && localStorage.getItem('budgeto.mockDataGenerated')) {
    localStorage.removeItem('budgeto.mockDataGenerated');
  }

  // Migrer fra version 1 til version 2
  if (state.version === 1) {
    migrateV1ToV2(state);
  }

  // Migrer kategorier til nameKey format (gælder alle versioner)
  migrateCategories(state);

  // Tjek om vi skal auto-reset variable posteringer
  const lastOpenedISO = localStorage.getItem(STORAGE_KEYS.LAST_OPENED_ISO);
  const now = nowInCopenhagen();

  if (shouldResetVariable(lastOpenedISO)) {
    // Nulstil variable posteringer
    state.variable = [];
    state.sidsteResetISO = firstDayOfMonth(now);
    saveAppState(state);
    console.log('Auto-reset: Variable posteringer nulstillet for ny måned');
  } else {
    // Gem migreret state
    saveAppState(state);
  }

  // Opdater last opened
  localStorage.setItem(STORAGE_KEYS.LAST_OPENED_ISO, now.toISOString());

  return state;
}

/**
 * Nulstiller AL data (manuelt reset fra indstillinger)
 * Sletter hele app state og seed flag
 * Nulstiller også theme og locale for at trigge onboarding flow
 */
export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.APP_STATE);
  localStorage.removeItem(STORAGE_KEYS.SEED_APPLIED);
  localStorage.removeItem(STORAGE_KEYS.LAST_OPENED_ISO);
  // Nulstil også theme og locale så onboarding kan vælge dem igen
  localStorage.removeItem('budgeto.theme');
  localStorage.removeItem('budgeto.locale');
  console.log('Total reset: Al data slettet');
}

/**
 * Tjekker om onboarding skal vises
 * @returns true hvis det er første kørsel
 */
export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem(STORAGE_KEYS.SEED_APPLIED);
}

/**
 * Markerer onboarding som completed
 */
export function completeOnboarding(): void {
  localStorage.setItem(STORAGE_KEYS.SEED_APPLIED, 'true');
}

/**
 * Forsøger at sætte lock (bruges til at forhindre concurrent writes)
 * @returns true hvis lock blev sat, false hvis allerede låst
 */
export function acquireLock(): boolean {
  const lock = localStorage.getItem(STORAGE_KEYS.LOCK);
  if (lock) {
    // Tjek om lock er for gammel (over 5 sekunder = stale)
    const lockTime = parseInt(lock, 10);
    if (Date.now() - lockTime < 5000) {
      return false; // Lock er aktiv
    }
  }
  localStorage.setItem(STORAGE_KEYS.LOCK, Date.now().toString());
  return true;
}

/**
 * Frigiver lock
 */
export function releaseLock(): void {
  localStorage.removeItem(STORAGE_KEYS.LOCK);
}

/**
 * Wrapper til sikre write-operationer med lock
 * @param fn - Funktion der modificerer state
 */
export async function withLock<T>(fn: (state: AppState) => T): Promise<T> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    if (acquireLock()) {
      try {
        const state = getAppState() || createInitialState();
        const result = fn(state);
        saveAppState(state);
        return result;
      } finally {
        releaseLock();
      }
    }
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error('Kunne ikke få adgang til data (lock timeout)');
}
