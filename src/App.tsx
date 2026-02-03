import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ChartLineData01Icon, DashboardBrowsingIcon, ListViewIcon, Settings01Icon } from '@hugeicons/core-free-icons'
import { db, type Expense, DEFAULT_CATEGORIES, getAllCategories, getCustomCategories, saveCustomCategories, storageKey } from './db'
import { formatDkk, startOfMonth, endOfMonth } from './lib'
import { Bars, Sparkline, StackedBar } from './charts'
import { Insights } from './insights'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

type Lang = 'da' | 'en'

const LANG_KEY = 'lang'

function getLang(): Lang {
  try {
    const v = localStorage.getItem(storageKey(LANG_KEY))
    return v === 'en' ? 'en' : 'da'
  } catch {
    return 'da'
  }
}

function setLang(lang: Lang) {
  try {
    localStorage.setItem(storageKey(LANG_KEY), lang)
  } catch {}
}

const STRINGS: Record<Lang, Record<string, string>> = {
  da: {
    dashboard: 'Dashboard',
    add: 'Tilføj',
    settings: 'Indstillinger',
    list: 'Udgifter',
    insights: 'Overblik',
    overview: 'Overblik',
    weekly: 'Ugentligt',
    weeklySpending: 'Ugentligt forbrug',
    categoryShare: 'Kategorifordeling',
    searchDeleteUndo: 'Søg + slet + fortryd',
    addExpense: 'Tilføj udgift',
    thisMonth: 'Denne måned',
    trackedLocally: 'Gemmes lokalt · offline-first',
    topCategories: 'Top kategorier',
    latest: 'Seneste',
    entries: 'poster',
    searchPlaceholder: 'Søg (kategori, note, beløb)…',
    noMatches: 'Ingen matches.',
    avgPerDay: 'Gns./dag',
    biggest: 'Størst',
    now: 'Nu',
    amountDkk: 'Beløb (DKK)',
    category: 'Kategori',
    noteOptional: 'Note (valgfri)',
    save: 'Gem',
    saving: 'Gemmer…',
    back: 'Tilbage',
    saveAndAddAnother: 'Gem og tilføj en mere',
    enterAmount: 'Skriv et beløb (fx 40)',
    categories: 'Kategorier',
    yourCustomCategories: 'Dine kategorier',
    addNewCategory: 'Tilføj ny kategori',
    remove: 'Fjern',
    currency: 'Valuta',
    localEntries: 'Lokale poster',
    exportJson: 'Eksportér JSON',
    resetLocalData: 'Nulstil lokale data',
    resetConfirm: 'Slet alle lokale data på denne enhed?',
    done: 'Færdig',
    language: 'Sprog',
    demo: 'demo',
    deleted: 'Slettet',
    undo: 'Fortryd',
    restored: 'Gendannet',
  },
  en: {
    dashboard: 'Dashboard',
    add: 'Add',
    settings: 'Settings',
    list: 'Expenses',
    insights: 'Insights',
    overview: 'Overview',
    weekly: 'Weekly',
    weeklySpending: 'Weekly spending',
    categoryShare: 'Category share',
    searchDeleteUndo: 'Search + delete + undo',
    addExpense: 'Add expense',
    thisMonth: 'This month',
    trackedLocally: 'Stored locally · offline-first',
    topCategories: 'Top categories',
    latest: 'Latest',
    entries: 'entries',
    searchPlaceholder: 'Search (category, note, amount)…',
    noMatches: 'No matches.',
    avgPerDay: 'Avg/day',
    biggest: 'Biggest',
    now: 'Now',
    amountDkk: 'Amount (DKK)',
    category: 'Category',
    noteOptional: 'Note (optional)',
    save: 'Save',
    saving: 'Saving…',
    back: 'Back',
    saveAndAddAnother: 'Save and add another',
    enterAmount: 'Enter an amount (e.g. 40)',
    categories: 'Categories',
    yourCustomCategories: 'Your categories',
    addNewCategory: 'Add new category',
    remove: 'Remove',
    currency: 'Currency',
    localEntries: 'Local entries',
    exportJson: 'Export JSON',
    resetLocalData: 'Reset local data',
    resetConfirm: 'Delete all local data on this device?',
    done: 'Done',
    language: 'Language',
    demo: 'demo',
    deleted: 'Deleted',
    undo: 'Undo',
    restored: 'Restored',
  },
}

