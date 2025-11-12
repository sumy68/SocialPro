// src/utils/linkedinOAuth.ts
import * as AuthSession from 'expo-auth-session';

const APP_URL = 'https://socialpro-fnvo.onrender.com'; // PROD
const START_URL = `${APP_URL}/api/oauth/linkedin/start`;

export async function startLinkedInLogin() {
  // Deep Link, muss deinem scheme entsprechen (EXPO_PUBLIC_SCHEME=socialpro)
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'socialpro' });

  // 1) Browser öffnen → LinkedIn Login → Redirect zu socialpro://linkedin/success?code=...
  const res = await AuthSession.startAsync(START_URL, redirectUri);

  if (res.type !== 'success' || !res.url) {
    throw new Error('Login abgebrochen');
  }

  // 2) Code aus Deep Link ziehen
  const url = new URL(res.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error) throw new Error(`LinkedIn error: ${error}`);
  if (!code) throw new Error('Kein Code erhalten');

  // 3) Code gegen Token/Profilexchange
  const ex = await fetch(`${APP_URL}/api/oauth/linkedin/callback/exchange?code=${encodeURIComponent(code)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const data = await ex.json();
  if (!ex.ok || !data?.ok) throw new Error(`Exchange failed: ${data?.error || ex.status}`);

  // data: { ok:true, me, email }
  return data;
}
