// src/backend/routes/linkedin.ts
import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

export const linkedinRouter = new Hono();

const LI_COOKIE = 'li_state';

linkedinRouter.get('/start', (c) => {
  const state = crypto.randomUUID().replace(/-/g, '');
  // In Prod unbedingt secure:true (du bist auf HTTPS → passt)
  setCookie(c, LI_COOKIE, state, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: true,
    path: '/',
    maxAge: 600, // 10 min
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${process.env.PUBLIC_BASE_URL}/api/oauth/linkedin/callback`,
    scope: 'openid profile email',
    state,
  });

  return c.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`, 302);
});

linkedinRouter.get('/callback', async (c) => {
  const qState = c.req.query('state') ?? '';
  const cookieState = getCookie(c, LI_COOKIE) ?? '';

  // State MUSS übereinstimmen (und vorhanden sein)
  if (!qState || !cookieState || qState !== cookieState) {
    deleteCookie(c, LI_COOKIE, { path: '/' });
    return c.redirect('socialpro://connected/failure?provider=linkedin&reason=state_mismatch', 302);
  }

  // Einmal-Token → sofort löschen
  deleteCookie(c, LI_COOKIE, { path: '/' });

  const code = c.req.query('code') ?? '';
  if (!code) {
    return c.redirect('socialpro://connected/failure?provider=linkedin&reason=missing_code', 302);
  }

  // TODO: Token-Exchange hier (axios/fetch)
  return c.redirect(`socialpro://connected/success?provider=linkedin&code=${encodeURIComponent(code)}`, 302);
});
