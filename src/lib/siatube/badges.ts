import { asArray, asString, isRecord } from '../parse'

/**
 * Live /api/video exposes extended_badges as YouTube renderer objects.
 * We only surface a simple label when tooltip / accessibility label is present.
 */
export function badgeList(source: Record<string, unknown>): string[] | undefined {
  const badges: string[] = []
  for (const entry of asArray(source.extended_badges)) {
    if (!isRecord(entry)) continue
    const renderer = isRecord(entry.metadataBadgeRenderer)
      ? entry.metadataBadgeRenderer
      : entry
    const label =
      asString(renderer.tooltip) ??
      (isRecord(renderer.accessibilityData)
        ? asString(renderer.accessibilityData.label)
        : undefined)
    if (label) badges.push(label)
  }
  return badges.length ? badges : undefined
}
