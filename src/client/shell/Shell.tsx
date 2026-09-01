import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogoMark, MenuIcon } from '@/shell/icons'
import { MobileDrawer, NavRail } from '@/shell/nav'
import { ShellSearch } from '@/shell/ShellSearch'

export function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.search])

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-40 flex h-14 items-center bg-surface px-2 sm:px-4">
        <div className="mx-auto flex w-full max-w-[1800px] items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-label="メニュー"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-black/5 lg:hidden"
          >
            <MenuIcon />
          </button>

          <Link
            to="/"
            className="flex shrink-0 items-center gap-1 rounded-lg py-1 pl-0.5 pr-1 transition hover:bg-black/5 sm:pr-2"
          >
            <LogoMark />
            <span className="hidden text-[20px] font-semibold tracking-tight text-ink sm:inline">
              AuroraTube
            </span>
          </Link>

          <div className="mx-2 hidden min-w-0 flex-1 justify-center md:mx-4 md:flex">
            <ShellSearch />
          </div>
        </div>
      </header>

      <div className="border-b border-line px-3 py-2 md:hidden">
        <ShellSearch className="w-full max-w-none" />
      </div>

      <div className="mx-auto flex max-w-[1800px]">
        <NavRail />
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-4 lg:px-6 lg:pb-12">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>

      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
