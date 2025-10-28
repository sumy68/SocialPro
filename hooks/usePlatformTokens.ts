import { useState, useCallback, useEffect } from 'react';
import { Platform } from '@/constants/types';
import { trpc, trpcClient, isDemoMode } from '@/lib/trpc';
import { useApp } from '@/contexts/AppContext';

export function usePlatformTokens() {
  const { connectedPlatforms, disconnectPlatform } = useApp();
  const [refreshing, setRefreshing] = useState<Platform | null>(null);
  const [errors, setErrors] = useState<Record<Platform, string | null>>({
    instagram: null,
    linkedin: null,
    tiktok: null,
    youtube: null,
  });

  const refreshTokenMutation = trpc.platforms.refreshToken.useMutation();

  const checkTokenExpiry = useCallback(async (platform: Platform) => {
    console.log('[TokenManager] Checking token expiry for:', platform);
    
    const platformData = connectedPlatforms.find(p => p.platform === platform);
    
    if (!platformData?.connected) {
      return { isValid: false, needsRefresh: false };
    }

    try {
      if (isDemoMode()) {
        return { isValid: true, needsRefresh: false, data: { accessToken: 'demo-token' } } as any;
      }

      const tokenData = await trpcClient.platforms.getToken.query({} as any, { platform });
      
      if (!tokenData) {
        return { isValid: false, needsRefresh: false };
      }

      if (tokenData.isExpired) {
        console.log('[TokenManager] Token expired for:', platform);
        return { isValid: false, needsRefresh: true, data: tokenData };
      }

      const expiryDate = tokenData.expiresAt ? new Date(tokenData.expiresAt) : null;
      if (expiryDate) {
        const hoursUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60);
        
        if (hoursUntilExpiry < 24) {
          console.log('[TokenManager] Token expiring soon for:', platform);
          return { isValid: true, needsRefresh: true, data: tokenData };
        }
      }

      return { isValid: true, needsRefresh: false, data: tokenData };
    } catch (error: any) {
      console.error('[TokenManager] Error checking token:', error);
      return { isValid: false, needsRefresh: false };
    }
  }, [connectedPlatforms]);

  const refreshToken = useCallback(async (platform: Platform) => {
    console.log('[TokenManager] Refreshing token for:', platform);
    setRefreshing(platform);
    setErrors(prev => ({ ...prev, [platform]: null }));

    try {
      if (isDemoMode()) {
        console.log('[TokenManager] Demo mode: faking refresh success for', platform);
        return { success: true, data: { accessToken: 'demo-token' } } as any;
      }

      const result = await (refreshTokenMutation.mutateAsync) as any({ platform });
      console.log('[TokenManager] Token refreshed successfully for:', platform);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('[TokenManager] Error refreshing token:', error);
      const errorMessage = error.message || 'Failed to refresh token';
      setErrors(prev => ({ ...prev, [platform]: errorMessage }));
      
      if (errorMessage.includes('No refresh token') || errorMessage.includes('invalid_grant')) {
        console.log('[TokenManager] Re-authentication required for:', platform);
        await disconnectPlatform(platform);
        return { success: false, requiresReauth: true, error: errorMessage };
      }
      
      return { success: false, requiresReauth: false, error: errorMessage };
    } finally {
      setRefreshing(null);
    }
  }, [refreshTokenMutation, disconnectPlatform]);

  const getValidToken = useCallback(async (platform: Platform) => {
    console.log('[TokenManager] Getting valid token for:', platform);
    
    const status = await checkTokenExpiry(platform);
    
    if (!status.isValid) {
      if (status.needsRefresh) {
        const refreshResult = await refreshToken(platform);
        if (refreshResult.success && refreshResult.data) {
          return { token: refreshResult.data.accessToken, refreshed: true };
        }
        throw new Error(refreshResult.error || 'Failed to refresh token');
      }
      throw new Error('No valid token available');
    }
    
    if (status.needsRefresh) {
      refreshToken(platform);
    }
    
    return { token: status.data?.accessToken, refreshed: false };
  }, [checkTokenExpiry, refreshToken]);

  const checkAllConnectedPlatforms = useCallback(async () => {
    console.log('[TokenManager] Checking all connected platforms');
    
    const results = await Promise.all(
      connectedPlatforms
        .filter(p => p.connected)
        .map(async p => {
          const status = await checkTokenExpiry(p.platform);
          return { platform: p.platform, ...status };
        })
    );
    
    return results;
  }, [connectedPlatforms, checkTokenExpiry]);

  useEffect(() => {
    checkAllConnectedPlatforms();
    
    const interval = setInterval(() => {
      checkAllConnectedPlatforms();
    }, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkAllConnectedPlatforms]);

  return {
    refreshing,
    errors,
    checkTokenExpiry,
    refreshToken,
    getValidToken,
    checkAllConnectedPlatforms,
  };
}
