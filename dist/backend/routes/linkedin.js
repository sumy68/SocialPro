// src/backend/routes/linkedin.ts
// ESM + Hono v4 (Node 20) — copy/paste ready
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
const SCOPES = ['openid', 'profile', 'email'].join(' ');
linkedinRouter.get('/ping', (c) => c.text('li pong'));
// --- START ---
linkedinRouter.get('/start', (c) => {
    const missing = ensureEnv();
    if (missing.length)
        return c.text(`[ENV] Missing: ${missing.join(', ')}`, 500);
    const { CLIENT_ID, REDIRECT_URI } = getCfg();
    const state = randomBytes(16).toString('hex');
    setCookie(c, 'li_state', state, {
        httpOnly: true,
        sameSite: 'Lax',
        path: '/',
    });
    const url = `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=code` +
        `&client_id=${encodeURIComponent(CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&state=${encodeURIComponent(state)}`;
    return c.redirect(url, 302);
});
// --- CALLBACK ---
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
    const deepSuccess = `socialpro://linkedin/success${code ? `?code=${encodeURIComponent(code)}` : ''}`;
    const deepFail = `socialpro://linkedin/fail${error ? `?error=${encodeURIComponent(error)}` : ''}`;
    const ua = (c.req.header('user-agent') || '').toLowerCase();
    const isApp = /iphone|ipad|android|wv|crios|fxios/.test(ua);
    if (isApp)
        return c.redirect(error ? deepFail : deepSuccess, 302);
    const web = error
        ? `${APP_URL}/connected/linkedin-fail${error ? `?error=${encodeURIComponent(error)}` : ''}`
        : `${APP_URL}/connected/linkedin-success${code ? `?code=${encodeURIComponent(code)}` : ''}`;
    return c.redirect(web, 303);
});
// --- EXCHANGE ---
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
        const tokenTxt = await tokenResp.text();
        if (!tokenResp.ok) {
            console.error('LI token exchange failed:', tokenResp.status, tokenTxt);
            return c.json({ ok: false, error: 'exchange_failed' }, 400);
        }
        const token = JSON.parse(tokenTxt);
        const accessToken = token.access_token;
        const meResp = await fetch('https://api.linkedin.com/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const me = await meResp.json();
        const emailResp = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', { headers: { Authorization: `Bearer ${accessToken}` } });
        const emailJson = await emailResp.json();
        const email = emailJson?.elements?.[0]?.['handle~']?.emailAddress ?? null;
        const wantsJSON = (c.req.header('accept') || '').includes('application/json');
        const payload = { ok: true, me, email };
        if (wantsJSON)
            return c.json(payload);
        const deep = `socialpro://linkedin/success${email ? `?li_email=${encodeURIComponent(email)}` : ''}`;
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
