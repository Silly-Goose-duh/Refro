import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'

export function AppsPage() {
  const store = useStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [secret, setSecret] = useState('')

  return (
    <div className="rise grid gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          data-testid="connect-more"
          onClick={() => setOpen((v) => !v)}
          className="h-11 rounded-full bg-[#111114] px-5 text-sm text-white"
        >
          Connect more apps
        </button>
      </div>

      {open ? (
        <form
          className="card rounded-[28px] p-5 outline outline-1 outline-[#e4e8f2]"
          data-testid="connect-form"
          onSubmit={(e) => {
            e.preventDefault()
            void store.addApp({ id: name, name, secret }).then(() => {
              setName('')
              setSecret('')
              setOpen(false)
            })
          }}
        >
          <h2 className="font-semibold">New connection</h2>
          <p className="mt-1 text-sm text-[#6b7288]">
            Name the app and paste a token. GitHub names still verify live with GitHub. Others are stored locally.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              data-testid="connect-app-id"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="github, gmail, linear…"
              className="h-11 min-w-[160px] rounded-full bg-[#eef1f8] px-4"
            />
            <input
              data-testid="connect-secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Token or secret"
              className="h-11 min-w-[200px] flex-1 rounded-full bg-[#eef1f8] px-4"
            />
            <button data-testid="connect-submit" type="submit" className="h-11 rounded-full bg-[#6d5ef6] px-5 text-sm text-white">
              Connect
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {store.apps.map((a) => (
          <Link
            key={a.id}
            to={`/apps/${a.id}`}
            data-testid={`app-${a.id}`}
            className="card rounded-[28px] p-5 outline outline-1 outline-[#d9dee8] transition hover:-translate-y-0.5 hover:bg-[#f7f5ff] hover:outline-[#6d5ef6] hover:shadow-[0_12px_30px_rgba(109,94,246,0.12)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{a.name}</h2>
                <p className="mt-1 text-sm text-[#6b7288]">{a.blurb}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs ${
                  a.connected ? 'bg-[#ecfdf3] text-[#16a34a]' : 'bg-[#f4f6fb] text-[#6b7288]'
                }`}
              >
                {a.connected ? 'Connected' : 'Off'}
              </span>
            </div>
            <p className="mt-3 text-xs text-[#6b7288]">{a.note}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
