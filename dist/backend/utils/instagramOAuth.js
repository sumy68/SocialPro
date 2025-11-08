function requireEnv(name) {
    const v = process.env[name];
    if (!v)
        throw new Error('[ENV] Missing ' + name);
    return v;
}
const IG_CLIENT_ID = requireEnv('IG_CLIENT_ID'); // Meta App ID
const IG_CLIENT_SECRET = requireEnv('IG_CLIENT_SECRET'); // Meta App Secret
const APP_URL = requireEnv('APP_URL'); // https://socialpro-fnvo.onrender.com
export const IG_REDIRECT_URI = APP_URL + '/api/oauth/instagram/callback';
const FB_DIALOG_OAUTH = 'https://www.facebook.com/v20.0/dialog/oauth';
const GRAPH = 'https://graph.facebook.com/v20.0';
const GRAPH_TOKEN_URL = GRAPH + '/oauth/access_token';
// minimale Scopes für IG Graph
const OAUTH_SCOPES = 'pages_show_list,instagram_basic';
export function getAuthUrl() {
    const params = new URLSearchParams({
        client_id: IG_CLIENT_ID,
        redirect_uri: IG_REDIRECT_URI,
        response_type: 'code',
        scope: OAUTH_SCOPES,
        state: 'sp_ig',
    });
    return FB_DIALOG_OAUTH + '?' + params.toString();
}
export async function exchangeCodeForToken(code) {
    const params = new URLSearchParams({
        client_id: IG_CLIENT_ID,
        client_secret: IG_CLIENT_SECRET,
        redirect_uri: IG_REDIRECT_URI,
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
export async function fetchPages(userToken) {
    const url = GRAPH + '/me/accounts?fields=id,name,access_token&access_token=' + encodeURIComponent(userToken);
    const res = await fetch(url);
    if (!res.ok)
        throw new Error('Fetch pages failed: ' + res.status + ' ' + res.statusText);
    const data = await res.json();
    return data.data || [];
}
/** Holt IG Business Account ID zu einer FB Page */
export async function fetchIgBusinessAccountId(pageId, userOrPageToken) {
    const url = GRAPH + '/' + pageId + '?fields=instagram_business_account&access_token=' + encodeURIComponent(userOrPageToken);
    const res = await fetch(url);
    if (!res.ok)
        throw new Error('Fetch IG business account failed: ' + res.status + ' ' + res.statusText);
    const data = await res.json();
    return data?.instagram_business_account?.id || null;
}
