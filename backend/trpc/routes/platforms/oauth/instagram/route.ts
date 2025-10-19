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

export const instagramOAuthInitProcedure = publicProcedure
  .input(z.object({ state: z.string().optional() }).optional())
  .query(({ ctx, input }) => {
  const isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.INSTAGRAM_CLIENT_ID || !process.env.INSTAGRAM_CLIENT_SECRET;
  
  if (isDemoMode) {
    console.log('[Instagram OAuth] Running in demo mode');
    return { authUrl: 'demo://instagram-auth', isDemoMode: true, redirectUri: 'demo://callback' };
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID as string;
  const origin = resolveOrigin(ctx.req as unknown as Request);
  const envRedirect = (process.env.INSTAGRAM_REDIRECT_URI || '').trim();
  const redirectUri = envRedirect || `${origin}/api/platforms/oauth/instagram/callback`;

  const scope = 'instagram_basic,instagram_content_publish';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    response_type: 'code',
  });
  if (input?.state) params.set('state', input.state);
  const authUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  return { authUrl, isDemoMode: false, redirectUri, state: input?.state };
});

export const instagramOAuthCallbackProcedure = publicProcedure
  .input(z.object({
    code: z.string(),
    state: z.string().optional(),
    isDemoMode: z.boolean().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const isDemoMode = input.isDemoMode || process.env.DEMO_MODE === 'true' || !process.env.INSTAGRAM_CLIENT_ID || !process.env.INSTAGRAM_CLIENT_SECRET;
    
    if (isDemoMode) {
      console.log('[Instagram OAuth] Callback in demo mode');
      return {
        accessToken: 'demo_instagram_access_token',
        refreshToken: 'demo_instagram_refresh_token',
        userId: 'demo_instagram_user_id',
        username: 'demo_instagram_user',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    const clientId = process.env.INSTAGRAM_CLIENT_ID as string;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET as string;
    const origin = resolveOrigin(ctx.req as unknown as Request);
    const envRedirect = (process.env.INSTAGRAM_REDIRECT_URI || '').trim();
    const redirectUri = envRedirect || `${origin}/api/platforms/oauth/instagram/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Instagram credentials not configured');
    }

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: input.code,
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('[Instagram OAuth] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      let errorMessage = `Failed to exchange Instagram code for token (${response.status})`;
      try {
        const errorData = JSON.parse(responseText);
        if ((errorData as any).error_message) {
          errorMessage = (errorData as any).error_message;
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
      console.error('[Instagram OAuth] Failed to parse response as JSON:', responseText);
      throw new Error('Invalid JSON response from Instagram API');
    }
    
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`);
    const userText = await userResponse.text();
    
    if (!userResponse.ok) {
      console.error('[Instagram OAuth] User info error:', {
        status: userResponse.status,
        body: userText
      });
      throw new Error(`Failed to fetch Instagram user info (${userResponse.status})`);
    }
    
    let userData: any;
    try {
      userData = JSON.parse(userText);
    } catch {
      console.error('[Instagram OAuth] Failed to parse user data:', userText);
      throw new Error('Invalid JSON user data from Instagram API');
    }

    const expiresIn = data.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      accessToken: data.access_token,
      refreshToken: data.access_token,
      userId: data.user_id,
      username: userData.username,
      expiresAt,
    };
  });
