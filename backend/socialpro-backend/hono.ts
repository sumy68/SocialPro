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

// ✅ Zusätzlich: /healthz für Render-Healthchecks
app.get('/healthz', (c) =>
  c.json({
    status: 'ok',
    service: 'socialpro-backend',
    timestamp: new Date().toISOString(),
  })
);

// --- Root Route ---
app.get('/', (c) => c.json({ message: 'SocialPro backend up ✅' }));

// ===============================
// ✅ Instagram OAuth (Meta): START + CALLBACK mit Token-Exchange
// ===============================
app.get('/auth/instagram/start', (c) => {
  const appId = process.env.META_APP_ID ?? '1887376112124643'; // deine App-ID als Fallback
  const appUrl = process.env.APP_URL ?? 'https://socialpro-fnvo.onrender.com';
  const redirectUri = `${appUrl}/auth/instagram/callback`;

  // Für den ersten Test minimal halten (Facebook Login sonst oft blockiert)
  const scope = ['public_profile', 'email'].join(',');
  // Später erweitern (wenn Login geht): instagram_basic, pages_show_list, instagram_manage_insights, ...

  // TODO: state sicher persistieren/prüfen (z. B. via JWT/Redis)
  const state = crypto.randomUUID();

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
  const appId = process.env.META_APP_ID ?? '1887376112124643';
  const appSecret = process.env.META_APP_SECRET;
  const appUrl = process.env.APP_URL ?? 'https://socialpro-fnvo.onrender.com';
  const deepLink = process.env.EXPO_DEEP_LINK ?? 'socialpro://connected/success';

  const redirectUri = `${appUrl}/auth/instagram/callback`;
  const code = c.req.query('code');
  const state = c.req.query('state') ?? '';

  const errRedirect = (msg: string) => {
    const glue = deepLink.includes('?') ? '&' : '?';
    return c.redirect(
      `${deepLink}${glue}platform=instagram&ok=0&state=${encodeURIComponent(
        String(state)
      )}&message=${encodeURIComponent(msg)}`,
      302
    );
  };

  try {
    if (!code) return errRedirect('missing_code');
    if (!appSecret) return errRedirect('missing_app_secret');

    // 1) Short-lived User Access Token holen
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
        `?client_id=${encodeURIComponent(appId)}` +
        `&client_secret=${encodeURIComponent(appSecret)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=${encodeURIComponent(code)}`
    );
    const tokenJson: any = await tokenRes.json();

    if (!tokenRes.ok || tokenJson.error) {
      const detail = tokenJson.error?.message ?? tokenRes.statusText;
      console.error('❌ Token exchange failed:', tokenJson);
      return errRedirect(`token_exchange_failed:${detail}`);
    }

    const shortLivedToken: string = tokenJson.access_token;
    const shortExpiresIn: number = tokenJson.expires_in;

    // 2) Optional: Long-lived Token holen (empfohlen)
    let accessToken = shortLivedToken;
    let expiresIn = shortExpiresIn;

    try {
      const longRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token` +
          `?grant_type=fb_exchange_token` +
          `&client_id=${encodeURIComponent(appId)}` +
          `&client_secret=${encodeURIComponent(appSecret)}` +
          `&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`
      );
      const longJson: any = await longRes.json();
      if (longRes.ok && !longJson.error && longJson.access_token) {
        accessToken = longJson.access_token;
        expiresIn = longJson.expires_in ?? expiresIn;
      }
    } catch (e) {
      console.warn('⚠️ Long-lived exchange skipped:', (e as any)?.message);
    }

    // 3) (Optional) IG Business Accounts abrufen — nur wenn gebraucht
    //    Funktioniert für User mit verknüpften Pages/IG.
    // let igAccounts: Array<{ id: string; username?: string; name?: string }> = [];
    // try {
    //   const pagesRes = await fetch(
    //     `https://graph.facebook.com/v19.0/me/accounts` +
    //       `?fields=instagram_business_account{name,username,id}` +
    //       `&access_token=${encodeURIComponent(accessToken)}`
    //   );
    //   const pagesJson: any = await pagesRes.json();
    //   if (pagesRes.ok && pagesJson?.data) {
    //     for (const p of pagesJson.data) {
    //       const ig = p.instagram_business_account;
    //       if (ig?.id) igAccounts.push({ id: ig.id, username: ig.username, name: ig.name });
    //     }
    //   }
    // } catch {}

    // TODO: Hier in deiner DB speichern:
    // - provider: 'instagram'
    // - user_id (aus "state" ableiten/prüfen)
    // - accessToken (long-lived)
    // - expiresIn
    // - optional: igAccounts

    console.log('✅ Instagram OAuth success', {
      state,
      expiresIn,
      tokenPreview: accessToken?.slice(0, 6) + '…',
    });

    // 4) Erfolg → zurück in die App (dein Screen liest ok/ platform/ state)
    const glue = deepLink.includes('?') ? '&' : '?';
    return c.redirect(
      `${deepLink}${glue}platform=instagram&ok=1&state=${encodeURIComponent(String(state))}`,
      302
    );
  } catch (e: any) {
    console.error('❌ Instagram callback exception:', e);
    return errRedirect(`exception:${e?.message ?? 'unknown'}`);
  }
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
    `?client_key=${clientKey}` 
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

const BOOT_TS = new Date().toISOString();

app.get("/api/_whoami", (c) =>
  c.json({
    boot: BOOT_TS,
    fileHint: "this is the hono.ts build",
    redirectUri: IG_REDIRECT_URI,
  })
);

export default app;
