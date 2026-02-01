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

// Get all categories (default + custom from localStorage)
export function getAllCategories(): string[] {
  try {
    const raw = localStorage.getItem('budgeto:customCategories')
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
    localStorage.setItem('budgeto:customCategories', JSON.stringify(categories))
  } catch {}
}

// Get only custom categories
export function getCustomCategories(): string[] {
  try {
    const raw = localStorage.getItem('budgeto:customCategories')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

class BudgetoDb extends Dexie {
  expenses!: Table<Expense, number>

  constructor() {
    super('budgeto')
    this.version(1).stores({
      expenses: '++id, createdAt, category',
    })
  }
}

export const db = new BudgetoDb()
