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

// --- TikTok OAuth ---

// 1. Start OAuth: App ruft das auf, wir leiten den User zu TikTok
app.get('/auth/tiktok/start', (c) => {
  // Später aus Render Environment Variables:
  const clientKey = process.env.TIKTOK_CLIENT_KEY ?? 'MISSING_CLIENT_KEY';

  // Muss exakt genauso auch im TikTok Developer Portal hinterlegt werden:
  const redirectUri = 'https://socialpro-fnvo.onrender.com/auth/tiktok/callback';

  // TikTok OAuth authorize URL
  const scope = encodeURIComponent('user.info.basic');
  const state = 'todo-random-state'; // TODO: später dynamisch für CSRF

  const url =
    `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${clientKey}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  // Browser wird zu TikTok weitergeleitet
  return c.redirect(url, 302);
});

// 2. Callback von TikTok: TikTok ruft diese URL nach erfolgreichem Login auf
app.get('/auth/tiktok/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  console.log('✅ TikTok callback hit:', { code, state });

  // TODO: Hier später Access Token austauschen mit TikTok API
  return c.json({
    ok: true,
    source: 'tiktok',
    code,
    state,
    message: 'TikTok OAuth callback received successfully ✅',
  });
});

export default app;
