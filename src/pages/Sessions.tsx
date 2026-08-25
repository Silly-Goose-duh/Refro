import { Link } from 'react-router-dom'
import { useStore } from '../store'

export function SessionsPage() {
  const store = useStore()
  return (
    <div className="rise grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="card rounded-[24px] p-5">
          <div className="text-sm text-[#6b7288]">Total sessions</div>
          <div className="text-3xl font-semibold">{store.sessions.length}</div>
        </article>
        <article className="card rounded-[24px] p-5">
          <div className="text-sm text-[#6b7288]">Errors</div>
          <div className="text-3xl font-semibold">{store.sessions.filter((s) => s.status === 'Error').length}</div>
        </article>
        <article className="card rounded-[24px] p-5">
          <div className="text-sm text-[#6b7288]">Last model</div>
          <div className="text-3xl font-semibold">{store.sessions[0]?.model ?? '—'}</div>
        </article>
      </div>
      <article className="card overflow-hidden rounded-[28px]">
        <table className="w-full min-w-[720px] text-left text-sm" data-testid="sessions-table">
          <thead className="text-[#6b7288]">
            <tr>
              {['ID', 'Title', 'Model', 'When', 'Tokens', 'Status'].map((h) => (
                <th key={h} className="px-5 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {store.sessions.map((s) => (
              <tr key={s.id} className="border-t border-[#eef1f8]">
                <td className="px-5 py-4 font-mono text-xs">{s.id}</td>
                <td className="px-5 py-4 font-medium">
                  <Link to={`/chat/${s.id}`}>{s.title}</Link>
                </td>
                <td className="px-5 py-4">{s.model}</td>
                <td className="px-5 py-4 text-[#6b7288]">{s.createdAt.slice(0, 16).replace('T', ' ')}</td>
                <td className="px-5 py-4">{s.tokens}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      s.status === 'Done' ? 'bg-[#ecfdf3] text-[#16a34a]' : 'bg-[#fff1f2] text-[#e11d48]'
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {store.sessions.length === 0 ? <p className="px-5 py-8 text-sm text-[#6b7288]">No sessions yet.</p> : null}
      </article>
    </div>
  )
}
