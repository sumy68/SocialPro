// app/utils/instagramOAuth.ts
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

/**
 * Startet den Instagram OAuth Flow über dein Backend
 * und leitet nach dem Login zurück auf: app/connected/success.tsx
 */
export default async function startInstagramOAuth(state: string = "test-user-123") {
  const { EXPO_PUBLIC_APP_URL } = Constants.expoConfig?.extra ?? {};
  const APP_URL = (EXPO_PUBLIC_APP_URL as string) || "";

  if (!APP_URL) {
    throw new Error("EXPO_PUBLIC_APP_URL ist nicht gesetzt. Bitte in app.config.js hinterlegen.");
  }

  // ✅ funktioniert in Expo Go und echten Builds
  const returnUrl = AuthSession.makeRedirectUri({
    path: "connected/success", // kein Slash am Anfang!
    preferLocalhost: true,
  });

  // ✅ richtiger Backend-Endpoint
  const startUrl =
    `${APP_URL}/api/oauth/instagram/start` +
    `?return_to=${encodeURIComponent(returnUrl)}` +
    `&state=${encodeURIComponent(state)}`;

  console.log("[IG OAuth] startUrl =", startUrl);
  console.log("[IG OAuth] returnUrl =", returnUrl);

  return WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
}
