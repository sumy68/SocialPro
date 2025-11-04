// src/utils/instagramOAuth.ts
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

/**
 * Startet den Instagram OAuth Flow über dein Backend
 * Backend leitet am Ende direkt auf dein Deep Link Schema zurück:
 *   socialpro://connected/success
 */
export default async function startInstagramOAuth(state: string = 'test-user-123') {
  const { EXPO_PUBLIC_APP_URL, EXPO_PUBLIC_SCHEME } = Constants.expoConfig?.extra ?? {};

  const APP_URL = String(EXPO_PUBLIC_APP_URL || '');
  const SCHEME = String(EXPO_PUBLIC_SCHEME || 'socialpro');

  if (!APP_URL) {
    throw new Error('EXPO_PUBLIC_APP_URL fehlt. In app.config.js setzen!');
  }

  // Deep link zurück in die App
  const returnUrl = AuthSession.makeRedirectUri({
    scheme: SCHEME,
    path: 'connected/success'
  });

  // Dein Backend übernimmt alles, nur state mitgeben
  const startUrl = `${APP_URL}/auth/instagram/start?state=${encodeURIComponent(state)}`;

  return WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
}
