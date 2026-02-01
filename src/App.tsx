import { useEffect, useMemo, useRef, useState } from 'react'
import { db, type Expense, DEFAULT_CATEGORIES } from './db'
import { formatDkk, startOfMonth, endOfMonth } from './lib'

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
  const from = useMemo(() => startOfMonth(now), [now])
  const to = useMemo(() => endOfMonth(now), [now])

  const [items, setItems] = useState<Expense[] | null>(null)

  useMemo(() => {
    let cancelled = false
    db.expenses
      .where('createdAt')
      .between(from, to, true, true)
      .reverse()
      .sortBy('createdAt')
      .then((rows) => {
        if (cancelled) return
        setItems(rows.reverse())
      })
    return () => {
      cancelled = true
    }
  }, [from, to])

  const total = (items ?? []).reduce((sum, e) => sum + e.amountOre, 0)

  return (
    <section className="page">
      <div className="card hero">
        <div className="muted">This month</div>
        <div className="big">{formatDkk(total)}</div>
        <div className="muted">Tracked locally · offline-first</div>
        <button className="primary" onClick={onAdd}>Add expense</button>
      </div>

      <div className="card">
        <div className="row">
          <h2>Latest</h2>
          <span className="muted">{items?.length ?? 0} entries</span>
        </div>

        {!items ? (
          <div className="muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="muted">No expenses yet. Add your first one.</div>
        ) : (
          <ul className="list">
            {items.slice(0, 20).map((e) => (
              <li key={e.id} className="listItem">
                <div>
                  <div className="strong">{e.category}</div>
                  <div className="muted small">{e.note || '—'}</div>
                </div>
                <div className="right">
                  <div className="strong">{formatDkk(e.amountOre)}</div>
                  <div className="muted small">{new Date(e.createdAt).toLocaleString('da-DK')}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
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
    for (const c of DEFAULT_CATEGORIES) ordered.push(c)
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

  useMemo(() => {
    db.expenses.count().then(setCount)
  }, [])

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
