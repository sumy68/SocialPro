import { Hono } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'
import { randomBytes } from 'crypto'
import fetch from 'node-fetch'

export const tiktokRouter = new Hono()

// 🌍 ENV
const APP_URL =
  process.env.PUBLIC_BASE_URL ||
  process.env.APP_URL ||
  'https://socialpro-fnvo.onrender.com'

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET
const SCHEME = process.env.EXPO_PUBLIC_SCHEME || 'socialpro'

// Safety logs
if (!CLIENT_KEY || !CLIENT_SECRET) {
  console.warn('[TikTok] Missing TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET')
}

// trailing Slash entfernen
const REDIRECT_URI = `${APP_URL.replace(/\/$/, '')}/api/oauth/tiktok/callback`

// TikTok Scopes
const SCOPES = ['user.info.basic', 'video.upload'].join(',')

// OAuth Endpoints
const AUTHORIZE_URL = 'https://www.tiktok.com/auth/authorize/'
const TOKEN_URL = 'https://www.tiktok.com/auth/token/'

// 🔹 START TikTok Login Flow
tiktokRouter.get('/start', (c) => {
  const state = randomBytes(16).toString('hex')

  setCookie(c, 'tt_state', state, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
  })

  const u = new URL(AUTHORIZE_URL)
  u.searchParams.set('client_key', CLIENT_KEY ?? '')
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('scope', SCOPES)
  u.searchParams.set('redirect_uri', REDIRECT_URI)
  u.searchParams.set('state', state)

  console.log('[TikTok] /start → redirect', u.toString())

  return c.redirect(u.toString())
})

// 🔹 CALLBACK TikTok → Backend
tiktokRouter.get('/callback', async (c) => {
  const url = new URL(c.req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const saved = getCookie(c, 'tt_state')

  if (!code) return c.text('Missing code', 400)

  if (!state || !saved || state !== saved) {
    console.error('[TikTok] state mismatch', { state, saved })
    return c.text('Invalid state', 400)
  }

  const form = new URLSearchParams({
    client_key: CLIENT_KEY ?? '',
    client_secret: CLIENT_SECRET ?? '',
    code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  }).toString()

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })

  if (!res.ok) {
    const txt = await res.text()
    console.error('[TikTok] Token error:', res.status, txt)
    return c.text('TikTok token error', 500)
  }

  const data: any = await res.json()

  const access = data.access_token ?? data.data?.access_token ?? null
  const refresh = data.refresh_token ?? data.data?.refresh_token ?? null

  if (!access) {
    console.error('[TikTok] No access token', data)
    return c.json(data, 400)
  }

  // Cookies setzen
  setCookie(c, 'tt_access', access, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
  })

  if (refresh) {
    setCookie(c, 'tt_refresh', refresh, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
    })
  }

  // Deep Link zurück zur App
  const appRedirect = `${SCHEME}://connected/success?provider=tiktok`
  console.log('[TikTok] Redirect to App →', appRedirect)

  return c.redirect(appRedirect)
})

// 🔹 REFRESH ENDPOINT
tiktokRouter.get('/refresh', async (c) => {
  const rt = getCookie(c, 'tt_refresh')
  if (!rt) return c.text('No refresh token', 400)

  const form = new URLSearchParams({
    client_key: CLIENT_KEY ?? '',
    client_secret: CLIENT_SECRET ?? '',
    grant_type: 'refresh_token',
    refresh_token: rt,
  }).toString()

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })

  if (!res.ok) {
    const txt = await res.text()
    console.error('[TikTok] Refresh error:', res.status, txt)
    return c.text('Refresh failed', 500)
  }

  const data: any = await res.json()
  const access = data.access_token ?? data.data?.access_token ?? null

  if (!access) return c.json(data, 400)

  setCookie(c, 'tt_access', access, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
  })

  return c.json({ ok: true })
})
