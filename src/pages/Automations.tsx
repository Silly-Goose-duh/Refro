import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

export function AutomationsPage() {
  const store = useStore()
  const nav = useNavigate()
  const [name, setName] = useState('Morning brief')
  const [cadence, setCadence] = useState('weekdays 08:00')
  const [prompt, setPrompt] = useState('Run the daily brief. Read-only.')

  return (
    <div className="rise grid gap-4">
      <form
        className="card grid gap-3 rounded-[28px] p-5 md:grid-cols-4"
        data-testid="auto-form"
        onSubmit={(e) => {
          e.preventDefault()
          void store.createAutomation({ name, cadence, prompt })
        }}
      >
        <input
          data-testid="auto-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-full bg-[#eef1f8] px-4"
          placeholder="Name"
        />
        <input
          data-testid="auto-cadence"
          value={cadence}
          onChange={(e) => setCadence(e.target.value)}
          className="h-11 rounded-full bg-[#eef1f8] px-4"
          placeholder="Cadence"
        />
        <input
          data-testid="auto-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-11 rounded-full bg-[#eef1f8] px-4 md:col-span-1"
          placeholder="Prompt"
        />
        <button data-testid="auto-create" type="submit" className="h-11 rounded-full bg-[#111114] text-sm text-white">
          Create
        </button>
      </form>

      <div className="grid gap-3">
        {store.automations.map((a) => (
          <article key={a.id} className="card flex flex-wrap items-center gap-3 rounded-[24px] px-5 py-4" data-testid={`auto-${a.id}`}>
            <div className="min-w-0 flex-1">
              <div className="font-medium">{a.name}</div>
              <div className="text-xs text-[#6b7288]">
                {a.cadence} · {a.lastStatus}
                {a.lastRunAt ? ` · last ${a.lastRunAt}` : ''}
              </div>
            </div>
            <button
              type="button"
              className="text-sm"
              onClick={() => void store.toggleAutomation(a.id, !a.enabled)}
            >
              {a.enabled ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              data-testid={`auto-run-${a.id}`}
              className="rounded-full bg-[#6d5ef6] px-4 py-2 text-sm text-white"
              onClick={() => void store.runAutomation(a.id).then((s) => nav(`/chat/${s.id}`))}
            >
              Run now
            </button>
          </article>
        ))}
        {store.automations.length === 0 ? (
          <p className="text-sm text-[#6b7288]">No automations yet. Create one above — Run now hits Chat.</p>
        ) : null}
      </div>
    </div>
  )
}
