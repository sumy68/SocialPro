// src/backend/routes/linkedin.ts
import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

export const linkedinRouter = new Hono();
const LI_COOKIE = 'li_state';

// Debug-Route, um sicher zu sehen, dass DIESER Router live ist
linkedinRouter.get('/_debug', (c) => c.text('linkedin_router=NEW_STRICT_STATE'));

linkedinRouter.get('/start', (c) => {
  const state = crypto.randomUUID().replace(/-/g, '');

  setCookie(c, LI_COOKIE, state, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: true,
    path: '/',
    maxAge: 600, // 10min
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID ?? '',
    redirect_uri: `${process.env.PUBLIC_BASE_URL}/api/oauth/linkedin/callback`,
    scope: 'openid profile email',
    state,
  });

  return c.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
});

linkedinRouter.get('/callback', (c) => {
  const qState = c.req.query('state') ?? '';
  const cookieState = getCookie(c, LI_COOKIE) ?? '';
  const code = c.req.query('code') ?? '';

  // Sichtbarer Log in Render
  console.log('[LI] callback check', { qState, cookieState, ok: qState === cookieState, hasCode: !!code });

  // 🔒 Harte Prüfung
  if (!qState || !cookieState || qState !== cookieState) {
    deleteCookie(c, LI_COOKIE, { path: '/' });
    return c.redirect('socialpro://connected/failure?provider=linkedin&reason=state_mismatch', 302);
  }

  if (!code) {
    deleteCookie(c, LI_COOKIE, { path: '/' });
    return c.redirect('socialpro://connected/failure?provider=linkedin&reason=missing_code', 302);
  }

  // State ok -> Cookie invalidieren
  deleteCookie(c, LI_COOKIE, { path: '/' });

  // (Später Token-Exchange hier)
  return c.redirect(`socialpro://connected/success?provider=linkedin&code=${encodeURIComponent(code)}`, 302);
});
