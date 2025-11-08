// src/utils/instagramOAuth.ts
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

// Schließt ggf. offene Auth-Sessions automatisch (iOS Safari View Controller)
WebBrowser.maybeCompleteAuthSession();

const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? "https://socialpro-fnvo.onrender.com";
const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME ?? "socialpro"; // <— wichtig: muss zu deiner app.json/expo-config passen
const APP_SUCCESS_PATH = process.env.EXPO_PUBLIC_OAUTH_REDIRECT_PATH ?? "connected/success"; // du nutzt "connected/success"

export function getRedirectUri() {
  const uri = AuthSession.makeRedirectUri({
    scheme: APP_SCHEME,
    path: APP_SUCCESS_PATH,
  });
  console.log("redirectUri 👉", uri);
  return uri;
}

export async function startInstagramLogin() {
  const redirectUri = getRedirectUri();

  // Achtung: Backend erwartet aktuell "redirect_uri" — lassen wir so,
  // aber am Backend sicherstellen, dass es diese URI NUR als finalen Return benutzt,
  // die Instagram-redirect_uri bleibt die Backend-/callback-Route.
  const startUrl =
    `${APP_URL}/api/oauth/instagram/start?` +
    `redirect_uri=${encodeURIComponent(redirectUri)}`;

  // Öffnet SFSafariViewController und schließt, sobald auf redirectUri zurückgekehrt wird
  return WebBrowser.openAuthSessionAsync(startUrl, redirectUri);
}
