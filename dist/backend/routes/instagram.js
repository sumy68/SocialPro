// src/backend/routes/instagram.ts
import { Hono } from 'hono';
import { getAuthUrl, exchangeCodeForToken, fetchPages, fetchIgBusinessAccountId, } from '../utils/instagramOAuth.js';
const APP_SCHEME_SUCCESS = 'socialpro://connected/success';
const APP_SCHEME_FAIL = 'socialpro://connected/fail';
const OAUTH_STATE = 'sp_ig'; // muss mit getAuthUrl() matchen
export const instagramRouter = new Hono();
// Live-Check
instagramRouter.get('/_ping', (c) => c.json({ ok: true }));
// /api/oauth/instagram/start → Facebook/Meta Login
instagramRouter.get('/start', (c) => {
    try {
        const url = getAuthUrl(); // redirect_uri = APP_URL/api/oauth/instagram/callback + state=sp_ig
        return c.redirect(url, 302);
    }
    catch (e) {
        console.error('IG /start err:', e);
        return c.redirect(`${APP_SCHEME_FAIL}?provider=instagram&platform=instagram&error=start_failed`, 302);
    }
});
// Meta callback (in der Meta-App hinterlegt)
instagramRouter.get('/callback', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    if (state && state !== OAUTH_STATE) {
        return c.redirect(`${APP_SCHEME_FAIL}?provider=instagram&platform=instagram&error=bad_state`, 302);
    }
    if (!code) {
        return c.redirect(`${APP_SCHEME_FAIL}?provider=instagram&platform=instagram&error=missing_code`, 302);
    }
    return instagramExchange(c, code);
});
// Direkter Exchange-Endpoint (optional)
instagramRouter.get('/callback/exchange', async (c) => {
    const code = c.req.query('code');
    if (!code) {
        return c.redirect(`${APP_SCHEME_FAIL}?provider=instagram&platform=instagram&error=missing_code`, 302);
    }
    return instagramExchange(c, code);
});
async function instagramExchange(c, code) {
    try {
        // 1) code → user token
        const token = await exchangeCodeForToken(code);
        const userToken = token.access_token;
        // 2) Facebook Pages holen
        const pages = await fetchPages(userToken);
        if (!pages.length) {
            return c.redirect(`${APP_SCHEME_FAIL}?provider=instagram&platform=instagram&error=no_pages`, 302);
        }
        // 3) IG Business Account finden
        let igId = null;
        let usedPageId = null;
        for (const p of pages) {
            const maybe = await fetchIgBusinessAccountId(p.id, p.access_token || userToken);
            if (maybe) {
                igId = maybe;
                usedPageId = p.id;
                break;
            }
        }
        if (!igId) {
            return c.redirect(`${APP_SCHEME_FAIL}?provider=instagram&platform=instagram&error=no_instagram_business_account`, 302);
        }
        // 4) Erfolg → Deep Link zurück in die App ODER JSON
        const successUrl = `${APP_SCHEME_SUCCESS}?provider=instagram&platform=instagram&status=ok` +
            `&page_id=${encodeURIComponent(usedPageId || '')}` +
            `&ig_user_id=${encodeURIComponent(igId)}`;
        const wantsJSON = (c.req.header('accept') || '').includes('application/json');
        if (wantsJSON) {
            return c.json({ ok: true, page_id: usedPageId, ig_user_id: igId });
        }
        return c.redirect(successUrl, 302);
    }
    catch (err) {
        console.error('IG OAuth exchange error:', err);
        const wantsJSON = (c.req.header('accept') || '').includes('application/json');
        if (wantsJSON)
            return c.json({ ok: false, error: 'exchange_failed' }, 400);
        return c.redirect(`${APP_SCHEME_FAIL}?provider=instagram&platform=instagram&error=exchange_failed`, 302);
    }
}
