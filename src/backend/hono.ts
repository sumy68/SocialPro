import { Hono } from "hono";
import { cors } from "hono/cors";

// -------------------------------------------------
// ENV Variablen (auf Render setzen!)
// -------------------------------------------------

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || "";
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || "";
const LINKEDIN_REDIRECT_URI =
  process.env.LINKEDIN_REDIRECT_URI || "";
// z. B. "https://socialpro-fnvo.onrender.com/oauth/linkedin/callback"

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || "";
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || "";
const TIKTOK_REDIRECT_URI =
  process.env.TIKTOK_REDIRECT_URI || "";
// z. B. "https://socialpro-fnvo.onrender.com/oauth/tiktok/callback"

const IG_CLIENT_ID = process.env.IG_CLIENT_ID || "";
const IG_CLIENT_SECRET = process.env.IG_CLIENT_SECRET || "";
const IG_REDIRECT_URI =
  process.env.IG_REDIRECT_URI || "";
// z. B. "https://socialpro-fnvo.onrender.com/oauth/instagram/callback"

const YT_CLIENT_ID = process.env.YT_CLIENT_ID || "";
const YT_CLIENT_SECRET = process.env.YT_CLIENT_SECRET || "";
const YT_REDIRECT_URI =
  process.env.YT_REDIRECT_URI || "";
// z. B. "https://socialpro-fnvo.onrender.com/oauth/youtube/callback"


// -------------------------------------------------
// Helper: baue Deep Link zurück in die App
// Wir schicken den User zurück zu socialpro://connected/success?...,
// damit dein `connected/success.tsx` Screen aufgeht
// -------------------------------------------------

function buildAppRedirect(platform: string, ok: boolean, extra?: Record<string, string>) {
  const base =
    `socialpro://connected/success?platform=${encodeURIComponent(platform)}&ok=${ok ? "1" : "0"}`;

  const extraQuery = extra
    ? Object.entries(extra)
        .map(([key, value]) => `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("")
    : "";

  return base + extraQuery;
}


// -------------------------------------------------
// Hono App Setup
// -------------------------------------------------

const app = new Hono();

// CORS erlauben, damit Mobile App mit deinem Backend sprechen darf
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Health Check / Debug
app.get("/", (c) => {
  return c.json({
    ok: true,
    service: "socialpro-backend",
    version: 1,
  });
});


// -------------------------------------------------
// LINKEDIN CALLBACK
// Ablauf:
// 1. LinkedIn ruft diese URL mit ?code=...&state=... auf
// 2. Wir tauschen code -> Access Token
// 3. Wir leiten zurück in die App per socialpro://connected/success...
// -------------------------------------------------

app.get("/oauth/linkedin/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state"); // <- kannst du benutzen, um userId zu bekommen

  if (!code) {
    return c.redirect(
      buildAppRedirect("linkedin", false, { message: "missing_code" }),
      302
    );
  }

  try {
    // Code gegen Token tauschen
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
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

    const tokenJson = await tokenRes.json();
    console.log("[linkedin/callback] tokenJson:", tokenJson);

    // TODO: Hier später speichern in DB:
    // saveTokensToDB({
    //   userId: state,
    //   platform: "linkedin",
    //   tokenResponse: tokenJson,
    // });

    // Redirect zurück in die App
    return c.redirect(
      buildAppRedirect("linkedin", true, {
        state: state || "",
      }),
      302
    );
  } catch (err: any) {
    console.error("[linkedin/callback] error:", err);

    return c.redirect(
      buildAppRedirect("linkedin", false, {
        message: err?.message || "token_exchange_failed",
      }),
      302
    );
  }
});


// -------------------------------------------------
// TIKTOK CALLBACK
// TikTok nutzt client_key statt client_id
// Token endpoint: https://open.tiktokapis.com/v2/oauth/token/
// -------------------------------------------------

app.get("/oauth/tiktok/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    return c.redirect(
      buildAppRedirect("tiktok", false, { message: "missing_code" }),
      302
    );
  }

  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
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

    const tokenJson = await tokenRes.json();
    console.log("[tiktok/callback] tokenJson:", tokenJson);

    // TODO: speichern für Autopost
    // saveTokensToDB({
    //   userId: state,
    //   platform: "tiktok",
    //   tokenResponse: tokenJson,
    // });

    return c.redirect(
      buildAppRedirect("tiktok", true, {
        state: state || "",
      }),
      302
    );
  } catch (err: any) {
    console.error("[tiktok/callback] error:", err);

    return c.redirect(
      buildAppRedirect("tiktok", false, {
        message: err?.message || "token_exchange_failed",
      }),
      302
    );
  }
});


// -------------------------------------------------
// INSTAGRAM CALLBACK
// Instagram (Basic Display / Graph API) erster Schritt ist short-lived token
// endpoint: https://api.instagram.com/oauth/access_token
// -------------------------------------------------

app.get("/oauth/instagram/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    return c.redirect(
      buildAppRedirect("instagram", false, { message: "missing_code" }),
      302
    );
  }

  try {
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: IG_CLIENT_ID,
        client_secret: IG_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: IG_REDIRECT_URI,
        code,
      }),
    });

    const tokenJson = await tokenRes.json();
    console.log("[instagram/callback] tokenJson:", tokenJson);

    // TODO: speichern für Autopost
    // saveTokensToDB({
    //   userId: state,
    //   platform: "instagram",
    //   tokenResponse: tokenJson,
    // });

    return c.redirect(
      buildAppRedirect("instagram", true, {
        state: state || "",
      }),
      302
    );
  } catch (err: any) {
    console.error("[instagram/callback] error:", err);

    return c.redirect(
      buildAppRedirect("instagram", false, {
        message: err?.message || "token_exchange_failed",
      }),
      302
    );
  }
});


// -------------------------------------------------
// YOUTUBE CALLBACK
// Google OAuth2 token endpoint: https://oauth2.googleapis.com/token
// Wichtig: wir fragen access_type=offline im ersten Schritt in der App,
// damit wir hier einen refresh_token bekommen
// -------------------------------------------------

app.get("/oauth/youtube/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    return c.redirect(
      buildAppRedirect("youtube", false, { message: "missing_code" }),
      302
    );
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
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

    const tokenJson = await tokenRes.json();
    console.log("[youtube/callback] tokenJson:", tokenJson);

    // TODO: speichern für Autopost
    // saveTokensToDB({
    //   userId: state,
    //   platform: "youtube",
    //   tokenResponse: tokenJson,
    // });

    return c.redirect(
      buildAppRedirect("youtube", true, {
        state: state || "",
      }),
      302
    );
  } catch (err: any) {
    console.error("[youtube/callback] error:", err);

    return c.redirect(
      buildAppRedirect("youtube", false, {
        message: err?.message || "token_exchange_failed",
      }),
      302
    );
  }
});


// -------------------------------------------------
// Export Hono App als fetch()-Handler
// Deine [[...route]].ts ruft dann honoApp.fetch(request) auf.
// -------------------------------------------------

export default {
  fetch: (request: Request) => app.fetch(request),
};
