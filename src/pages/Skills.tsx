import { useState } from 'react'
import { useStore } from '../store'

export function SkillsPage() {
  const store = useStore()
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const selected = store.skills.find((s) => s.name === picked) ?? store.skills[0]

  return (
    <div className="rise grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-[28px] bg-[#111114] p-4 text-white">
        <div className="px-2 pb-3 text-sm text-white/50">Library</div>
        <div className="space-y-1" data-testid="skill-list">
          {store.skills.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setPicked(s.name)}
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm ${
                selected?.name === s.name ? 'bg-[#6d5ef6]' : 'hover:bg-white/8'
              }`}
            >
              <span>{s.name}</span>
              <span className="text-xs opacity-70">{s.runs}</span>
            </button>
          ))}
          {store.skills.length === 0 ? <p className="px-3 text-sm text-white/45">None yet</p> : null}
        </div>
      </aside>

      <div className="grid gap-4">
        <form
          className="card rounded-[28px] p-5"
          data-testid="skill-form"
          onSubmit={(e) => {
            e.preventDefault()
            void store.createSkill(text).then(() => setText(''))
          }}
        >
          <h2 className="font-semibold">New skill from English</h2>
          <textarea
            data-testid="skill-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="When I say standup, draft from open PRs, under 12 lines, do not post."
            className="mt-3 w-full rounded-[20px] bg-[#f4f6fb] p-4 outline-none"
          />
          <button
            data-testid="skill-create"
            type="submit"
            disabled={store.busy}
            className="mt-3 h-11 rounded-full bg-[#111114] px-5 text-sm text-white"
          >
            Create skill
          </button>
        </form>

        {selected ? (
          <article className="card rounded-[28px] p-6" data-testid="skill-detail">
            <div className="text-xs uppercase tracking-wide text-[#6b7288]">Selected</div>
            <h2 className="text-2xl font-semibold">#{selected.name}</h2>
            <p className="mt-1 text-[#6b7288]">{selected.desc}</p>
            <pre className="mt-4 overflow-auto rounded-[20px] bg-[#f4f6fb] p-4 text-xs whitespace-pre-wrap">
              {selected.body}
            </pre>
          </article>
        ) : null}
      </div>
    </div>
  )
}
