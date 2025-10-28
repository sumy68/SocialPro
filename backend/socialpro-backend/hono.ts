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

// --- Root Route ---
app.get('/', (c) => c.json({ message: 'SocialPro backend up ✅' }));

// --- TikTok OAuth (Skelett) ---

// 1. Start OAuth: App ruft das auf, wir leiten den User zu TikTok
app.get('/auth/tiktok/start', (c) => {
  // Diese Werte kommen später aus ENV:
  const clientKey = process.env.TIKTOK_CLIENT_KEY ?? 'MISSING_CLIENT_KEY';
  const redirectUri = 'https://socialpro-fnvo.onrender.com/auth/tiktok/callback';

  // TikTok OAuth authorize URL
  const scope = encodeURIComponent('user.info.basic');
  const state = 'todo-random-state'; // später dynamisch generieren

  const url =
    `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${clientKey}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  return c.redirect(url, 302);
});

// 2. Callback von TikTok: TikTok ruft diese URL nach erfolgreichem Login auf
app.get('/auth/tiktok/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  // TODO: später hier Access Token mit TikTok austauschen
  console.log('✅ TikTok callback hit:', { code, state });

  return c.json({
    ok: true,
    source: 'tiktok',
    code,
    state,
    message: 'TikTok OAuth callback received successfully ✅',
  });
});

export default app;
