// src/backend/routes/linkedin.ts
import { Hono } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import { randomBytes } from 'node:crypto';
export const linkedinRouter = new Hono();
function getCfg() {
    const APP_URL = process.env.APP_URL || 'https://socialpro-fnvo.onrender.com';
    const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
    const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
    const REDIRECT_URI = process.env.LI_REDIRECT_URI || `${APP_URL}/api/oauth/linkedin/callback`;
    return { APP_URL, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI };
}
function ensureEnv() {
    const { APP_URL, CLIENT_ID, CLIENT_SECRET } = getCfg();
    const missing = [];
    if (!CLIENT_ID)
        missing.push('LINKEDIN_CLIENT_ID');
    if (!CLIENT_SECRET)
        missing.push('LINKEDIN_CLIENT_SECRET');
    if (!APP_URL)
        missing.push('APP_URL');
    return missing;
}
// ✅ OpenID Scopes (kein r_liteprofile/r_emailaddress)
const SCOPES = ['openid', 'profile', 'email'].join(' ');
linkedinRouter.get('/ping', (c) => c.text('li pong'));
// --- START ---
linkedinRouter.get('/start', (c) => {
    const missing = ensureEnv();
    if (missing.length)
        return c.text(`[ENV] Missing: ${missing.join(', ')}`, 500);
    const { CLIENT_ID, REDIRECT_URI } = getCfg();
    const state = randomBytes(16).toString('hex');
    setCookie(c, 'li_state', state, { httpOnly: true, sameSite: 'Lax', path: '/' });
    const url = `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=code` +
        `&client_id=${encodeURIComponent(CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&state=${encodeURIComponent(state)}`;
    return c.redirect(url, 302);
});
// --- CALLBACK ---
// 🔁 Statt auf /connected/... zu gehen, direkt auf /callback/exchange mit ?code=...
linkedinRouter.get('/callback', (c) => {
    const { APP_URL } = getCfg();
    const u = new URL(c.req.url);
    const code = u.searchParams.get('code') ?? '';
    const error = u.searchParams.get('error') ?? '';
    const state = u.searchParams.get('state') ?? '';
    const saved = getCookie(c, 'li_state') || '';
    if (state && saved && state !== saved) {
        console.warn('[LI CALLBACK] state mismatch', { state, saved });
    }
    if (error) {
        return c.redirect(`${APP_URL}/connected/linkedin-fail?error=${encodeURIComponent(error)}`, 302);
    }
    if (code) {
        return c.redirect(`${APP_URL}/api/oauth/linkedin/callback/exchange?code=${encodeURIComponent(code)}`, 302);
    }
    return c.text('Missing code', 400);
});
// --- EXCHANGE ---
// ✅ nutzt OIDC userinfo (liefert name, email, picture, sub)
linkedinRouter.get('/callback/exchange', async (c) => {
    const missing = ensureEnv();
    if (missing.length)
        return c.json({ ok: false, error: `missing_env:${missing.join(',')}` }, 500);
    const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = getCfg();
    const code = c.req.query('code');
    if (!code)
        return c.json({ ok: false, error: 'missing_code' }, 400);
    try {
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        });
        const tokenResp = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });
        const token = await tokenResp.json();
        const accessToken = token?.access_token;
        if (!accessToken) {
            console.error('No access_token:', token);
            return c.json({ ok: false, error: 'no_access_token' }, 400);
        }
        const userinfo = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        }).then(r => r.json());
        const wantsJSON = (c.req.header('accept') || '').includes('application/json');
        if (wantsJSON)
            return c.json({ ok: true, me: userinfo, email: userinfo.email });
        const deep = `socialpro://linkedin/success${userinfo.email ? `?li_email=${encodeURIComponent(userinfo.email)}` : ''}`;
        return c.redirect(deep, 302);
    }
    catch (e) {
        console.error('LI exchange error:', e);
        const wantsJSON = (c.req.header('accept') || '').includes('application/json');
        if (wantsJSON)
            return c.json({ ok: false, error: 'exchange_failed' }, 400);
        return c.redirect('socialpro://linkedin/fail?error=exchange_failed', 302);
    }
});
