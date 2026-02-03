export function Sparkline({ values, stroke = 'var(--accent)' }: { values: number[]; stroke?: string }) {
  const w = 110
  const h = 40
  const pad = 4
  const max = Math.max(1, ...values)
  const min = Math.min(0, ...values)
  const span = Math.max(1, max - min)

  const pts = values
    .map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2)
      const y = h - pad - ((v - min) / span) * (h - pad * 2)
      return [x, y]
    })

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')

  return (
    <svg
      className="spark"
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Trend"
      style={{ maxWidth: '100%' }}
    >
      <path d={d} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" pathLength={1} />
    </svg>
  )
}

export function Bars({ values, ariaLabel = 'Weekly spending' }: { values: number[]; ariaLabel?: string }) {
  const w = 240
  const h = 84
  const pad = 10
  const gap = 10
  const max = Math.max(1, ...values)
  const bw = (w - pad * 2 - gap * (values.length - 1)) / values.length

  return (
    <svg
      className="bars"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={ariaLabel}
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      {values.map((v, i) => {
        const hh = ((v / max) * (h - pad * 2)) || 0
        const x = pad + i * (bw + gap)
        const y = h - pad - hh
        return (
          <rect
            key={i}
            className="bar"
            style={{ animationDelay: `${i * 35}ms` }}
            x={x}
            y={y}
            width={bw}
            height={hh}
            rx={10}
            fill="url(#g)"
            opacity={0.9}
          />
        )
      })}
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function StackedBar({
  parts,
  ariaLabel = 'Category share',
}: {
  parts: { label: string; value: number; color: string }[]
  ariaLabel?: string
}) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1
  return (
    <div className="stackedBar" role="img" aria-label={ariaLabel}>
      {parts
        .filter((p) => p.value > 0)
        .map((p) => (
          <div
            key={p.label}
            className="stackedPart"
            style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
            title={`${p.label}: ${Math.round((p.value / total) * 100)}%`}
          />
        ))}
    </div>
  )
}
