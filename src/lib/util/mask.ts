/** Mask a secret for logs: keep 4 chars on each end when long enough. */
export function maskSecret(value: string, visible = 4): string {
  const v = value.trim()
  if (!v) return '****'
  if (v.length <= visible * 2) return '****'
  return `${v.slice(0, visible)}…${v.slice(-visible)}`
}
