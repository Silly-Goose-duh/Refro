import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export type Role = 'user' | 'assistant' | 'system'

export type ToolEvent = {
  id: string
  name: string
  status: 'ok' | 'error' | 'running'
  detail: string
  at: string
}

export type Message = { id: string; role: Role; text: string; at: string }

export type Session = {
  id: string
  title: string
  taskId?: string
  status: 'Done' | 'Error' | 'Running'
  tokens: string
  model: string
  createdAt: string
  messages: Message[]
  tools: ToolEvent[]
}

export type Skill = { name: string; desc: string; body: string; runs: number }

export type TaskDef = {
  id: string
  label: string
  prompt: string
  icon: string
}

export type AppConn = {
  id: string
  name: string
  blurb: string
  connected: boolean
  note: string
}

export type Automation = {
  id: string
  name: string
  cadence: string
  prompt: string
  enabled: boolean
  lastRunAt: string | null
  lastStatus: 'idle' | 'success' | 'error'
}

export type Settings = {
  workspace: string
  model: string
  rememberSessions: boolean
}

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
  sessions: Omit<Session, 'messages' | 'tools'>[]
  tasks: TaskDef[]
  apps: AppConn[]
  automations: Automation[]
  events: CalEvent[]
}

export type Engine = {
  snapshot: () => Snapshot
  getSession: (id: string) => Session | null
  chat: (sessionId: string | undefined, text: string) => Promise<Session>
  runTask: (taskId: string, extra?: string) => Promise<Session>
  addEvent: (input: { title: string; start: string; end?: string }) => CalEvent
  addApp: (input: { id: string; name: string; secret: string }) => Promise<AppConn>
  createSkill: (text: string) => Promise<Skill>
  connectApp: (id: string, secret: string) => Promise<AppConn>
  disconnectApp: (id: string) => AppConn
  createAutomation: (input: { name: string; cadence: string; prompt: string }) => Automation
  toggleAutomation: (id: string, enabled: boolean) => Automation
  runAutomation: (id: string) => Promise<Session>
  saveSettings: (patch: Partial<Settings>) => Settings
}

const TASKS: TaskDef[] = [
  {
    id: 'daily-brief',
    label: 'Daily brief',
    icon: 'sparkles',
    prompt: 'Assemble today\'s brief from connected apps, last sessions, and skills. Read-only. Short.',
  },
  {
    id: 'inbox',
    label: 'Triage inbox',
    icon: 'mail',
    prompt: 'Triage unread mail-like items in Refro inbox/apps. Draft replies. Do not send.',
  },
  {
    id: 'standup',
    label: 'Standup',
    icon: 'message',
    prompt: 'Draft standup from recent Refro sessions and skills. Under 12 lines.',
  },
  {
    id: 'review-prs',
    label: 'Review PRs',
    icon: 'git',
    prompt: 'If GitHub is connected, say so and outline how you would review open PRs. Do not merge.',
  },
  {
    id: 'dump-config',
    label: 'Dump dsh config',
    icon: 'terminal',
    prompt: 'Dump the official dsh web profile bundles from this machine.',
  },
]

const APP_SEED: Omit<AppConn, 'connected' | 'note'>[] = [
  { id: 'github', name: 'GitHub', blurb: 'PRs, Device Flow / PAT' },
  { id: 'gmail', name: 'Gmail', blurb: 'Inbox triage via MCP or app password' },
  { id: 'calendar', name: 'Calendar', blurb: 'Meet prep for daily brief' },
  { id: 'notion', name: 'Notion', blurb: 'Notes and task DBs' },
  { id: 'linear', name: 'Linear', blurb: 'Issues and cycles' },
  { id: 'slack', name: 'Slack', blurb: 'Notify a channel' },
  { id: 'browser', name: 'Browser', blurb: 'web_search / web_fetch (built-in)' },
]

export function slug(text: string): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return s || 'skill'
}

export function maskKey(key: string | null): string {
  if (!key) return 'not set'
  if (key.length < 10) return 'sk-…****'
  return `${key.slice(0, 5)}…${key.slice(-4)}`
}

