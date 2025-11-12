// src/backend/routes/linkedin.ts
import { Hono } from "hono";

const scheme = process.env.EXPO_PUBLIC_SCHEME || "socialpro";
const appUrl =
  process.env.PUBLIC_BASE_URL || "https://socialpro-fnvo.onrender.com";
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
  const code =
    url.searchParams.get("code") ||
    url.searchParams.get("auth_code") ||
    url.searchParams.get("authorization_code");
  const error =
    url.searchParams.get("error") ||
    url.searchParams.get("error_description") ||
    undefined;

  console.log("[LinkedIn CALLBACK] Params:", Object.fromEntries(url.searchParams));

  if (error) {
    console.error("[LinkedIn CALLBACK] Error:", error);
    return c.redirect(
      `${failureDeep}&reason=${encodeURIComponent(error)}`,
      302
    );
  }

  if (!code) {
    console.error("[LinkedIn CALLBACK] Missing code!");
    return c.redirect(`${failureDeep}&reason=missing_code`, 302);
  }

  const deepLink = `${successDeep}&code=${encodeURIComponent(code)}`;
  console.log("[LinkedIn CALLBACK] DeepLink →", deepLink);
  return c.redirect(deepLink, 302);
});

// === 3️⃣a EXCHANGE (POST) – code → access_token + user info ===
linkedin.post("/callback/exchange", async (c) => {
  try {
    const u = new URL(c.req.url);
    let code =
      u.searchParams.get("code") ||
      (await c.req.json().catch(() => null))?.code;
    if (!code) return c.json({ ok: false, error: "missing_code" }, 400);

    const redirectUri = `${appUrl}/api/oauth/linkedin/callback`;

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const token = await tokenRes.json().catch(() => ({}));
    if (!token?.access_token) {
      console.error("[LinkedIn EXCHANGE POST] Token Error:", token);
      return c.json({ ok: false, error: "token_failed" }, 400);
    }

    const accessToken = token.access_token;

    // OIDC userinfo
    const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const me = await meRes.json().catch(() => ({}));
    let email = me?.email ?? null;

    // Fallback E-Mail
    if (!email) {
      try {
        const emailRes = await fetch(
          "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const emailJson = await emailRes.json().catch(() => ({}));
        email = emailJson?.elements?.[0]?.["handle~"]?.emailAddress ?? null;
      } catch {}
    }

    // Optional: Orgs
    const orgsRes = await fetch(
      "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&state=APPROVED",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const orgs = await orgsRes.json().catch(() => ({}));

    return c.json({
      ok: true,
      access_token: accessToken,
      me: {
        sub: me.sub,
        name: me.name,
        email,
        picture: me.picture,
        linkedInId: me.sub,
        organizations: orgs?.elements ?? [],
      },
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

    const redirectUri = `${appUrl}/api/oauth/linkedin/callback`;

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const token = await tokenRes.json().catch(() => ({}));
    if (!token?.access_token) {
      console.error("[LinkedIn EXCHANGE GET] Token Error:", token);
      return c.json({ ok: false, error: "token_failed" }, 400);
    }
    const accessToken = token.access_token;

    const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const me = await meRes.json().catch(() => ({}));
    let email = me?.email ?? null;

    if (!email) {
      try {
        const emailRes = await fetch(
          "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const emailJson = await emailRes.json().catch(() => ({}));
        email = emailJson?.elements?.[0]?.["handle~"]?.emailAddress ?? null;
      } catch {}
    }

    return c.json({
      ok: true,
      access_token: accessToken,
      me: {
        sub: me.sub,
        name: me.name,
        email,
        picture: me.picture,
      },
    });
  } catch (err) {
    console.error("[LinkedIn EXCHANGE GET] Error:", err);
    return c.json({ ok: false, error: "exchange_failed" }, 500);
  }
});

// === 4️⃣ POST helper endpoint ===
linkedin.post("/post", async (c) => {
  const body = await c.req.json();
  const { accessToken, authorUrn, text, mediaUrl } = body;
  if (!accessToken || !authorUrn || !text)
    return c.json({ ok: false, error: "missing_fields" }, 400);

  const postBody: any = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: mediaUrl ? "IMAGE" : "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  if (mediaUrl) {
    postBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
      { status: "READY", originalUrl: mediaUrl },
    ];
  }

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postBody),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[LinkedIn POST] Fail:", json);
    return c.json({ ok: false, error: json.message || "post_failed" }, 400);
  }

  return c.json({ ok: true, post: json });
});

// === 5️⃣ POST-Stats ===
linkedin.post("/stats", async (c) => {
  try {
    const { accessToken, postUrn } = await c.req.json();
    if (!accessToken || !postUrn) {
      return c.json({ ok: false, error: "missing_fields" }, 400);
    }

    const statsUrl = `https://api.linkedin.com/v2/ugcPosts/${encodeURIComponent(postUrn)}/statistics`;
    const res = await fetch(statsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[LinkedIn STATS] Fail:", json);
      return c.json({ ok: false, error: json.message || "stats_failed" }, 400);
    }

    const s =
      json?.elements?.[0]?.totalShareStatistics || json?.totalShareStatistics || {};
    return c.json({
      ok: true,
      stats: {
        impressions: s.impressionCount ?? 0,
        likes: s.likeCount ?? 0,
        comments: s.commentCount ?? 0,
        shares: s.shareCount ?? 0,
        raw: json,
      },
    });
  } catch (e) {
    console.error("[LinkedIn STATS] Error:", e);
    return c.json({ ok: false, error: "internal_error" }, 500);
  }
});
