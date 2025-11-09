// src/backend/routes/linkedin.ts
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

export const linkedinRouter = new Hono()

// /start – state erzeugen & als Cookie setzen
linkedinRouter.get('/start', (c) => {
  const state = crypto.randomUUID().replace(/-/g, '')
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LI_CLIENT_ID ?? '',
    redirect_uri: `${process.env.PUBLIC_BASE_URL}/api/oauth/linkedin/callback`,
    scope: 'openid profile email',
    state,
  })
  setCookie(c, 'li_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
  })
  return c.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`, 302)
})

// /callback – state prüfen (STRIKT), Cookie löschen, dann weitermachen
linkedinRouter.get('/callback', async (c) => {
  const qs = c.req.query()
  const code = qs.code
  const state = qs.state
  const cookieState = getCookie(c, 'li_state')

  // 1) MUSS vorhanden & identisch sein
  if (!state || !cookieState || state !== cookieState) {
    // Cookie weg, um Replays zu vermeiden
    deleteCookie(c, 'li_state', { path: '/' })
    return c.redirect(
      'socialpro://connected/failure?provider=linkedin&reason=state_mismatch',
      302
    )
  }

  // 2) Einmal-Token verbrauchen
  deleteCookie(c, 'li_state', { path: '/' })

  // 3) Ab hier: echten Token-Exchange machen (oder für Dummy-Code testweise short-circuit)
  if (!code || code === 'dummy_code') {
    return c.redirect(
      'socialpro://connected/failure?provider=linkedin&reason=not_exchanged_yet',
      302
    )
  }

  // … hier deinen echten Code→Token-Exchange implementieren …
  // const tokens = await exchangeLinkedInCodeForTokens(code)

  // Beispiel-Redirect nach Erfolg:
  return c.redirect('socialpro://connected/success?provider=linkedin', 302)
})
