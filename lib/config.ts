// lib/config.ts
const rawBase =
  process.env.EXPO_PUBLIC_APP_URL?.trim() ||
  "https://socialpro-fnvo.onrender.com";

export const API_BASE = rawBase.replace(/\/+$/, ""); // trailing Slash weg
export const HEALTH_PATH = "/healthz";
export const HEALTH_URL = `${API_BASE}${HEALTH_PATH}`;
