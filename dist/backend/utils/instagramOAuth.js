"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IG_REDIRECT_URI = void 0;
exports.getAuthUrl = getAuthUrl;
exports.exchangeCodeForToken = exchangeCodeForToken;
exports.fetchPages = fetchPages;
exports.fetchIgBusinessAccountId = fetchIgBusinessAccountId;
function requireEnv(name) {
    const v = process.env[name];
    if (!v)
        throw new Error('[ENV] Missing ' + name);
    return v;
}
const IG_CLIENT_ID = requireEnv('IG_CLIENT_ID'); // Meta App ID
const IG_CLIENT_SECRET = requireEnv('IG_CLIENT_SECRET'); // Meta App Secret
const APP_URL = requireEnv('APP_URL'); // https://socialpro-fnvo.onrender.com
exports.IG_REDIRECT_URI = APP_URL + '/api/oauth/instagram/callback';
const FB_DIALOG_OAUTH = 'https://www.facebook.com/v20.0/dialog/oauth';
const GRAPH = 'https://graph.facebook.com/v20.0';
const GRAPH_TOKEN_URL = GRAPH + '/oauth/access_token';
// minimale Scopes für IG Graph
const OAUTH_SCOPES = 'pages_show_list,instagram_basic';
function getAuthUrl() {
    const params = new URLSearchParams({
        client_id: IG_CLIENT_ID,
        redirect_uri: exports.IG_REDIRECT_URI,
        response_type: 'code',
        scope: OAUTH_SCOPES,
        state: 'sp_ig',
    });
    return FB_DIALOG_OAUTH + '?' + params.toString();
}
async function exchangeCodeForToken(code) {
    const params = new URLSearchParams({
        client_id: IG_CLIENT_ID,
        client_secret: IG_CLIENT_SECRET,
        redirect_uri: exports.IG_REDIRECT_URI,
        code,
    });
    const res = await fetch(GRAPH_TOKEN_URL + '?' + params.toString(), { method: 'GET' });
    if (!res.ok) {
        const msg = 'FB token exchange failed: ' + res.status + ' ' + res.statusText;
        throw new Error(msg);
    }
    return res.json(); // { access_token, token_type, expires_in }
}
/** Listet FB Pages des Users */
async function fetchPages(userToken) {
    const url = GRAPH + '/me/accounts?fields=id,name,access_token&access_token=' + encodeURIComponent(userToken);
    const res = await fetch(url);
    if (!res.ok)
        throw new Error('Fetch pages failed: ' + res.status + ' ' + res.statusText);
    const data = await res.json();
    return data.data || [];
}
/** Holt IG Business Account ID zu einer FB Page */
async function fetchIgBusinessAccountId(pageId, userOrPageToken) {
    const url = GRAPH + '/' + pageId + '?fields=instagram_business_account&access_token=' + encodeURIComponent(userOrPageToken);
    const res = await fetch(url);
    if (!res.ok)
        throw new Error('Fetch IG business account failed: ' + res.status + ' ' + res.statusText);
    const data = await res.json();
    return data?.instagram_business_account?.id || null;
}