export function explainDeepseekError(status: number, body: string): string {
  const text = body.slice(0, 400)
  if (status === 402 || /insufficient balance|insufficient credits/i.test(text)) {
    return 'LLM wallet is empty (HTTP 402). OpenRouter/DeepSeek needs credit. Dump dsh config, skills, and apps still work locally.'
  }
  if (status === 401 || /authentication|unauthorized|invalid api key/i.test(text)) {
    return 'LLM rejected the API key (401). Check ~/.dsh/.credentials.yaml — do not paste the key in chat.'
  }
  if (status === 429) {
    return 'LLM rate-limited this key (429). Wait a moment and retry.'
  }
  return `LLM HTTP ${status}. Local tasks still work.`
}

export function readCred(dshHome: string, name: string): string | null {
  const file = join(dshHome, '.credentials.yaml')
  if (!existsSync(file)) return null
  const raw = readFileSync(file, 'utf8')
  const m = raw.match(new RegExp(`${name}:\\s*(\\S+)`))
  const v = m?.[1]?.trim()
  return v && v !== 'null' ? v : null
}

export function readDeepseekKey(dshHome: string): string | null {
  return readCred(dshHome, 'DEEPSEEK_API_KEY')
}

export type LlmRoute = {
  name: 'openrouter' | 'deepseek'
  key: string
  url: string
  model: string
}

export function resolveLlm(dshHome: string, model: string): LlmRoute | null {
  const openrouter = readCred(dshHome, 'OPENROUTER_API_KEY')
  if (openrouter) {
    const id = model.includes('/') ? model : 'deepseek/deepseek-chat'
    return {
      name: 'openrouter',
      key: openrouter,
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: id,
    }
  }
  const deepseek = readDeepseekKey(dshHome)
  if (deepseek) {
    return {
      name: 'deepseek',
      key: deepseek,
      url: 'https://api.deepseek.com/chat/completions',
      model: model.includes('/') ? 'deepseek-chat' : model || 'deepseek-chat',
    }
  }
  return null
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch {
    return fallback
  }
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, JSON.stringify(value, null, 2), 'utf8')
}

function parseSkillMd(raw: string, name: string): Skill {
  const desc =
    raw
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith('#') && !l.startsWith('---')) ?? name
  return { name, desc: desc.slice(0, 160), body: raw, runs: 0 }
}

export function heuristicSkill(text: string): { name: string; md: string } {
  const name = slug(text)
  const first = text.trim().split(/\n/)[0] ?? text
  const md = `---
name: ${name}
description: ${first.slice(0, 120)}
---

# ${name}

${text.trim()}

## Rules
- Do not send mail or merge PRs unless the user says so.
- Prefer read-only tools first.
`
  return { name, md }
}

