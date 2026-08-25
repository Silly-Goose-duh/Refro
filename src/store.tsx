import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from './api'
import type { Session, Snapshot } from './types'

type Store = Snapshot & {
  busy: boolean
  error: string | null
  refresh: () => Promise<void>
  runTask: (id: string, extra?: string) => Promise<Session>
  chat: (sessionId: string | undefined, text: string) => Promise<Session>
  createSkill: (text: string) => Promise<void>
  connectApp: (id: string, secret: string) => Promise<void>
  addApp: (input: { id: string; name: string; secret: string }) => Promise<void>
  disconnectApp: (id: string) => Promise<void>
  addEvent: (input: { title: string; start: string }) => Promise<void>
  createAutomation: (input: { name: string; cadence: string; prompt: string }) => Promise<void>
  runAutomation: (id: string) => Promise<Session>
  toggleAutomation: (id: string, enabled: boolean) => Promise<void>
  saveSettings: (patch: { workspace?: string; model?: string; rememberSessions?: boolean }) => Promise<void>
}

const empty: Snapshot = {
  settings: { workspace: '', model: 'deepseek-chat', rememberSessions: true },
  keyPresent: false,
  keyMasked: 'not set',
  provider: 'none',
  workspace: '',
  skills: [],
  sessions: [],
  tasks: [],
  apps: [],
  automations: [],
  events: [],
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<Snapshot>(empty)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const next = await api.state()
    setSnap(next)
  }, [])

  useEffect(() => {
    void refresh().catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
  }, [refresh])

  const wrap = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setBusy(true)
    setError(null)
    try {
      const out = await fn()
      await refresh()
      return out
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      throw err
    } finally {
      setBusy(false)
    }
  }, [refresh])

  const value = useMemo<Store>(
    () => ({
      ...snap,
      busy,
      error,
      refresh,
      runTask: (id, extra) => wrap(() => api.runTask(id, extra)),
      chat: (sessionId, text) => wrap(() => api.chat(sessionId, text)),
      createSkill: (text) => wrap(async () => { await api.createSkill(text) }),
      connectApp: (id, secret) => wrap(async () => { await api.connectApp(id, secret) }),
      addApp: (input) => wrap(async () => { await api.addApp(input) }),
      disconnectApp: (id) => wrap(async () => { await api.disconnectApp(id) }),
      addEvent: (input) => wrap(async () => { await api.addEvent(input) }),
      createAutomation: (input) => wrap(async () => { await api.createAutomation(input) }),
      runAutomation: (id) => wrap(() => api.runAutomation(id)),
      toggleAutomation: (id, enabled) => wrap(async () => { await api.toggleAutomation(id, enabled) }),
      saveSettings: (patch) => wrap(async () => { await api.saveSettings(patch) }),
    }),
    [snap, busy, error, refresh, wrap],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('store missing')
  return ctx
}
