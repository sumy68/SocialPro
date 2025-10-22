import * as AuthSession from 'expo-auth-session';

/**
 * Baut die Redirect-URI für OAuth-Flows.
 * Diese muss genau mit der URI übereinstimmen,
 * die du in den Provider-Einstellungen (Instagram, LinkedIn, etc.)
 * und im Render-Backend konfiguriert hast.
 */
export function getRedirectUri(): string {
  const scheme = (process.env.EXPO_PUBLIC_SCHEME || 'myapp').trim();
  const path = (process.env.EXPO_PUBLIC_OAUTH_REDIRECT_PATH || '/auth/callback').trim();

 
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  const redirectUri = AuthSession.makeRedirectUri({
    scheme,
    path: normalizedPath,
  });

  console.log('[OAuth] Redirect URI generated:', redirectUri);

  return redirectUri;
}
