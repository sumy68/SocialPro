// src/backend/hono.ts
import { Hono } from "hono";
import { cors } from "hono/cors";

// -------------------------------------------------
// ENV Variablen (Render Dashboard setzen!)
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
// Helper: Deep Link zurück in die Expo App
// -------------------------------------------------
function buildAppRedirect(
  platform: string,
  ok: boolean,
  extra?: Record<string, string>
) {
  const base = `socialpro://connected/success?platform=${encodeURIComponent(
    platform
  )}&ok=${ok ? "1" : "0"}`;
  const extraQuery = extra
    ? Object.entries(extra)
        .map(
          ([key, value]) =>
            `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join("")
    : "";
  return base + extraQuery;
}

// HTML-Redirect (for in-app browsers)
function htmlRedirectToApp(targetUrl: string) {
  return `
<!doctype html>
<html lang="de">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Zurück zur App</title></head>
  <body style="font-family: system-ui">
    <p>Weiterleitung zurück zur App…</p>
    <script>
      try { window.location.replace(${JSON.stringify(targetUrl)}); } catch(e) {}
      setTimeout(function(){ window.location.href = ${JSON.stringify(
        targetUrl
      )}; }, 1200);
    </script>
    <a href="${targetUrl}">Falls nichts passiert, hier tippen</a>
  </body>
</html>`;
}

// -------------------------------------------------
// Hono Setup
// -------------------------------------------------
const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// -------------------------------------------------
// Health / Ping
// -------------------------------------------------
app.get("/", (c) => c.json({ ok: true, service: "socialpro-backend", version: 2 }));
app.get("/status", (c) => c.json({ ok: true, ts: new Date().toISOString() }));
app.get("/__ping", (c) => c.text("pong-socialpro"));

// -------------------------------------------------
// ✅ Instagram Graph API (correct 2025 flow)
// -------------------------------------------------
app.get("/api/oauth/instagram/debug-env", (c) =>
  c.json({
    hasClientId: Boolean(IG_CLIENT_ID),
    hasClientSecret: Boolean(IG_CLIENT_SECRET),
    redirectUri: IG_REDIRECT_URI,
  })
);

app.get("/api/oauth/instagram/start", (c) => {
  if (!IG_CLIENT_ID || !IG_REDIRECT_URI) {
    return c.text("Missing IG env vars", 500);
  }

  const state = crypto.randomUUID();
  const scope = "pages_show_list,instagram_basic";

  const params = new URLSearchParams({
    client_id: IG_CLIENT_ID,
    redirect_uri: IG_REDIRECT_URI,
    response_type: "code",
    scope,
    state,
  });

  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;

  console.log("[IG START] ", authUrl);
  return c.redirect(authUrl);
});

app.get("/api/oauth/instagram/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    const fail = buildAppRedirect("instagram", false, { message: "missing_code" });
    return c.html(htmlRedirectToApp(fail));
  }

  try {
    const tokenRes = await fetch("https://graph.facebook.com/v20.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: IG_CLIENT_ID,
        client_secret: IG_CLIENT_SECRET,
        redirect_uri: IG_REDIRECT_URI,
        code,
      }),
    });

    const tokenJson = await tokenRes.json();
    console.log("[IG TOKEN] ", tokenJson);

    const ok = buildAppRedirect("instagram", true, { state: state || "" });
    return c.html(htmlRedirectToApp(ok));
  } catch (err: any) {
    const fail = buildAppRedirect("instagram", false, { message: err?.message || "token_failed" });
    return c.html(htmlRedirectToApp(fail));
  }
});

// -------------------------------------------------
// LINKEDIN
// -------------------------------------------------
app.get("/api/oauth/linkedin/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    const fail = buildAppRedirect("linkedin", false, { message: "missing_code" });
    return c.html(htmlRedirectToApp(fail));
  }

  try {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });

    const data = await res.json();
    console.log("[LinkedIn Token]", data);

    const ok = buildAppRedirect("linkedin", true, { state: state || "" });
    return c.html(htmlRedirectToApp(ok));
  } catch (err: any) {
    const fail = buildAppRedirect("linkedin", false, { message: err?.message || "token_failed" });
    return c.html(htmlRedirectToApp(fail));
  }
});

// -------------------------------------------------
// TIKTOK
// -------------------------------------------------
app.get("/api/oauth/tiktok/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    const fail = buildAppRedirect("tiktok", false, { message: "missing_code" });
    return c.html(htmlRedirectToApp(fail));
  }

  try {
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: TIKTOK_REDIRECT_URI,
      }),
    });

    const data = await res.json();
    console.log("[TikTok Token]", data);

    const ok = buildAppRedirect("tiktok", true, { state: state || "" });
    return c.html(htmlRedirectToApp(ok));
  } catch (err: any) {
    const fail = buildAppRedirect("tiktok", false, { message: err?.message || "token_failed" });
    return c.html(htmlRedirectToApp(fail));
  }
});

// -------------------------------------------------
// YOUTUBE
// -------------------------------------------------
app.get("/api/oauth/youtube/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    const fail = buildAppRedirect("youtube", false, { message: "missing_code" });
    return c.html(htmlRedirectToApp(fail));
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: YT_CLIENT_ID,
        client_secret: YT_CLIENT_SECRET,
        redirect_uri: YT_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const data = await res.json();
    console.log("[YouTube Token]", data);

    const ok = buildAppRedirect("youtube", true, { state: state || "" });
    return c.html(htmlRedirectToApp(ok));
  } catch (err: any) {
    const fail = buildAppRedirect("youtube", false, { message: err?.message || "token_failed" });
    return c.html(htmlRedirectToApp(fail));
  }
});

// -------------------------------------------------
// Export
// -------------------------------------------------
export default app;
