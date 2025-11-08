"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiktokRouter = void 0;
const hono_1 = require("hono");
const cookie_1 = require("hono/cookie");
const crypto_1 = require("crypto");
const node_fetch_1 = __importDefault(require("node-fetch"));
exports.tiktokRouter = new hono_1.Hono();
// ⚙️ ENV
const APP_URL = process.env.APP_URL || 'https://socialpro-fnvo.onrender.com';
const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY; // = client_id
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = `${APP_URL}/api/oauth/tiktok/callback`;
// ✅ Scopes je nach Bedarf (Basics + Upload)
const SCOPES = ['user.info.basic', 'video.upload'].join(',');
// 🔐 OAuth URLs (Login Kit)
const AUTHORIZE_URL = 'https://www.tiktok.com/auth/authorize/';
const TOKEN_URL = 'https://www.tiktok.com/auth/token/';
// Start
exports.tiktokRouter.get('/start', (c) => {
    const state = (0, crypto_1.randomBytes)(16).toString('hex');
    (0, cookie_1.setCookie)(c, 'tt_state', state, { httpOnly: true, sameSite: 'Lax', path: '/' });
    const u = new URL(AUTHORIZE_URL);
    u.searchParams.set('client_key', CLIENT_KEY);
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('scope', SCOPES);
    u.searchParams.set('redirect_uri', REDIRECT_URI);
    u.searchParams.set('state', state);
    return c.redirect(u.toString());
});
// Callback
exports.tiktokRouter.get('/callback', async (c) => {
    const url = new URL(c.req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const saved = (0, cookie_1.getCookie)(c, 'tt_state');
    if (!code || !state || state !== saved)
        return c.text('Invalid state', 400);
    const res = await (0, node_fetch_1.default)(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_key: CLIENT_KEY,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
        }).toString(), // 👈 FIX: .toString()
    });
    const data = await res.json();
    if (!data.access_token && !data.data?.access_token)
        return c.json(data, 400);
    const access = data.access_token ?? data.data.access_token;
    const refresh = data.refresh_token ?? data.data?.refresh_token;
    (0, cookie_1.setCookie)(c, 'tt_access', access, { httpOnly: true, sameSite: 'Lax', path: '/' });
    if (refresh)
        (0, cookie_1.setCookie)(c, 'tt_refresh', refresh, { httpOnly: true, sameSite: 'Lax', path: '/' });
    return c.redirect('socialpro://connected/success?provider=tiktok');
});
// Refresh
exports.tiktokRouter.get('/refresh', async (c) => {
    const rt = (0, cookie_1.getCookie)(c, 'tt_refresh');
    if (!rt)
        return c.text('no refresh token', 400);
    const res = await (0, node_fetch_1.default)(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_key: CLIENT_KEY,
            client_secret: CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: rt,
        }).toString(), // 👈 FIX: .toString()
    });
    const data = await res.json();
    const access = data.access_token ?? data.data?.access_token;
    if (!access)
        return c.json(data, 400);
    (0, cookie_1.setCookie)(c, 'tt_access', access, { httpOnly: true, sameSite: 'Lax', path: '/' });
    return c.json({ ok: true });
});
