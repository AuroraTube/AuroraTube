/**
 * Compact number formatting shared by server transformers and client UI.
 * Locale fixed to ja-JP for consistent display strings.
 */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value)
  try {
    return new Intl.NumberFormat('ja-JP', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  } catch {
    return String(value)
  }
}
