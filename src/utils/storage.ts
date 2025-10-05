/**
 * Storage utilities for Budgeto
 * Håndterer localStorage operations, seeding, auto-reset og locks
 */

import type { AppState, Category } from '../types';
import categoriesSeed from '../data/categories.seed.json';
import { shouldResetVariable, firstDayOfMonth, nowInCopenhagen } from './date';

// Storage keys
const STORAGE_KEYS = {
  APP_STATE: 'budgeto.appstate',
  SEED_APPLIED: 'budgeto.seed.applied',
  LAST_OPENED_ISO: 'budgeto.lastOpenedISO',
  LOCK: 'budgeto.lock',
} as const;

const CURRENT_VERSION = 1;

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
 * Opretter initial app state med seed data
 * @returns Ny AppState
 */
function createInitialState(): AppState {
  return {
    version: CURRENT_VERSION,
    faste: [],
    variable: [],
    kategorier: categoriesSeed as Category[],
    sidsteResetISO: firstDayOfMonth(),
  };
}

/**
 * Initialiserer app state
 * - Opretter ny state hvis ikke eksisterer
 * - Auto-reset variable posteringer ved månedsskifte
 * @returns AppState
 */
export function initAppState(): AppState {
  let state = getAppState();

  // Første kørsel: opret initial state
  if (!state) {
    state = createInitialState();
    saveAppState(state);
    localStorage.setItem(STORAGE_KEYS.SEED_APPLIED, 'true');
    return state;
  }

  // Tjek om vi skal auto-reset variable posteringer
  const lastOpenedISO = localStorage.getItem(STORAGE_KEYS.LAST_OPENED_ISO);
  const now = nowInCopenhagen();

  if (shouldResetVariable(lastOpenedISO)) {
    // Nulstil variable posteringer
    state.variable = [];
    state.sidsteResetISO = firstDayOfMonth(now);
    saveAppState(state);
    console.log('Auto-reset: Variable posteringer nulstillet for ny måned');
  }

  // Opdater last opened
  localStorage.setItem(STORAGE_KEYS.LAST_OPENED_ISO, now.toISOString());

  return state;
}

/**
 * Nulstiller AL data (manuelt reset fra indstillinger)
 * Sletter hele app state og seed flag
 */
export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.APP_STATE);
  localStorage.removeItem(STORAGE_KEYS.SEED_APPLIED);
  localStorage.removeItem(STORAGE_KEYS.LAST_OPENED_ISO);
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
