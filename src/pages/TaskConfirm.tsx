import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'

export function TaskConfirmPage() {
  const { taskId } = useParams()
  const loc = useLocation()
  const store = useStore()
  const nav = useNavigate()
  const task = store.tasks.find((t) => t.id === taskId)
  const preset = (loc.state as { extra?: string } | null)?.extra ?? ''
  const [extra, setExtra] = useState(preset)

  if (!task) {
    return <p className="text-sm text-[#6b7288]">Unknown task.</p>
  }

  return (
    <div className="rise card mx-auto max-w-2xl space-y-4 rounded-[28px] p-6">
      <p className="text-sm text-[#6b7288]">Confirm this is the right task. Add changes if you want — the model will fold them into the session.</p>
      <h2 className="text-2xl font-semibold">{task.label}</h2>
      <p className="rounded-[20px] bg-[#f4f6fb] p-4 text-sm leading-relaxed">{task.prompt}</p>
      <label className="block text-sm">
        Extra instructions (optional)
        <textarea
          data-testid="task-extra"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          rows={4}
          placeholder="e.g. only open PRs, skip drafts, use a shorter standup"
          className="mt-2 w-full rounded-[20px] bg-[#f4f6fb] p-4 outline-none"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="task-confirm"
          disabled={store.busy}
          onClick={() => void store.runTask(task.id, extra).then((s) => nav(`/chat/${s.id}`))}
          className="h-11 rounded-full bg-[#111114] px-5 text-sm text-white disabled:opacity-50"
        >
          Yes, run this
        </button>
        <button type="button" onClick={() => nav(-1)} className="h-11 rounded-full bg-[#eef1f8] px-5 text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
