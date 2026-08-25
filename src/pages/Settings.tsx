import { useEffect, useState } from 'react'
import { useStore } from '../store'

const MODELS = [
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini' },
  { id: 'openrouter/auto', label: 'Auto (OpenRouter picks)' },
]

function llmLabel(provider: string) {
  if (provider === 'openrouter') return 'OpenRouter'
  if (provider === 'deepseek') return 'DeepSeek'
  return 'Not connected'
}

export function SettingsPage() {
  const store = useStore()
  const [workspace, setWorkspace] = useState(store.workspace)
  const [model, setModel] = useState(store.settings.model)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setWorkspace(store.workspace)
    setModel(store.settings.model)
  }, [store.workspace, store.settings.model])

  const known = MODELS.some((m) => m.id === model)

  return (
    <form
      className="rise grid max-w-3xl gap-4"
      data-testid="settings-form"
      onSubmit={(e) => {
        e.preventDefault()
        void store
          .saveSettings({ workspace, model, rememberSessions: store.settings.rememberSessions })
          .then(() => {
            setSaved(true)
            window.setTimeout(() => setSaved(false), 1600)
          })
      }}
    >
      <section className="card rounded-[28px] p-6 outline outline-1 outline-[#e4e8f2]">
        <h2 className="font-semibold">Chat</h2>
        <p className="mt-1 text-sm text-[#6b7288]">Which service answers in this UI.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            data-testid="llm-provider"
            className={`rounded-full px-3 py-1 text-sm ${
              store.provider === 'none' ? 'bg-[#fff1f2] text-[#e11d48]' : 'bg-[#ecfdf3] text-[#16a34a]'
            }`}
          >
            {llmLabel(store.provider)}
          </span>
          <span data-testid="key-masked" className="font-mono text-sm text-[#6b7288]">
            {store.keyMasked}
          </span>
        </div>
        <label className="mt-5 block text-sm text-[#6b7288]">
          Model
          <select
            data-testid="settings-model"
            value={known ? model : 'deepseek/deepseek-chat'}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 h-11 w-full rounded-full bg-[#eef1f8] px-4 text-[#12131a]"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card rounded-[28px] p-6 outline outline-1 outline-[#e4e8f2]">
        <h2 className="font-semibold">Workspace</h2>
        <p className="mt-1 text-sm text-[#6b7288]">Folder Refro treats as your project.</p>
        <input
          data-testid="settings-workspace"
          value={workspace}
          onChange={(e) => setWorkspace(e.target.value)}
          className="mt-4 h-11 w-full rounded-full bg-[#eef1f8] px-4"
        />
      </section>

      <section className="card rounded-[28px] p-6 outline outline-1 outline-[#e4e8f2]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Memory</h2>
            <p className="mt-1 text-sm text-[#6b7288]">Keep chat history on this computer so you can reopen sessions.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={store.settings.rememberSessions}
            onClick={() => void store.saveSettings({ rememberSessions: !store.settings.rememberSessions })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              store.settings.rememberSessions ? 'bg-[#6d5ef6]' : 'bg-[#d7dbe6]'
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                store.settings.rememberSessions ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button data-testid="settings-save" type="submit" className="h-11 rounded-full bg-[#111114] px-6 text-sm text-white">
          Save
        </button>
        {saved ? <span className="text-sm text-[#16a34a]">Saved</span> : null}
      </div>
    </form>
  )
}
