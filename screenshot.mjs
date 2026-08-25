import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire('C:/Users/admin/deepseek-harness/apps/web/package.json')
const { chromium } = require('playwright')

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots')
await mkdir(out, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const routes = [
  ['home', '/'],
  ['chat', '/chat'],
  ['sessions', '/sessions'],
  ['skills', '/skills'],
  ['inbox', '/inbox'],
]

for (const [name, route] of routes) {
  await page.goto(`http://127.0.0.1:5173${route}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true })
}

await browser.close()
console.log('ok')
