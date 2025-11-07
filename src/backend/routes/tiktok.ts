import { Hono } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'
import { randomBytes } from 'crypto'
import fetch from 'node-fetch'

export const tiktokRouter = new Hono()

// ⚙️ ENV
const APP_URL = process.env.APP_URL || 'https://socialpro-fnvo.onrender.com'
const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!      // = client_id
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!
const REDIRECT_URI = `${APP_URL}/api/oauth/tiktok/callback`

// ✅ Scopes je nach Bedarf (Basics + Upload)
const SCOPES = ['user.info.basic','video.upload'].join(',')

// 🔐 OAuth URLs (Login Kit)
// NOTE: Endpoints je nach TikTok-Produkt leicht unterschiedlich – diese hier sind die gängigen Login/OAuth-Endpoints.
const AUTHORIZE_URL = 'https://www.tiktok.com/auth/authorize/'
const TOKEN_URL     = 'https://www.tiktok.com/auth/token/'

// Start
tiktokRouter.get('/start', (c) => {
  const state = randomBytes(16).toString('hex')
  setCookie(c, 'tt_state', state, { httpOnly: true, sameSite: 'Lax', path: '/' })

  const u = new URL(AUTHORIZE_URL)
  u.searchParams.set('client_key', CLIENT_KEY)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('scope', SCOPES)
  u.searchParams.set('redirect_uri', REDIRECT_URI)
  u.searchParams.set('state', state)
  return c.redirect(u.toString())
})

// Callback
tiktokRouter.get('/callback', async (c) => {
  const url = new URL(c.req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const saved = getCookie(c, 'tt_state')
  if (!code || !state || state !== saved) return c.text('Invalid state', 400)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    })
  })
  const data = await res.json() as any
  if (!data.access_token && !data.data?.access_token) return c.json(data, 400)

  const access = data.access_token ?? data.data.access_token
  const refresh = data.refresh_token ?? data.data?.refresh_token
  setCookie(c, 'tt_access', access, { httpOnly:true, sameSite:'Lax', path:'/' })
  if (refresh) setCookie(c, 'tt_refresh', refresh, { httpOnly:true, sameSite:'Lax', path:'/' })

  return c.redirect('socialpro://connected/success?provider=tiktok')
})

// Refresh
tiktokRouter.get('/refresh', async (c) => {
  const rt = getCookie(c, 'tt_refresh')
  if (!rt) return c.text('no refresh token', 400)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: rt,
    })
  })
  const data = await res.json() as any
  const access = data.access_token ?? data.data?.access_token
  if (!access) return c.json(data, 400)

  setCookie(c, 'tt_access', access, { httpOnly:true, sameSite:'Lax', path:'/' })
  return c.json({ ok:true })
})
