/** Parse display counts like "1930万", "4億回視聴", "1.2M". */

export function parseLooseCount(text: string): number | undefined {
  const cleaned = text
    .replace(/[,，]/g, '')
    .replace(/\s*回視聴\s*/gi, '')
    .replace(/\s*views?\s*/gi, '')
    .trim()
  if (!cleaned) return undefined

  const m = cleaned.match(/^([\d.]+)\s*([万億KkMmBb])?/)
  if (!m) {
    const n = Number(cleaned.replace(/[^\d.]/g, ''))
    return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined
  }

  let n = Number(m[1])
  if (!Number.isFinite(n)) return undefined
  const unit = m[2]
  if (unit === '万') n *= 10_000
  else if (unit === '億') n *= 100_000_000
  else if (unit === 'K' || unit === 'k') n *= 1_000
  else if (unit === 'M' || unit === 'm') n *= 1_000_000
  else if (unit === 'B' || unit === 'b') n *= 1_000_000_000
  return Math.round(n)
}
