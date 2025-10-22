import { BACKEND_URL } from '../config';
import { postJSON } from '../util/debugFetch';

export type Platform = 'instagram' | 'linkedin' | 'tiktok' | 'youtube';

export type ConnectPayload =
  | { code: string; expiresAt?: string }
  | {
      accessToken: string;
      refreshToken?: string;
      userId: string;
      username: string;
      expiresAt?: string;
    };

export async function connectPlatform(platform: Platform, payload: ConnectPayload) {
  const url = `${BACKEND_URL}/api/platforms/connect/${platform}`;
  const result = await postJSON(url, payload);

  console.log('[OAuth][debug] result:', result);

  if (!result.ok) {
    throw new Error(
      `Backend error for ${platform}: ` +
        (typeof result.data === 'string' ? result.data : JSON.stringify(result.data))
    );
  }

  return result.data;
}
