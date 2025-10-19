import { z } from 'zod';
import { publicProcedure } from '../../../../create-context';

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
    return 'http://localhost:3000';
  }
}

export const tiktokOAuthInitProcedure = publicProcedure
  .input(z.object({ state: z.string().optional() }).optional())
  .query(({ ctx, input }) => {
  const isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET;
  
  if (isDemoMode) {
    console.log('[TikTok OAuth] Running in demo mode');
    return { authUrl: 'demo://tiktok-auth', isDemoMode: true, redirectUri: 'demo://callback' };
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY as string;
  const origin = resolveOrigin(ctx.req as unknown as Request);
  const envRedirect = (process.env.TIKTOK_REDIRECT_URI || '').trim();
  const redirectUri = envRedirect || `${origin}/api/platforms/oauth/tiktok/callback`;

  const scope = 'video.upload,video.publish';
  const params = new URLSearchParams({
    client_key: clientKey,
    scope,
    response_type: 'code',
    redirect_uri: redirectUri,
  });
  if (input?.state) params.set('state', input.state);
  const authUrl = `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
  return { authUrl, isDemoMode: false, redirectUri, state: input?.state };
});

export const tiktokOAuthCallbackProcedure = publicProcedure
  .input(z.object({
    code: z.string(),
    state: z.string().optional(),
    isDemoMode: z.boolean().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const isDemoMode = input.isDemoMode || process.env.DEMO_MODE === 'true' || !process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET;
    
    if (isDemoMode) {
      console.log('[TikTok OAuth] Callback in demo mode');
      return {
        accessToken: 'demo_tiktok_access_token',
        refreshToken: 'demo_tiktok_refresh_token',
        userId: 'demo_tiktok_user_id',
        username: 'demo_tiktok_user',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    const clientKey = process.env.TIKTOK_CLIENT_KEY as string;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET as string;
    const origin = resolveOrigin(ctx.req as unknown as Request);
    const envRedirect = (process.env.TIKTOK_REDIRECT_URI || '').trim();
    const redirectUri = envRedirect || `${origin}/api/platforms/oauth/tiktok/callback`;

    if (!clientKey || !clientSecret) {
      throw new Error('TikTok credentials not configured');
    }

    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: input.code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('[TikTok OAuth] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      let errorMessage = `Failed to exchange TikTok code for token (${response.status})`;
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
      console.error('[TikTok OAuth] Failed to parse response as JSON:', responseText);
      throw new Error('Invalid JSON response from TikTok API');
    }
    
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const userText = await userResponse.text();
    
    if (!userResponse.ok) {
      console.error('[TikTok OAuth] User info error:', {
        status: userResponse.status,
        body: userText
      });
      throw new Error(`Failed to fetch TikTok user info (${userResponse.status})`);
    }
    
    let userData: any;
    try {
      userData = JSON.parse(userText);
    } catch {
      console.error('[TikTok OAuth] Failed to parse user data:', userText);
      throw new Error('Invalid JSON user data from TikTok API');
    }

    const expiresIn = data.expires_in || 86400;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      userId: data.open_id,
      username: userData.data?.user?.display_name || 'TikTok User',
      expiresAt,
    };
  });
