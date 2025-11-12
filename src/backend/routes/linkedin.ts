// src/backend/routes/linkedin.ts
import { Hono } from "hono";

// timeout helper (verhindert endloses Hängen)
const fetchWithTimeout = (url: string, opts: any = {}, ms = 7000) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(id));
};

const scheme = process.env.EXPO_PUBLIC_SCHEME || "socialpro";
const appUrl = process.env.PUBLIC_BASE_URL || "https://socialpro-fnvo.onrender.com";
const clientId = process.env.LI_CLIENT_ID!;
const clientSecret = process.env.LI_CLIENT_SECRET!;

const successDeep = `${scheme}://connected/success?provider=linkedin`;
const failureDeep = `${scheme}://connected/failure?provider=linkedin`;

export const linkedin = new Hono();

// === 1️⃣ START – Redirect user to LinkedIn login (OIDC) ===
linkedin.get("/start", (c) => {
  const redirectUri = `${appUrl}/api/oauth/linkedin/callback`;
  const scopes = ["openid", "profile", "email", "w_member_social"];
  const state = "socialpro-state-123";

  const url =
    `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&scope=${encodeURIComponent(scopes.join(" "))}`;

  console.log("[LinkedIn] Using scopes (OIDC):", scopes.join(", "));
  return c.redirect(url, 302);
});

// === 2️⃣ CALLBACK – Handle LinkedIn redirect ===
linkedin.get("/callback", (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  console.log("[LinkedIn CALLBACK] Params:", Object.fromEntries(url.searchParams));

  if (error)
    return c.redirect(`${failureDeep}&reason=${encodeURIComponent(error)}`, 302);
  if (!code)
    return c.redirect(`${failureDeep}&reason=missing_code`, 302);

  const deepLink = `${successDeep}&code=${encodeURIComponent(code)}`;
  console.log("[LinkedIn CALLBACK] DeepLink →", deepLink);
  return c.redirect(deepLink, 302);
});

// === 3️⃣a EXCHANGE (POST) – code → access_token + user info ===
linkedin.post("/callback/exchange", async (c) => {
  try {
    const u = new URL(c.req.url);
    const body = await c.req.json().catch(() => ({}));
    const code = u.searchParams.get("code") || body.code;

    if (!code) return c.json({ ok: false, error: "missing_code" }, 400);
    if (code === "TEST" || code === "MOCK")
      return c.json({ ok: false, error: "token_failed_mock" }, 400);

    const redirectUri = `${appUrl}/api/oauth/linkedin/callback`;

    const tokenRes = await fetchWithTimeout("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }, 7000);

    const token = await tokenRes.json().catch(() => ({}));
    if (!token?.access_token)
      return c.json({ ok: false, error: "token_failed" }, 400);

    const accessToken = token.access_token;

    const meRes = await fetchWithTimeout("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const me = await meRes.json().catch(() => ({}));

    let email = me?.email ?? null;
    if (!email) {
      const emailRes = await fetchWithTimeout(
        "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const emailJson = await emailRes.json().catch(() => ({}));
      email = emailJson?.elements?.[0]?.["handle~"]?.emailAddress ?? null;
    }

    const orgsRes = await fetchWithTimeout(
      "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&state=APPROVED",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const orgs = await orgsRes.json().catch(() => ({}));

    return c.json({
      ok: true,
      access_token: accessToken,
      me: { sub: me.sub, name: me.name, email, picture: me.picture, organizations: orgs?.elements ?? [] },
    });
  } catch (err) {
    console.error("[LinkedIn EXCHANGE POST] Error:", err);
    return c.json({ ok: false, error: "exchange_failed" }, 500);
  }
});

// === 3️⃣b EXCHANGE (GET) – bequem per ?code=... ===
linkedin.get("/callback/exchange", async (c) => {
  try {
    const u = new URL(c.req.url);
    const code = u.searchParams.get("code");

    if (!code) return c.json({ ok: false, error: "missing_code" }, 400);
    if (code === "TEST" || code === "MOCK")
      return c.json({ ok: false, error: "token_failed_mock" }, 400);

    const redirectUri = `${appUrl}/api/oauth/linkedin/callback`;

    const tokenRes = await fetchWithTimeout("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }, 7000);

    const token = await tokenRes.json().catch(() => ({}));
    if (!token?.access_token)
      return c.json({ ok: false, error: "token_failed" }, 400);

    const accessToken = token.access_token;

    const meRes = await fetchWithTimeout("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const me = await meRes.json().catch(() => ({}));

    let email = me?.email ?? null;
    if (!email) {
      const emailRes = await fetchWithTimeout(
        "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const emailJson = await emailRes.json().catch(() => ({}));
      email = emailJson?.elements?.[0]?.["handle~"]?.emailAddress ?? null;
    }

    return c.json({
      ok: true,
      access_token: accessToken,
      me: { sub: me.sub, name: me.name, email, picture: me.picture },
    });
  } catch (err) {
    console.error("[LinkedIn EXCHANGE GET] Error:", err);
    return c.json({ ok: false, error: "exchange_failed" }, 500);
  }
});
