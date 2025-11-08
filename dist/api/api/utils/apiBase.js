// src/utils/apiBase.ts
export const apiBase = (process.env.EXPO_PUBLIC_APP_URL ?? '').replace(/\/+$/, '');
console.log('[API] Base:', apiBase);