function t(lang: Lang, key: string) {
  return STRINGS[lang][key] ?? key
}

function localeFor(lang: Lang) {
  return lang === 'da' ? 'da-DK' : 'en-US'
}

function monthLabel(ts: number, lang: Lang) {
  return new Date(ts).toLocaleDateString(localeFor(lang), { month: 'long', year: 'numeric' })
}

function addMonths(ts: number, delta: number) {
  const d = new Date(ts)
  d.setDate(1)
  d.setMonth(d.getMonth() + delta)
  return d.getTime()
}

function hashHue(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h % 360
}

function categoryColor(category: string) {
  const hue = hashHue(category)
  return {
    dot: `hsl(${hue} 70% 45%)`,
    tint: `hsla(${hue}, 70%, 55%, 0.14)`,
  }
}

type Tab = 'dashboard' | 'list' | 'add' | 'insights' | 'settings'

function tabFromHash(): Tab | null {
  if (typeof window === 'undefined') return null
  const h = window.location.hash.replace('#', '').trim()
  return h === 'dashboard' || h === 'list' || h === 'add' || h === 'insights' || h === 'settings' ? h : null
}

const DEMO = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true'

export default function App() {
  const [tab, setTab] = useState<Tab>(() => tabFromHash() ?? 'dashboard')
  const [lang, setLangState] = useState<Lang>(() => getLang())
  const [tabAnimating, setTabAnimating] = useState(false)

  // Keep tab in sync with URL hash so back/forward works.
  useEffect(() => {
    const onHashChange = () => {
      const next = tabFromHash()
      if (next) setTab(next)
    }

    window.addEventListener('hashchange', onHashChange)
    onHashChange()
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    setTabAnimating(true)
    const t = setTimeout(() => setTabAnimating(false), 220)
    return () => clearTimeout(t)
  }, [tab])

  const navigate = (next: Tab) => {
    if (typeof window === 'undefined') return

    // Update URL (pushes history). hashchange listener drives state.
    const desired = `#${next}`
    if (window.location.hash !== desired) window.location.hash = desired
    else setTab(next)
  }

  // Seed demo data into a separate DB so it never pollutes real data.
  useEffect(() => {
    if (!DEMO) return
    let cancelled = false

    async function seed() {
      const count = await db.expenses.count()
      if (cancelled) return
      if (count > 0) return

      const categories = getAllCategories()
      const notes = ['Netto', 'Rema', 'Bilka', 'Circle K', 'Apotek', 'Spotify', 'HBO', 'Wolt', 'Føtex', 'Bageren']

      const now = Date.now()
      const startThisMonth = startOfMonth(now)
      const startLastMonth = startOfMonth(addMonths(now, -1))

      const items: Omit<Expense, 'id'>[] = []

      // Heavily bias toward *current month* so the default dashboard looks populated.
      // Also add some last-month entries to make month-nav interesting.
      const makeEntry = (createdAt: number) => {
        const category = categories[Math.floor(Math.random() * categories.length)] ?? 'Andet'
        const base = [25, 39, 45, 59, 75, 99, 129, 179, 249, 349][Math.floor(Math.random() * 10)]
        const amountOre = (base + Math.floor(Math.random() * 35)) * 100
        const note = Math.random() > 0.22 ? notes[Math.floor(Math.random() * notes.length)] : null
        items.push({ createdAt, category, amountOre, note })
      }

      // Current month: ~50 entries spread across days
      for (let i = 0; i < 50; i++) {
        const dayOffset = Math.floor(Math.random() * 28)
        const hour = Math.floor(Math.random() * 14) + 7
        const minute = Math.floor(Math.random() * 60)
        makeEntry(startThisMonth + dayOffset * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000 + minute * 60 * 1000)
      }

      // Last month: ~18 entries
      for (let i = 0; i < 18; i++) {
        const dayOffset = Math.floor(Math.random() * 28)
        const hour = Math.floor(Math.random() * 14) + 7
        const minute = Math.floor(Math.random() * 60)
        makeEntry(startLastMonth + dayOffset * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000 + minute * 60 * 1000)
      }

      // newest first for nicer first impression
      items.sort((a, b) => b.createdAt - a.createdAt)
      await db.expenses.bulkAdd(items)
    }

    void seed()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app">
      <Header tab={tab} lang={lang} />
      <main className={tabAnimating ? 'main tabAnimating' : 'main'}>
        {tab === 'dashboard' && <Dashboard onAdd={() => navigate('add')} onList={() => navigate('list')} lang={lang} />}
        {tab === 'list' && <ExpensesList lang={lang} onAdd={() => navigate('add')} />}
        {tab === 'add' && <AddExpense onDone={() => navigate('dashboard')} lang={lang} />}
        {tab === 'insights' && <Insights lang={lang} />}
        {tab === 'settings' && (
          <Settings
            lang={lang}
            onLangChange={(next) => {
              setLang(next)
              setLangState(next)
            }}
          />
        )}
      </main>
      <Nav tab={tab} setTab={navigate} lang={lang} />
    </div>
  )
}

function Header({ tab, lang }: { tab: Tab; lang: Lang }) {
  const title =
    tab === 'dashboard'
      ? t(lang, 'dashboard')
      : tab === 'list'
        ? t(lang, 'list')
        : tab === 'add'
          ? t(lang, 'add')
          : tab === 'insights'
            ? t(lang, 'insights')
            : t(lang, 'settings')
  return (
    <header className="top" aria-label="Header">
      <div className="logoWrap" aria-hidden>
        <div className="brandLogo">Budgeto</div>
        {DEMO && <div className="logoSub">{t(lang, 'demo')}</div>}
      </div>
      {/* keep accessible page title for screen readers */}
      <div className="srOnly">{title}</div>
    </header>
  )
}

function NavIcon({ icon }: { icon: any }) {
  return <HugeiconsIcon icon={icon} size={22} color="currentColor" strokeWidth={1.8} />
}

function Nav({ tab, setTab, lang }: { tab: Tab; setTab: (t: Tab) => void; lang: Lang }) {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="navBar" role="list">
        <button
          role="listitem"
          className={tab === 'dashboard' ? 'navItem active' : 'navItem'}
          onClick={() => setTab('dashboard')}
          aria-label={t(lang, 'dashboard')}
        >
          <NavIcon icon={DashboardBrowsingIcon} />
          <span className="srOnly">{t(lang, 'dashboard')}</span>
        </button>

        <button
          role="listitem"
          className={tab === 'list' ? 'navItem active' : 'navItem'}
          onClick={() => setTab('list')}
          aria-label={t(lang, 'list')}
        >
          <NavIcon icon={ListViewIcon} />
          <span className="srOnly">{t(lang, 'list')}</span>
        </button>

        <button
          role="listitem"
          className={tab === 'add' ? 'navItem navItemAdd active' : 'navItem navItemAdd'}
          onClick={() => setTab('add')}
          aria-label={t(lang, 'addExpense')}
        >
          <span className="navAddInner" aria-hidden>
            <NavIcon icon={Add01Icon} />
          </span>
          <span className="srOnly">{t(lang, 'add')}</span>
        </button>

        <button
          role="listitem"
          className={tab === 'insights' ? 'navItem active' : 'navItem'}
          onClick={() => setTab('insights')}
          aria-label={t(lang, 'insights')}
        >
          <NavIcon icon={ChartLineData01Icon} />
          <span className="srOnly">{t(lang, 'insights')}</span>
        </button>

        <button
          role="listitem"
          className={tab === 'settings' ? 'navItem active' : 'navItem'}
          onClick={() => setTab('settings')}
          aria-label={t(lang, 'settings')}
        >
          <NavIcon icon={Settings01Icon} />
          <span className="srOnly">{t(lang, 'settings')}</span>
        </button>
      </div>
    </nav>
  )
}

