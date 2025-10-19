import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32bytes!';
const ALGORITHM = 'aes-256-cbc';

const tokenStore = new Map<string, any>();

function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32));
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}

function decrypt(encrypted: string, ivHex: string): string {
  const iv = Buffer.from(ivHex, 'hex');
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const platformTokenSchema = z.object({
  platform: z.enum(['instagram', 'linkedin', 'tiktok', 'youtube']),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  userId: z.string(),
  username: z.string(),
  expiresAt: z.string().optional(),
});

export const savePlatformTokenProcedure = publicProcedure
  .input(platformTokenSchema)
  .mutation(async ({ input }) => {
    console.log('[Platform] Saving platform token for:', input.platform);
    
    const encryptedAccessToken = encrypt(input.accessToken);
    const encryptedRefreshToken = input.refreshToken ? encrypt(input.refreshToken) : null;
    
    tokenStore.set(input.platform, {
      platform: input.platform,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      userId: input.userId,
      username: input.username,
      expiresAt: input.expiresAt,
      createdAt: new Date().toISOString(),
    });
    
    console.log('[Platform] Token saved successfully for:', input.platform);
    
    return {
      success: true,
      platform: input.platform,
      username: input.username,
    };
  });

export const getPlatformTokenProcedure = publicProcedure
  .input(z.object({
    platform: z.enum(['instagram', 'linkedin', 'tiktok', 'youtube']),
  }))
  .query(async ({ input }) => {
    console.log('[Platform] Getting platform token for:', input.platform);
    
    const stored = tokenStore.get(input.platform);
    
    if (!stored) {
      return null;
    }
    
    const accessToken = decrypt(stored.accessToken.encrypted, stored.accessToken.iv);
    const refreshToken = stored.refreshToken 
      ? decrypt(stored.refreshToken.encrypted, stored.refreshToken.iv)
      : undefined;
    
    const now = new Date();
    const expiresAt = stored.expiresAt ? new Date(stored.expiresAt) : null;
    const isExpired = expiresAt ? now >= expiresAt : false;
    
    return {
      platform: stored.platform,
      accessToken,
      refreshToken,
      userId: stored.userId,
      username: stored.username,
      expiresAt: stored.expiresAt,
      isExpired,
    };
  });

export const disconnectPlatformProcedure = publicProcedure
  .input(z.object({
    platform: z.enum(['instagram', 'linkedin', 'tiktok', 'youtube']),
  }))
  .mutation(async ({ input }) => {
    console.log('[Platform] Disconnecting platform:', input.platform);
    
    tokenStore.delete(input.platform);
    
    return {
      success: true,
      platform: input.platform,
    };
  });

export const refreshPlatformTokenProcedure = publicProcedure
  .input(z.object({
    platform: z.enum(['instagram', 'linkedin', 'tiktok', 'youtube']),
  }))
  .mutation(async ({ input }) => {
    console.log('[Platform] Refreshing token for:', input.platform);
    
    const stored = tokenStore.get(input.platform);
    
    if (!stored || !stored.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const refreshToken = decrypt(stored.refreshToken.encrypted, stored.refreshToken.iv);
    
    let newAccessToken: string;
    let newRefreshToken: string | undefined;
    let expiresAt: string | undefined;
    
    try {
      switch (input.platform) {
        case 'instagram':
          const igResponse = await fetch(
            `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${refreshToken}`
          );
          if (!igResponse.ok) {
            const errorText = await igResponse.text();
            console.error('[Instagram Refresh] Error response:', errorText);
            throw new Error(`Failed to refresh Instagram token: ${errorText}`);
          }
          const igText = await igResponse.text();
          let igData;
          try {
            igData = JSON.parse(igText);
          } catch (error) {
            console.error('[Instagram Refresh] Failed to parse response as JSON:', igText);
            throw new Error('Invalid response from Instagram API');
          }
          if (!igData.access_token) {
            throw new Error('No access token in response');
          }
          newAccessToken = igData.access_token;
          expiresAt = new Date(Date.now() + igData.expires_in * 1000).toISOString();
          break;
          
        case 'linkedin':
          const liResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
              client_id: process.env.LINKEDIN_CLIENT_ID!,
              client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            }),
          });
          if (!liResponse.ok) {
            const errorText = await liResponse.text();
            console.error('[LinkedIn Refresh] Error response:', errorText);
            throw new Error(`Failed to refresh LinkedIn token: ${errorText}`);
          }
          const liText = await liResponse.text();
          let liData;
          try {
            liData = JSON.parse(liText);
          } catch (error) {
            console.error('[LinkedIn Refresh] Failed to parse response as JSON:', liText);
            throw new Error('Invalid response from LinkedIn API');
          }
          if (!liData.access_token) {
            throw new Error('No access token in response');
          }
          newAccessToken = liData.access_token;
          newRefreshToken = liData.refresh_token;
          expiresAt = new Date(Date.now() + liData.expires_in * 1000).toISOString();
          break;
          
        case 'youtube':
          const ytResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
              client_id: process.env.YOUTUBE_CLIENT_ID!,
              client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
            }),
          });
          if (!ytResponse.ok) {
            const errorText = await ytResponse.text();
            console.error('[YouTube Refresh] Error response:', errorText);
            throw new Error(`Failed to refresh YouTube token: ${errorText}`);
          }
          const ytText = await ytResponse.text();
          let ytData;
          try {
            ytData = JSON.parse(ytText);
          } catch (error) {
            console.error('[YouTube Refresh] Failed to parse response as JSON:', ytText);
            throw new Error('Invalid response from YouTube API');
          }
          if (!ytData.access_token) {
            throw new Error('No access token in response');
          }
          newAccessToken = ytData.access_token;
          expiresAt = new Date(Date.now() + ytData.expires_in * 1000).toISOString();
          break;
          
        case 'tiktok':
          const ttResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_key: process.env.TIKTOK_CLIENT_KEY!,
              client_secret: process.env.TIKTOK_CLIENT_SECRET!,
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
            }),
          });
          if (!ttResponse.ok) {
            const errorText = await ttResponse.text();
            console.error('[TikTok Refresh] Error response:', errorText);
            throw new Error(`Failed to refresh TikTok token: ${errorText}`);
          }
          const ttText = await ttResponse.text();
          let ttData;
          try {
            ttData = JSON.parse(ttText);
          } catch (error) {
            console.error('[TikTok Refresh] Failed to parse response as JSON:', ttText);
            throw new Error('Invalid response from TikTok API');
          }
          if (!ttData.access_token) {
            throw new Error('No access token in response');
          }
          newAccessToken = ttData.access_token;
          newRefreshToken = ttData.refresh_token;
          expiresAt = new Date(Date.now() + ttData.expires_in * 1000).toISOString();
          break;
          
        default:
          throw new Error(`Unsupported platform: ${input.platform}`);
      }
      
      const encryptedAccessToken = encrypt(newAccessToken);
      const encryptedRefreshToken = newRefreshToken ? encrypt(newRefreshToken) : stored.refreshToken;
      
      tokenStore.set(input.platform, {
        ...stored,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        updatedAt: new Date().toISOString(),
      });
      
      console.log('[Platform] Token refreshed successfully for:', input.platform);
      
      return {
        success: true,
        platform: input.platform,
        accessToken: newAccessToken,
        expiresAt,
      };
    } catch (error: any) {
      console.error('[Platform] Error refreshing token:', error);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  });
