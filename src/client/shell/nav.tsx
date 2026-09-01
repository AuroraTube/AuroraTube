import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  CloseIcon,
  CommunityIcon,
  HomeIcon,
  LogoMark,
  MenuIcon,
  SearchNavIcon,
  SettingsIcon,
  TrendingIcon,
} from '@/shell/icons'
import { STORAGE_KEYS, readFlag, writeFlag } from '@/lib/storage'

const NAV_ITEMS = [
  { to: '/', label: 'ホーム', Icon: HomeIcon },
  { to: '/search', label: '検索', Icon: SearchNavIcon },
  { to: '/trending', label: 'トレンド', Icon: TrendingIcon },
  { to: '/settings', label: '設定', Icon: SettingsIcon },
] as const

const COMMUNITY_URL = 'https://discord.gg/QcrEzNtgVc'

const activeClass = 'bg-chip text-ink'
const idleClass = 'text-ink hover:bg-chip'

const railCollapsedClass =
  'group flex flex-col items-center gap-1 rounded-xl px-1 py-3 text-[10px] font-medium transition'
const railExpandedClass =
  'group flex flex-row items-center gap-6 rounded-xl px-3 py-2.5 text-sm font-medium transition'
const drawerLinkClass =
  'flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition'

function NavLinks({
  variant = 'rail',
  collapsed = false,
  onNavigate,
}: {
  variant?: 'rail' | 'drawer'
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const base =
    variant === 'drawer' ? drawerLinkClass : collapsed ? railCollapsedClass : railExpandedClass

  return (
    <div className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          title={label}
          className={({ isActive }) => [base, isActive ? activeClass : idleClass].join(' ')}
        >
          {({ isActive }) => (
            <>
              <Icon filled={isActive} />
              <span className="min-w-0 truncate">{label}</span>
            </>
          )}
        </NavLink>
      ))}
      <a
        href={COMMUNITY_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        title="コミュニティ"
        className={[base, idleClass].join(' ')}
      >
        <CommunityIcon />
        <span className="min-w-0 truncate">コミュニティ</span>
      </a>
    </div>
  )
}

/** Desktop (lg+) left rail — collapsible icon column ↔ labeled sidebar. */
export function NavRail() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(readFlag(STORAGE_KEYS.sidebarCollapsed))
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      writeFlag(STORAGE_KEYS.sidebarCollapsed, next)
      return next
    })
  }

  return (
    <aside
      className={[
        'sticky top-14 hidden h-[calc(100vh-56px)] shrink-0 flex-col bg-surface py-3 transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[72px] items-center px-1' : 'w-[240px] items-stretch px-3',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
        aria-expanded={!collapsed}
        className={[
          'mb-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-black/5',
          collapsed ? '' : 'ml-0.5',
        ].join(' ')}
      >
        <MenuIcon />
      </button>
      <NavLinks variant="rail" collapsed={collapsed} />
    </aside>
  )
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="メニュー">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="メニューを閉じる"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 flex w-[min(280px,85vw)] flex-col bg-surface shadow-xl">
        <div className="flex h-14 items-center gap-2 border-b border-line px-3">
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-black/5"
          >
            <CloseIcon />
          </button>
          <Link to="/" onClick={onClose} className="flex items-center gap-1 rounded-lg py-1 pr-2">
            <LogoMark />
            <span className="text-[18px] font-semibold tracking-tight text-ink">AuroraTube</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <NavLinks variant="drawer" onNavigate={onClose} />
        </nav>
      </div>
    </div>
  )
}
