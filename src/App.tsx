import { useEffect, useMemo, useRef, useState } from 'react'
import { db, type Expense, DEFAULT_CATEGORIES, getAllCategories, getCustomCategories, saveCustomCategories } from './db'
import { formatDkk, startOfMonth, endOfMonth } from './lib'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function monthLabel(ts: number) {
  return new Date(ts).toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })
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

type Tab = 'dashboard' | 'add' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="app">
      <Header tab={tab} />
      <main className="main">
        {tab === 'dashboard' && <Dashboard onAdd={() => setTab('add')} />}
        {tab === 'add' && <AddExpense onDone={() => setTab('dashboard')} />}
        {tab === 'settings' && <Settings />}
      </main>
      <Nav tab={tab} setTab={setTab} />
    </div>
  )
}

function Header({ tab }: { tab: Tab }) {
  const title = tab === 'dashboard' ? 'Dashboard' : tab === 'add' ? 'Add' : 'Settings'
  return (
    <header className="top">
      <div className="brand">Budgeto</div>
      <div className="title">{title}</div>
      <div className="spacer" />
    </header>
  )
}

function Nav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="nav">
      <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Dashboard</button>
      <button className={tab === 'add' ? 'active' : ''} onClick={() => setTab('add')}>+ Add</button>
      <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Settings</button>
    </nav>
  )
}

function Dashboard({ onAdd }: { onAdd: () => void }) {
  const now = Date.now()
  const [monthTs, setMonthTs] = useState(() => startOfMonth(now))
  const from = useMemo(() => startOfMonth(monthTs), [monthTs])
  const to = useMemo(() => endOfMonth(monthTs), [monthTs])

  const [items, setItems] = useState<Expense[] | null>(null)
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null)
  const [query, setQuery] = useState('')

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

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
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

  async function removeWithUndo(expense: Expense) {
    if (expense.id == null) return

    // optimistic remove
    setItems((prev) => (prev ? prev.filter((x) => x.id !== expense.id) : prev))

    await db.expenses.delete(expense.id)

    setToast({
      text: `Deleted ${expense.category} (${formatDkk(expense.amountOre)})`,
      undo: async () => {
        const id = await db.expenses.add({
          category: expense.category,
          note: expense.note,
          amountOre: expense.amountOre,
          createdAt: expense.createdAt,
        })
        setItems((prev) => (prev ? [{ ...expense, id }, ...prev] : [{ ...expense, id }]))
        setToast({ text: 'Undo: restored' })
      },
    })
  }

  return (
    <section className="page">
      <div className="card hero">
        <div className="row heroHeader">
          <div className="muted">{monthLabel(from)}</div>
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
              Now
            </button>
            <button className="segBtn" type="button" onClick={() => setMonthTs((t) => addMonths(t, 1))} aria-label="Next month">
              →
            </button>
          </div>
        </div>

        <div className="big">{formatDkk(total)}</div>

        <div className="insights">
          <div className="pill">
            <div className="muted small">Avg/day</div>
            <div className="strong">{avgPerDay == null ? '—' : formatDkk(avgPerDay)}</div>
          </div>
          <div className="pill">
            <div className="muted small">Biggest</div>
            <div className="strong">{biggest ? formatDkk(biggest.amountOre) : '—'}</div>
          </div>
        </div>

        <div className="muted">Tracked locally · offline-first</div>
        <button className="primary" onClick={onAdd}>Add expense</button>
      </div>

      <div className="card mb12">
        <div className="row">
          <h2>Top categories</h2>
          <span className="muted">{monthLabel(from)}</span>
        </div>

        {!items ? (
          <div className="muted">Loading…</div>
        ) : byCategory.length === 0 ? (
          <div className="muted">No data yet.</div>
        ) : (
          <ul className="list compact">
            {byCategory.map((c) => (
              <li key={c.category} className="listItem compact categoryItem" style={{ background: categoryColor(c.category).tint }}>
                <div className="row rowCenter">
                  <span className="dot" style={{ background: categoryColor(c.category).dot }} />
                  <div className="strong">{c.category}</div>
                </div>
                <div className="right strong">{formatDkk(c.amountOre)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <div className="row">
          <h2>Latest</h2>
          <span className="muted">{filtered?.length ?? items?.length ?? 0} entries</span>
        </div>

        <input
          className="input mt10"
          placeholder="Search (category, note, amount)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {!filtered ? (
          <div className="muted">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="muted">No matches.</div>
        ) : (
          <ul className="list">
            {filtered.slice(0, 40).map((e) => (
              <li key={e.id} className="listItem">
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
                  <div className="muted small">{new Date(e.createdAt).toLocaleString('da-DK')}</div>
                  <button className="mini danger" type="button" onClick={() => void removeWithUndo(e)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {toast && (
        <div className="toast" role="status">
          <div className="toastText">{toast.text}</div>
          {toast.undo && (
            <button className="toastBtn" onClick={() => void toast.undo?.()}>Undo</button>
          )}
        </div>
      )}
    </section>
  )
}

function AddExpense({ onDone }: { onDone: () => void }) {
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
      const last = localStorage.getItem('budgeto:lastCategory')
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
        return localStorage.getItem('budgeto:lastCategory')
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
      setError('Enter an amount (e.g. 40)')
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
        localStorage.setItem('budgeto:lastCategory', category)
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
        <label className="label">Amount (DKK)</label>
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

        <label className="label">Category</label>
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

        <label className="label">Note (optional)</label>
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
          <span>Save and add another</span>
        </label>

        {error && <div className="error">{error}</div>}

        <button className="primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="ghost" onClick={onDone} disabled={saving}>
          Back
        </button>
      </div>
    </section>
  )
}

function Settings() {
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
      alert('Category already exists')
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
    if (!confirm('Delete all local data on this device?')) return
    await db.expenses.clear()
    setCount(0)
    alert('Done')
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
        <h2>Categories</h2>
        <div className="muted small" style={{ marginBottom: 10 }}>
          Default: {DEFAULT_CATEGORIES.join(', ')}
        </div>

        {customCategories.length > 0 && (
          <>
            <label className="label">Your custom categories</label>
            <ul className="list compact">
              {customCategories.map((cat) => (
                <li key={cat} className="listItem compact">
                  <div className="strong">{cat}</div>
                  <button className="mini danger" type="button" onClick={() => removeCategory(cat)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <label className="label">Add new category</label>
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
            Add
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Settings</h2>
        <div className="kv"><span>Currency</span><span>DKK</span></div>
        <div className="kv"><span>Local entries</span><span>{count ?? '…'}</span></div>
        <div className="muted small">
          V1 stores everything locally on this device (offline-first).
        </div>
        <div className="stack">
          <button className="ghost" onClick={exportJson}>Export JSON</button>
          <button className="danger" onClick={reset}>Reset local data</button>
        </div>
      </div>
    </section>
  )
}
