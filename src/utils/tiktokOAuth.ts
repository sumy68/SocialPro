// src/utils/tiktokOAuth.ts
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

// schließt ggf. offene Safari-Sessions korrekt
WebBrowser.maybeCompleteAuthSession();

const APP_URL =
  process.env.EXPO_PUBLIC_APP_URL ?? "https://socialpro-fnvo.onrender.com";

const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME ?? "socialpro";
const APP_SUCCESS_PATH =
  process.env.EXPO_PUBLIC_OAUTH_REDIRECT_PATH ?? "connected/success";

// 👉 Deep-Link wie: socialpro://connected/success
export function getRedirectUri() {
  const uri = AuthSession.makeRedirectUri({
    scheme: APP_SCHEME,
    path: APP_SUCCESS_PATH,
  });
  console.log("[TikTok] redirectUri (deep link) 👉", uri);
  return uri;
}

/**
 * Startet den TikTok OAuth Login:
 *   App → Backend (/api/oauth/tiktok/start)
 *   Backend → TikTok
 *   TikTok → Backend (/callback)
 *   Backend → Deep-Link socialpro://connected/success?provider=tiktok
 */
export async function startTikTokLogin() {
  const redirectUri = getRedirectUri();

  const startUrl = `${APP_URL.replace(/\/$/, "")}/api/oauth/tiktok/start`;

  console.log("[TikTok] startUrl 👉", startUrl);

  // TikTok Login → Safari → Backend → Deep-Link zurück zur App
  return WebBrowser.openAuthSessionAsync(startUrl, redirectUri);
}
