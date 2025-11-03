// app/utils/instagramOAuth.ts
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

/**
 * Startet den Instagram OAuth Flow über dein Backend
 * und leitet nach dem Login zurück auf: app/connected/success.tsx
 */
export default async function startInstagramOAuth(state: string = 'test-user-123') {
  const { EXPO_PUBLIC_APP_URL, EXPO_PUBLIC_SCHEME } = Constants.expoConfig?.extra ?? {};
  const APP_URL = (EXPO_PUBLIC_APP_URL as string) || '';
  const SCHEME = (EXPO_PUBLIC_SCHEME as string) || 'socialpro';

  if (!APP_URL) {
    throw new Error('EXPO_PUBLIC_APP_URL ist nicht gesetzt. Bitte in app.config.js hinterlegen.');
  }

  const returnUrl = AuthSession.makeRedirectUri({
    scheme: SCHEME,             // z. B. 'socialpro'
    path: 'connected/success',  // entspricht app/connected/success.tsx
    preferLocalhost: true,
  });

  const startUrl =
    `${APP_URL}/auth/instagram/start` +
    `?return_to=${encodeURIComponent(returnUrl)}` +
    `&state=${encodeURIComponent(state)}`;

  return WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
}
