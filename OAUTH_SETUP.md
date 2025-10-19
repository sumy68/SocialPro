# OAuth Platform Setup Guide

This guide explains how to set up OAuth authentication for each social media platform.

## Prerequisites

1. Copy `.env.example` to `.env`
2. Generate a secure encryption key:
   ```bash
   openssl rand -hex 32
   ```
3. Add the encryption key to your `.env` file

## Platform Setup

### Instagram (Facebook Graph API)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add "Instagram Basic Display" product
4. Configure OAuth redirect URI: `http://localhost:8081/api/platforms/oauth/instagram/callback`
5. Add to `.env`:
   ```
   INSTAGRAM_CLIENT_ID=your_app_id
   INSTAGRAM_CLIENT_SECRET=your_app_secret
   INSTAGRAM_REDIRECT_URI=http://localhost:8081/api/platforms/oauth/instagram/callback
   ```

**Required Permissions:**
- `instagram_basic`
- `instagram_content_publish`

**Testing:**
- Add test users in Facebook App Dashboard → Roles → Instagram Testers

### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add "Sign In with LinkedIn using OpenID Connect" product
4. Configure OAuth 2.0 redirect URL: `http://localhost:8081/api/platforms/oauth/linkedin/callback`
5. Add to `.env`:
   ```
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   LINKEDIN_REDIRECT_URI=http://localhost:8081/api/platforms/oauth/linkedin/callback
   ```

**Required Permissions:**
- `w_member_social` (for posting)
- `openid` (for authentication)
- `profile` (for user info)

**Note:** LinkedIn OAuth requires app verification for production use.

### TikTok

1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create a new app
3. Enable "Content Posting API"
4. Configure redirect URI: `http://localhost:8081/api/platforms/oauth/tiktok/callback`
5. Add to `.env`:
   ```
   TIKTOK_CLIENT_KEY=your_client_key
   TIKTOK_CLIENT_SECRET=your_client_secret
   TIKTOK_REDIRECT_URI=http://localhost:8081/api/platforms/oauth/tiktok/callback
   ```

**Required Permissions:**
- `video.upload`
- `video.publish`

**Testing:**
- Test accounts must be added in TikTok Developer Portal

### YouTube (Google OAuth)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:8081/api/platforms/oauth/youtube/callback`
6. Add to `.env`:
   ```
   YOUTUBE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   YOUTUBE_CLIENT_SECRET=your_client_secret
   YOUTUBE_REDIRECT_URI=http://localhost:8081/api/platforms/oauth/youtube/callback
   ```

**Required Scopes:**
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube`

**Note:** YouTube API has daily quota limits. Request quota increase for production.

## Production Deployment

When deploying to production:

1. Update all redirect URIs to your production domain
2. Generate a secure encryption key (32 bytes minimum)
3. Store credentials in secure environment variables
4. Enable rate limiting on OAuth endpoints
5. Implement proper error logging
6. Consider using a database for token storage instead of in-memory Map

### Recommended Token Storage

For production, replace the in-memory `tokenStore` with a database:

```typescript
// Example with PostgreSQL
import { db } from './database';

export const savePlatformTokenProcedure = publicProcedure
  .input(platformTokenSchema)
  .mutation(async ({ input }) => {
    const encryptedAccessToken = encrypt(input.accessToken);
    const encryptedRefreshToken = input.refreshToken ? encrypt(input.refreshToken) : null;
    
    await db.platformTokens.upsert({
      where: { platform: input.platform },
      update: {
        accessToken: encryptedAccessToken.encrypted,
        accessTokenIv: encryptedAccessToken.iv,
        refreshToken: encryptedRefreshToken?.encrypted,
        refreshTokenIv: encryptedRefreshToken?.iv,
        userId: input.userId,
        username: input.username,
        expiresAt: input.expiresAt,
      },
      create: {
        platform: input.platform,
        accessToken: encryptedAccessToken.encrypted,
        accessTokenIv: encryptedAccessToken.iv,
        refreshToken: encryptedRefreshToken?.encrypted,
        refreshTokenIv: encryptedRefreshToken?.iv,
        userId: input.userId,
        username: input.username,
        expiresAt: input.expiresAt,
      },
    });
    
    return { success: true };
  });
```

## Testing OAuth Flow

1. Start the development server:
   ```bash
   npx expo start
   ```

2. Navigate to Settings → Connected Platforms
3. Click "Connect" on any platform
4. Complete the OAuth flow in the browser
5. You should be redirected back to the app with a success message

## Troubleshooting

### "OAuth redirect URI mismatch"
- Ensure the redirect URI in your `.env` matches exactly what's configured in the platform's developer console
- Check for trailing slashes
- Verify the protocol (http vs https)

### "Invalid client credentials"
- Double-check your client ID and secret in `.env`
- Ensure no extra spaces or quotes

### "Token expired" errors
- The app automatically refreshes tokens when they expire
- If refresh fails, the user will be prompted to reconnect

### Mobile testing
- Update redirect URIs to use your development machine's IP address
- Example: `http://192.168.1.100:8081/api/platforms/oauth/...`
- Make sure your phone and computer are on the same network

## Security Best Practices

1. **Never commit `.env` to version control**
2. **Rotate encryption keys regularly**
3. **Use HTTPS in production**
4. **Implement rate limiting**
5. **Log all OAuth errors for monitoring**
6. **Set up token expiry notifications**
7. **Use short-lived access tokens with refresh tokens**
8. **Implement PKCE for mobile apps (if supported by platform)**

## Rate Limits

Each platform has different rate limits:

- **Instagram**: 200 requests per hour per user
- **LinkedIn**: Varies by API endpoint
- **TikTok**: 100 requests per day per user (video upload)
- **YouTube**: 10,000 units per day (default quota)

Monitor your usage and implement appropriate caching and queuing strategies.