function Dashboard({ onAdd, onList, lang }: { onAdd: () => void; onList: () => void; lang: Lang }) {
  const now = Date.now()
  const [monthTs, setMonthTs] = useState(() => startOfMonth(now))
  const from = useMemo(() => startOfMonth(monthTs), [monthTs])
  const to = useMemo(() => endOfMonth(monthTs), [monthTs])

  const [items, setItems] = useState<Expense[] | null>(null)

  // Load monthly items (newest first)
  useEffect(() => {
    let cancelled = false
    db.expenses
      .where('createdAt')
      .between(from, to, true, true)
      .reverse()
      .sortBy('createdAt')
      .then((rows) => {
        if (cancelled) return
        setItems(rows)
      })
    return () => {
      cancelled = true
    }
  }, [from, to])

  // (toast moved to ExpensesList)

  // (filtering + list moved to ExpensesList)

  const total = (items ?? []).reduce((sum, e) => sum + e.amountOre, 0)

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of items ?? []) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amountOre)
    }
    return Array.from(map.entries())
      .map(([category, amountOre]) => ({ category, amountOre }))
      .sort((a, b) => b.amountOre - a.amountOre)
      .slice(0, 6)
  }, [items])

  const biggest = useMemo(() => {
    if (!items || items.length === 0) return null
    return items.reduce((max, e) => (e.amountOre > max.amountOre ? e : max), items[0])
  }, [items])

  const avgPerDay = useMemo(() => {
    if (!items) return null
    const start = new Date(from)
    const end = new Date(to)

    // if current month, only count days up to today (min 1)
    const today = new Date()
    const isCurrentMonth =
      start.getFullYear() === today.getFullYear() && start.getMonth() === today.getMonth()

    const daysInMonth = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const dayOfMonth = today.getDate()

    const denom = clamp(isCurrentMonth ? dayOfMonth : daysInMonth, 1, 31)
    return Math.round(total / denom)
  }, [items, from, to, total])

  const dailySeries = useMemo(() => {
    if (!items) return []
    const days = 14
    const end = Date.now()
    const start = end - (days - 1) * 24 * 60 * 60 * 1000
    const buckets = new Array(days).fill(0)

    for (const e of items) {
      const ts = e.createdAt
      if (ts < start || ts > end) continue
      const idx = Math.floor((ts - start) / (24 * 60 * 60 * 1000))
      if (idx >= 0 && idx < days) buckets[idx] += e.amountOre
    }

    return buckets
  }, [items])

  const weeklyBars = useMemo(() => {
    if (!items) return []
    const start = from
    const bars = [0, 0, 0, 0, 0]
    for (const e of items) {
      const idx = Math.floor((e.createdAt - start) / (7 * 24 * 60 * 60 * 1000))
      if (idx >= 0 && idx < bars.length) bars[idx] += e.amountOre
    }
    // Trim empty tail weeks
    while (bars.length > 1 && bars[bars.length - 1] === 0) bars.pop()
    return bars
  }, [items, from])

  const categoryShare = useMemo(() => {
    const top = byCategory.slice(0, 4)
    const rest = byCategory.slice(4).reduce((s, c) => s + c.amountOre, 0)
    const parts = top.map((c) => ({
      label: c.category,
      value: c.amountOre,
      color: categoryColor(c.category).dot,
    }))
    if (rest > 0) parts.push({ label: 'Other', value: rest, color: 'rgba(17,24,39,0.25)' })
    return parts
  }, [byCategory])

  // (delete-with-undo moved to ExpensesList)

  return (
    <section className="page">
      <div className="card hero">
        <div className="row heroHeader">
          <div className="muted">{monthLabel(from, lang)}</div>
          <div className="spacer" />
          <div className="seg">
            <button className="segBtn" type="button" onClick={() => setMonthTs((t) => addMonths(t, -1))} aria-label="Previous month">
              ←
            </button>
            <button
              className="segBtn"
              type="button"
              onClick={() => setMonthTs(startOfMonth(Date.now()))}
              aria-label="Go to current month"
            >
              {t(lang, 'now')}
            </button>
            <button className="segBtn" type="button" onClick={() => setMonthTs((t) => addMonths(t, 1))} aria-label="Next month">
              →
            </button>
          </div>
        </div>

        <div className="big">{formatDkk(total)}</div>
        <div className="sparkUnder">
          <Sparkline values={dailySeries.map((v) => Math.round(v / 100))} />
        </div>

        <div className="insights">
          <div className="pill">
            <div className="muted small">{t(lang, 'avgPerDay')}</div>
            <div className="strong">{avgPerDay == null ? '—' : formatDkk(avgPerDay)}</div>
          </div>
          <div className="pill">
            <div className="muted small">{t(lang, 'biggest')}</div>
            <div className="strong">{biggest ? formatDkk(biggest.amountOre) : '—'}</div>
          </div>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <button className="primary" onClick={onAdd}>{t(lang, 'addExpense')}</button>
          <button className="ghost" onClick={onList} type="button">{t(lang, 'list')}</button>
        </div>
      </div>

      <div className="card mb12">
        <div className="row">
          <h2>{t(lang, 'overview')}</h2>
          <span className="muted">{monthLabel(from, lang)}</span>
        </div>

        <div className="vizRow">
          <div className="vizCard">
            <div className="muted small">{t(lang, 'weekly')}</div>
            <Bars ariaLabel={t(lang, 'weeklySpending')} values={weeklyBars.map((v) => Math.round(v / 100))} />
          </div>
          <div className="vizCard">
            <div className="muted small">{t(lang, 'categoryShare')}</div>
            <StackedBar ariaLabel={t(lang, 'categoryShare')} parts={categoryShare} />
            <div className="legend">
              {categoryShare.slice(0, 4).map((p) => (
                <div key={p.label} className="legendItem">
                  <span className="dot" style={{ background: p.color }} />
                  <span className="muted small">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row rowCenter">
          <h2>{t(lang, 'latest')}</h2>
          <div className="spacer" />
          <button className="ghost mini" type="button" onClick={onList}>
            {t(lang, 'list')}
          </button>
        </div>

        <div className="muted" style={{ marginTop: 10 }}>
          {t(lang, 'topCategories')} · {t(lang, 'latest')} → {t(lang, 'list')}
        </div>
      </div>

      {/* toast moved to ExpensesList */}
    </section>
  )
}

function ExpensesList({ lang, onAdd }: { lang: Lang; onAdd: () => void }) {
  const [items, setItems] = useState<Expense[] | null>(null)
  const [toast, setToast] = useState<{ text: string; undo?: () => Promise<void> } | null>(null)
  const [toastLeaving, setToastLeaving] = useState(false)
  const [query, setQuery] = useState('')
  const [leavingIds, setLeavingIds] = useState<Set<number>>(() => new Set())

  const closeToast = () => {
    setToastLeaving(true)
    setTimeout(() => {
      setToast(null)
      setToastLeaving(false)
    }, 180)
  }

  useEffect(() => {
    let cancelled = false
    db.expenses
      .orderBy('createdAt')
      .reverse()
      .toArray()
      .then((rows) => {
        if (cancelled) return
        setItems(rows)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Auto-hide toast (with exit animation)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => closeToast(), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!items) return null
    if (!q) return items
    return items.filter((e) => {
      const note = (e.note ?? '').toLowerCase()
      const cat = (e.category ?? '').toLowerCase()
      const amt = (e.amountOre / 100).toFixed(2)
      return note.includes(q) || cat.includes(q) || amt.includes(q)
    })
  }, [items, query])

  async function removeWithUndo(expense: Expense) {
    if (expense.id == null) return

    // Animate out before removal
    setLeavingIds((prev) => new Set(prev).add(expense.id!))
    setTimeout(() => {
      setItems((prev) => (prev ? prev.filter((x) => x.id !== expense.id) : prev))
      setLeavingIds((prev) => {
        const next = new Set(prev)
        next.delete(expense.id!)
        return next
      })
    }, 180)

    await db.expenses.delete(expense.id)

    setToastLeaving(false)
    setToast({
      text: `${t(lang, 'deleted')} ${expense.category} (${formatDkk(expense.amountOre)})`,
      undo: async () => {
        const id = await db.expenses.add({
          category: expense.category,
          note: expense.note,
          amountOre: expense.amountOre,
          createdAt: expense.createdAt,
        })
        setItems((prev) => (prev ? [{ ...expense, id }, ...prev] : [{ ...expense, id }]))
        setToastLeaving(false)
        setToast({ text: t(lang, 'restored') })
      },
    })
  }

  return (
    <section className="page">
      <div className="card">
        <div className="row rowCenter">
          <h2>{t(lang, 'list')}</h2>
          <div className="spacer" />
          <button className="primary mini" type="button" onClick={onAdd}>
            {t(lang, 'add')}
          </button>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <span className="muted">{filtered?.length ?? items?.length ?? 0} {t(lang, 'entries')}</span>
          <span className="muted small">{t(lang, 'searchDeleteUndo')}</span>
        </div>

        <input
          className="input mt10"
          placeholder={t(lang, 'searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {!filtered ? (
          <div className="muted">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="muted">{t(lang, 'noMatches')}</div>
        ) : (
          <ul className="list">
            {filtered.map((e) => (
              <li key={e.id} className={leavingIds.has(e.id!) ? 'listItem leaving' : 'listItem'}>
                <div>
                  <div className="row rowCenter" style={{ gap: 8 }}>
                    <span className="dot" style={{ background: categoryColor(e.category).dot }} />
                    <span className="badge" style={{ background: categoryColor(e.category).tint }}>
                      {e.category}
                    </span>
                  </div>
                  <div className="muted small">{e.note || '—'}</div>
                </div>
                <div className="right">
                  <div className="strong">{formatDkk(e.amountOre)}</div>
                  <div className="muted small">{new Date(e.createdAt).toLocaleString(localeFor(lang))}</div>
                  <button className="mini danger" type="button" onClick={() => void removeWithUndo(e)}>
                    {t(lang, 'remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {toast && (
        <div className={toastLeaving ? 'toast leaving' : 'toast'} role="status">
          <div className="toastText">{toast.text}</div>
          {toast.undo && (
            <button
              className="toastBtn"
              onClick={async () => {
                await toast.undo?.()
                closeToast()
              }}
            >
              {t(lang, 'undo')}
            </button>
          )}
          {!toast.undo && (
            <button className="toastBtn" onClick={() => closeToast()} aria-label="Close">
              OK
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function AddExpense({ onDone, lang }: { onDone: () => void; lang: Lang }) {
  const amountRef = useRef<HTMLInputElement | null>(null)

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [saveAndAddAnother, setSaveAndAddAnother] = useState(true)

  // Pick a better default category: last used (local), else first in list.
  useEffect(() => {
    try {
      const last = localStorage.getItem(storageKey('lastCategory'))
      if (last) setCategory(last)
    } catch {}

    // one-hand flow: focus amount immediately
    setTimeout(() => amountRef.current?.focus(), 50)
  }, [])

  // Keep most-recent category at the front
  const categories = useMemo(() => {
    const allCats = getAllCategories()
    const uniq = new Set<string>()
    const last = (() => {
      try {
        return localStorage.getItem(storageKey('lastCategory'))
      } catch {
        return null
      }
    })()

    const ordered: string[] = []
    if (last) ordered.push(last)
    for (const c of allCats) ordered.push(c)
    for (const c of ordered) {
      if (!c) continue
      if (uniq.has(c)) continue
      uniq.add(c)
      ordered[uniq.size - 1] = c
    }

    return Array.from(uniq)
  }, [])

  function setQuickAmount(v: number) {
    setAmount(String(v))
    // keep focus so you can just press save
    amountRef.current?.focus()
  }

  async function save() {
    setError(null)

    const normalized = amount.replace(',', '.').trim()
    const value = Number(normalized)
    if (!Number.isFinite(value) || value <= 0) {
      setError(t(lang, 'enterAmount'))
      amountRef.current?.focus()
      return
    }

    const amountOre = Math.round(value * 100)

    setSaving(true)
    try {
      await db.expenses.add({
        category,
        note: note.trim() || null,
        amountOre,
        createdAt: Date.now(),
      })

      try {
        localStorage.setItem(storageKey('lastCategory'), category)
      } catch {}

      if (saveAndAddAnother) {
        // keep category, reset fields, keep focus
        setAmount('')
        setNote('')
        setTimeout(() => amountRef.current?.focus(), 20)
      } else {
        onDone()
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function onAmountKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      void save()
    }
  }

  return (
    <section className="page">
      <div className="card">
        <label className="label">{t(lang, 'amountDkk')}</label>
        <input
          ref={amountRef}
          className="input"
          inputMode="decimal"
          placeholder="40"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={onAmountKeyDown}
          aria-label="Amount"
        />

        <div className="chips quick" aria-label="Quick amounts">
          {[20, 30, 40, 50, 75, 100].map((v) => (
            <button key={v} type="button" className="chip" onClick={() => setQuickAmount(v)}>
              {v}
            </button>
          ))}
        </div>

        <label className="label">{t(lang, 'category')}</label>
        <div className="chips">
          {categories.map((c) => (
            <button
              key={c}
              className={c === category ? 'chip active' : 'chip'}
              type="button"
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="label">{t(lang, 'noteOptional')}</label>
        <input
          className="input"
          placeholder="Frokost…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <label className="toggle">
          <input
            type="checkbox"
            checked={saveAndAddAnother}
            onChange={(e) => setSaveAndAddAnother(e.target.checked)}
          />
          <span>{t(lang, 'saveAndAddAnother')}</span>
        </label>

        {error && <div className="error">{error}</div>}

        <button className="primary" onClick={save} disabled={saving}>
          {saving ? t(lang, 'saving') : t(lang, 'save')}
        </button>
        <button className="ghost" onClick={onDone} disabled={saving}>
          {t(lang, 'back')}
        </button>
      </div>
    </section>
  )
}

function Settings({ lang, onLangChange }: { lang: Lang; onLangChange: (l: Lang) => void }) {
  const [count, setCount] = useState<number | null>(null)
  const [customCategories, setCustomCategories] = useState<string[]>(() => getCustomCategories())
  const [newCategory, setNewCategory] = useState('')

  useMemo(() => {
    db.expenses.count().then(setCount)
  }, [])

  function addCategory() {
    const trimmed = newCategory.trim()
    if (!trimmed) return

    const allCats = getAllCategories()
    if (allCats.includes(trimmed)) {
      alert(lang === 'da' ? 'Kategorien findes allerede' : 'Category already exists')
      return
    }

    const updated = [...customCategories, trimmed]
    setCustomCategories(updated)
    saveCustomCategories(updated)
    setNewCategory('')
  }

  function removeCategory(cat: string) {
    if (!confirm(`Remove custom category "${cat}"?`)) return
    const updated = customCategories.filter((c) => c !== cat)
    setCustomCategories(updated)
    saveCustomCategories(updated)
  }

  async function reset() {
    if (!confirm(t(lang, 'resetConfirm'))) return
    await db.expenses.clear()
    setCount(0)
    alert(t(lang, 'done'))
  }

  async function exportJson() {
    const all = await db.expenses.toArray()
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      currency: 'DKK',
      expenses: all,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budgeto-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="page">
      <div className="card" style={{ marginBottom: 12 }}>
        <h2>{t(lang, 'categories')}</h2>
        <div className="kv"><span>{t(lang, 'language')}</span>
          <select
            className="select"
            value={lang}
            onChange={(e) => onLangChange(e.target.value === 'en' ? 'en' : 'da')}
            aria-label={t(lang, 'language')}
          >
            <option value="da">Dansk</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="muted small" style={{ marginBottom: 10 }}>
          Default: {DEFAULT_CATEGORIES.join(', ')}
        </div>

        {customCategories.length > 0 && (
          <>
            <label className="label">{t(lang, 'yourCustomCategories')}</label>
            <ul className="list compact">
              {customCategories.map((cat) => (
                <li key={cat} className="listItem compact">
                  <div className="strong">{cat}</div>
                  <button className="mini danger" type="button" onClick={() => removeCategory(cat)}>
                    {t(lang, 'remove')}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <label className="label">{t(lang, 'addNewCategory')}</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className="input"
            placeholder="Underholdning"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCategory()
              }
            }}
            style={{ flex: 1 }}
          />
          <button
            className="primary"
            onClick={addCategory}
            disabled={!newCategory.trim()}
            style={{ width: 'auto', marginTop: 0 }}
          >
            {t(lang, 'add')}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>{t(lang, 'settings')}</h2>
        <div className="kv"><span>{t(lang, 'currency')}</span><span>DKK</span></div>
        <div className="kv"><span>{t(lang, 'localEntries')}</span><span>{count ?? '…'}</span></div>
        <div className="muted small">
          {t(lang, 'trackedLocally')}
        </div>
        <div className="stack">
          <button className="ghost" onClick={exportJson}>{t(lang, 'exportJson')}</button>
          <button className="danger" onClick={reset}>{t(lang, 'resetLocalData')}</button>
        </div>
      </div>
    </section>
  )
}
