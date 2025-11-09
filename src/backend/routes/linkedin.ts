// src/backend/routes/linkedin.ts
import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

export const linkedinRouter = new Hono();

// /start: state setzen
linkedinRouter.get('/start', (c) => {
  const state = crypto.randomUUID().replace(/-/g, '');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${process.env.PUBLIC_BASE_URL}/api/oauth/linkedin/callback`,
    scope: 'openid profile email',
    state,
  });

  // Cookie sicher setzen
  setCookie(c, 'li_state', state, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: true,      // auf Render via HTTPS: true
    path: '/',         // wichtig, damit es im Callback mitkommt
    maxAge: 10 * 60,   // 10 min
  });

  return c.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
});

// /callback: state prüfen
linkedinRouter.get('/callback', async (c) => {
  const qState = c.req.query('state') ?? '';
  const cookieState = getCookie(c, 'li_state') ?? '';

  if (!qState || !cookieState || qState !== cookieState) {
    // Cookie aufräumen
    deleteCookie(c, 'li_state', { path: '/' });
    return c.redirect(
      'socialpro://connected/failure?provider=linkedin&reason=state_mismatch',
      302
    );
  }

  // Optional: Cookie nach erfolgreicher Prüfung invalidieren
  deleteCookie(c, 'li_state', { path: '/' });

  // TODO: echten Token-Exchange machen; bis dahin nur Platzhalter:
  const code = c.req.query('code') ?? '';
  if (!code) {
    return c.redirect(
      'socialpro://connected/failure?provider=linkedin&reason=missing_code',
      302
    );
  }

  // Hier würdest du mit LinkedIn den Code eintauschen…
  return c.redirect(
    `socialpro://connected/success?provider=linkedin&code=${encodeURIComponent(code)}`,
    302
  );
});
