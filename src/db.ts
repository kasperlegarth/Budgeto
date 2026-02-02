import Dexie, { type Table } from 'dexie'

export type Expense = {
  id?: number
  createdAt: number
  amountOre: number
  category: string
  note: string | null
}

export const DEFAULT_CATEGORIES = [
  'Frokost',
  'Mad',
  'Transport',
  'Indkoeb',
  'Borne',
  'Abonnement',
  'Andet',
]

function isDemoMode() {
  try {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true'
  } catch {
    return false
  }
}

export const STORAGE_PREFIX = isDemoMode() ? 'budgeto-demo' : 'budgeto'
export const DB_NAME = isDemoMode() ? 'budgeto-demo' : 'budgeto'

export function storageKey(suffix: string) {
  return `${STORAGE_PREFIX}:${suffix}`
}

// Get all categories (default + custom from localStorage)
export function getAllCategories(): string[] {
  try {
    const raw = localStorage.getItem(storageKey('customCategories'))
    const custom: string[] = raw ? JSON.parse(raw) : []
    const uniq = new Set<string>()
    for (const c of [...DEFAULT_CATEGORIES, ...custom]) {
      if (c && c.trim()) uniq.add(c.trim())
    }
    return Array.from(uniq)
  } catch {
    return [...DEFAULT_CATEGORIES]
  }
}

// Save custom categories to localStorage
export function saveCustomCategories(categories: string[]) {
  try {
    localStorage.setItem(storageKey('customCategories'), JSON.stringify(categories))
  } catch {}
}

// Get only custom categories
export function getCustomCategories(): string[] {
  try {
    const raw = localStorage.getItem(storageKey('customCategories'))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

class BudgetoDb extends Dexie {
  expenses!: Table<Expense, number>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      expenses: '++id, createdAt, category',
    })
  }
}

export const db = new BudgetoDb(DB_NAME)
