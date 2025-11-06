// src/utils/instagramOAuth.ts
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

const APP_URL =
  process.env.EXPO_PUBLIC_APP_URL || "https://socialpro-fnvo.onrender.com";

export function getRedirectUri() {
  const uri = AuthSession.makeRedirectUri({
    scheme: "socialpro",
    path: "connected/success",
  });
  console.log("redirectUri 👉", uri);
  return uri;
}

export async function startInstagramLogin() {
  const redirectUri = getRedirectUri();
  const startUrl = `${APP_URL}/api/oauth/instagram/start?redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;
  // Öffnet Safari und wartet auf Rückkehr zu redirectUri
  return WebBrowser.openAuthSessionAsync(startUrl, redirectUri);
}
