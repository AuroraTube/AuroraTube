export function DurationBadge({ text }: { text?: string }) {
  if (!text) return null
  return (
    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[11px] font-medium text-white">
      {text}
    </span>
  )
}
