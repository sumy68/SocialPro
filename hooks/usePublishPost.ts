import { useState, useCallback } from 'react';
import { Platform } from '@/constants/types';
import { trpc, isDemoMode } from '@/lib/trpc';
import { usePlatformConnection } from '@/contexts/PlatformConnectionContext';
import { Alert } from 'react-native';

interface PublishPostInput {
  platform: Platform;
  caption: string;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video';
  contentType?: 'post' | 'reel';
}

export function usePublishPost() {
  const [publishing, setPublishing] = useState<Platform[]>([]);
  const [errors, setErrors] = useState<Record<Platform, string | null>>({
    instagram: null,
    linkedin: null,
    tiktok: null,
    youtube: null,
  });

  const { getPublishToken, refreshPlatformToken } = usePlatformConnection();
  const publishMutation = trpc.platforms.publish.useMutation();

  const publishToSinglePlatform = useCallback(async (input: PublishPostInput) => {
    console.log('[PublishPost] Publishing to:', input.platform);
    
    try {
      const tokenData = await getPublishToken(input.platform);
      
      if (isDemoMode()) {
        console.log('[PublishPost] Demo mode: simulating publish success');
        return { success: true, data: { id: 'demo', status: 'posted' } } as any;
      }

      const result = await publishMutation.mutateAsync({
        platform: input.platform,
        caption: input.caption,
        mediaUrls: input.mediaUrls,
        mediaType: input.mediaType,
        accessToken: tokenData.accessToken,
        userId: tokenData.userId,
        contentType: input.contentType,
      });
      
      console.log('[PublishPost] Successfully published to:', input.platform);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('[PublishPost] Error publishing to', input.platform, ':', error);
      
      if (error.message.includes('Token expired') || error.message.includes('invalid_token')) {
        console.log('[PublishPost] Token expired, attempting refresh...');
        
        try {
          const refreshResult = await refreshPlatformToken(input.platform);
          
          if (refreshResult.success) {
            console.log('[PublishPost] Token refreshed, retrying publish...');
            const tokenData = await getPublishToken(input.platform);
            
            const result = await publishMutation.mutateAsync({
              platform: input.platform,
              caption: input.caption,
              mediaUrls: input.mediaUrls,
              mediaType: input.mediaType,
              accessToken: tokenData.accessToken,
              userId: tokenData.userId,
              contentType: input.contentType,
            });
            
            return { success: true, data: result };
          } else if (refreshResult.requiresReauth) {
            return {
              success: false,
              requiresReauth: true,
              error: 'Please reconnect your account',
            };
          }
        } catch (refreshError) {
          console.error('[PublishPost] Failed to refresh token:', refreshError);
        }
      }
      
      return {
        success: false,
        requiresReauth: false,
        error: error.message || 'Failed to publish post',
      };
    }
  }, [getPublishToken, publishMutation, refreshPlatformToken]);

  const publishToMultiplePlatforms = useCallback(async (
    platforms: Platform[],
    input: Omit<PublishPostInput, 'platform'>
  ) => {
    console.log('[PublishPost] Publishing to multiple platforms:', platforms);
    
    setPublishing(platforms);
    setErrors({
      instagram: null,
      linkedin: null,
      tiktok: null,
      youtube: null,
    });

    const results = await Promise.allSettled(
      platforms.map(platform =>
        publishToSinglePlatform({ ...input, platform })
      )
    );

    const successfulPlatforms: Platform[] = [];
    const failedPlatforms: Platform[] = [];
    const requiresReauth: Platform[] = [];
    const newErrors: Record<Platform, string | null> = {
      instagram: null,
      linkedin: null,
      tiktok: null,
      youtube: null,
    };

    results.forEach((result, index) => {
      const platform = platforms[index];
      
      if (result.status === 'fulfilled' && result.value.success) {
        successfulPlatforms.push(platform);
      } else if (result.status === 'fulfilled' && result.value.requiresReauth) {
        requiresReauth.push(platform);
        newErrors[platform] = result.value.error || 'Reconnection required';
        failedPlatforms.push(platform);
      } else if (result.status === 'fulfilled') {
        failedPlatforms.push(platform);
        newErrors[platform] = result.value.error || 'Failed to publish';
      } else {
        failedPlatforms.push(platform);
        newErrors[platform] = result.reason?.message || 'Failed to publish';
      }
    });

    setErrors(newErrors);
    setPublishing([]);

    if (requiresReauth.length > 0) {
      Alert.alert(
        'Reconnection Required',
        `Please reconnect: ${requiresReauth.join(', ')}`,
        [{ text: 'OK' }]
      );
    }

    console.log('[PublishPost] Publish results:', {
      successful: successfulPlatforms,
      failed: failedPlatforms,
      requiresReauth,
    });

    return {
      successfulPlatforms,
      failedPlatforms,
      requiresReauth,
      errors: newErrors,
    };
  }, [publishToSinglePlatform]);

  const isPublishing = useCallback((platform?: Platform) => {
    if (platform) {
      return publishing.includes(platform);
    }
    return publishing.length > 0;
  }, [publishing]);

  return {
    publishToSinglePlatform,
    publishToMultiplePlatforms,
    isPublishing,
    publishing,
    errors,
  };
}
