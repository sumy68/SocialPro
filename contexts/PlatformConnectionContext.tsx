import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Platform } from '@/constants/types';
import { trpcVanillaClient, isDemoMode } from '@/lib/trpc';
import { useApp } from './AppContext';
import { Alert } from 'react-native';

export interface PlatformConnectionStatus {
  platform: Platform;
  connected: boolean;
  accountName?: string;
  accountId?: string;
  isExpired?: boolean;
  expiresAt?: string;
  lastChecked?: string;
  error?: string;
}

export const [PlatformConnectionProvider, usePlatformConnection] = createContextHook(() => {
  const { connectedPlatforms, disconnectPlatform } = useApp();
  const [statusMap, setStatusMap] = useState<Record<Platform, PlatformConnectionStatus>>({
    instagram: { platform: 'instagram', connected: false },
    linkedin: { platform: 'linkedin', connected: false },
    tiktok: { platform: 'tiktok', connected: false },
    youtube: { platform: 'youtube', connected: false },
  });
  const [checking, setChecking] = useState<boolean>(false);
  const mounted = useRef<boolean>(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const checkPlatformStatus = useCallback(async (platform: Platform) => {
    console.log('[PlatformConnection] Checking status for:', platform);
    
    try {
      const platformData = connectedPlatforms.find(p => p.platform === platform);
      
      if (!platformData?.connected) {
        if (!mounted.current) return;
        setStatusMap(prev => ({
          ...prev,
          [platform]: {
            platform,
            connected: false,
            lastChecked: new Date().toISOString(),
          },
        }));
        return;
      }

      if (isDemoMode()) {
        const platformData = connectedPlatforms.find(p => p.platform === platform);
        if (!mounted.current) return;
        setStatusMap(prev => ({
          ...prev,
          [platform]: {
            platform,
            connected: !!platformData?.connected,
            accountName: platformData?.accountName,
            accountId: platformData?.accountId,
            isExpired: false,
            lastChecked: new Date().toISOString(),
          },
        }));
        return;
      }

      const tokenData = await trpcVanillaClient.platforms.getToken.query({ platform });
      
      if (!tokenData) {
        if (!mounted.current) return;
        setStatusMap(prev => ({
          ...prev,
          [platform]: {
            platform,
            connected: platformData.connected,
            accountName: platformData.accountName,
            accountId: platformData.accountId,
            lastChecked: new Date().toISOString(),
          },
        }));
        return;
      }

      if (!mounted.current) return;
      setStatusMap(prev => ({
        ...prev,
        [platform]: {
          platform,
          connected: true,
          accountName: platformData.accountName,
          accountId: tokenData.userId,
          isExpired: tokenData.isExpired,
          expiresAt: tokenData.expiresAt,
          lastChecked: new Date().toISOString(),
        },
      }));

      if (tokenData.isExpired) {
        console.log('[PlatformConnection] Token expired for:', platform);
        if (!mounted.current) return;
        setStatusMap(prev => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            error: 'Token expired. Please reconnect.',
          },
        }));
      }
    } catch (error: any) {
      console.log('[PlatformConnection] Error checking platform status:', error.message);
      
      let errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('JSON response but got text/html') || 
          errorMessage.includes('Response not OK') ||
          errorMessage.includes('Cannot connect to server') ||
          errorMessage.includes('Demo mode enabled')) {
        console.log('[PlatformConnection] Backend not available, using local state only');
        const platformData = connectedPlatforms.find(p => p.platform === platform);
        if (!mounted.current) return;
        setStatusMap(prev => ({
          ...prev,
          [platform]: {
            platform,
            connected: platformData?.connected || false,
            accountName: platformData?.accountName,
            accountId: platformData?.accountId,
            lastChecked: new Date().toISOString(),
          },
        }));
        return;
      }
      
      if (!mounted.current) return;
      setStatusMap(prev => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          error: errorMessage,
          lastChecked: new Date().toISOString(),
        },
      }));
    }
  }, [connectedPlatforms]);

  const checkAllPlatforms = useCallback(async () => {
    console.log('[PlatformConnection] Checking all platforms');
    if (mounted.current) setChecking(true);
    
    try {
      await Promise.all([
        checkPlatformStatus('instagram'),
        checkPlatformStatus('linkedin'),
        checkPlatformStatus('tiktok'),
        checkPlatformStatus('youtube'),
      ]);
    } catch (error) {
      console.error('[PlatformConnection] Error checking all platforms:', error);
    } finally {
      if (mounted.current) setChecking(false);
    }
  }, [checkPlatformStatus]);

  const refreshPlatformToken = useCallback(async (platform: Platform) => {
    console.log('[PlatformConnection] Refreshing token for:', platform);
    
    try {
      if (isDemoMode()) {
        await checkPlatformStatus(platform);
        return { success: true };
      }

      const result = await trpcVanillaClient.platforms.refreshToken.mutate({ platform });
      
      if (result.success) {
        await checkPlatformStatus(platform);
        return { success: true };
      }
      
      return { success: false, error: 'Failed to refresh token' };
    } catch (error: any) {
      console.log('[PlatformConnection] Error refreshing token:', error.message);
      
      const errorMessage = error.message || 'Failed to refresh token';
      
      if (errorMessage.includes('No refresh token') || errorMessage.includes('invalid_grant')) {
        await disconnectPlatform(platform);
        Alert.alert(
          'Reconnection Required',
          `Your ${platform} token has expired. Please reconnect to continue publishing.`,
          [{ text: 'OK' }]
        );
        return { success: false, requiresReauth: true, error: errorMessage };
      }
      
      return { success: false, requiresReauth: false, error: errorMessage };
    }
  }, [checkPlatformStatus, disconnectPlatform]);

  const getPublishToken = useCallback(async (platform: Platform) => {
    console.log('[PlatformConnection] Getting publish token for:', platform);
    
    const status = statusMap[platform];
    
    if (!status.connected) {
      throw new Error(`${platform} is not connected`);
    }
    
    if (status.isExpired) {
      console.log('[PlatformConnection] Token expired, attempting refresh...');
      const refreshResult = await refreshPlatformToken(platform);
      
      if (!refreshResult.success) {
        throw new Error(refreshResult.error || 'Token expired and refresh failed');
      }
    }
    
    if (isDemoMode()) {
      const local = connectedPlatforms.find(p => p.platform === platform);
      if (!local?.connected) throw new Error(`${platform} is not connected`);
      return {
        accessToken: local.accessToken ?? 'demo-token',
        userId: local.accountId ?? 'demo-user',
        username: local.accountName ?? 'Demo User',
      };
    }

    const tokenData = await trpcVanillaClient.platforms.getToken.query({ platform });
    
    if (!tokenData || !tokenData.accessToken) {
      throw new Error('No valid token available');
    }
    
    return {
      accessToken: tokenData.accessToken,
      userId: tokenData.userId,
      username: tokenData.username,
    };
  }, [statusMap, refreshPlatformToken, connectedPlatforms]);

  const connectedPlatformsList = useMemo(() => {
    return Object.values(statusMap).filter(p => p.connected);
  }, [statusMap]);

  return useMemo(() => ({
    statusMap,
    checking,
    connectedPlatformsList,
    checkPlatformStatus,
    checkAllPlatforms,
    refreshPlatformToken,
    getPublishToken,
  }), [
    statusMap,
    checking,
    connectedPlatformsList,
    checkPlatformStatus,
    checkAllPlatforms,
    refreshPlatformToken,
    getPublishToken,
  ]);
});
