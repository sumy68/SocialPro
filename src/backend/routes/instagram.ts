// src/backend/routes/instagram.ts
import { Hono, type Context } from 'hono';
import {
  getAuthUrl,
  exchangeCodeForToken,
  fetchPages,
  fetchIgBusinessAccountId,
} from '../utils/instagramOAuth.js';

const APP_SCHEME_SUCCESS = 'socialpro://connected/success';
const APP_SCHEME_FAIL = 'socialpro://connected/fail';
const OAUTH_STATE = 'sp_ig'; // muss mit getAuthUrl() matchen

export const instagramRouter = new Hono();

// --- helpers --------------------------------------------------------------
const wantsJSON = (c: Context) =>
  (c.req.header('accept') || '').includes('application/json');

const failUrl = (error: string) =>
  `${APP_SCHEME_FAIL}?provider=instagram&platform=instagram&error=${error}`;

const successUrl = (params: { page_id: string; ig_user_id: string }) =>
  `${APP_SCHEME_SUCCESS}?provider=instagram&platform=instagram&status=ok` +
  `&page_id=${encodeURIComponent(params.page_id || '')}` +
  `&ig_user_id=${encodeURIComponent(params.ig_user_id)}`;

// --- ping / health --------------------------------------------------------
instagramRouter.get('/_ping', (c: Context) => c.json({ ok: true }));
instagramRouter.get('/ping', (c: Context) => c.text('ig pong'));

// --- start ---------------------------------------------------------------
instagramRouter.get('/start', (c: Context) => {
  try {
    const url = getAuthUrl(); // redirect_uri: APP_URL/api/oauth/instagram/callback
    return c.redirect(url, 302);
  } catch (err) {
    console.error('IG /start error:', err);
    return c.redirect(failUrl('start_failed'), 302);
  }
});

// --- callback + exchange -------------------------------------------------
instagramRouter.get('/callback', async (c: Context) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  if (state && state !== OAUTH_STATE)
    return c.redirect(failUrl('bad_state'), 302);
  if (!code) return c.redirect(failUrl('missing_code'), 302);
  return instagramExchange(c, code);
});

instagramRouter.get('/callback/exchange', async (c: Context) => {
  const code = c.req.query('code');
  if (!code) return c.redirect(failUrl('missing_code'), 302);
  return instagramExchange(c, code);
});

// --- core oauth flow -----------------------------------------------------
async function instagramExchange(c: Context, code: string) {
  try {
    // 1) code → user token
    const token = await exchangeCodeForToken(code);
    const userToken = (token as any).access_token as string;
    if (!userToken) throw new Error('no_access_token');

    // 2) Facebook Pages holen
    const pages: Array<{ id: string; access_token?: string }> =
      await fetchPages(userToken);
    if (!pages?.length) {
      if (wantsJSON(c)) return c.json({ ok: false, error: 'no_pages' }, 400);
      return c.redirect(failUrl('no_pages'), 302);
    }

    // 3) IG Business Account suchen
    let igId: string | null = null;
    let usedPageId: string | null = null;
    for (const p of pages) {
      const maybe = await fetchIgBusinessAccountId(
        p.id,
        p.access_token || userToken
      );
      if (maybe) {
        igId = maybe;
        usedPageId = p.id;
        break;
      }
    }

    if (!igId) {
      if (wantsJSON(c))
        return c.json(
          { ok: false, error: 'no_instagram_business_account' },
          400
        );
      return c.redirect(failUrl('no_instagram_business_account'), 302);
    }

    // 4) Erfolg → Deep Link / JSON
    const sUrl = successUrl({
      page_id: usedPageId || '',
      ig_user_id: igId,
    });

    if (wantsJSON(c))
      return c.json({ ok: true, page_id: usedPageId, ig_user_id: igId });

    return c.html(
      `<!doctype html>
<meta http-equiv="refresh" content="0;url=${sUrl}">
<title>Weiterleitung…</title>
<p>Weiterleitung… Falls nichts passiert, <a href="${sUrl}">hier klicken</a>.</p>`,
      302,
      { Location: sUrl }
    );
  } catch (err) {
    console.error('IG OAuth exchange error:', err);
    if (wantsJSON(c))
      return c.json({ ok: false, error: 'exchange_failed' }, 400);
    return c.redirect(failUrl('exchange_failed'), 302);
  }
}
