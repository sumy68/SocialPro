// src/hono.ts
import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import { timing } from 'hono/timing'
import { linkedinRouter } from './backend/routes/linkedin.js'
import { instagramRouter } from './backend/routes/instagram.js'

// 🧠 App-Instance
const app = new Hono()

// 🌐 CORS (für App-Calls wie /callback/exchange)
app.use(
  '*',
  cors({
    origin: '*', // falls du einschränken willst: ['socialpro://*', 'exp://*', 'http://localhost:19006']
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
  }),
)

// ⏱️ Server-Timing (nice to have für Debug)
app.use('*', timing())

// 🪵 Simple request logger (mit Query + Code-Maskierung)
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const u = new URL(c.req.url)
  const qEntries = Array.from(u.searchParams.entries())
  const q: Record<string, string> = {}
  for (const [k, v] of qEntries) q[k] = v
  if (q.code) {
    // maskiere sensiblen Code: ersten 6 Zeichen + Länge anzeigen
    const len = q.code.length
    const head = q.code.slice(0, 6)
    q.code = `${head}...(${len})`
  }
  console.log(
    JSON.stringify({
      method: c.req.method,
      path: u.pathname,
      query: q,
      status: c.res.status,
      ms: Date.now() - start,
    }),
  )
})

// 🏁 Boot logs
const BUILD = process.env.BUILD_TAG || 'e1b0b4c' // optional via ENV
console.log('[BOOT] hono.ts loaded')
console.log('[BOOT] BUILD=', BUILD)
console.log('[BOOT] mounting /api/oauth/linkedin + /api/oauth/instagram')

// 🔗 Routers
app.route('/api/oauth/linkedin', linkedinRouter)
app.route('/api/oauth/instagram', instagramRouter)

// 🩺 Health route mit Build-Tag (für Render-Check)
app.get('/health', (c: Context) => c.text(`ok build=${BUILD}`))

// 🛰️ Status (JSON) – hilfreich in CI/Deploy
app.get('/status', (c: Context) =>
  c.json({
    ok: true,
    build: BUILD,
    env: {
      node: process.version,
      publicBaseUrl: process.env.PUBLIC_BASE_URL || null,
      port: process.env.PORT || null,
    },
    routers: ['linkedin', 'instagram'],
    now: new Date().toISOString(),
  }),
)

// 🚨 Inline debug route (optional)
app.get('/_debug', (c: Context) => c.text('hono_router=LIVE'))

// ❗ NotFound & Error Handling
app.notFound((c) => c.text('Not Found', 404))

app.onError((err, c) => {
  console.error('[ERROR]', err)
  // keine sensiblen Details leaken
  return c.json({ ok: false, error: 'internal_error' }, 500)
})

// ✅ Export
export default app
export { app }
