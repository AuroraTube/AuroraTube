import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { searchHref } from '@/lib/search'
import { SearchIcon } from '@/shell/icons'

export function ShellSearch({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('q') ?? '')

  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get('q') ?? '')
  }, [location.search])

  return (
    <form
      className={`flex h-10 min-w-0 max-w-[640px] flex-1 items-center ${className}`.trim()}
      onSubmit={(event) => {
        event.preventDefault()
        navigate(searchHref(query))
      }}
    >
      <div className="flex h-full min-w-0 flex-1 items-center overflow-hidden rounded-l-full border border-[#ccc] border-r-0 bg-white">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 text-base text-ink outline-none ring-0 focus:outline-none focus:ring-0 placeholder:text-[#888] sm:px-4"
          placeholder="検索"
          enterKeyHint="search"
        />
      </div>
      <button
        type="submit"
        className="grid h-full w-12 shrink-0 place-items-center rounded-r-full border border-[#ccc] bg-[#f8f8f8] text-ink transition hover:bg-[#f0f0f0] sm:w-16"
        aria-label="検索"
      >
        <SearchIcon />
      </button>
    </form>
  )
}
