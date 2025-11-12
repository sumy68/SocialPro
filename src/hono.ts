// src/hono.ts
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { timing } from "hono/timing";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./backend/trpc/router.js";

// ✅ korrigierte Imports (Router heißen bei dir linkedin / instagram)
import { linkedin } from "./backend/routes/linkedin.js";
import { instagramRouter } from "./backend/routes/instagram.js";

// 🧠 App-Instance
const app = new Hono();

// 🌐 CORS (für App-Calls wie /callback/exchange)
app.use(
  "*",
  cors({
    origin: "*", // kannst du später einschränken (z. B. ['socialpro://*', 'exp://*'])
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// ⏱️ Server-Timing (Debug)
app.use("*", timing());

// 🪵 Request Logger
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const u = new URL(c.req.url);
  const qEntries = Array.from(u.searchParams.entries());
  const q: Record<string, string> = {};
  for (const [k, v] of qEntries) q[k] = v;
  if (q.code) {
    const len = q.code.length;
    const head = q.code.slice(0, 6);
    q.code = `${head}...(${len})`;
  }
  console.log(
    JSON.stringify({
      method: c.req.method,
      path: u.pathname,
      query: q,
      status: c.res.status,
      ms: Date.now() - start,
    })
  );
});

// 🏁 Boot logs
const BUILD = process.env.BUILD_TAG || "local-dev";
console.log("[BOOT] hono.ts loaded");
console.log("[BOOT] BUILD =", BUILD);
console.log("[BOOT] mounting /api/oauth/linkedin + /api/oauth/instagram");

// 🔗 Router Mounts
app.route("/api/oauth/linkedin", linkedin);
app.route("/api/oauth/instagram", instagramRouter);
app.use("/api/trpc/*", trpcServer({ router: appRouter }));
console.log("[BOOT] mounting /api/trpc");

// 🩺 Health route
app.get("/health", (c: Context) => c.text(`ok build=${BUILD}`));

// 🛰️ Status (JSON)
app.get("/status", (c: Context) =>
  c.json({
    ok: true,
    build: BUILD,
    env: {
      node: process.version,
      publicBaseUrl: process.env.PUBLIC_BASE_URL || null,
      port: process.env.PORT || null,
    },
    routers: ["linkedin", "instagram"],
    now: new Date().toISOString(),
  })
);

// 🚨 Debug route
app.get("/_debug", (c: Context) => c.text("hono_router=LIVE"));

// ❗ NotFound & Error Handling
app.notFound((c) => c.text("Not Found", 404));
app.onError((err, c) => {
  console.error("[ERROR]", err);
  return c.json({ ok: false, error: "internal_error" }, 500);
});

// ✅ Export
export default app;
export { app };
