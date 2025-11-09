// src/backend/routes/linkedin.ts
import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

export const linkedinRouter = new Hono();
const LI_COOKIE = 'li_state';

// --- START ----------------------------------------------------
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
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${process.env.PUBLIC_BASE_URL}/api/oauth/linkedin/callback`,
    scope: 'openid profile email',
    state,
  });

  return c.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

// --- CALLBACK -------------------------------------------------
linkedinRouter.get('/callback', async (c) => {
  const qState = c.req.query('state') ?? '';
  const cookieState = getCookie(c, LI_COOKIE) ?? '';

  // 🧩 Log für Render-Konsole
  console.log('[LI] callback check', { qState, cookieState, ok: qState === cookieState });

  // 🔒 Harte Prüfung & EARLY RETURN
  if (!qState || !cookieState || qState !== cookieState) {
    deleteCookie(c, LI_COOKIE, { path: '/' });
    return c.redirect(
      'socialpro://connected/failure?provider=linkedin&reason=state_mismatch',
      302
    );
  }

  // State passt → Cookie löschen
  deleteCookie(c, LI_COOKIE, { path: '/' });

  const code = c.req.query('code') ?? '';
  if (!code) {
    return c.redirect(
      'socialpro://connected/failure?provider=linkedin&reason=missing_code',
      302
    );
  }

  // Erfolg (später Token-Exchange hier einbauen)
  return c.redirect(
    `socialpro://connected/success?provider=linkedin&code=${encodeURIComponent(code)}`,
    302
  );
});

