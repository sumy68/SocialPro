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
        const { ok, data } = await getJson(`${base}/api/oauth/${input.platform}/status`);
        if (!ok) return { ok: false };
        return { ok: true, ...data };
      },
    },
    refreshToken: {
      async mutate(input: { platform: "instagram" | "linkedin" | "tiktok" }) {
        const base = getBaseUrl();
        const { ok, data } = await getJson(`${base}/api/oauth/${input.platform}/refresh-token`, { method: "POST" });
        if (!ok) return { ok: false, requiresReauth: true };
        return { ok: true, ...(data ?? {}) };
      },
    },
  },
  posts: {
    schedule: {
      async mutate(input: {
        userId: string;
        platform: "instagram" | "linkedin" | "tiktok" | "youtube";
        caption: string;
        mediaUrls?: string[];
        mediaType?: "image" | "video";
        contentType?: "post" | "reel";
        scheduledDate: string;
        accessToken: string;
        platformUserId?: string;
      }) {
        const base = getBaseUrl();
        const { ok, data } = await getJson(`${base}/api/trpc/posts.schedule`, {
          method: "POST",
          body: JSON.stringify({ input }),
        });
        if (!ok) return { ok: false, error: data };
        return { ok: true, ...data };
      },
    },
    list: {
      async query(input: {
        userId: string;
        status?: "scheduled" | "published" | "failed";
      }) {
        const base = getBaseUrl();
        const { ok, data } = await getJson(`${base}/api/trpc/posts.list?input=${encodeURIComponent(JSON.stringify(input))}`);
        if (!ok) return { ok: false, error: data };
        return { ok: true, data };
      },
    },
  },
};
