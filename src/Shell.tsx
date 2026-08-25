import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Blocks,
  CalendarClock,
  Grid2x2,
  Home,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { RadialPalette } from './RadialPalette'
import { useStore } from './store'

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/tasks', label: 'Tasks', icon: Zap },
  { to: '/apps', label: 'Apps', icon: Grid2x2 },
  { to: '/automations', label: 'Automations', icon: CalendarClock },
  { to: '/skills', label: 'Skills', icon: Sparkles },
  { to: '/sessions', label: 'Sessions', icon: Blocks },
]

function pageMeta(path: string) {
  if (path.startsWith('/chat')) return { kicker: 'Workspace', title: 'Chat' }
  if (path.startsWith('/apps/')) return { kicker: 'App', title: 'App' }
  if (path.startsWith('/tasks/')) return { kicker: 'Confirm', title: 'Confirm task' }
  const titles: Record<string, { kicker: string; title: string }> = {
    '/': { kicker: 'Today', title: 'Home' },
    '/tasks': { kicker: 'One-click', title: 'Tasks' },
    '/apps': { kicker: 'Connections', title: 'Apps' },
    '/automations': { kicker: 'Schedule', title: 'Automations' },
    '/skills': { kicker: 'Library', title: 'Skills' },
    '/sessions': { kicker: 'Memory', title: 'Sessions' },
    '/settings': { kicker: '', title: 'Settings' },
  }
  return titles[path] ?? titles['/']
}

export function Shell() {
  const [open, setOpen] = useState(false)
  const [palette, setPalette] = useState(false)
  const loc = useLocation()
  const store = useStore()
  const page = pageMeta(loc.pathname)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((v) => !v)
      }
      if (e.key === 'Escape') setPalette(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-dvh min-h-0 p-2">
      <div className="flex min-h-0 min-w-0 w-full overflow-hidden rounded-[24px] bg-white/70 shadow-[0_20px_50px_rgba(18,19,26,0.1)] ring-1 ring-white/80">
        <aside
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="m-3 flex shrink-0 flex-col rounded-[28px] bg-[#111114] text-white transition-[width] duration-300 ease-out"
          style={{ width: open ? 228 : 76 }}
        >
          <div className="flex h-16 items-center gap-3 px-5">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-sm font-semibold text-[#111114]">
              R
            </div>
            {open ? (
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-tight">Refro</div>
                <div className="text-[11px] text-white/45">Single user</div>
              </div>
            ) : null}
          </div>
          <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                data-testid={`nav-${label.toLowerCase()}`}
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-2xl px-3 text-sm transition ${
                    isActive
                      ? 'bg-white text-[#111114]'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.8} className="shrink-0" />
                {open ? <span className="truncate">{label}</span> : null}
              </NavLink>
            ))}
          </nav>
          <div className="px-3 pb-4">
            <NavLink
              to="/settings"
              data-testid="nav-settings"
              className={({ isActive }) =>
                `flex h-11 items-center gap-3 rounded-2xl px-3 text-sm ${
                  isActive ? 'bg-white text-[#111114]' : 'text-white/55 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Settings size={18} strokeWidth={1.8} className="shrink-0" />
              {open ? <span>Settings</span> : null}
            </NavLink>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center gap-3 px-5 py-4 md:px-8">
            <div className="mr-auto">
              {page.kicker ? (
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#6b7288]">
                  {page.kicker}
                </div>
              ) : null}
              <h1 className="text-[28px] font-semibold tracking-tight">{page.title}</h1>
            </div>
            <button
              type="button"
              data-testid="open-palette"
              onClick={() => setPalette(true)}
              className="flex h-11 items-center gap-2 rounded-full bg-[#eef1f8] px-4 text-sm text-[#6b7288]"
            >
              <Search size={16} />
              Task wheel
              <span className="text-[11px]">⌘K</span>
            </button>
          </header>
          {store.error ? (
            <div data-testid="error-banner" className="mx-5 mb-2 rounded-2xl bg-[#fff1f2] px-4 py-2 text-sm text-[#e11d48] md:mx-8">
              {store.error}
            </div>
          ) : null}
          <main className="min-h-0 flex-1 overflow-auto px-5 pb-6 md:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      {palette ? <RadialPalette onClose={() => setPalette(false)} /> : null}
    </div>
  )
}
