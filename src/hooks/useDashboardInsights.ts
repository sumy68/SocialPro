import { useMemo } from 'react';
import { useWeeklyData } from '@/hooks/useWeeklyData';
import { useApp } from '@/contexts/AppContext';

type DashboardInsights = {
  weekLabel: string;
  weeklySummary: {
    totalReach: number;
    totalInteractions: number;
    newFollowers: number;
  };
  reachBreakdown: {
    organic: number;
    paid: number;
    viral: number;
    stories: number;
  };
  engagementBreakdown: {
    likes: number;
    likesChange: number;
    comments: number;
    commentsChange: number;
    shares: number;
    sharesChange: number;
    saves: number;
    savesChange: number;
  };
  platforms: Array<{
    platform: string;
    followers: number;
    engagement: number;
    reach: number;
    change: string;
    color: string;
  }>;
};

export function useDashboardInsights() {
  const { connectedPlatforms, posts, language } = useApp();

  const weeklyQuery = useWeeklyData({
    connectedPlatforms,
    posts,
    language,
  });

  const insights = useMemo<DashboardInsights | undefined>(() => {
    const data: any = weeklyQuery.data;
    if (!data) return undefined;

    return {
      weekLabel: data.weekLabel ?? '',

      weeklySummary: {
        totalReach: data.summary?.totalReach ?? 0,
        totalInteractions: data.summary?.totalInteractions ?? 0,
        newFollowers: data.summary?.newFollowers ?? 0,
      },

      reachBreakdown: {
        organic: data.reach?.organic ?? 0,
        paid: data.reach?.paid ?? 0,
        viral: data.reach?.viral ?? 0,
        stories: data.reach?.stories ?? 0,
      },

      engagementBreakdown: {
        likes: data.engagement?.likes ?? 0,
        likesChange: data.engagement?.likesChange ?? 0,
        comments: data.engagement?.comments ?? 0,
        commentsChange: data.engagement?.commentsChange ?? 0,
        shares: data.engagement?.shares ?? 0,
        sharesChange: data.engagement?.sharesChange ?? 0,
        saves: data.engagement?.saves ?? 0,
        savesChange: data.engagement?.savesChange ?? 0,
      },

      platforms: (data.platforms ?? []).map((p: any) => ({
        platform: p.platform,
        followers: p.followers ?? 0,
        engagement: p.engagement ?? 0,
        reach: p.reach ?? 0,
        change: p.change ?? '+0%',
        color: p.color ?? '#e11d48',
      })),
    };
  }, [weeklyQuery.data]);

  return {
    ...weeklyQuery,
    data: insights,
  };
}
