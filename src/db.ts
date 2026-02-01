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
] as const

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
