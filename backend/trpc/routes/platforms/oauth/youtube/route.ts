import { z } from 'zod';
import { publicProcedure } from '../../../../create-context';
import crypto from 'crypto';

function resolveOrigin(req: Request): string {
  try {
    const current = new URL(req.url);
    const proto = (req.headers.get('x-forwarded-proto') || current.protocol.replace(':', '')).trim();
    const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || current.host).trim();
    return `${proto}://${host}`;
  } catch {
    const fallback = (process.env.EXPO_PUBLIC_APP_URL || '').trim();
    if (fallback && (fallback.startsWith('http://') || fallback.startsWith('https://')))
      return fallback.replace(/\/$/, '');
    return 'https://socialpro-fnvo.onrender.com';
  }
}

export const youtubeOAuthInitProcedure = publicProcedure
  .input(z.object({ state: z.string().optional(), codeChallenge: z.string().optional(), codeVerifier: z.string().optional() }).optional())
  .query(({ ctx, input }) => {
  const isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET;
  
  if (isDemoMode) {
    console.log('[YouTube OAuth] Running in demo mode');
    return { authUrl: 'demo://youtube-auth', isDemoMode: true, redirectUri: 'demo://callback' };
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID as string;
  const origin = resolveOrigin(ctx.req as unknown as Request);
  const envRedirect = (process.env.YOUTUBE_REDIRECT_URI || '').trim();
  const redirectUri = envRedirect || `${origin}/api/platforms/oauth/youtube/callback`;

  const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
  const state = (input?.state || '').slice(0, 128);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'consent',
  });
  if (state) params.set('state', state);
  const cv = input?.codeVerifier;
  if (input?.codeChallenge || cv) {
    let challenge = input?.codeChallenge;
    if (!challenge && cv) {
      const hash = crypto.createHash('sha256').update(cv).digest();
      challenge = hash.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    if (challenge) {
      params.set('code_challenge', challenge);
      params.set('code_challenge_method', 'S256');
    }
  }
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return { authUrl, isDemoMode: false, redirectUri, state, pkce: Boolean(input?.codeChallenge) };
});

export const youtubeOAuthCallbackProcedure = publicProcedure
  .input(z.object({
    code: z.string(),
    codeVerifier: z.string().optional(),
    state: z.string().optional(),
    isDemoMode: z.boolean().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const isDemoMode = input.isDemoMode || process.env.DEMO_MODE === 'true' || !process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET;
    
    if (isDemoMode) {
      console.log('[YouTube OAuth] Callback in demo mode');
      return {
        accessToken: 'demo_youtube_access_token',
        refreshToken: 'demo_youtube_refresh_token',
        userId: 'demo_youtube_channel_id',
        username: 'Demo YouTube Channel',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    const clientId = process.env.YOUTUBE_CLIENT_ID as string;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET as string;
    const origin = resolveOrigin(ctx.req as unknown as Request);
    const envRedirect = (process.env.YOUTUBE_REDIRECT_URI || '').trim();
    const redirectUri = envRedirect || `${origin}/api/platforms/oauth/youtube/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('YouTube credentials not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: input.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        ...(input.codeVerifier ? { code_verifier: input.codeVerifier } : {}),
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('[YouTube OAuth] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      let errorMessage = `Failed to exchange YouTube code for token (${response.status})`;
      try {
        const errorData = JSON.parse(responseText);
        if ((errorData as any).error_description) {
          errorMessage = (errorData as any).error_description;
        } else if ((errorData as any).error) {
          errorMessage = typeof (errorData as any).error === 'string' ? (errorData as any).error : JSON.stringify((errorData as any).error);
        }
      } catch {
        if (responseText && responseText.length < 200) {
          errorMessage = `${errorMessage}: ${responseText}`;
        }
      }
      throw new Error(errorMessage);
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[YouTube OAuth] Failed to parse response as JSON:', responseText);
      throw new Error('Invalid JSON response from YouTube API');
    }
    
    const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const channelText = await channelResponse.text();
    
    if (!channelResponse.ok) {
      console.error('[YouTube OAuth] Channel info error:', {
        status: channelResponse.status,
        body: channelText
      });
      throw new Error(`Failed to fetch YouTube channel info (${channelResponse.status})`);
    }
    
    let channelData: any;
    try {
      channelData = JSON.parse(channelText);
    } catch {
      console.error('[YouTube OAuth] Failed to parse channel data:', channelText);
      throw new Error('Invalid JSON channel data from YouTube API');
    }

    const expiresIn = data.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      userId: channelData.items?.[0]?.id,
      username: channelData.items?.[0]?.snippet?.title,
      expiresAt,
    };
  });
