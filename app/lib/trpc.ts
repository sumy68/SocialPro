import Constants from 'expo-constants';

const FALLBACK_URL = 'https://socialpro-fnvo.onrender.com';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_APP_URL
  ?? Constants?.expoConfig?.extra?.APP_URL
  ?? FALLBACK_URL;

/** Einheitlich die Backend-Base holen (Render) */
export function getBaseUrl() {
  return API_BASE_URL.replace(/\/+$/, ''); // trailing slash weg
}

/** Optional: kleine Helper zum Pingen/Health */
export async function ping(path: string = '/health') {
  const res = await fetch(getBaseUrl() + path);
  return { ok: res.ok, status: res.status, text: await res.text() };
}
