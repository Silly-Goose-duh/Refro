import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

export function TasksPage() {
  const store = useStore()
  const nav = useNavigate()
  return (
    <div className="rise grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {store.tasks.map((t) => (
        <article key={t.id} className="card rounded-[28px] p-5">
          <h2 className="font-semibold">{t.label}</h2>
          <p className="mt-2 text-sm text-[#6b7288]">{t.prompt}</p>
          <button
            type="button"
            data-testid={`run-task-${t.id}`}
            disabled={store.busy}
            onClick={() => nav(`/tasks/${t.id}`)}
            className="mt-4 h-11 w-full rounded-full bg-[#111114] text-sm text-white disabled:opacity-50"
          >
            Run now
          </button>
        </article>
      ))}
    </div>
  )
}
