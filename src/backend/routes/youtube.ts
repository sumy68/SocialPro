import { Hono } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'
import { randomBytes } from 'crypto'
import fetch from 'node-fetch'

export const youtubeRouter = new Hono()

// ⚙️ ENV
const APP_URL = process.env.APP_URL || 'https://socialpro-fnvo.onrender.com'
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = `${APP_URL}/api/oauth/youtube/callback`

// Scopes (Upload + Manage)
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube'
].join(' ')

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

// Start
youtubeRouter.get('/start', (c) => {
  const state = randomBytes(16).toString('hex')
  setCookie(c, 'yt_state', state, { httpOnly: true, sameSite:'Lax', path:'/' })

  const u = new URL(AUTHORIZE_URL)
  u.searchParams.set('client_id', CLIENT_ID)
  u.searchParams.set('redirect_uri', REDIRECT_URI)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('scope', SCOPES)
  u.searchParams.set('access_type', 'offline')   // refresh_token
  u.searchParams.set('prompt', 'consent')        // refresh on first consent
  u.searchParams.set('state', state)

  return c.redirect(u.toString())
})

// Callback
youtubeRouter.get('/callback', async (c) => {
  const url = new URL(c.req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const saved = getCookie(c, 'yt_state')
  if (!code || !state || state !== saved) return c.text('Invalid state', 400)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }).toString()
  })

  const data = await res.json() as any
  if (!data.access_token) return c.json(data, 400)

  setCookie(c, 'yt_access', data.access_token, { httpOnly:true, sameSite:'Lax', path:'/' })
  if (data.refresh_token) {
    setCookie(c, 'yt_refresh', data.refresh_token, { httpOnly:true, sameSite:'Lax', path:'/' })
  }

  return c.redirect('socialpro://connected/success?provider=youtube')
})

// Refresh
youtubeRouter.get('/refresh', async (c) => {
  const rt = getCookie(c, 'yt_refresh')
  if (!rt) return c.text('no refresh token', 400)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: rt,
      grant_type: 'refresh_token',
    }).toString()
  })

  const data = await res.json() as any
  if (!data.access_token) return c.json(data, 400)

  setCookie(c, 'yt_access', data.access_token, { httpOnly:true, sameSite:'Lax', path:'/' })
  return c.json({ ok:true })
})
