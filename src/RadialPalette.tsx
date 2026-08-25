import { GitPullRequest, Mail, MessageSquare, Sparkles, Terminal } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from './store'

const ICONS = {
  sparkles: Sparkles,
  mail: Mail,
  message: MessageSquare,
  git: GitPullRequest,
  terminal: Terminal,
}

export function RadialPalette({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const nav = useNavigate()
  const [hint, setHint] = useState<string | null>(null)
  const n = store.tasks.length || 1
  const size = 420
  const r = 150

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#111114]/55 backdrop-blur-sm"
      data-testid="command-palette"
      onClick={onClose}
    >
      <div className="relative" style={{ width: size, height: size }} onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0 rounded-full border border-white/15 bg-[#111114]/80 shadow-[0_30px_80px_rgba(0,0,0,0.35)]" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-1/2 left-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-sm font-semibold text-[#111114]"
        >
          Tasks
          <span className="mt-0.5 text-[10px] font-normal text-[#6b7288]">esc</span>
        </button>
        {store.tasks.map((t, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2
          const x = size / 2 + Math.cos(angle) * r
          const y = size / 2 + Math.sin(angle) * r
          const Icon = ICONS[t.icon as keyof typeof ICONS] ?? Sparkles
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`wheel-${t.id}`}
              title={t.label}
              className="absolute grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#111114] shadow-lg outline outline-1 outline-[#d7dbe6] transition hover:scale-110 hover:bg-[#6d5ef6] hover:text-white hover:outline-[#6d5ef6]"
              style={{ left: x, top: y }}
              onMouseEnter={() => setHint(`${t.label} — ${t.prompt}`)}
              onMouseLeave={() => setHint(null)}
              onClick={() => {
                onClose()
                nav(`/tasks/${t.id}`)
              }}
            >
              <Icon size={20} strokeWidth={1.8} />
            </button>
          )
        })}
      </div>
      <p className="absolute bottom-10 max-w-lg px-6 text-center text-sm text-white/90">
        {hint ?? 'Hover an icon. Click to confirm the task before it runs.'}
      </p>
    </div>
  )
}
