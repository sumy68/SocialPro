import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Platform } from '@/constants/types';
import { useMemo } from 'react';

export function usePlatformAnalytics(platform: Platform) {
  const { connectedPlatforms } = useApp();
  
  const platformData = useMemo(
    () => connectedPlatforms.find(p => p.platform === platform),
    [connectedPlatforms, platform]
  );

  const isConnected = platformData?.connected && platformData?.accessToken;

  const instagramQuery = trpc.platforms.analytics.instagram.getProfile.useQuery(
    {
      accessToken: platformData?.accessToken || '',
      userId: platformData?.accountId || '',
    },
    {
      enabled: platform === 'instagram' && !!isConnected,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const linkedinQuery = trpc.platforms.analytics.linkedin.getProfile.useQuery(
    {
      accessToken: platformData?.accessToken || '',
      userId: platformData?.accountId || '',
    },
    {
      enabled: platform === 'linkedin' && !!isConnected,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const tiktokQuery = trpc.platforms.analytics.tiktok.getProfile.useQuery(
    {
      accessToken: platformData?.accessToken || '',
      openId: platformData?.accountId || '',
    },
    {
      enabled: platform === 'tiktok' && !!isConnected,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const youtubeQuery = trpc.platforms.analytics.youtube.getChannel.useQuery(
    {
      accessToken: platformData?.accessToken || '',
      channelId: platformData?.accountId || '',
    },
    {
      enabled: platform === 'youtube' && !!isConnected,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const query = useMemo(() => {
    switch (platform) {
      case 'instagram':
        return instagramQuery;
      case 'linkedin':
        return linkedinQuery;
      case 'tiktok':
        return tiktokQuery;
      case 'youtube':
        return youtubeQuery;
      default:
        return { data: null, isLoading: false, error: null };
    }
  }, [platform, instagramQuery, linkedinQuery, tiktokQuery, youtubeQuery]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isConnected,
  };
}

export function useAllPlatformsAnalytics() {
  const { connectedPlatforms } = useApp();

  const connectedPlatformsList = useMemo(
    () => connectedPlatforms.filter(p => p.connected && p.accessToken),
    [connectedPlatforms]
  );

  const instagramQuery = trpc.platforms.analytics.instagram.getProfile.useQuery(
    {
      accessToken: connectedPlatformsList.find(p => p.platform === 'instagram')?.accessToken || '',
      userId: connectedPlatformsList.find(p => p.platform === 'instagram')?.accountId || '',
    },
    {
      enabled: connectedPlatformsList.some(p => p.platform === 'instagram'),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const linkedinQuery = trpc.platforms.analytics.linkedin.getProfile.useQuery(
    {
      accessToken: connectedPlatformsList.find(p => p.platform === 'linkedin')?.accessToken || '',
      userId: connectedPlatformsList.find(p => p.platform === 'linkedin')?.accountId || '',
    },
    {
      enabled: connectedPlatformsList.some(p => p.platform === 'linkedin'),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const tiktokQuery = trpc.platforms.analytics.tiktok.getProfile.useQuery(
    {
      accessToken: connectedPlatformsList.find(p => p.platform === 'tiktok')?.accessToken || '',
      openId: connectedPlatformsList.find(p => p.platform === 'tiktok')?.accountId || '',
    },
    {
      enabled: connectedPlatformsList.some(p => p.platform === 'tiktok'),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const youtubeQuery = trpc.platforms.analytics.youtube.getChannel.useQuery(
    {
      accessToken: connectedPlatformsList.find(p => p.platform === 'youtube')?.accessToken || '',
      channelId: connectedPlatformsList.find(p => p.platform === 'youtube')?.accountId || '',
    },
    {
      enabled: connectedPlatformsList.some(p => p.platform === 'youtube'),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const platformsData = useMemo(() => {
    const data: { platform: Platform; followers: number; reach: number; engagement: number }[] = [];

    if (instagramQuery.data) {
      data.push({
        platform: 'instagram',
        followers: instagramQuery.data.followers,
        reach: instagramQuery.data.profileViews || 0,
        engagement: 0,
      });
    }

    if (linkedinQuery.data) {
      data.push({
        platform: 'linkedin',
        followers: linkedinQuery.data.followers,
        reach: 0,
        engagement: 0,
      });
    }

    if (tiktokQuery.data) {
      data.push({
        platform: 'tiktok',
        followers: tiktokQuery.data.followers,
        reach: 0,
        engagement: 0,
      });
    }

    if (youtubeQuery.data) {
      data.push({
        platform: 'youtube',
        followers: youtubeQuery.data.subscribers,
        reach: youtubeQuery.data.totalViews,
        engagement: 0,
      });
    }

    return data;
  }, [instagramQuery.data, linkedinQuery.data, tiktokQuery.data, youtubeQuery.data]);

  const isLoading = 
    instagramQuery.isLoading || 
    linkedinQuery.isLoading || 
    tiktokQuery.isLoading || 
    youtubeQuery.isLoading;

  const totalFollowers = useMemo(
    () => platformsData.reduce((sum, p) => sum + p.followers, 0),
    [platformsData]
  );

  const totalReach = useMemo(
    () => platformsData.reduce((sum, p) => sum + p.reach, 0),
    [platformsData]
  );

  return {
    platformsData,
    totalFollowers,
    totalReach,
    isLoading,
  };
}
