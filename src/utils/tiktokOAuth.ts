// src/utils/tiktokOAuth.ts
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const APP_URL =
  process.env.EXPO_PUBLIC_APP_URL ?? "https://socialpro-fnvo.onrender.com";

const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME ?? "socialpro";
const APP_SUCCESS_PATH =
  process.env.EXPO_PUBLIC_OAUTH_REDIRECT_PATH ?? "connected/success";

export function getRedirectUri() {
  const uri = AuthSession.makeRedirectUri({
    scheme: APP_SCHEME,
    path: APP_SUCCESS_PATH,
  });
  console.log("[TikTok] redirectUri (deep link) 👉", uri);
  return uri;
}

export async function startTikTokLogin() {
  const redirectUri = getRedirectUri();
  const startUrl = `${APP_URL.replace(/\/$/, "")}/api/oauth/tiktok/start`;

  console.log("[TikTok] startUrl 👉", startUrl);

  return WebBrowser.openAuthSessionAsync(startUrl, redirectUri, {
    preferEphemeralSession: true, // ←🔥 TikTok Login FINALLY not saved
  });
}
