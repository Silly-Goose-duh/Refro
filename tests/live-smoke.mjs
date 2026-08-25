import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const require = createRequire('C:/Users/admin/deepseek-harness/apps/web/package.json')
const { chromium } = require('playwright')
const url = 'http://127.0.0.1:5173'
const results = []

function note(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

function credHas(name) {
  const raw = readFileSync(join(homedir(), '.dsh', '.credentials.yaml'), 'utf8')
  return new RegExp(`${name}:\\s*\\S+`).test(raw)
}

async function api(path, init) {
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? `${res.status}`)
  return body
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(25000)

try {
  note('dsh credentials OPENROUTER_API_KEY', credHas('OPENROUTER_API_KEY'), 'masked in report')
  note('dsh credentials DEEPSEEK_API_KEY', credHas('DEEPSEEK_API_KEY'), 'kept; native 402')
  const webPkg = JSON.parse(readFileSync(join(homedir(), '.dsh', 'profiles', 'web', 'package.json'), 'utf8'))
  const bundles = webPkg.dsh?.profile?.bundles ?? []
  note(
    'dsh web profile official bundles only',
    bundles.includes('@deepseek-ai/dsh-base') &&
      bundles.includes('@deepseek-ai/dsh-web-app') &&
      bundles.length === 2,
    bundles.join(', '),
  )
  const settings = readFileSync(join(homedir(), '.dsh', 'settings.yaml'), 'utf8')
  note('dsh settings OpenRouter provider', settings.includes('openrouter.ai') && settings.includes('OPENROUTER_API_KEY'))

  const state = await api('/api/state')
  note('GET /api/state', true, `provider=${state.provider}`)
  note('LLM provider is OpenRouter', state.provider === 'openrouter', state.provider)
  note('key masked (no raw secret in API)', !String(state.keyMasked).includes('sk-or-v1-06'), state.keyMasked)

  const dump = await api('/api/tasks/dump-config/run', { method: 'POST', body: '{}' })
  note('Task Dump dsh config', dump.status === 'Done' && String(dump.messages?.at(-1)?.text).includes('dsh-web-app'), dump.status)

  const chat = await api('/api/chat', { method: 'POST', body: JSON.stringify({ text: 'Reply with the single word PONG.' }) })
  note('Chat via OpenRouter', chat.status === 'Done' && /pong/i.test(chat.messages?.at(-1)?.text ?? ''), chat.status)

  const brief = await api('/api/tasks/daily-brief/run', { method: 'POST', body: '{}' })
  note('Task Daily brief (LLM)', brief.status === 'Done', brief.status)

  const standup = await api('/api/tasks/standup/run', { method: 'POST', body: '{}' })
  note('Task Standup (LLM)', standup.status === 'Done', standup.status)

  const inbox = await api('/api/tasks/inbox/run', { method: 'POST', body: '{}' })
  note('Task Triage inbox (LLM)', inbox.status === 'Done', inbox.status)

  const prs = await api('/api/tasks/review-prs/run', { method: 'POST', body: '{}' })
  note('Task Review PRs (LLM)', prs.status === 'Done', prs.status)

  const skill = await api('/api/skills', {
    method: 'POST',
    body: JSON.stringify({ text: 'When I say live-check, reply with one line that the OpenRouter path is up.' }),
  })
  note('Create skill from English', Boolean(skill.name), skill.name)

  try {
    await api('/api/apps/github/connect', { method: 'POST', body: JSON.stringify({ secret: 'not-a-real-pat' }) })
    note('GitHub connect (live PAT verify)', true)
  } catch (err) {
    note('GitHub connect (live PAT verify)', false, err instanceof Error ? err.message : String(err))
  }

  const gmail = await api('/api/apps/gmail/connect', { method: 'POST', body: JSON.stringify({ secret: 'local-test-secret' }) })
  note('Gmail connect (local secret store)', gmail.connected === true, gmail.note)

  const cal = await api('/api/apps/calendar/connect', { method: 'POST', body: JSON.stringify({ secret: 'local-cal' }) })
  note('Calendar connect (local secret store)', cal.connected === true)

  const auto = await api('/api/automations', {
    method: 'POST',
    body: JSON.stringify({ name: 'Live ping', cadence: 'manual', prompt: 'Say READY in one word.' }),
  })
  note('Create automation', Boolean(auto.id), auto.name)
  const ran = await api(`/api/automations/${auto.id}/run`, { method: 'POST', body: '{}' })
  note('Run automation now', ran.status === 'Done', ran.status)

  const saved = await api('/api/settings', {
    method: 'POST',
    body: JSON.stringify({ workspace: homedir(), model: 'deepseek/deepseek-chat' }),
  })
  note('Save settings', saved.model === 'deepseek/deepseek-chat')

  await page.goto(url, { waitUntil: 'networkidle' })
  note('Home renders', await page.getByRole('heading', { name: 'Good morning' }).isVisible())

  for (const [testId, heading] of [
    ['nav-chat', 'Chat'],
    ['nav-tasks', 'Tasks'],
    ['nav-apps', 'Apps'],
    ['nav-automations', 'Automations'],
    ['nav-skills', 'Skills'],
    ['nav-sessions', 'Sessions'],
    ['nav-settings', 'Settings'],
  ]) {
    await page.getByTestId(testId).click()
    const vis = await page.getByRole('heading', { name: heading }).isVisible()
    note(`Nav ${heading}`, vis)
  }

  await page.getByTestId('nav-home').click().catch(async () => {
    await page.goto(url)
  })
  await page.goto(url)
  await page.getByTestId('open-palette').click()
  note('Command palette opens', await page.getByTestId('command-palette').isVisible())
  await page.keyboard.press('Escape')

  await page.getByTestId('nav-chat').click()
  await page.getByTestId('chat-input').fill('Say OK')
  await page.getByTestId('chat-send').click()
  await page.waitForURL(/\/chat\//, { timeout: 25000 })
  const log = await page.getByTestId('chat-log').innerText()
  note('Chat send button (UI)', log.length > 2, `chars=${log.length}`)
} catch (err) {
  note('smoke runner', false, err instanceof Error ? err.message : String(err))
} finally {
  await browser.close()
}

const pass = results.filter((r) => r.ok).length
const fail = results.filter((r) => !r.ok).length
console.log(`\nSUMMARY  pass=${pass}  fail=${fail}`)
process.exit(fail ? 1 : 0)
