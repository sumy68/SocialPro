// src/hono.ts
import { Hono, type Context } from 'hono'
import { linkedinRouter } from './backend/routes/linkedin.js'
import { instagramRouter } from './backend/routes/instagram.js'

// 🧠 App-Instance
const app = new Hono()

// 🪵 Simple request logger
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  console.log(
    JSON.stringify({
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      status: c.res.status,
      ms: Date.now() - start,
    }),
  )
})

// 🏁 Boot logs
console.log('[BOOT] hono.ts loaded')
console.log('[BOOT] mounting /api/oauth/linkedin + /api/oauth/instagram')

// 🔗 Routers
app.route('/api/oauth/linkedin', linkedinRouter)
app.route('/api/oauth/instagram', instagramRouter)

// 🩺 Health route mit Build-Tag (für Render-Check)
const BUILD = 'e1b0b4c' // 👉 dein letzter Commit-Hash o.ä.
app.get('/health', (c: Context) => c.text(`ok build=${BUILD}`))

// 🚨 Inline debug route (optional)
app.get('/_debug', (c: Context) => c.text('hono_router=LIVE'))

// ✅ Export
export default app
export { app }
