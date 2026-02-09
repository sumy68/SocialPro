// src/server.ts
import 'dotenv/config'
import app from './hono.js'
import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import type { IncomingHttpHeaders } from 'node:http'

// SCHEDULER IMPORT
import { startScheduler } from './backend/scheduler.js'

const PORT = Number(process.env.PORT ?? 10000)
const HOST = process.env.HOST ?? '0.0.0.0'

function nodeHeadersToFetchHeaders(h: IncomingHttpHeaders) {
  const headers = new Headers()
  for (const [k, v] of Object.entries(h)) {
    if (Array.isArray(v)) {
      for (const vv of v) headers.append(k, vv)
    } else if (typeof v === 'string') {
      headers.set(k, v)
    }
  }
  return headers
}

function resolveOrigin(headers: IncomingHttpHeaders) {
  const proto =
    (Array.isArray(headers['x-forwarded-proto'])
      ? headers['x-forwarded-proto'][0]
      : headers['x-forwarded-proto']) || 'http'
  const host =
    (Array.isArray(headers['x-forwarded-host'])
      ? headers['x-forwarded-host'][0]
      : headers['x-forwarded-host']) ||
    (Array.isArray(headers['host']) ? headers['host'][0] : headers['host']) ||
    `${HOST}:${PORT}`
  return `${proto}://${host}`
}

const server = createServer(async (req, res) => {
  try {
    const origin = resolveOrigin(req.headers)
    const url = new URL(req.url || '/', origin)
    const headers = nodeHeadersToFetchHeaders(req.headers)
    const method = req.method || 'GET'

    const init: RequestInit & { duplex?: 'half' } = { method, headers }

    const methodHasBody = !/^(GET|HEAD)$/i.test(method)
    if (methodHasBody) {
      init.body = req as any
      ;(init as any).duplex = 'half'
    }

    const request = new Request(url, init)
    const r = await app.fetch(request)

    res.statusCode = r.status
    r.headers.forEach((v, k) => res.setHeader(k, v))

    if (method.toUpperCase() === 'HEAD') {
      res.end()
      return
    }

    if (r.body) {
      const readable = Readable.fromWeb(r.body as any)
      readable.on('error', (e) => {
        console.error('[server] stream error:', e)
        if (!res.headersSent) res.statusCode = 500
        res.end()
      })
      readable.pipe(res)
    } else {
      res.end()
    }
  } catch (err) {
    console.error('[server] error:', err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    }
    res.end('Internal Server Error')
  }
})

server.keepAliveTimeout = 75_000
server.headersTimeout = 80_000
server.requestTimeout = 75_000

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`)
  
  startScheduler()
  console.log('[Server] Scheduler started!')
})

function shutdown(signal: string) {
  console.log(`[server] received ${signal}, shutting down...`)
  server.close((err) => {
    if (err) {
      console.error('[server] close error:', err)
      process.exit(1)
    }
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

export default server
