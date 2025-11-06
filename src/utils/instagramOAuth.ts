// src/utils/instagramOAuth.ts
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

/**
 * Startet den Instagram OAuth Flow über dein Backend
 * und leitet nach erfolgreichem Login zurück auf:
 *   socialpro://connected/success
 */
export default async function startInstagramOAuth(state: string = 'test-user-123') {
  const { EXPO_PUBLIC_APP_URL, EXPO_PUBLIC_SCHEME } = Constants.expoConfig?.extra ?? {};

  const APP_URL = String(EXPO_PUBLIC_APP_URL || '');
  const SCHEME = String(EXPO_PUBLIC_SCHEME || 'socialpro');

  if (!APP_URL) {
    throw new Error('❌ EXPO_PUBLIC_APP_URL fehlt. Bitte in app.config.js setzen!');
  }

  // Deep-Link zurück in die App (z. B. socialpro://connected/success)
  const returnUrl = AuthSession.makeRedirectUri({
    scheme: SCHEME,
    path: 'connected/success',
  });

  // Richtiger Backend-Endpunkt
  const startUrl = `${APP_URL}/api/oauth/instagram/start?redirect_uri=${encodeURIComponent(
    returnUrl
  )}&state=${encodeURIComponent(state)}`;

  console.log('[Instagram OAuth] startUrl →', startUrl);
  console.log('[Instagram OAuth] returnUrl →', returnUrl);

  // Öffnet den Login in Safari / WebView
  return WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
}
