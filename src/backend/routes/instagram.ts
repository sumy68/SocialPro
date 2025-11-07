import { Hono } from 'hono'
import {
  getAuthUrl,
  exchangeCodeForToken,
  fetchPages,
  fetchIgBusinessAccountId,
} from '../utils/instagramOAuth'

export const instagramRouter = new Hono()

// Start → Facebook Login Dialog
instagramRouter.get('/start', (c) => {
  const url = getAuthUrl()
  return c.redirect(url, 302)
})

// Callback-EXCHANGE (umbenannt): Token holen → Pages → IG Business ID → Deep Link zurück in App
// WICHTIG: server.ts handled jetzt /api/oauth/instagram/callback (Deep-Link/Web-Fallback).
// Dieser Endpoint ist NUR für den tatsächlichen Token-Exchange gedacht.
instagramRouter.get('/callback/exchange', async (c) => {
  const code = c.req.query('code')
  if (!code) return c.redirect('socialpro://connected/fail?error=missing_code', 302)

  try {
    // 1) User-Token
    const token = await exchangeCodeForToken(code)
    const userToken = token.access_token

    // 2) Pages ziehen
    const pages = await fetchPages(userToken)
    if (!pages.length) return c.redirect('socialpro://connected/fail?error=no_pages', 302)

    // 3) Page mit IG Business Account finden
    let igId: string | null = null
    let usedPageId: string | null = null

    for (const p of pages) {
      const maybe = await fetchIgBusinessAccountId(p.id, p.access_token || userToken)
      if (maybe) { igId = maybe; usedPageId = p.id; break }
    }

    if (!igId) {
      return c.redirect('socialpro://connected/fail?error=no_instagram_business_account', 302)
    }

    // 4) Erfolgreich – entweder JSON oder Redirect zurück in App
    const successUrl =
      'socialpro://connected/success'
      + '?page_id=' + encodeURIComponent(usedPageId || '')
      + '&ig_user_id=' + encodeURIComponent(igId)

    const wantsJSON = (c.req.header('accept') || '').includes('application/json')
    if (wantsJSON) {
      return c.json({ ok: true, page_id: usedPageId, ig_user_id: igId })
    }

    return c.redirect(successUrl, 302)
  } catch (err) {
    console.error('OAuth error:', err)
    const wantsJSON = (c.req.header('accept') || '').includes('application/json')
    if (wantsJSON) {
      return c.json({ ok: false, error: 'exchange_failed' }, 400)
    }
    return c.redirect('socialpro://connected/fail?error=exchange_failed', 302)
  }
})
