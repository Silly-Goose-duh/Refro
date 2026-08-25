import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const require = createRequire('C:/Users/admin/deepseek-harness/apps/web/package.json')
const { chromium } = require('playwright')

const root = mkdtempSync(join(tmpdir(), 'refro-e2e-'))
const dshHome = join(root, '.dsh')
mkdirSync(join(dshHome, 'profiles', 'web'), { recursive: true })
writeFileSync(
  join(dshHome, 'profiles', 'web', 'package.json'),
  JSON.stringify({ dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'] } } }),
  'utf8',
)
writeFileSync(join(dshHome, '.credentials.yaml'), 'refs:\n  DEEPSEEK_API_KEY: sk-e2etestkey9999\n', 'utf8')

const port = 5174
const url = `http://127.0.0.1:${port}`
const child = spawn('npx', ['vite', '--port', String(port), '--host', '127.0.0.1', '--strictPort'], {
  cwd: join(import.meta.dirname, '..'),
  env: {
    ...process.env,
    DSH_HOME: dshHome,
    REFRO_DATA: join(root, 'data'),
    REFRO_CHAT_STUB: '1',
  },
  stdio: 'pipe',
  shell: true,
})

let out = ''
child.stdout.on('data', (d) => {
  out += d.toString()
})
child.stderr.on('data', (d) => {
  out += d.toString()
})

function fail(msg) {
  child.kill()
  console.error(out)
  throw new Error(msg)
}

try {
  let ready = false
  for (let i = 0; i < 40; i++) {
    await sleep(250)
    try {
      const r = await fetch(`${url}/api/state`)
      if (r.ok) {
        ready = true
        break
      }
    } catch {
      /* wait */
    }
  }
  if (!ready) fail('vite did not start')

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  page.setDefaultTimeout(15000)

  await page.goto(url)
  await page.getByTestId('open-palette').click()
  await page.getByTestId('wheel-dump-config').click()
  await page.getByTestId('task-confirm').click()
  await page.waitForURL(/\/chat\//)
  const log = page.getByTestId('chat-log')
  await log.waitFor()
  const body = await log.innerText()
  if (!body.includes('dsh-web-app')) fail(`dump-config UI missing profile json: ${body}`)

  await page.getByTestId('nav-skills').click()
  await page.getByTestId('skill-text').fill('When I say standup, draft from open PRs under 12 lines.')
  await page.getByTestId('skill-create').click()
  await page.getByTestId('skill-list').getByText('standup', { exact: false }).waitFor()

  await page.getByTestId('nav-apps').click()
  await page.getByTestId('connect-more').click()
  await page.getByTestId('connect-app-id').fill('github')
  await page.getByTestId('connect-secret').fill('ghp_e2e_token')
  await page.getByTestId('connect-submit').click()
  await page.getByTestId('app-github').getByText('Connected').waitFor()

  await page.getByTestId('nav-automations').click()
  await page.getByTestId('auto-name').fill('E2E auto')
  await page.getByTestId('auto-prompt').fill('Say hello from automation')
  await page.getByTestId('auto-create').click()
  await page.getByText('E2E auto').waitFor()
  await page.locator('button', { hasText: 'Run now' }).first().click()
  await page.waitForURL(/\/chat\//)
  await page.getByTestId('chat-log').getByText('Stub reply: Say hello from automation').waitFor()

  await page.getByTestId('open-palette').click()
  await page.getByTestId('command-palette').waitFor()
  await page.keyboard.press('Escape')
  await page.getByTestId('nav-settings').click()
  await page.getByTestId('key-masked').waitFor()
  const masked = await page.getByTestId('key-masked').innerText()
  if (!masked.includes('…')) fail(`key not masked: ${masked}`)
  if (masked.includes('sk-e2etestkey9999')) fail('raw key leaked in UI')

  await page.getByTestId('settings-workspace').fill('C:\\\\e2e-workspace')
  await page.getByTestId('settings-save').click()
  await sleep(300)
  const state = await (await fetch(`${url}/api/state`)).json()
  if (state.workspace !== 'C:\\\\e2e-workspace' && state.workspace !== 'C:\\e2e-workspace') {
    // value as typed
    if (!String(state.workspace).includes('e2e-workspace')) fail(`workspace not saved: ${state.workspace}`)
  }

  const apiState = await (await fetch(`${url}/api/state`)).json()
  if (!Array.isArray(apiState.sessions) || apiState.sessions.length < 2) {
    fail(`api sessions ${JSON.stringify(apiState.sessions)}`)
  }
  await page.goto(`${url}/sessions`)
  await page.getByTestId('sessions-table').locator('tbody tr').first().waitFor()
  const rows = await page.getByTestId('sessions-table').locator('tbody tr').count()
  if (rows < 2) fail(`expected session rows, got ${rows}`)

  await browser.close()
  console.log('e2e ok')
} finally {
  child.kill()
  if (child.pid) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', shell: true })
  }
}
