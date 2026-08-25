import { ArrowUp, Paperclip } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import type { Session } from '../types'

const LAST = 'refro.lastSession'

export function ChatPage() {
  const { sessionId } = useParams()
  const store = useStore()
  const nav = useNavigate()
  const [draft, setDraft] = useState('')
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem(LAST, sessionId)
      return
    }
    const last = sessionStorage.getItem(LAST)
    if (last) nav(`/chat/${last}`, { replace: true })
  }, [sessionId, nav])

  useEffect(() => {
    if (!sessionId) {
      setSession(null)
      return
    }
    void api.session(sessionId).then(setSession).catch(() => setSession(null))
  }, [sessionId, store.sessions])

  async function send() {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    const next = await store.chat(sessionId, text)
    sessionStorage.setItem(LAST, next.id)
    nav(`/chat/${next.id}`)
    setSession(next)
  }

  return (
    <div className="rise flex h-[calc(100vh-9.5rem)] min-h-[520px] gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="scroll-thin card relative min-h-0 flex-1 overflow-auto rounded-[28px] p-5 outline outline-1 outline-[#e4e8f2] md:p-8">
          <div className="flex w-full flex-col gap-6" data-testid="chat-log">
            {(session?.messages ?? []).map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-[22px] px-4 py-3 text-[15px] leading-relaxed ${
                    m.role === 'user' ? 'bg-[#6d5ef6] text-white' : 'bg-[#f4f6fb] text-[#12131a]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {!session ? (
              <p className="text-sm text-[#6b7288]">This tab remembers the last chat until you close it. Start typing or pick a session on the right.</p>
            ) : null}
          </div>
        </div>

        <form
          className="card flex items-end gap-2 rounded-[28px] p-2 pl-4 outline outline-1 outline-[#e4e8f2]"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <button type="button" className="mb-2 grid h-10 w-10 place-items-center text-[#6b7288]">
            <Paperclip size={18} />
          </button>
          <textarea
            data-testid="chat-input"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Continue this session"
            className="mb-2 max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2 outline-none"
          />
          <button
            data-testid="chat-send"
            type="submit"
            disabled={store.busy}
            className="grid h-12 w-12 place-items-center rounded-full bg-[#111114] text-white disabled:opacity-40"
          >
            <ArrowUp size={18} />
          </button>
        </form>
      </div>

      <aside className="card hidden w-80 shrink-0 flex-col rounded-[28px] p-4 outline outline-1 outline-[#e4e8f2] lg:flex">
        <div className="mb-2 text-sm font-semibold">History</div>
        <p className="mb-3 text-[11px] text-[#6b7288]">
          {store.settings.rememberSessions
            ? 'Saved locally on this machine.'
            : 'Tab-only until you enable memory in Settings.'}
        </p>
        <div className="scroll-thin min-h-0 flex-1 space-y-1 overflow-auto" data-testid="chat-history">
          {(store.settings.rememberSessions
            ? store.sessions
            : store.sessions.filter((s) => s.id === sessionId)
          ).map((s) => (
            <Link
              key={s.id}
              to={`/chat/${s.id}`}
              className={`block rounded-2xl border px-3 py-2 text-sm transition hover:border-[#6d5ef6] hover:bg-[#f6f4ff] ${
                s.id === sessionId ? 'border-[#6d5ef6] bg-[#f6f4ff]' : 'border-[#eceff6]'
              }`}
            >
              <div className="truncate font-medium">{s.title}</div>
              <div className="text-[11px] text-[#6b7288]">{s.status}</div>
            </Link>
          ))}
        </div>
        {(session?.tools.length ?? 0) > 0 ? (
          <div className="mt-3 border-t border-[#eef1f8] pt-3" data-testid="tool-inspector">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7288]">This turn</div>
            {session?.tools.map((t) => (
              <div key={t.id} className="text-xs text-[#6b7288]">
                {t.name} · {t.status}
              </div>
            ))}
          </div>
        ) : null}
      </aside>
    </div>
  )
}
