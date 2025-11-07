import { Hono } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'
import { randomBytes } from 'crypto'
import fetch from 'node-fetch'

export const linkedinRouter = new Hono()

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!
const APP_URL = process.env.APP_URL || 'https://socialpro-fnvo.onrender.com'
const REDIRECT_URI = `${APP_URL}/api/oauth/linkedin/callback`
const SCOPES = ['openid','profile','email','offline_access','w_member_social'].join(' ')

// 🔹 Login starten
linkedinRouter.get('/start', async (c) => {
  const state = randomBytes(16).toString('hex')
  setCookie(c, 'linkedin_state', state, { httpOnly: true, sameSite: 'Lax', path: '/' })

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('state', state)

  return c.redirect(url.toString())
})

// 🔹 Callback & Tokens speichern
linkedinRouter.get('/callback', async (c) => {
  const url = new URL(c.req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const saved = getCookie(c, 'linkedin_state')

  if (!code || !state || state !== saved)
    return c.text('Invalid state', 400)

  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    })
  })
  const tokenData = await tokenRes.json() as any
  if (!tokenData.access_token) return c.json(tokenData, 400)

  // Token-Cookies (Demo; später DB)
  setCookie(c, 'linkedin_access', tokenData.access_token, { httpOnly: true, sameSite: 'Lax', path: '/' })
  if (tokenData.refresh_token) {
    setCookie(c, 'linkedin_refresh', tokenData.refresh_token, { httpOnly: true, sameSite: 'Lax', path: '/' })
  }

  return c.redirect('socialpro://connected/success?provider=linkedin')
})

// 🔹 Helper: Token Refresh (später z. B. in Cron verwenden)
linkedinRouter.get('/refresh', async (c) => {
  const refreshToken = getCookie(c, 'linkedin_refresh')
  if (!refreshToken) return c.text('no refresh token', 400)

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    })
  })
  const data = await res.json() as any
  if (!data.access_token) return c.json(data, 400)

  setCookie(c, 'linkedin_access', data.access_token, { httpOnly: true, sameSite: 'Lax', path: '/' })
  return c.json({ ok: true, newToken: true })
})
