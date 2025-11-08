import { Hono } from 'hono'
import {
  getAuthUrl,
  exchangeCodeForToken,
  fetchPages,
  fetchIgBusinessAccountId,
} from '../utils/instagramOAuth'

const APP_SCHEME_SUCCESS = 'socialpro://connected/success'
const APP_SCHEME_FAIL = 'socialpro://connected/fail'
const OAUTH_STATE = 'sp_ig' // muss mit getAuthUrl() matchen

export const instagramRouter = new Hono()

// /api/oauth/instagram/start → Facebook Login
instagramRouter.get('/start', (c) => {
  const url = getAuthUrl() // sollte redirect_uri = APP_URL/api/oauth/instagram/callback + state=sp_ig setzen
  return c.redirect(url, 302)
})

// Meta callback (die URL, die du in der Meta-App hinterlegst)
instagramRouter.get('/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  if (state && state !== OAUTH_STATE) {
    return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=bad_state`, 302)
  }
  if (!code) {
    return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=missing_code`, 302)
  }
  // delegiere auf den Exchange-Flow
  return instagramExchange(c, code)
})

// Reiner Exchange-Endpoint (kannst du auch direkt hitten)
instagramRouter.get('/callback/exchange', async (c) => {
  const code = c.req.query('code')
  if (!code) {
    return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=missing_code`, 302)
  }
  return instagramExchange(c, code)
})

async function instagramExchange(c: any, code: string) {
  try {
    // 1) code → user token
    const token = await exchangeCodeForToken(code)
    const userToken = token.access_token

    // 2) Seiten holen
    const pages = await fetchPages(userToken)
    if (!pages.length) {
      return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=no_pages`, 302)
    }

    // 3) IG Business Account finden
    let igId: string | null = null
    let usedPageId: string | null = null
    for (const p of pages) {
      const maybe = await fetchIgBusinessAccountId(p.id, p.access_token || userToken)
      if (maybe) { igId = maybe; usedPageId = p.id; break }
    }
    if (!igId) {
      return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=no_instagram_business_account`, 302)
    }

    // 4) Erfolg → Deep Link zurück in die App ODER JSON
    const successUrl =
      `${APP_SCHEME_SUCCESS}?platform=instagram&status=ok` +
      `&page_id=${encodeURIComponent(usedPageId || '')}` +
      `&ig_user_id=${encodeURIComponent(igId)}`

    const wantsJSON = (c.req.header('accept') || '').includes('application/json')
    if (wantsJSON) {
      return c.json({ ok: true, page_id: usedPageId, ig_user_id: igId })
    }
    return c.redirect(successUrl, 302)
  } catch (err) {
    console.error('OAuth error:', err)
    const wantsJSON = (c.req.header('accept') || '').includes('application/json')
    if (wantsJSON) return c.json({ ok: false, error: 'exchange_failed' }, 400)
    return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=exchange_failed`, 302)
  }
}
