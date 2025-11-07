// deploy trigger 😎
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { instagramRouter } from './backend/routes/instagram'
import { linkedinRouter } from './backend/routes/linkedin'
import { tiktokRouter } from './backend/routes/tiktok'
import { youtubeRouter } from './backend/routes/youtube'

const app = new Hono()

// CORS (falls du die Start-URL im In-App Browser öffnest)
app.use('*', cors())

// Version/Deploy-Marker (für Render-Check)
app.get('/version', (c) =>
  c.text('build:v3 ' + (process.env.RENDER_GIT_COMMIT || 'local'))
)
console.log('[deploy] build v3 loaded')

// Healthcheck für Render
app.get('/health', (c) => c.text('ok'))

/**
 * Instagram OAuth Callback – fängt Desktop/Safari ab und gibt Web-Fallback,
 * sonst 302 auf Deep Link für die App.
 *
 * WICHTIG: Diese Route ist VOR dem instagramRouter registriert,
 * damit sie sicher greift, auch wenn der Router selbst /callback hat.
 */
app.get('/api/oauth/instagram/callback', async (c) => {
  const url = new URL(c.req.url)
  const code = url.searchParams.get('code') ?? ''
  const error = url.searchParams.get('error') ?? ''

  // TODO: Wenn du hier Tokens tauschst, erst machen, dann redirecten.

  const deepLink = `socialpro://connected/success${
    code ? `?code=${encodeURIComponent(code)}` : ''
  }`

  const ua = (c.req.header('user-agent') || '').toLowerCase()
  const isIOSApp =
    ua.includes('iphone') || ua.includes('ipad') || ua.includes('crios') || ua.includes('fxios')
  const isAndroidApp = ua.includes('android') || ua.includes('wv')
  const cameFromApp = isIOSApp || isAndroidApp

  if (cameFromApp) {
    // App/WebView fängt den Deep Link
    return c.redirect(deepLink, 302)
  }

  // Web-Fallback (für Desktop/Safari „Adresse ungültig“-Case)
  const webFallback = process.env.APP_URL
    ? `${process.env.APP_URL}/connected/success${
        code ? `?code=${encodeURIComponent(code)}` : ''
      }`
    : null

  if (webFallback) {
    return c.redirect(webFallback, 303) // 303 = sauberer GET auf Zielseite
  }

  // letzte Rettung: simpler HTML-Button
  const html = `<!doctype html>
<meta charset="utf-8" />
<title>SocialPro verbunden</title>
<body style="font-family:system-ui;display:grid;place-items:center;height:100dvh">
  <div style="max-width:520px;text-align:center">
    <h1>Instagram verbunden ✅</h1>
    <p>Du kannst dieses Fenster schließen.</p>
    <p><a href="${deepLink}" style="display:inline-block;padding:.8rem 1.1rem;border:1px solid #888;border-radius:10px;text-decoration:none">
      In der App öffnen
    </a></p>
    ${error ? `<p style="color:#b00">Fehler: ${error}</p>` : ''}
  </div>
</body>`
  return c.html(html, 200)
})

// Router mounten
app.route('/api/oauth/instagram', instagramRouter)
app.route('/api/oauth/linkedin', linkedinRouter)
app.route('/api/oauth/tiktok', tiktokRouter)
app.route('/api/oauth/youtube', youtubeRouter)

// Optional: andere Router hier mounten
// app.route('/api/xyz', xyzRouter);

const port = Number(process.env.PORT) || 10000
console.log(`[server] listening on :${port}`)
serve({ fetch: app.fetch, port })

// force redeploy tet
