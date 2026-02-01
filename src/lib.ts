export function formatDkk(ore: number) {
  const kr = ore / 100
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 2,
  }).format(kr)
}

export function startOfMonth(ts: number) {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime()
}

export function endOfMonth(ts: number) {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime()
}
