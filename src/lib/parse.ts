/** Lightweight helpers for reading loosely-typed upstream JSON. */

export type RecordLike = Record<string, unknown>

export function isRecord(value: unknown): value is RecordLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

export function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const result = asString(value)
    if (result) return result
  }
  return undefined
}

export function requiredString(value: unknown, fallback: string): string {
  return asString(value) ?? fallback
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

export function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function mapDefined<T, R>(items: T[], map: (item: T) => R | null | undefined): R[] {
  const out: R[] = []
  for (const item of items) {
    const mapped = map(item)
    if (mapped != null) out.push(mapped)
  }
  return out
}
