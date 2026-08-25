export type ToolEvent = {
  id: string
  name: string
  status: 'ok' | 'error' | 'running'
  detail: string
  at: string
}

export type Message = { id: string; role: 'user' | 'assistant' | 'system'; text: string; at: string }

export type SessionListItem = {
  id: string
  title: string
  taskId?: string
  status: 'Done' | 'Error' | 'Running'
  tokens: string
  model: string
  createdAt: string
}

export type Session = SessionListItem & { messages: Message[]; tools: ToolEvent[] }

export type Skill = { name: string; desc: string; body: string; runs: number }

export type TaskDef = { id: string; label: string; prompt: string; icon: string }

export type AppConn = { id: string; name: string; blurb: string; connected: boolean; note: string }

export type Automation = {
  id: string
  name: string
  cadence: string
  prompt: string
  enabled: boolean
  lastRunAt: string | null
  lastStatus: 'idle' | 'success' | 'error'
}

export type Settings = { workspace: string; model: string; rememberSessions: boolean }

export type CalEvent = {
  id: string
  title: string
  start: string
  end?: string
  source: 'local' | 'google'
}

export type Snapshot = {
  settings: Settings
  keyPresent: boolean
  keyMasked: string
  provider: 'openrouter' | 'deepseek' | 'none'
  workspace: string
  skills: Skill[]
  sessions: SessionListItem[]
  tasks: TaskDef[]
  apps: AppConn[]
  automations: Automation[]
  events: CalEvent[]
}
