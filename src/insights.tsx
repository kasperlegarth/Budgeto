import { useEffect, useMemo, useState } from 'react'
import { db, type Expense } from './db'
import { formatDkk, startOfMonth, endOfMonth } from './lib'
import { Bars, StackedBar } from './charts'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function addMonths(ts: number, delta: number) {
  const d = new Date(ts)
  d.setDate(1)
  d.setMonth(d.getMonth() + delta)
  return d.getTime()
}

type Lang = 'da' | 'en'

function localeFor(lang: Lang) {
  return lang === 'da' ? 'da-DK' : 'en-US'
}

function monthLabel(ts: number, lang: Lang) {
  return new Date(ts).toLocaleDateString(localeFor(lang), { month: 'long', year: 'numeric' })
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

export function Insights({ lang }: { lang: Lang }) {
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

  const total = (items ?? []).reduce((sum, e) => sum + e.amountOre, 0)

  const avgPerDay = useMemo(() => {
    if (!items) return null
    const start = new Date(from)
    const end = new Date(to)

    const today = new Date()
    const isCurrentMonth = start.getFullYear() === today.getFullYear() && start.getMonth() === today.getMonth()

    const daysInMonth = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const dayOfMonth = today.getDate()

    const denom = clamp(isCurrentMonth ? dayOfMonth : daysInMonth, 1, 31)
    return Math.round(total / denom)
  }, [items, from, to, total])

  const weeklyBars = useMemo(() => {
    if (!items) return []
    const start = from
    const bars = [0, 0, 0, 0, 0]
    for (const e of items) {
      const idx = Math.floor((e.createdAt - start) / (7 * 24 * 60 * 60 * 1000))
      if (idx >= 0 && idx < bars.length) bars[idx] += e.amountOre
    }
    while (bars.length > 1 && bars[bars.length - 1] === 0) bars.pop()
    return bars
  }, [items, from])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of items ?? []) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amountOre)
    }
    return Array.from(map.entries())
      .map(([category, amountOre]) => ({ category, amountOre }))
      .sort((a, b) => b.amountOre - a.amountOre)
  }, [items])

  const categoryShare = useMemo(() => {
    const top = byCategory.slice(0, 5)
    const rest = byCategory.slice(5).reduce((s, c) => s + c.amountOre, 0)
    const parts = top.map((c) => ({
      label: c.category,
      value: c.amountOre,
      color: categoryColor(c.category).dot,
    }))
    if (rest > 0) parts.push({ label: 'Other', value: rest, color: 'rgba(17,24,39,0.25)' })
    return parts
  }, [byCategory])

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
            <button className="segBtn" type="button" onClick={() => setMonthTs(startOfMonth(Date.now()))} aria-label="Go to current month">
              {lang === 'da' ? 'Nu' : 'Now'}
            </button>
            <button className="segBtn" type="button" onClick={() => setMonthTs((t) => addMonths(t, 1))} aria-label="Next month">
              →
            </button>
          </div>
        </div>

        <div className="row" style={{ alignItems: 'baseline' }}>
          <div className="big">{formatDkk(total)}</div>
          <div className="spacer" />
          <div className="pill" style={{ padding: '10px 12px' }}>
            <div className="muted small">{lang === 'da' ? 'Gns./dag' : 'Avg/day'}</div>
            <div className="strong">{avgPerDay == null ? '—' : formatDkk(avgPerDay)}</div>
          </div>
        </div>
      </div>

      <div className="card mb12">
        <div className="row">
          <h2>{lang === 'da' ? 'Uge-for-uge' : 'Weekly'}</h2>
          <span className="muted">{monthLabel(from, lang)}</span>
        </div>
        <div className="vizCard mt10">
          <Bars ariaLabel={lang === 'da' ? 'Ugentligt forbrug' : 'Weekly spending'} values={weeklyBars.map((v) => Math.round(v / 100))} />
        </div>
      </div>

      <div className="card">
        <div className="row">
          <h2>{lang === 'da' ? 'Kategorier' : 'Categories'}</h2>
          <span className="muted">{monthLabel(from, lang)}</span>
        </div>

        <div className="vizCard mt10">
          <div className="muted small">{lang === 'da' ? 'Andel' : 'Share'}</div>
          <StackedBar ariaLabel={lang === 'da' ? 'Kategorifordeling' : 'Category share'} parts={categoryShare} />
          <div className="legend">
            {categoryShare.slice(0, 5).map((p) => (
              <div key={p.label} className="legendItem">
                <span className="dot" style={{ background: p.color }} />
                <span className="muted small">{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        {byCategory.length === 0 ? (
          <div className="muted mt10">{lang === 'da' ? 'Ingen data endnu.' : 'No data yet.'}</div>
        ) : (
          <ul className="list compact mt10">
            {byCategory.slice(0, 12).map((c) => (
              <li key={c.category} className="listItem compact">
                <div className="row rowCenter" style={{ gap: 8 }}>
                  <span className="dot" style={{ background: categoryColor(c.category).dot }} />
                  <span className="strong">{c.category}</span>
                </div>
                <div className="right strong">{formatDkk(c.amountOre)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
