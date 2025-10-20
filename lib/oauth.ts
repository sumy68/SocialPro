import * as AuthSession from 'expo-auth-session';

export function getRedirectUri(): string {
  const scheme = (process.env.EXPO_PUBLIC_SCHEME || 'myapp').trim();
  const path = (process.env.EXPO_PUBLIC_OAUTH_REDIRECT_PATH || '/auth/callback').trim();
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const uri = AuthSession.makeRedirectUri({
    scheme,
    path: `/${normalizedPath}`,
  });
  return uri;
}
