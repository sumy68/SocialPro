function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error('[ENV] Missing ' + name);
  return v;
}

const IG_CLIENT_ID = requireEnv('IG_CLIENT_ID');       // deine Meta App-ID
const IG_CLIENT_SECRET = requireEnv('IG_CLIENT_SECRET'); // dein App-Secret
const APP_URL = requireEnv('APP_URL');                 // https://socialpro-fnvo.onrender.com

// Redirect URI MUSS exakt im Meta Dashboard eingetragen sein
export const IG_REDIRECT_URI = APP_URL + '/api/oauth/instagram/callback';

// Facebook Login Dialog (Graph OAuth)
const FB_DIALOG_OAUTH = 'https://www.facebook.com/v20.0/dialog/oauth';
const GRAPH_TOKEN_URL = 'https://graph.facebook.com/v20.0/oauth/access_token';

// Scopes für IG Graph – minimal start:
// - pages_show_list: FB Pages auflisten, um zu IG Business zu kommen
// - instagram_basic: Basis-Infos des IG Business Accounts
const OAUTH_SCOPES = 'pages_show_list,instagram_basic';

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: IG_CLIENT_ID,
    redirect_uri: IG_REDIRECT_URI,
    response_type: 'code',
    scope: OAUTH_SCOPES,
    state: 'xyz',
  });
  return FB_DIALOG_OAUTH + '?' + params.toString();
}

// Tauscht ?code gegen USER ACCESS TOKEN (Graph)
export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; token_type: string; expires_in: number; }> {
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
  return res.json();
}