export function createEngine(opts: {
  dshHome: string
  dataDir: string
  stubChat: boolean
  now?: () => string
  fetchImpl?: typeof fetch
}): Engine {
  const now = opts.now ?? (() => new Date().toISOString())
  const fetchImpl = opts.fetchImpl ?? fetch
  mkdirSync(opts.dataDir, { recursive: true })
  mkdirSync(join(opts.dshHome, 'skills'), { recursive: true })

  const paths = {
    sessions: join(opts.dataDir, 'sessions.json'),
    apps: join(opts.dataDir, 'apps.json'),
    autos: join(opts.dataDir, 'automations.json'),
    settings: join(opts.dataDir, 'settings.json'),
    secrets: join(opts.dataDir, 'secrets.json'),
    runs: join(opts.dataDir, 'skill-runs.json'),
    events: join(opts.dataDir, 'events.json'),
    extraApps: join(opts.dataDir, 'extra-apps.json'),
  }

  const loadSessions = () => readJson<Session[]>(paths.sessions, [])
  const saveSessions = (s: Session[]) => writeJson(paths.sessions, s)
  const loadSecrets = () => readJson<Record<string, string>>(paths.secrets, {})
  const loadApps = (): AppConn[] => {
    const saved = readJson<Record<string, { connected: boolean; note: string }>>(paths.apps, {})
    const extra = readJson<Omit<AppConn, 'connected' | 'note'>[]>(paths.extraApps, [])
    const catalog = [...APP_SEED, ...extra.filter((a) => !APP_SEED.some((s) => s.id === a.id))]
    return catalog.map((a) => {
      if (a.id === 'browser') {
        return { ...a, connected: true, note: 'Always on — dsh web_search/web_fetch' }
      }
      const row = saved[a.id]
      return {
        ...a,
        connected: Boolean(row?.connected),
        note: row?.note ?? 'Disconnected',
      }
    })
  }

  function listSkills(): Skill[] {
    const dir = join(opts.dshHome, 'skills')
    const runs = readJson<Record<string, number>>(paths.runs, {})
    if (!existsSync(dir)) return []
    const out: Skill[] = []
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      if (!name.isDirectory()) continue
      const md = join(dir, name.name, 'SKILL.md')
      if (!existsSync(md)) continue
      const skill = parseSkillMd(readFileSync(md, 'utf8'), name.name)
      skill.runs = runs[name.name] ?? 0
      out.push(skill)
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
  }

  function bumpRun(name: string) {
    const runs = readJson<Record<string, number>>(paths.runs, {})
    runs[name] = (runs[name] ?? 0) + 1
    writeJson(paths.runs, runs)
  }

  function dumpConfig(): string {
    const pkg = join(opts.dshHome, 'profiles', 'web', 'package.json')
    if (!existsSync(pkg)) return 'No web profile package.json found.'
    return readFileSync(pkg, 'utf8')
  }

  async function complete(prompt: string, system: string): Promise<string> {
    if (opts.stubChat) {
      return `Stub reply: ${prompt.slice(0, 180)}`
    }
    const route = resolveLlm(opts.dshHome, settings().model)
    if (!route) {
      return `No LLM key in ${join(opts.dshHome, '.credentials.yaml')}. ${prompt.slice(0, 120)}`
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${route.key}`,
      'Content-Type': 'application/json',
    }
    if (route.name === 'openrouter') {
      headers['HTTP-Referer'] = 'http://127.0.0.1:5173'
      headers['X-Title'] = 'Refro'
    }
    const res = await fetchImpl(route.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: route.model,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(explainDeepseekError(res.status, t))
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    return json.choices?.[0]?.message?.content ?? '(empty model reply)'
  }

  function settings(): Settings {
    const fallbackModel = readCred(opts.dshHome, 'OPENROUTER_API_KEY')
      ? 'deepseek/deepseek-chat'
      : 'deepseek-chat'
    const saved = readJson<Partial<Settings>>(paths.settings, {})
    return {
      workspace: saved.workspace ?? homedir(),
      model: saved.model ?? fallbackModel,
      rememberSessions: saved.rememberSessions ?? true,
    }
  }

  const engine: Engine = {
    snapshot() {
      const route = resolveLlm(opts.dshHome, settings().model)
      const sessions = loadSessions()
      return {
        settings: settings(),
        keyPresent: Boolean(route),
        keyMasked: maskKey(route?.key ?? null),
        provider: route?.name ?? 'none',
        workspace: settings().workspace,
        skills: listSkills(),
        sessions: sessions.map((s) => ({
          id: s.id,
          title: s.title,
          taskId: s.taskId,
          status: s.status,
          tokens: s.tokens,
          model: s.model,
          createdAt: s.createdAt,
        })),
        tasks: TASKS,
        apps: loadApps(),
        automations: readJson<Automation[]>(paths.autos, []),
        events: readJson<CalEvent[]>(paths.events, []),
      }
    },

    getSession(id) {
      return loadSessions().find((s) => s.id === id) ?? null
    },

    async chat(sessionId, text) {
      const sessions = loadSessions()
      let session = sessions.find((s) => s.id === sessionId)
      const at = now()
      if (!session) {
        session = {
          id: `ses-${Date.now()}`,
          title: text.slice(0, 64) || 'Chat',
          status: 'Running',
          tokens: '—',
          model: settings().model,
          createdAt: at,
          messages: [],
          tools: [],
        }
        sessions.unshift(session)
      }
      session.messages.push({ id: `m-${Date.now()}`, role: 'user', text, at })
      session.status = 'Running'
      const tool: ToolEvent = {
        id: `t-${Date.now()}`,
        name: 'llm',
        status: 'running',
        detail: 'deepseek-chat',
        at,
      }
      session.tools.push(tool)
      saveSessions(sessions)
      try {
        const reply = await complete(
          text,
          `You are Refro, the work UI for DeepSeek Harness. Workspace: ${settings().workspace}. Be concise.`,
        )
        tool.status = 'ok'
        tool.detail = `ok · ${reply.length} chars`
        session.messages.push({
          id: `m-${Date.now()}-a`,
          role: 'assistant',
          text: reply,
          at: now(),
        })
        session.status = 'Done'
        session.tokens = String(Math.max(1, Math.round(reply.length / 4)))
      } catch (err) {
        tool.status = 'error'
        tool.detail = err instanceof Error ? err.message : String(err)
        session.status = 'Error'
        session.messages.push({
          id: `m-${Date.now()}-e`,
          role: 'assistant',
          text: tool.detail,
          at: now(),
        })
      }
      saveSessions(sessions)
      return session
    },

    async runTask(taskId, extra) {
      const task = TASKS.find((t) => t.id === taskId)
      if (!task) throw new Error(`Unknown task ${taskId}`)
      const at = now()
      const note = extra?.trim()
      const userText = note
        ? `${task.prompt}\n\nAdditional instructions from the user:\n${note}`
        : task.prompt
      const session: Session = {
        id: `ses-${Date.now()}`,
        title: task.label,
        taskId: task.id,
        status: 'Running',
        tokens: '—',
        model: settings().model,
        createdAt: at,
        messages: [
          { id: `m-${Date.now()}`, role: 'user', text: userText, at },
        ],
        tools: [],
      }
      const sessions = loadSessions()
      sessions.unshift(session)

      if (task.id === 'dump-config') {
        const raw = dumpConfig()
        session.tools.push({
          id: `t-${Date.now()}`,
          name: 'read',
          status: 'ok',
          detail: 'profiles/web/package.json',
          at,
        })
        session.messages.push({
          id: `m-${Date.now()}-a`,
          role: 'assistant',
          text: `Web profile:\n\n\`\`\`json\n${raw}\n\`\`\``,
          at: now(),
        })
        session.status = 'Done'
        session.tokens = String(Math.round(raw.length / 4))
        saveSessions(sessions)
        bumpRun('dump-config')
        return session
      }

      session.tools.push({
        id: `t-${Date.now()}`,
        name: 'skill',
        status: 'ok',
        detail: task.id,
        at,
      })
      saveSessions(sessions)
      const apps = loadApps()
        .filter((a) => a.connected)
        .map((a) => a.name)
        .join(', ')
      const reply = await complete(
        `${userText}\n\nConnected apps: ${apps || 'none'}\nSkills: ${listSkills()
          .map((s) => s.name)
          .join(', ') || 'none'}`,
        'You are Refro configuring and running a confirmed task for DeepSeek Harness. Honour extra user instructions. Short, factual.',
      )
      session.tools.push({
        id: `t-${Date.now()}-llm`,
        name: 'llm',
        status: 'ok',
        detail: 'deepseek-chat',
        at: now(),
      })
      session.messages.push({
        id: `m-${Date.now()}-a`,
        role: 'assistant',
        text: reply,
        at: now(),
      })
      session.status = 'Done'
      session.tokens = String(Math.max(1, Math.round(reply.length / 4)))
      saveSessions(sessions)
      bumpRun(task.id)
      return session
    },

    async createSkill(text) {
      const trimmed = text.trim()
      if (!trimmed) throw new Error('Describe the skill first')
      let made = heuristicSkill(trimmed)
      if (!opts.stubChat && readDeepseekKey(opts.dshHome)) {
        try {
          const body = await complete(
            `Write a SKILL.md for DeepSeek Harness from this request. Return markdown only.\n\n${trimmed}`,
            'You write concise SKILL.md files with YAML frontmatter name + description.',
          )
          const nameMatch = body.match(/name:\s*([a-z0-9-]+)/i)
          made = { name: nameMatch?.[1] ?? made.name, md: body }
        } catch {
          /* keep heuristic */
        }
      }
      const dir = join(opts.dshHome, 'skills', made.name)
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'SKILL.md'), made.md, 'utf8')
      return parseSkillMd(made.md, made.name)
    },

    async connectApp(id, secret) {
      const token = secret.trim()
      if (!token) throw new Error('Paste a token or secret')
      if (id === 'browser') {
        const apps = loadApps()
        return apps.find((a) => a.id === 'browser')!
      }
      if (id === 'github' && !opts.stubChat) {
        const res = await fetchImpl('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'refro-ui',
          },
        })
        if (!res.ok) throw new Error(`GitHub rejected the token (${res.status})`)
        const user = (await res.json()) as { login?: string }
        const note = `Connected as ${user.login ?? 'user'}`
        const saved = readJson<Record<string, { connected: boolean; note: string }>>(paths.apps, {})
        saved.github = { connected: true, note }
        writeJson(paths.apps, saved)
        const secrets = loadSecrets()
        secrets.github = token
        writeJson(paths.secrets, secrets)
        return loadApps().find((a) => a.id === 'github')!
      }
      const saved = readJson<Record<string, { connected: boolean; note: string }>>(paths.apps, {})
      saved[id] = { connected: true, note: `Connected (${token.slice(0, 4)}…)` }
      writeJson(paths.apps, saved)
      const secrets = loadSecrets()
      secrets[id] = token
      writeJson(paths.secrets, secrets)
      const row = loadApps().find((a) => a.id === id)
      if (!row) throw new Error(`Unknown app ${id}`)
      return row
    },

    disconnectApp(id) {
      const saved = readJson<Record<string, { connected: boolean; note: string }>>(paths.apps, {})
      saved[id] = { connected: false, note: 'Disconnected' }
      writeJson(paths.apps, saved)
      const secrets = loadSecrets()
      delete secrets[id]
      writeJson(paths.secrets, secrets)
      const row = loadApps().find((a) => a.id === id)
      if (!row) throw new Error(`Unknown app ${id}`)
      return row
    },

    createAutomation(input) {
      const list = readJson<Automation[]>(paths.autos, [])
      const row: Automation = {
        id: `auto-${Date.now()}`,
        name: input.name.trim() || 'Untitled',
        cadence: input.cadence.trim() || 'manual',
        prompt: input.prompt.trim(),
        enabled: true,
        lastRunAt: null,
        lastStatus: 'idle',
      }
      if (!row.prompt) throw new Error('Automation needs a prompt')
      list.unshift(row)
      writeJson(paths.autos, list)
      return row
    },

    toggleAutomation(id, enabled) {
      const list = readJson<Automation[]>(paths.autos, [])
      const row = list.find((a) => a.id === id)
      if (!row) throw new Error('Missing automation')
      row.enabled = enabled
      writeJson(paths.autos, list)
      return row
    },

    async runAutomation(id) {
      const list = readJson<Automation[]>(paths.autos, [])
      const row = list.find((a) => a.id === id)
      if (!row) throw new Error('Missing automation')
      try {
        const session = await engine.chat(undefined, row.prompt)
        row.lastRunAt = now()
        row.lastStatus = session.status === 'Error' ? 'error' : 'success'
        writeJson(paths.autos, list)
        return session
      } catch (err) {
        row.lastRunAt = now()
        row.lastStatus = 'error'
        writeJson(paths.autos, list)
        throw err
      }
    },

    saveSettings(patch) {
      const next = { ...settings(), ...patch }
      writeJson(paths.settings, next)
      return next
    },

    addEvent(input) {
      const title = input.title.trim()
      if (!title) throw new Error('Event needs a title')
      const list = readJson<CalEvent[]>(paths.events, [])
      const row: CalEvent = {
        id: `ev-${Date.now()}`,
        title,
        start: input.start || now(),
        end: input.end,
        source: 'local',
      }
      list.push(row)
      list.sort((a, b) => a.start.localeCompare(b.start))
      writeJson(paths.events, list)
      return row
    },

    async addApp(input) {
      const id = slug(input.id || input.name)
      if (!id) throw new Error('App needs a name')
      const extra = readJson<Omit<AppConn, 'connected' | 'note'>[]>(paths.extraApps, [])
      if (!APP_SEED.some((a) => a.id === id) && !extra.some((a) => a.id === id)) {
        extra.push({ id, name: input.name.trim() || id, blurb: 'Custom connection' })
        writeJson(paths.extraApps, extra)
      }
      return engine.connectApp(id, input.secret)
    },
  }

  return engine
}

export function defaultHomes() {
  const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return {
    dshHome,
    dataDir: process.env.REFRO_DATA ?? join(dshHome, 'refro'),
    stubChat: process.env.REFRO_CHAT_STUB === '1',
  }
}
