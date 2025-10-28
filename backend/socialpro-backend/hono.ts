// backend/socialpro-backend/hono.ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

const app = new Hono()

// --- Middlewares ---
app.use('*', logger())
app.use('*', cors())

// --- Health / Status ---
app.get('/status', (c) =>
  c.json({
    ok: true,
    service: 'socialpro-backend',
    timestamp: new Date().toISOString(),
  })
)

// --- Root Route ---
app.get('/', (c) => c.json({ message: 'SocialPro backend up ✅' }))

// ======================================================
// ===============   TIKTOK OAUTH   =====================
// ======================================================

// 1. User startet TikTok Connect → wir leiten zu TikTok Login
app.get('/auth/tiktok/start', (c) => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY ?? 'MISSING_CLIENT_KEY'
  const redirectUri =
    'https://socialpro-fnvo.onrender.com/auth/tiktok/callback'

  // TODO: Scope anpassen je nach dem, was du brauchst
  const scope = encodeURIComponent('user.info.basic')
  const state = 'todo-random-state' // TODO: später dynamisch für CSRF

  const url =
    `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${clientKey}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`

  return c.redirect(url, 302)
})

// 2. TikTok ruft das nach Login auf
app.get('/auth/tiktok/callback', (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')

  console.log('✅ TikTok callback hit:', { code, state })

  return c.json({
    ok: true,
    platform: 'tiktok',
    code,
    state,
    message: 'TikTok OAuth callback received ✅',
  })
})

// ======================================================
// ===============   LINKEDIN OAUTH   ===================
// ======================================================

// LinkedIn OAuth Doku: https://learn.microsoft.com/linkedin/shared/authentication
// 1. User startet LinkedIn Connect → redirect zu LinkedIn
app.get('/auth/linkedin/start', (c) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID ?? 'MISSING_LINKEDIN_CLIENT_ID'
  const redirectUri =
    'https://socialpro-fnvo.onrender.com/auth/linkedin/callback'

  const scope = encodeURIComponent(
    [
      'r_liteprofile', // basic profile
      'r_emailaddress', // email
      'w_member_social', // post creation
    ].join(' ')
  )

  const state = 'todo-random-state' // TODO: CSRF token später speichern

  const url =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&state=${state}`

  return c.redirect(url, 302)
})

// 2. LinkedIn ruft das nach Login auf
app.get('/auth/linkedin/callback', (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')

  console.log('✅ LinkedIn callback hit:', { code, state })

  return c.json({
    ok: true,
    platform: 'linkedin',
    code,
    state,
    message: 'LinkedIn OAuth callback received ✅',
  })
})

// ======================================================
// ============   INSTAGRAM OAUTH (META)   ==============
// ======================================================

// Instagram verwendet Meta OAuth (Facebook Login for Instagram Business)
// 1. User startet Instagram Connect → redirect zu Meta OAuth
app.get('/auth/instagram/start', (c) => {
  const clientId = process.env.INSTAGRAM_CLIENT_ID ?? 'MISSING_INSTAGRAM_CLIENT_ID'
  const redirectUri =
    'https://socialpro-fnvo.onrender.com/auth/instagram/callback'

  // Für Instagram Basic Display API oder Graph API
  const scope = encodeURIComponent(
    [
      'instagram_basic', // Profilinfos / Medien lesen
      'pages_show_list', // Seiten anzeigen
      'instagram_manage_insights',
      'instagram_manage_comments',
    ].join(',')
  )

  const state = 'todo-random-state'

  const url =
    `https://api.instagram.com/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&response_type=code` +
    `&state=${state}`

  return c.redirect(url, 302)
})

// 2. Instagram ruft das nach Login auf
app.get('/auth/instagram/callback', (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')

  console.log('✅ Instagram callback hit:', { code, state })

  return c.json({
    ok: true,
    platform: 'instagram',
    code,
    state,
    message: 'Instagram OAuth callback received ✅',
  })
})

// ======================================================
// ===============   YOUTUBE OAUTH   ====================
// ======================================================

// Google OAuth für YouTube Data API
// 1. User startet YouTube Connect → redirect zu Google
app.get('/auth/youtube/start', (c) => {
  const clientId = process.env.YOUTUBE_CLIENT_ID ?? 'MISSING_YOUTUBE_CLIENT_ID'
  const redirectUri =
    'https://socialpro-fnvo.onrender.com/auth/youtube/callback'

  // YouTube scopes, z.B. hochladen / channel info
  const scope = encodeURIComponent(
    [
      'https://www.googleapis.com/auth/youtube.readonly',
      // später evtl. mehr, z.B. upload:
      // 'https://www.googleapis.com/auth/youtube.upload'
    ].join(' ')
  )

  const state = 'todo-random-state'
  const accessType = 'offline' // damit wir Refresh Token kriegen

  const url =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=${accessType}` +
    `&state=${state}` +
    `&prompt=consent`

  return c.redirect(url, 302)
})

// 2. YouTube ruft das nach Login auf
app.get('/auth/youtube/callback', (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')

  console.log('✅ YouTube callback hit:', { code, state })

  return c.json({
    ok: true,
    platform: 'youtube',
    code,
    state,
    message: 'YouTube OAuth callback received ✅',
  })
})

export default app
