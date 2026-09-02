const pagerBtnClass =
  'rounded-full border border-[#d9d9d9] bg-white px-4 py-1.5 text-sm font-medium text-ink transition enabled:hover:bg-chip disabled:cursor-not-allowed disabled:opacity-40'

type SearchPagerProps = {
  canGoPrev: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
}

export function SearchPager({ canGoPrev, canGoNext, onPrev, onNext }: SearchPagerProps) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" disabled={!canGoPrev} onClick={onPrev} className={pagerBtnClass}>
        前へ
      </button>
      <button type="button" disabled={!canGoNext} onClick={onNext} className={pagerBtnClass}>
        次へ
      </button>
    </div>
  )
}
