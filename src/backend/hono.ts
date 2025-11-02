import { Hono } from "hono";
import { cors } from "hono/cors";

// -------------------------------------------------
// ENV Variablen (auf Render setzen!)
// -------------------------------------------------
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || "";
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || "";
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || "";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || "";
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || "";
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || "";

const IG_CLIENT_ID = process.env.IG_CLIENT_ID || "";
const IG_CLIENT_SECRET = process.env.IG_CLIENT_SECRET || "";
const IG_REDIRECT_URI = process.env.IG_REDIRECT_URI || "";

const YT_CLIENT_ID = process.env.YT_CLIENT_ID || "";
const YT_CLIENT_SECRET = process.env.YT_CLIENT_SECRET || "";
const YT_REDIRECT_URI = process.env.YT_REDIRECT_URI || "";

// -------------------------------------------------
// Deep Link zurück in die App
// -------------------------------------------------
function buildAppRedirect(platform: string, ok: boolean, extra?: Record<string, string>) {
  const base = `socialpro://connected/success?platform=${encodeURIComponent(platform)}&ok=${ok ? "1" : "0"}`;
  const extraQuery = extra
    ? Object.entries(extra)
        .map(([key, value]) => `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("")
    : "";
  return base + extraQuery;
}

// -------------------------------------------------
// Hono Setup
// -------------------------------------------------
const app = new Hono();

app.use(
  "*",
  cors({ origin: "*", allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization"] })
);

app.get("/", (c) => c.json({ ok: true, service: "socialpro-backend", version: 1 }));

// Debug ENV Check (temporär)
app.get("/oauth/instagram/debug-env", (c) => {
  return c.json({
    hasClientId: !!IG_CLIENT_ID,
    hasClientSecret: !!IG_CLIENT_SECRET,
    redirectUri: IG_REDIRECT_URI,
  });
});

// -------------------------------------------------
// INSTAGRAM START (Basic Display)
// -------------------------------------------------
app.get("/oauth/instagram/start", (c) => {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: IG_CLIENT_ID,
    redirect_uri: IG_REDIRECT_URI,
    scope: "user_profile",
    response_type: "code",
    state,
  });
  return c.redirect(`https://api.instagram.com/oauth/authorize?${params.toString()}`);
});

// INSTAGRAM CALLBACK
app.get("/oauth/instagram/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code) return c.redirect(buildAppRedirect("instagram", false, { message: "missing_code" }), 302);
  try {
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: new URLSearchParams({ client_id: IG_CLIENT_ID, client_secret: IG_CLIENT_SECRET, grant_type: "authorization_code", redirect_uri: IG_REDIRECT_URI, code }),
    });
    const tokenJson = await tokenRes.json();
    console.log("[instagram/callback]", tokenJson);
    return c.redirect(buildAppRedirect("instagram", true, { state: state || "" }), 302);
  } catch (err: any) {
    console.error("[instagram/callback] error", err);
    return c.redirect(buildAppRedirect("instagram", false, { message: err?.message || "token_failed" }), 302);
  }
});

// -------------------------------------------------
// LINKEDIN CALLBACK
// -------------------------------------------------
app.get("/oauth/linkedin/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code) return c.redirect(buildAppRedirect("linkedin", false, { message: "missing_code" }), 302);
  try {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: LINKEDIN_REDIRECT_URI, client_id: LINKEDIN_CLIENT_ID, client_secret: LINKEDIN_CLIENT_SECRET }),
    });
    console.log("[linkedin/callback]", await res.json());
    return c.redirect(buildAppRedirect("linkedin", true, { state: state || "" }), 302);
  } catch (err: any) {
    console.error("[linkedin/callback] error", err);
    return c.redirect(buildAppRedirect("linkedin", false, { message: err?.message || "token_failed" }), 302);
  }
});

// -------------------------------------------------
// TIKTOK CALLBACK
// -------------------------------------------------
app.get("/oauth/tiktok/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code) return c.redirect(buildAppRedirect("tiktok", false, { message: "missing_code" }), 302);
  try {
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_key: TIKTOK_CLIENT_KEY, client_secret: TIKTOK_CLIENT_SECRET, code, grant_type: "authorization_code", redirect_uri: TIKTOK_REDIRECT_URI }),
    });
    console.log("[tiktok/callback]", await res.json());
    return c.redirect(buildAppRedirect("tiktok", true, { state: state || "" }), 302);
  } catch (err: any) {
    console.error("[tiktok/callback] error", err);
    return c.redirect(buildAppRedirect("tiktok", false, { message: err?.message || "token_failed" }), 302);
  }
});

// -------------------------------------------------
// YOUTUBE CALLBACK
// -------------------------------------------------
app.get("/oauth/youtube/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code) return c.redirect(buildAppRedirect("youtube", false, { message: "missing_code" }), 302);
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: YT_CLIENT_ID, client_secret: YT_CLIENT_SECRET, redirect_uri: YT_REDIRECT_URI, grant_type: "authorization_code" }),
    });
    console.log("[youtube/callback]", await res.json());
    return c.redirect(buildAppRedirect("youtube", true, { state: state || "" }), 302);
  } catch (err: any) {
    console.error("[youtube/callback] error", err);
    return c.redirect(buildAppRedirect("youtube", false, { message: err?.message || "token_failed" }), 302);
  }
});

export default { fetch: (req: Request) => app.fetch(req) };

// --- Health / Status ---
app.get('/status', (c) =>
  c.json({
    ok: true,
    service: 'socialpro-backend',
    timestamp: new Date().toISOString(),
  })
);

// ✅ Zusätzlich: /healthz direkt in Hono
app.get('/healthz', (c) =>
  c.json({
    status: 'ok',
    message: 'API is running',
    service: 'socialpro-backend',
  })
);
