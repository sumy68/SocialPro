// src/server.ts
import 'dotenv/config'
import app from './hono.js'
import { createServer } from 'node:http'
import { Readable } from 'node:stream'

const PORT = Number(process.env.PORT ?? 10000)
const HOST = process.env.HOST ?? '0.0.0.0'

// Node -> Fetch Headers
function nodeHeadersToFetchHeaders(h: import('node:http').IncomingHttpHeaders) {
  const headers = new Headers()
  for (const [k, v] of Object.entries(h)) {
    if (Array.isArray(v)) for (const vv of v) headers.append(k, vv)
    else if (typeof v === 'string') headers.set(k, v)
  }
  return headers
}

const server = createServer(async (req, res) => {
  try {
    const origin = `http://127.0.0.1:${PORT}`
    const url = new URL(req.url || '/', origin)

    const headers = nodeHeadersToFetchHeaders(req.headers)
    const method = req.method || 'GET'
    const hasBody = method !== 'GET' && method !== 'HEAD'

    const init: RequestInit & { duplex?: 'half' } = { method, headers }
    if (hasBody) {
      // stream request body through
      init.body = req as any
      init.duplex = 'half' // required for streaming request bodies in Node
    }

    const request = new Request(url, init)
    const r = await app.fetch(request)

    // Status & headers
    res.statusCode = r.status
    r.headers.forEach((v, k) => res.setHeader(k, v))

    // HEAD: headers only
    if (method === 'HEAD') {
      res.end()
      return
    }

    // Stream response body (no buffering)
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
    if (!res.headersSent) res.statusCode = 500
    res.end('Internal Server Error')
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`)
})
