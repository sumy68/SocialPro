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
    return 'http://localhost:3000';
  }
}

export const linkedinOAuthInitProcedure = publicProcedure
  .input(z.object({ state: z.string().optional(), codeChallenge: z.string().optional(), codeVerifier: z.string().optional() }).optional())
  .query(({ ctx, input }) => {
  try {
    console.log('[LinkedIn OAuth Init] Starting initialization');
    const isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET;
    
    if (isDemoMode) {
      console.log('[LinkedIn OAuth Init] Running in demo mode');
      return { authUrl: 'demo://linkedin-auth', isDemoMode: true, redirectUri: 'demo://callback' };
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID as string;
    const origin = resolveOrigin(ctx.req as unknown as Request);
    const envRedirect = (process.env.LINKEDIN_REDIRECT_URI || '').trim();
    const redirectUri = envRedirect || `${origin}/api/platforms/oauth/linkedin/callback`;

    const state = (input?.state || crypto.randomUUID()).replace(/[^a-zA-Z0-9-_\.~]/g, '').slice(0, 128);
    let codeChallenge = input?.codeChallenge;
    if (!codeChallenge && input?.codeVerifier) {
      const hash = crypto.createHash('sha256').update(input.codeVerifier).digest();
      codeChallenge = hash.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    console.log('[LinkedIn OAuth Init] Configuration:', {
      clientId: clientId?.substring(0, 8) + '...',
      origin,
      redirectUri,
      state,
    });

    const scope = 'r_liteprofile r_emailaddress w_member_social';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
    });
    if (codeChallenge) {
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
    }
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    
    console.log('[LinkedIn OAuth Init] Returning auth URL');
    return { authUrl, isDemoMode: false, redirectUri, state, pkce: Boolean(codeChallenge) };
  } catch (error: any) {
    console.error('[LinkedIn OAuth Init] Error:', error);
    throw new Error(`LinkedIn OAuth initialization failed: ${error.message}`);
  }
});

export const linkedinOAuthCallbackProcedure = publicProcedure
  .input(z.object({
    code: z.string(),
    codeVerifier: z.string().optional(),
    state: z.string().optional(),
    isDemoMode: z.boolean().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const isDemoMode = input.isDemoMode || process.env.DEMO_MODE === 'true' || !process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET;
    
    if (isDemoMode) {
      console.log('[LinkedIn OAuth] Callback in demo mode');
      return {
        accessToken: 'demo_linkedin_access_token',
        refreshToken: 'demo_linkedin_refresh_token',
        userId: 'demo_linkedin_user_id',
        username: 'demo_linkedin_user',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    const clientId = process.env.LINKEDIN_CLIENT_ID as string;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET as string;
    const origin = resolveOrigin(ctx.req as unknown as Request);
    const envRedirect = (process.env.LINKEDIN_REDIRECT_URI || '').trim();
    const redirectUri = envRedirect || `${origin}/api/platforms/oauth/linkedin/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('LinkedIn credentials not configured');
    }

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: input.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        ...(input.codeVerifier ? { code_verifier: input.codeVerifier } : {}),
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('[LinkedIn OAuth] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      let errorMessage = `Failed to exchange LinkedIn code for token (${response.status})`;
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
      console.error('[LinkedIn OAuth] Failed to parse response as JSON:', responseText);
      throw new Error('Invalid JSON response from LinkedIn API');
    }
    
    const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const userText = await userResponse.text();
    
    if (!userResponse.ok) {
      console.error('[LinkedIn OAuth] User info error:', {
        status: userResponse.status,
        body: userText
      });
      throw new Error(`Failed to fetch LinkedIn user info (${userResponse.status})`);
    }
    
    let userData: any;
    try {
      userData = JSON.parse(userText);
    } catch {
      console.error('[LinkedIn OAuth] Failed to parse user data:', userText);
      throw new Error('Invalid JSON user data from LinkedIn API');
    }

    const expiresIn = data.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      userId: userData.sub,
      username: userData.name,
      expiresAt,
    };
  });
