import { Hono } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'
import { randomBytes } from 'crypto'

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!
const APP_URL = process.env.APP_URL || 'https://socialpro-fnvo.onrender.com'
const REDIRECT_URI = `${APP_URL}/api/oauth/linkedin/callback`

// Minimal-Scopes (Profil + Email). Für Posten: 'w_member_social' ergänzen.
const SCOPES = ['r_liteprofile', 'r_emailaddress'/*, 'w_member_social'*/].join(' ')

function requireEnv(name: string, v?: string) {
  if (!v) throw new Error(`[ENV] Missing ${name}`)
  return v
}
requireEnv('LINKEDIN_CLIENT_ID', CLIENT_ID)
requireEnv('LINKEDIN_CLIENT_SECRET', CLIENT_SECRET)
requireEnv('APP_URL', APP_URL)

// Router
export const linkedinRouter = new Hono()

// 1) Start → LinkedIn Consent (mit CSRF state in Cookie)
linkedinRouter.get('/start', (c) => {
  const state = randomBytes(16).toString('hex')
  setCookie(c, 'li_state', state, { httpOnly: true, sameSite: 'Lax', path: '/' })

  const url =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&state=${encodeURIComponent(state)}`
  return c.redirect(url, 302)
})

/**
 * 2) Callback → NUR Weiterleitung:
 *  - App-UserAgent → Deep Link in die App mit ?code=...
 *  - Desktop → 303 auf Web-Fallback, z.B. /connected/linkedin-success
 *  (Kein Token-Tausch hier!)
 */
linkedinRouter.get('/callback', (c) => {
  const u = new URL(c.req.url)
  const code = u.searchParams.get('code') ?? ''
  const error = u.searchParams.get('error') ?? ''
  const state = u.searchParams.get('state') ?? ''
  const saved = getCookie(c, 'li_state') || ''

  // CSRF basic check (nicht blockend, aber loggen)
  if (state && saved && state !== saved) {
    console.warn('[LI CALLBACK] state mismatch', { state, saved })
  }

  const deepSuccess = `socialpro://linkedin/success${code ? `?code=${encodeURIComponent(code)}` : ''}`
  const deepFail    = `socialpro://linkedin/fail${error ? `?error=${encodeURIComponent(error)}` : ''}`

  const ua = (c.req.header('user-agent') || '').toLowerCase()
  const isApp =
    ua.includes('iphone') || ua.includes('ipad') || ua.includes('android') ||
    ua.includes('wv') || ua.includes('crios') || ua.includes('fxios')

  if (isApp) {
    return c.redirect(error ? deepFail : deepSuccess, 302)
  }

  const webBase = APP_URL
  const web = error
    ? `${webBase}/connected/linkedin-fail${error ? `?error=${encodeURIComponent(error)}` : ''}`
    : `${webBase}/connected/linkedin-success${code ? `?code=${encodeURIComponent(code)}` : ''}`
  return c.redirect(web, 303)
})

/**
 * 3) Exchange → tauscht ?code gegen Access Token und liefert JSON
 *    (App ruft diesen Endpoint mit Accept: application/json auf)
 */
linkedinRouter.get('/callback/exchange', async (c) => {
  const code = c.req.query('code')
  if (!code) return c.json({ ok: false, error: 'missing_code' }, 400)

  try {
    // Token holen
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    })

    const tokenResp = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const tokenTxt = await tokenResp.text()
    if (!tokenResp.ok) {
      console.error('LI token exchange failed:', tokenResp.status, tokenTxt)
      return c.json({ ok: false, error: 'exchange_failed' }, 400)
    }
    const token = JSON.parse(tokenTxt) as { access_token: string; expires_in: number }
    const accessToken = token.access_token

    // Profil
    const meResp = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const me = await meResp.json()

    // Email
    const emailResp = await fetch(
      'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const emailJson: any = await emailResp.json()
    const email = emailJson?.elements?.[0]?.['handle~']?.emailAddress ?? null

    // App-First: JSON
    const wantsJSON = (c.req.header('accept') || '').includes('application/json')
    const payload = { ok: true, me, email }
    if (wantsJSON) return c.json(payload)

    // Optional Deep Link (falls im Browser geöffnet)
    const deep = `socialpro://linkedin/success${email ? `?li_email=${encodeURIComponent(email)}` : ''}`
    return c.redirect(deep, 302)
  } catch (e) {
    console.error('LI exchange error:', e)
    const wantsJSON = (c.req.header('accept') || '').includes('application/json')
    if (wantsJSON) return c.json({ ok: false, error: 'exchange_failed' }, 400)
    return c.redirect('socialpro://linkedin/fail?error=exchange_failed', 302)
  }
})
