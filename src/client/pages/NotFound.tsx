import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="relative mb-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-chip sm:h-32 sm:w-32">
          <svg
            viewBox="0 0 64 64"
            className="h-14 w-14 text-[#909090] sm:h-16 sm:w-16"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="28" cy="28" r="14" />
            <path d="M38 38 52 52" />
            <path d="M22 24h12M22 32h8" opacity="0.5" />
          </svg>
        </div>
        <span className="absolute -right-1 -top-1 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold tracking-wide text-white">
          404
        </span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        ページが見つかりません
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted sm:text-[15px]">
        お探しのページは削除されたか、URL が間違っている可能性があります。
        ホームに戻るか、キーワードで検索してみてください。
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
        <Link
          to="/"
          className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-medium text-white transition hover:bg-[#272727]"
        >
          ホームへ戻る
        </Link>
        <Link
          to="/search"
          className="inline-flex h-11 items-center justify-center rounded-full border border-[#d9d9d9] bg-white px-6 text-sm font-medium text-ink transition hover:bg-chip"
        >
          検索する
        </Link>
        <Link
          to="/trending"
          className="inline-flex h-11 items-center justify-center rounded-full border border-[#d9d9d9] bg-white px-6 text-sm font-medium text-ink transition hover:bg-chip"
        >
          トレンドを見る
        </Link>
      </div>
    </div>
  )
}
