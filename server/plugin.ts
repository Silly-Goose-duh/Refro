import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { createEngine, defaultHomes } from './refro.ts'

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function refroApiPlugin(): Plugin {
  const engine = createEngine(defaultHomes())
  return {
    name: 'refro-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/')) return next()
        const path = url.split('?')[0] ?? url
        try {
          if (req.method === 'GET' && path === '/api/state') {
            return send(res, 200, engine.snapshot())
          }
          if (req.method === 'GET' && path.startsWith('/api/sessions/')) {
            const id = decodeURIComponent(path.slice('/api/sessions/'.length))
            const row = engine.getSession(id)
            return row ? send(res, 200, row) : send(res, 404, { error: 'missing session' })
          }
          const json = req.method === 'GET' ? {} : JSON.parse((await readBody(req)) || '{}')
          if (req.method === 'POST' && path === '/api/chat') {
            return send(res, 200, await engine.chat(json.sessionId, String(json.text ?? '')))
          }
          if (req.method === 'POST' && path.startsWith('/api/tasks/') && path.endsWith('/run')) {
            const id = decodeURIComponent(path.slice('/api/tasks/'.length, -'/run'.length))
            return send(res, 200, await engine.runTask(id, json.extra ? String(json.extra) : undefined))
          }
          if (req.method === 'POST' && path === '/api/apps') {
            return send(res, 200, await engine.addApp({
              id: String(json.id ?? json.name ?? ''),
              name: String(json.name ?? ''),
              secret: String(json.secret ?? ''),
            }))
          }
          if (req.method === 'POST' && path === '/api/events') {
            return send(res, 200, engine.addEvent(json))
          }
          if (req.method === 'POST' && path === '/api/skills') {
            return send(res, 200, await engine.createSkill(String(json.text ?? '')))
          }
          if (req.method === 'POST' && path.startsWith('/api/apps/') && path.endsWith('/connect')) {
            const id = decodeURIComponent(path.slice('/api/apps/'.length, -'/connect'.length))
            return send(res, 200, await engine.connectApp(id, String(json.secret ?? '')))
          }
          if (req.method === 'POST' && path.startsWith('/api/apps/') && path.endsWith('/disconnect')) {
            const id = decodeURIComponent(path.slice('/api/apps/'.length, -'/disconnect'.length))
            return send(res, 200, engine.disconnectApp(id))
          }
          if (req.method === 'POST' && path === '/api/automations') {
            return send(res, 200, engine.createAutomation(json))
          }
          if (req.method === 'POST' && path.startsWith('/api/automations/') && path.endsWith('/run')) {
            const id = decodeURIComponent(path.slice('/api/automations/'.length, -'/run'.length))
            return send(res, 200, await engine.runAutomation(id))
          }
          if (req.method === 'POST' && path.startsWith('/api/automations/') && path.endsWith('/toggle')) {
            const id = decodeURIComponent(path.slice('/api/automations/'.length, -'/toggle'.length))
            return send(res, 200, engine.toggleAutomation(id, Boolean(json.enabled)))
          }
          if (req.method === 'POST' && path === '/api/settings') {
            return send(res, 200, engine.saveSettings(json))
          }
          return send(res, 404, { error: 'unknown api' })
        } catch (err) {
          return send(res, 400, { error: err instanceof Error ? err.message : String(err) })
        }
      })
    },
  }
}
