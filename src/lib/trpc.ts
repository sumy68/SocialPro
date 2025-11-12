import Constants from "expo-constants";

export const isDemoMode: boolean =
  (process.env.EXPO_PUBLIC_DEMO_MODE ?? "").toLowerCase() === "true";

export function getBaseUrl() {
  const env =
    (Constants?.expoConfig as any)?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_APP_URL ||
    "https://socialpro-fnvo.onrender.com";
  return env.replace(/\/$/, "");
}

/**
 * Minimaler Vanilla-Client für die Plattform-Calls.
 * Erwartete Signaturen im Code:
 *   trpcVanillaClient.platforms.getToken.query({ platform })
 *   trpcVanillaClient.platforms.refreshToken.mutate({ platform })
 *
 * Backend-Endpunkte:
 *   GET  /api/oauth/:platform/status        -> { ok, connected, accountName?, accountId?, isExpired? }
 *   POST /api/oauth/:platform/refresh-token -> { ok, requiresReauth? }
 *
 * Falls dein Backend andere Pfade nutzt, passt du die URLs unten an.
 */
async function getJson(url: string, opts?: RequestInit) {
  const res = await fetch(url, { ...opts, headers: { "content-type": "application/json", ...(opts?.headers || {}) }});
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null }; }
  catch { return { ok: res.ok, status: res.status, data: null }; }
}

export const trpcVanillaClient = {
  platforms: {
    getToken: {
      async query(input: { platform: "instagram" | "linkedin" | "tiktok" }) {
        const base = getBaseUrl();
        // passe ggf. auf deinen echten Status-Endpunkt an
        const { ok, data } = await getJson(`${base}/api/oauth/${input.platform}/status`);
        if (!ok) return { ok: false };
        return { ok: true, ...data };
      },
    },
    refreshToken: {
      async mutate(input: { platform: "instagram" | "linkedin" | "tiktok" }) {
        const base = getBaseUrl();
        // passe ggf. auf deinen echten Refresh-Endpunkt an
        const { ok, data } = await getJson(`${base}/api/oauth/${input.platform}/refresh-token`, { method: "POST" });
        if (!ok) return { ok: false, requiresReauth: true };
        return { ok: true, ...(data ?? {}) };
      },
    },
  },
};
