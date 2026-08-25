import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'

export function HomePage() {
  const store = useStore()
  const nav = useNavigate()
  const connected = store.apps.filter((a) => a.connected).length
  const week = [0, 0, 0, 0, 0, 0, 0]
  for (const s of store.sessions) {
    const d = new Date(s.createdAt).getDay()
    const i = d === 0 ? 6 : d - 1
    week[i] += 1
  }
  const max = Math.max(1, ...week)

  return (
    <div className="rise grid gap-4 pb-4">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Sessions', value: String(store.sessions.length), delta: 'on this machine' },
          { label: 'Skills', value: String(store.skills.length), delta: 'saved locally' },
          { label: 'Apps connected', value: String(connected), delta: `${store.apps.length} available` },
          { label: 'LLM', value: store.provider === 'none' ? 'Missing' : store.provider, delta: store.keyMasked },
        ].map((k) => (
          <article key={k.label} className="card rounded-[24px] p-5">
            <div className="text-sm text-[#6b7288]">{k.label}</div>
            <div className="mt-2 text-[34px] font-semibold tracking-tight">{k.value}</div>
            <div className="mt-1 text-xs text-[#6b7288]">{k.delta}</div>
          </article>
        ))}
      </div>

      <article className="card rounded-[28px] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">One-click tasks</h2>
          <Link to="/tasks" className="text-sm text-[#6d5ef6]">
            All tasks
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          {store.tasks.map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`task-${t.id}`}
              onClick={() => nav(`/tasks/${t.id}`)}
              className="rounded-[22px] bg-[#111114] px-4 py-4 text-left text-white"
            >
              <div className="text-sm font-medium">{t.label}</div>
              <div className="mt-1 line-clamp-2 text-xs text-white/50">{t.prompt}</div>
            </button>
          ))}
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="card rounded-[28px] p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Weekly sessions</h2>
          <div className="flex h-36 items-end justify-around gap-2 px-2">
            {week.map((n, i) => (
              <div
                key={i}
                className="w-7 rounded-full bg-[#6d5ef6] sm:w-9"
                style={{ height: `${Math.max(12, (n / max) * 100)}%`, opacity: 0.4 + n / (max * 2) }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-around px-2 text-xs text-[#6b7288]">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={`${d}-${i}`} className="w-7 text-center sm:w-9">
                {d}
              </span>
            ))}
          </div>
        </article>
        <article className="rounded-[28px] bg-[#111114] p-5 text-white">
          <h2 className="font-semibold">Workspace</h2>
          <p className="mt-3 break-all font-mono text-xs text-white/70">{store.workspace || '—'}</p>
          <p className="mt-4 text-sm text-white/55">Model {store.settings.model}</p>
          <Link
            to="/settings"
            className="mt-6 flex h-11 items-center justify-center rounded-full bg-white text-sm font-medium text-[#111114]"
          >
            Open settings
          </Link>
        </article>
      </div>

      <article className="overflow-hidden rounded-[28px] bg-[#111114] p-5 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Recent sessions</h2>
          <Link to="/sessions" className="text-xs text-white/45">
            Open archive
          </Link>
        </div>
        <div className="space-y-2" data-testid="home-sessions">
          {store.sessions.slice(0, 5).map((s) => (
            <Link
              key={s.id}
              to={`/chat/${s.id}`}
              className="flex items-center justify-between rounded-2xl bg-white/6 px-4 py-3"
            >
              <div>
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-white/45">{s.model}</div>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{s.status}</span>
            </Link>
          ))}
          {store.sessions.length === 0 ? (
            <p className="text-sm text-white/45">No runs yet. Use a one-click task.</p>
          ) : null}
        </div>
      </article>
    </div>
  )
}
