// backend/socialpro-backend/hono.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

const app = new Hono();

// --- Middlewares ---
app.use('*', logger());
app.use('*', cors());

// --- Health / Status ---
app.get('/status', (c) =>
  c.json({
    ok: true,
    service: 'socialpro-backend',
    timestamp: new Date().toISOString(),
  })
);

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    service: 'socialpro-backend',
    timestamp: new Date().toISOString(),
  })
);

// --- Root Route ---
app.get('/', (c) => c.json({ message: 'SocialPro backend up ✅' }));

// ===============================
// ✅ Instagram OAuth (Meta)
// ===============================
app.get('/auth/instagram/start', (c) => {
  const appId = "1887376112124643"; // ✅ Deine Meta App ID
  const redirectUri = 'https://socialpro-fnvo.onrender.com/auth/instagram/callback';

  const scope = [
    'public_profile',
    'email',
    'instagram_basic',
    'pages_show_list',
    'pages_read_engagement',
    'instagram_manage_insights',
  ].join(',');

  const state = crypto.randomUUID(); // ✅ random state

  const url =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}`;

  return c.redirect(url, 302);
});

app.get('/auth/instagram/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  console.log('✅ Instagram callback hit:', { code, state });

  // TODO: Access Token über Graph API holen (kommt später)

  // Zurück in die App redirecten
  const deeplink = `socialpro://oauth?provider=instagram&status=success&code=${code}`;
  return c.redirect(deeplink, 302);
});

// ===============================
// ✅ TikTok OAuth (dein Skelett)
// ===============================
app.get('/auth/tiktok/start', (c) => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY ?? 'MISSING_CLIENT_KEY';
  const redirectUri = 'https://socialpro-fnvo.onrender.com/auth/tiktok/callback';
  const scope = encodeURIComponent('user.info.basic');
  const state = 'todo-random-state';

  const url =
    `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${clientKey}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  return c.redirect(url, 302);
});

app.get('/auth/tiktok/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  console.log('✅ TikTok callback hit:', { code, state });
  return c.json({ ok: true, source: 'tiktok', code, state });
});

export default app;
