import { Link, useNavigate, useParams } from 'react-router-dom'
import { APP_PLAYBOOKS } from '../app-catalog'
import { useStore } from '../store'

export function AppDetailPage() {
  const { appId } = useParams()
  const store = useStore()
  const nav = useNavigate()
  const app = store.apps.find((a) => a.id === appId)
  const book = APP_PLAYBOOKS[appId ?? ''] ?? {
    whatsNew: 'Custom app. Token is stored locally. Predefined tasks are not catalogued yet — use Chat or the task wheel.',
    tasks: [{ label: 'Daily brief', taskId: 'daily-brief', extra: `Use the ${appId} connection if it is on.` }],
  }

  if (!app) return <p className="text-sm text-[#6b7288]">Unknown app.</p>

  return (
    <div className="rise grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <article className="card rounded-[28px] p-6 outline outline-1 outline-[#e4e8f2]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{app.name}</h2>
            <p className="mt-1 text-[#6b7288]">{app.blurb}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs ${app.connected ? 'bg-[#ecfdf3] text-[#16a34a]' : 'bg-[#f4f6fb]'}`}>
            {app.connected ? 'Connected' : 'Off'}
          </span>
        </div>
        <h3 className="mt-6 font-semibold">What’s new</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#4b5163]">{book.whatsNew}</p>
        <p className="mt-3 text-xs text-[#6b7288]">{app.note}</p>
        {app.id !== 'browser' && app.connected ? (
          <button type="button" className="mt-4 text-sm text-[#e11d48]" onClick={() => void store.disconnectApp(app.id)}>
            Disconnect
          </button>
        ) : null}
        {!app.connected && app.id !== 'browser' ? (
          <Link to="/apps" className="mt-4 inline-block text-sm text-[#6d5ef6]">
            Connect from Apps
          </Link>
        ) : null}
      </article>
      <article className="card rounded-[28px] p-6 outline outline-1 outline-[#e4e8f2]">
        <h3 className="font-semibold">Predefined tasks</h3>
        <div className="mt-3 grid gap-2">
          {book.tasks.map((t) => (
            <button
              key={t.label}
              type="button"
              className="rounded-[18px] border border-[#eceff6] px-4 py-3 text-left text-sm transition hover:border-[#6d5ef6] hover:bg-[#f6f4ff]"
              onClick={() => nav(`/tasks/${t.taskId}`, { state: { extra: t.extra } })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </article>
    </div>
  )
}
