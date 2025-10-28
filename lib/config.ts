// lib/config.ts
const rawBase =
  process.env.EXPO_PUBLIC_APP_URL?.trim() ||
  "https://socialpro-fnvo.onrender.com";

// entfernt alle Slashes am Ende (z. B. https://domain.com//// → https://domain.com)
export const API_BASE = rawBase.replace(/\/+$/, "");
console.log("[CONFIG] Normalized API_BASE:", API_BASE);

export const HEALTH_PATH = "/healthz";
export const HEALTH_URL = `${API_BASE}${HEALTH_PATH}`;
