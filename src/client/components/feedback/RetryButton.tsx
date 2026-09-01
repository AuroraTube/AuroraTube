export function RetryButton({
  onRetry,
  label = '再読み込み',
}: {
  onRetry: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#d9d9d9] bg-white px-4 py-1.5 text-sm font-medium text-ink transition hover:bg-chip"
    >
      {label}
    </button>
  )
}
