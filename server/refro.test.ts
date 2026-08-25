import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEngine, explainDeepseekError, heuristicSkill, maskKey, resolveLlm, slug } from './refro.ts'

function tmpEngine() {
  const root = mkdtempSync(join(tmpdir(), 'refro-'))
  const dshHome = join(root, '.dsh')
  mkdirSync(join(dshHome, 'profiles', 'web'), { recursive: true })
  writeFileSync(
    join(dshHome, 'profiles', 'web', 'package.json'),
    JSON.stringify({ dsh: { profile: { bundles: ['@deepseek-ai/dsh-web-app'] } } }),
    'utf8',
  )
  writeFileSync(join(dshHome, '.credentials.yaml'), 'refs:\n  DEEPSEEK_API_KEY: sk-testkeyABCDEF\n', 'utf8')
  return createEngine({
    dshHome,
    dataDir: join(root, 'data'),
    stubChat: true,
    now: () => '2026-08-25T12:00:00.000Z',
  })
}

describe('helpers', () => {
  it('slugs names', () => {
    expect(slug('Daily Brief!!')).toBe('daily-brief')
  })
  it('masks keys', () => {
    expect(maskKey('sk-1234567890abcd')).toBe('sk-12…abcd')
  })
  it('writes heuristic skill markdown', () => {
    const s = heuristicSkill('When I say standup, draft from PRs')
    expect(s.md).toContain('standup')
  })
  it('explains 402 without raw json', () => {
    const msg = explainDeepseekError(402, '{"error":{"message":"Insufficient Balance"}}')
    expect(msg).toMatch(/wallet is empty|no remaining credit/)
    expect(msg).not.toContain('Insufficient Balance')
  })
  it('prefers OpenRouter when both keys exist', () => {
    const root = mkdtempSync(join(tmpdir(), 'refro-or-'))
    const dshHome = join(root, '.dsh')
    mkdirSync(dshHome, { recursive: true })
    writeFileSync(
      join(dshHome, '.credentials.yaml'),
      'refs:\n  DEEPSEEK_API_KEY: sk-deep\n  OPENROUTER_API_KEY: sk-or-v1-test\n',
      'utf8',
    )
    const route = resolveLlm(dshHome, 'deepseek-chat')
    expect(route?.name).toBe('openrouter')
    expect(route?.model).toBe('deepseek/deepseek-chat')
    expect(route?.url).toContain('openrouter.ai')
  })
})

describe('engine', () => {
  it('dumps real web profile as a task', async () => {
    const e = tmpEngine()
    const ses = await e.runTask('dump-config')
    expect(ses.status).toBe('Done')
    expect(ses.messages.at(-1)?.text).toContain('dsh-web-app')
    expect(ses.tools[0]?.name).toBe('read')
    expect(e.snapshot().sessions).toHaveLength(1)
  })

  it('creates a skill on disk', async () => {
    const e = tmpEngine()
    const skill = await e.createSkill('When I say standup, draft from open PRs, under 12 lines.')
    expect(skill.name).toContain('standup')
    expect(e.snapshot().skills.map((s) => s.name)).toContain(skill.name)
  })

  it('chats in stub mode', async () => {
    const e = tmpEngine()
    const ses = await e.chat(undefined, 'hello refro')
    expect(ses.messages).toHaveLength(2)
    expect(ses.messages[1]?.text).toContain('Stub reply')
  })

  it('connects github in stub mode', async () => {
    const e = tmpEngine()
    const app = await e.connectApp('github', 'ghp_testtoken')
    expect(app.connected).toBe(true)
    expect(e.snapshot().apps.find((a) => a.id === 'browser')?.connected).toBe(true)
  })

  it('runs an automation through chat', async () => {
    const e = tmpEngine()
    const auto = e.createAutomation({ name: 'Morning', cadence: '08:00', prompt: 'brief please' })
    const ses = await e.runAutomation(auto.id)
    expect(ses.messages[0]?.text).toBe('brief please')
    expect(e.snapshot().automations[0]?.lastStatus).toBe('success')
  })

  it('saves settings', () => {
    const e = tmpEngine()
    const s = e.saveSettings({ workspace: 'C:\\work' })
    expect(s.workspace).toBe('C:\\work')
    expect(e.snapshot().workspace).toBe('C:\\work')
  })
})
