import { Hono } from 'hono';

// ---- ENV ----
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://socialpro-fnvo.onrender.com';
const REDIRECT_URI = `${BASE_URL}/api/oauth/linkedin/callback`;

export const linkedinRouter = new Hono();

// GET /api/oauth/linkedin/start
// -> setzt li_state Cookie + redirect zu LinkedIn
linkedinRouter.get('/start', (c) => {
  const state = crypto.randomUUID().replace(/-/g, '');
  c.header(
    'Set-Cookie',
    `li_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('scope', 'r_liteprofile r_emailaddress w_member_social');
  url.searchParams.set('state', state);

  return c.redirect(url.toString(), 302);
});

// GET /api/oauth/linkedin/callback
// -> validiert state (oder Dev-Bypass) und deep-linkt zurück in die App
linkedinRouter.get('/callback', (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const skip = c.req.query('__skip_state') === '1'; // DEV ONLY

  const cookie = c.req.header('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)li_state=([^;]+)/);
  const savedState = m?.[1];

  // State-Check (skipbar im Dev)
  if (!skip && (!state || !savedState || state !== savedState)) {
    c.header('Set-Cookie', 'li_state=; Max-Age=0; Path=/');
    return c.redirect(
      'socialpro://connected/failure?provider=linkedin&reason=state_mismatch',
      302
    );
  }

  // Cookie leeren
  c.header('Set-Cookie', 'li_state=; Max-Age=0; Path=/');

  if (!code) {
    return c.redirect(
      'socialpro://connected/failure?provider=linkedin&reason=missing_code',
      302
    );
  }

  // Erfolgs-Deep-Link zurück in die App
  return c.redirect(
    `socialpro://connected/success?provider=linkedin&code=${encodeURIComponent(code)}`,
    302
  );
});

// GET /api/oauth/linkedin/callback/exchange?code=...
// -> tauscht Code gegen Access Token und holt Profil + Email
linkedinRouter.get('/callback/exchange', async (c) => {
  const code = c.req.query('code');
  if (!code) return c.text('Missing code', 400);

  // 1) Access Token holen
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI, // muss exakt matchen mit /callback
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!tokenRes.ok) {
    const errTxt = await tokenRes.text();
    return c.json({ ok: false, stage: 'accessToken', error: errTxt }, 400);
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    expires_in: number;
  };
  const accessToken = tokenJson.access_token;

  // 2) Me (Profil)
  const meRes = await fetch('https://api.linkedin.com/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const me = await meRes.json();

  // 3) Email
  const emailRes = await fetch(
    'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const email = await emailRes.json();

  // TODO: Tokens/Profil in DB persistieren (User + Provider verknüpfen)

  return c.json({
    ok: true,
    provider: 'linkedin',
    token: {
      access_token: accessToken,
      expires_in: tokenJson.expires_in,
    },
    profile: me,
    email,
  });
});
