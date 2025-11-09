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

// --- utils ---------------------------------------------------------------
const wantsJSON = (c: Context) =>
  (c.req.header('accept') || '').includes('application/json');

const failUrl = (error: string) => {
  const u = new URL(APP_SCHEME_FAIL);
  u.searchParams.set('provider', 'instagram');
  u.searchParams.set('platform', 'instagram');
  u.searchParams.set('error', error);
  return u.toString();
};

const successUrl = (params: { page_id: string; ig_user_id: string }) => {
  const u = new URL(APP_SCHEME_SUCCESS);
  u.searchParams.set('provider', 'instagram');
  u.searchParams.set('platform', 'instagram');
  u.searchParams.set('status', 'ok');
  u.searchParams.set('page_id', params.page_id || '');
  u.searchParams.set('ig_user_id', params.ig_user_id);
  return u.toString();
};

// --- health / ping -------------------------------------------------------
instagramRouter.get('/_ping', (c: Context) => c.json({ ok: true }));
instagramRouter.get('/ping', (c: Context) => c.text('ig pong'));

// --- start ---------------------------------------------------------------
instagramRouter.get('/start', (c: Context) => {
  try {
    const url = getAuthUrl(); // redirect_uri: APP_URL/api/oauth/instagram/callback & state=sp_ig
    return c.redirect(url, 302);
  } catch (e) {
    console.error('IG /start err:', e);
    return c.redirect(failUrl('start_failed'), 302);
  }
});

// --- callback + exchange -------------------------------------------------
instagramRouter.get('/callback', async (c: Context) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  if (state && state !== OAUTH_STATE) return c.redirect(failUrl('bad_state'), 302);
  if (!code) return c.redirect(failUrl('missing_code'), 302);

  return instagramExchange(c, code);
});

instagramRouter.get('/callback/exchange', async (c: Context) => {
  const code = c.req.query('code');
  if (!code) return c.redirect(failUrl('missing_code'), 302);
  return instagramExchange(c, code);
});

// --- core flow -----------------------------------------------------------
async function instagramExchange(c: Context, code: string) {
  try {
    // 1) code → user token
    const token = await exchangeCodeForToken(code);
    const userToken = (token as any).access_token as string;
    if (!userToken) throw new Error('no_access_token');

    // 2) Facebook Pages
    const pages: Array<{ id: string; access_token?: string }> = await fetchPages(userToken);
    if (!pages?.length) {
      if (wantsJSON(c)) return c.json({ ok: false, error: 'no_pages' }, 400);
      return c.redirect(failUrl('no_pages'), 302);
    }

    // 3) IG Business Account
    let igId: string | null = null;
    let usedPageId: string | null = null;
    for (const p of pages) {
      const maybe = await fetchIgBusinessAccountId(p.id, p.access_token || userToken);
      if (maybe) {
        igId = maybe;
        usedPageId = p.id;
        break;
      }
    }
    if (!igId) {
      if (wantsJSON(c)) return c.json({ ok: false, error: 'no_instagram_business_account' }, 400);
      return c.redirect(failUrl('no_instagram_business_account'), 302);
    }

    // 4) Erfolg → Deep Link oder JSON
    const sUrl = successUrl({ page_id: usedPageId || '', ig_user_id: igId });
    if (wantsJSON(c)) return c.json({ ok: true, page_id: usedPageId, ig_user_id: igId });

    return c.html(
      `<!doctype html>
<meta http-equiv="refresh" content="0;url=${sUrl}">
<title>Weiter zur App…</title>
<p>Weiterleitung… Falls nichts passiert, <a href="${sUrl}">hier tippen</a>.</p>`,
      302,
      { Location: sUrl }
    );
  } catch (err) {
    console.error('IG OAuth exchange error:', err);
    if (wantsJSON(c)) return c.json({ ok: false, error: 'exchange_failed' }, 400);
    return c.redirect(failUrl('exchange_failed'), 302);
  }
}
