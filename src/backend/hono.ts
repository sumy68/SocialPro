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
function buildAppRedirect(
  platform: string,
  ok: boolean,
  extra?: Record<string, string>
) {
  // Du nutzt aktuell dieses Deep-Link-Pattern:
  // socialpro://connected/success?platform=instagram&ok=1
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

// HTML + JS Redirect (stabil in Safari/In-App Browsern)
function htmlRedirectToApp(targetUrl: string) {
  return `
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Zurück zur App…</title>
  </head>
  <body style="font-family: -apple-system, system-ui, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial;">
    <p>Weiterleitung zurück zur App…</p>
    <script>
      (function(){
        try { window.location.replace(${JSON.stringify(targetUrl)}); } catch(e) {}
        setTimeout(function(){ window.location.href = ${JSON.stringify(
          targetUrl
        )}; }, 1200);
      })();
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

// Root & Health
app.get("/", (c) =>
  c.json({ ok: true, service: "socialpro-backend", version: 1 })
);
app.get("/status", (c) =>
  c.json({
    ok: true,
    service: "socialpro-backend",
    timestamp: new Date().toISOString(),
  })
);
app.get("/healthz", (c) =>
  c.json({
    status: "ok",
    message: "API is running",
    service: "socialpro-backend",
  })
);
app.get("/api/health", (c) =>
  c.json({ ok: true, service: "socialpro-backend", scope: "api" })
);

// -------------------------------------------------
// INSTAGRAM START (Basic Display)
// -------------------------------------------------
app.get("/api/oauth/instagram/debug-env", (c) =>
  c.json({
    hasClientId: !!IG_CLIENT_ID,
    hasClientSecret: !!IG_CLIENT_SECRET,
    redirectUri: IG_REDIRECT_URI,
  })
);

app.get("/api/oauth/instagram/start", (c) => {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: IG_CLIENT_ID,
    redirect_uri: IG_REDIRECT_URI, // MUSS in Meta-Whitelist sein
    scope: "user_profile",
    response_type: "code",
    state,
  });
  return c.redirect(
    `https://api.instagram.com/oauth/authorize?${params.toString()}`
  );
});

// INSTAGRAM CALLBACK
app.get("/api/oauth/instagram/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    const target = buildAppRedirect("instagram", false, { message: "missing_code" });
    return c.html(htmlRedirectToApp(target));
  }

  try {
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: IG_CLIENT_ID,
        client_secret: IG_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: IG_REDIRECT_URI, // exakt identisch zu /start & Meta-Whitelist
        code,
      }),
    });

    const tokenJson = await tokenRes.json();
    console.log("[instagram/callback] token response:", tokenJson);

    // Hier könntest du tokenJson.access_token speichern/weiterverarbeiten

    const target = buildAppRedirect("instagram", true, { state: state || "" });
    return c.html(htmlRedirectToApp(target));
  } catch (err: any) {
    console.error("[instagram/callback] error", err);
    const target = buildAppRedirect("instagram", false, {
      message: err?.message || "token_failed",
    });
    return c.html(htmlRedirectToApp(target));
  }
});

// -------------------------------------------------
// LINKEDIN
// -------------------------------------------------
app.get("/api/oauth/linkedin/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    const target = buildAppRedirect("linkedin", false, { message: "missing_code" });
    return c.html(htmlRedirectToApp(target));
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
    console.log("[linkedin/callback] token response:", data);

    const target = buildAppRedirect("linkedin", true, { state: state || "" });
    return c.html(htmlRedirectToApp(target));
  } catch (err: any) {
    console.error("[linkedin/callback] error", err);
    const target = buildAppRedirect("linkedin", false, {
      message: err?.message || "token_failed",
    });
    return c.html(htmlRedirectToApp(target));
  }
});

// -------------------------------------------------
// TIKTOK
// -------------------------------------------------
app.get("/api/oauth/tiktok/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    const target = buildAppRedirect("tiktok", false, { message: "missing_code" });
    return c.html(htmlRedirectToApp(target));
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
    console.log("[tiktok/callback] token response:", data);

    const target = buildAppRedirect("tiktok", true, { state: state || "" });
    return c.html(htmlRedirectToApp(target));
  } catch (err: any) {
    console.error("[tiktok/callback] error", err);
    const target = buildAppRedirect("tiktok", false, {
      message: err?.message || "token_failed",
    });
    return c.html(htmlRedirectToApp(target));
  }
});

// -------------------------------------------------
// YOUTUBE
// -------------------------------------------------
app.get("/api/oauth/youtube/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    const target = buildAppRedirect("youtube", false, { message: "missing_code" });
    return c.html(htmlRedirectToApp(target));
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
    console.log("[youtube/callback] token response:", data);

    const target = buildAppRedirect("youtube", true, { state: state || "" });
    return c.html(htmlRedirectToApp(target));
  } catch (err: any) {
    console.error("[youtube/callback] error", err);
    const target = buildAppRedirect("youtube", false, {
      message: err?.message || "token_failed",
    });
    return c.html(htmlRedirectToApp(target));
  }
});

export default {
  fetch: (req: Request) => app.fetch(req),
};
