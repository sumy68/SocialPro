// src/utils/tiktokOAuth.ts
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

// sorgt dafür, dass offene Safari-Auth-Sessions (iOS) korrekt geschlossen werden
WebBrowser.maybeCompleteAuthSession();

const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? "https://socialpro-fnvo.onrender.com";
const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME ?? "socialpro";
const APP_SUCCESS_PATH = process.env.EXPO_PUBLIC_OAUTH_REDIRECT_PATH ?? "connected/success";

// erzeugt den Deep-Link wie: socialpro://connected/success
export function getRedirectUri() {
  const uri = AuthSession.makeRedirectUri({
    scheme: APP_SCHEME,
    path: APP_SUCCESS_PATH,
  });
  console.log("[TikTok] redirectUri 👉", uri);
  return uri;
}

/**
 * Startet den TikTok OAuth Login über:
 *   Backend: /api/oauth/tiktok/start
 * dann TikTok → Backend → Deep-Link zurück zur App
 */
export async function startTikTokLogin() {
  const redirectUri = getRedirectUri();

  // Wir geben redirect_uri explizit ans Backend — genau wie bei Instagram
  const startUrl =
    `${APP_URL.replace(/\/$/, "")}/api/oauth/tiktok/start?` +
    `redirect_uri=${encodeURIComponent(redirectUri)}`;

  console.log("[TikTok] startUrl 👉", startUrl);

  // TikTok Login → Safari → Backend → redirectUri → App
  return WebBrowser.openAuthSessionAsync(startUrl, redirectUri);
}
