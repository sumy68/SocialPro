import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log(`[Hono] ${c.req.method} ${c.req.url}`);
  await next();
});

app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC] Error on ${path}:`, error);
      console.error(`[tRPC] Error details:`, {
        message: error.message,
        code: (error as any).code,
        cause: error.cause,
      });
    },
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// REST compatibility endpoints
const api = new Hono().basePath("/api/platforms");

// OAuth callback helper so providers can redirect here; immediately deep-link back to the app scheme so AuthSession can resolve
api.get("/oauth/:platform/callback", (c) => {
  const url = new URL(c.req.url);
  const platform = c.req.param("platform");
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const error = url.searchParams.get("error") ?? "";
  const scheme = (process.env.APP_SCHEME || process.env.EXPO_PUBLIC_SCHEME || "myapp").trim();
  const deeplink = `${scheme}://oauth/callback?platform=${encodeURIComponent(platform)}&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}&error=${encodeURIComponent(error)}`;
  return c.redirect(deeplink, 302);
});

api.post("/connect/:platform", async (c) => {
  const platform = c.req.param("platform") as "instagram" | "linkedin" | "tiktok" | "youtube";
  let body;
  try {
    const text = await c.req.text();
    body = text ? JSON.parse(text) : {};
  } catch (error) {
    console.error('[API] Failed to parse request body:', error);
    return c.json({ success: false, error: 'Invalid request body' }, 400);
  }
  const caller = appRouter.createCaller({ req: c.req.raw });

  // If a code is provided, exchange it via existing OAuth callback procedures.
  if (body?.code) {
    switch (platform) {
      case "instagram": {
        const data = await caller.platforms.oauth.instagram.callback({ code: body.code });
        const expiresAt = body.expiresAt || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
        await caller.platforms.saveToken({
          platform,
          accessToken: data.accessToken,
          refreshToken: (data as any).refreshToken,
          userId: (data as any).userId ?? (data as any).openId ?? (data as any).channelId,
          username: (data as any).username ?? (data as any).name ?? (data as any).channelName ?? "",
          expiresAt,
        });
        return c.json({ success: true });
      }
      case "linkedin": {
        const data = await caller.platforms.oauth.linkedin.callback({ code: body.code });
        const expiresAt = body.expiresAt || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
        await caller.platforms.saveToken({
          platform,
          accessToken: data.accessToken,
          userId: (data as any).userId,
          username: (data as any).name ?? "",
          expiresAt,
        });
        return c.json({ success: true });
      }
      case "tiktok": {
        const data = await caller.platforms.oauth.tiktok.callback({ code: body.code });
        const expiresAt = body.expiresAt || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
        await caller.platforms.saveToken({
          platform,
          accessToken: data.accessToken,
          refreshToken: (data as any).refreshToken,
          userId: (data as any).openId,
          username: (data as any).username ?? "",
          expiresAt,
        });
        return c.json({ success: true });
      }
      case "youtube": {
        const data = await caller.platforms.oauth.youtube.callback({ code: body.code });
        const expiresAt = body.expiresAt || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
        await caller.platforms.saveToken({
          platform,
          accessToken: data.accessToken,
          refreshToken: (data as any).refreshToken,
          userId: (data as any).channelId,
          username: (data as any).channelName ?? "",
          expiresAt,
        });
        return c.json({ success: true });
      }
    }
  }

  // Otherwise expect direct token payload
  const { accessToken, refreshToken, userId, username, expiresAt } = body || {};
  if (!accessToken || !userId || !username) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }
  await caller.platforms.saveToken({ platform, accessToken, refreshToken, userId, username, expiresAt });
  return c.json({ success: true });
});

api.get("/status", async (c) => {
  const caller = appRouter.createCaller({ req: c.req.raw });
  const platforms: ("instagram" | "linkedin" | "tiktok" | "youtube")[] = [
    "instagram",
    "linkedin",
    "tiktok",
    "youtube",
  ];
  const items = await Promise.all(
    platforms.map(async (p) => {
      const token = await caller.platforms.getToken({ platform: p });
      return {
        platform: p,
        status: token ? (token.isExpired ? "expired" : "connected") : "not_connected",
        username: token?.username ?? null,
        userId: token?.userId ?? null,
        expiresAt: token?.expiresAt ?? null,
      };
    })
  );
  return c.json({ items });
});

api.delete("/disconnect/:platform", async (c) => {
  const platform = c.req.param("platform") as "instagram" | "linkedin" | "tiktok" | "youtube";
  const caller = appRouter.createCaller({ req: c.req.raw });
  await caller.platforms.disconnect({ platform });
  return c.json({ success: true });
});

app.route("/api/platforms", api);

app.all("*", (c) => {
  console.log('[Hono] 404 - Route not found:', c.req.method, c.req.url);
  return c.json({ error: "Not Found", path: c.req.url }, 404);
});

export default app;
