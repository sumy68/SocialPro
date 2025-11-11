// src/backend/routes/linkedin.ts
import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

export const linkedinRouter = new Hono();
const LI_COOKIE = 'li_state';

// Redirect-URL strikt aus ENV (Render Screenshot zeigt LI_REDIRECT_URI)
const APP_URL =
  (process.env.APP_URL || process.env.PUBLIC_BASE_URL || 'https://socialpro-fnvo.onrender.com').replace(/\/$/, '');
const REDIRECT_URI =
  (process.env.LI_REDIRECT_URI || `${APP_URL}/api/oauth/linkedin/callback`).replace(/\/$/, '');

// Debug
linkedinRouter.get('/_debug', (c) => c.text(`linkedin_router=NEW_STRICT_STATE; redirect=${REDIRECT_URI}`));

linkedinRouter.get('/start', (c) => {
  const state = crypto.randomUUID().replace(/-/g, '');

  setCookie(c, LI_COOKIE, state, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: true,
    path: '/',
    maxAge: 600,
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID ?? '',
    redirect_uri: REDIRECT_URI,
    // Für Posten brauchst du w_member_social
    scope: 'r_liteprofile r_emailaddress w_member_social',
    state,
  });

  const url = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  console.log('[LI] start redirect ->', url);
  return c.redirect(url);
});

linkedinRouter.get('/callback', (c) => {
  const qState = c.req.query('state') ?? '';
  const cookieState = getCookie(c, LI_COOKIE) ?? '';
  const code = c.req.query('code') ?? '';

  console.log('[LI] callback check', { qState, cookieState, ok: qState === cookieState, hasCode: !!code });

  if (!qState || !cookieState || qState !== cookieState) {
    deleteCookie(c, LI_COOKIE, { path: '/' });
    return c.redirect('socialpro://connected/failure?provider=linkedin&reason=state_mismatch', 302);
  }
  if (!code) {
    deleteCookie(c, LI_COOKIE, { path: '/' });
    return c.redirect('socialpro://connected/failure?provider=linkedin&reason=missing_code', 302);
  }

  deleteCookie(c, LI_COOKIE, { path: '/' });
  return c.redirect(`socialpro://connected/success?provider=linkedin&code=${encodeURIComponent(code)}`, 302);
});
