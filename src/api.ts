import type { AppConn, Automation, CalEvent, Session, Settings, Skill, Snapshot } from './types'

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const body = (await res.json()) as T & { error?: string }
  if (!res.ok) throw new Error(body.error ?? res.statusText)
  return body
}

export const api = {
  state: () => req<Snapshot>('/api/state'),
  session: (id: string) => req<Session>(`/api/sessions/${encodeURIComponent(id)}`),
  chat: (sessionId: string | undefined, text: string) =>
    req<Session>('/api/chat', { method: 'POST', body: JSON.stringify({ sessionId, text }) }),
  runTask: (id: string, extra?: string) =>
    req<Session>(`/api/tasks/${encodeURIComponent(id)}/run`, {
      method: 'POST',
      body: JSON.stringify({ extra: extra ?? '' }),
    }),
  addApp: (input: { id: string; name: string; secret: string }) =>
    req<AppConn>('/api/apps', { method: 'POST', body: JSON.stringify(input) }),
  addEvent: (input: { title: string; start: string; end?: string }) =>
    req<CalEvent>('/api/events', { method: 'POST', body: JSON.stringify(input) }),
  createSkill: (text: string) => req<Skill>('/api/skills', { method: 'POST', body: JSON.stringify({ text }) }),
  connectApp: (id: string, secret: string) =>
    req<AppConn>(`/api/apps/${encodeURIComponent(id)}/connect`, {
      method: 'POST',
      body: JSON.stringify({ secret }),
    }),
  disconnectApp: (id: string) =>
    req<AppConn>(`/api/apps/${encodeURIComponent(id)}/disconnect`, { method: 'POST', body: '{}' }),
  createAutomation: (input: { name: string; cadence: string; prompt: string }) =>
    req<Automation>('/api/automations', { method: 'POST', body: JSON.stringify(input) }),
  runAutomation: (id: string) =>
    req<Session>(`/api/automations/${encodeURIComponent(id)}/run`, { method: 'POST', body: '{}' }),
  toggleAutomation: (id: string, enabled: boolean) =>
    req<Automation>(`/api/automations/${encodeURIComponent(id)}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
  saveSettings: (patch: Partial<Settings>) =>
    req<Settings>('/api/settings', { method: 'POST', body: JSON.stringify(patch) }),
}
