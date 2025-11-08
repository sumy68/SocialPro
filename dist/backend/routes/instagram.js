"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instagramRouter = void 0;
// src/backend/routes/instagram.ts
const hono_1 = require("hono");
const instagramOAuth_1 = require("../utils/instagramOAuth");
const APP_SCHEME_SUCCESS = 'socialpro://connected/success';
const APP_SCHEME_FAIL = 'socialpro://connected/fail';
const OAUTH_STATE = 'sp_ig'; // muss mit getAuthUrl() matchen
exports.instagramRouter = new hono_1.Hono();
// Quick ping zum Live-Check
exports.instagramRouter.get('/_ping', (c) => c.json({ ok: true }));
// /api/oauth/instagram/start → Facebook Login
exports.instagramRouter.get('/start', (c) => {
    try {
        const url = (0, instagramOAuth_1.getAuthUrl)(); // redirect_uri = APP_URL/api/oauth/instagram/callback + state=sp_ig
        return c.redirect(url, 302);
    }
    catch (e) {
        console.error('IG /start err:', e);
        return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=start_failed`, 302);
    }
});
// Meta callback (die URL, die du in der Meta-App hinterlegst)
exports.instagramRouter.get('/callback', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    if (state && state !== OAUTH_STATE) {
        return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=bad_state`, 302);
    }
    if (!code) {
        return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=missing_code`, 302);
    }
    return instagramExchange(c, code);
});
// Reiner Exchange-Endpoint (optional direkt aufrufbar)
exports.instagramRouter.get('/callback/exchange', async (c) => {
    const code = c.req.query('code');
    if (!code) {
        return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=missing_code`, 302);
    }
    return instagramExchange(c, code);
});
async function instagramExchange(c, code) {
    try {
        // 1) code → user token
        const token = await (0, instagramOAuth_1.exchangeCodeForToken)(code);
        const userToken = token.access_token;
        // 2) Seiten holen
        const pages = await (0, instagramOAuth_1.fetchPages)(userToken);
        if (!pages.length) {
            return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=no_pages`, 302);
        }
        // 3) IG Business Account finden
        let igId = null;
        let usedPageId = null;
        for (const p of pages) {
            const maybe = await (0, instagramOAuth_1.fetchIgBusinessAccountId)(p.id, p.access_token || userToken);
            if (maybe) {
                igId = maybe;
                usedPageId = p.id;
                break;
            }
        }
        if (!igId) {
            return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=no_instagram_business_account`, 302);
        }
        // 4) Erfolg → Deep Link zurück in die App ODER JSON
        const successUrl = `${APP_SCHEME_SUCCESS}?platform=instagram&status=ok` +
            `&page_id=${encodeURIComponent(usedPageId || '')}` +
            `&ig_user_id=${encodeURIComponent(igId)}`;
        const wantsJSON = (c.req.header('accept') || '').includes('application/json');
        if (wantsJSON) {
            return c.json({ ok: true, page_id: usedPageId, ig_user_id: igId });
        }
        return c.redirect(successUrl, 302);
    }
    catch (err) {
        console.error('OAuth error:', err);
        const wantsJSON = (c.req.header('accept') || '').includes('application/json');
        if (wantsJSON)
            return c.json({ ok: false, error: 'exchange_failed' }, 400);
        return c.redirect(`${APP_SCHEME_FAIL}?platform=instagram&error=exchange_failed`, 302);
    }
}
