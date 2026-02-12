import { useMemo } from "react";
import { translations } from '@/constants/translations';
import type { Language } from '@/constants/translations';
import { useQuery } from "@tanstack/react-query";
import { fetchWeeklyInsights } from "@/lib/insights";
import type { Platform } from "@/types/insights";

type ConnectedPlatform = { 
  platform: Platform; 
  connected?: boolean; 
  connectedAt?: string;
  accessToken?: string;
  accountId?: string;
};
type Post = { id: string; caption: string; scheduledDate?: string; platforms?: Platform[]; mediaUrls?: string[] };

export function useWeeklyData(params: {
  connectedPlatforms: ConnectedPlatform[];
  posts: Post[];
  language: "de" | "en" | string;
}) {
  const { connectedPlatforms, posts, language } = params;

  // Build platform params with tokens
  const platformParams = useMemo(() => 
    connectedPlatforms
      .filter(p => p.connected && p.accessToken && p.accountId)
      .map(p => ({
        platform: p.platform,
        accessToken: p.accessToken!,
        userId: p.accountId!,
      })),
    [connectedPlatforms]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-insights", platformParams.map(p => p.platform).sort().join(","), language],
    queryFn: () => fetchWeeklyInsights({ platforms: platformParams }),
    staleTime: 5 * 60 * 1000,
    enabled: platformParams.length > 0, // Only run if we have connected platforms with tokens
  });

  // Map in das Format deines Screens
  const weeklyData = useMemo(() => {
    if (!data) {
      // Minimaler Fallback bis Query resolved (UI zeigt Loader über isLoading)
      const now = new Date();
      return {
        weekStart: now,
        weekEnd: now,
        totalReach: 0,
        totalEngagement: 0,
        newFollowers: 0,
        postsPublished: 0,
        comparisonToPreviousWeek: {
          reach: { change: 0, changePercent: 0 },
          engagement: { change: 0, changePercent: 0 },
          followers: { change: 0, changePercent: 0 },
          posts: { change: 0, changePercent: 0 },
        },
        topPerformingPosts: [] as Array<{
          id: string; platform: string; content: string; thumbnail?: string;
          publishedAt: Date; reach: number; likes: number; comments: number; shares: number;
        }>,
        platformPerformance: [] as Array<{
          platform: string; reach: number; engagement: number; averageEngagementRate: number; color: string;
        }>,
        insights: [] as Array<{ title: string; description: string; value: string; trend: 'up'|'down'|'neutral'; color: string }>,
        recommendations: [] as Array<{ title: string; description: string; action: string; priority: 'high'|'medium'|'low'; color: string }>,
      };
    }

    const getPlatformColor = (p: string) => {
      switch (p) {
        case "instagram": return "#E1306C";
        case "tiktok": return "#000000";
        case "linkedin": return "#0A66C2";
        default: return "#5B72ED";
      }
    };

    const prev = data.previousWeek;
    const cmp = {
      reach: {
        change: data.totals.reach - (prev?.reach ?? 0),
        changePercent: (prev?.reach ?? 0) > 0 ? ((data.totals.reach - (prev!.reach)) / prev!.reach) * 100 : 0,
      },
      engagement: {
        change: data.totals.engagement - (prev?.engagement ?? 0),
        changePercent: (prev?.engagement ?? 0) > 0 ? ((data.totals.engagement - (prev!.engagement)) / prev!.engagement) * 100 : 0,
      },
      followers: {
        change: data.totals.newFollowers - (prev?.newFollowers ?? 0),
        changePercent: (prev?.newFollowers ?? 0) > 0 ? ((data.totals.newFollowers - (prev!.newFollowers)) / prev!.newFollowers) * 100 : 0,
      },
      posts: {
        change: data.totals.postsPublished - (prev?.postsPublished ?? 0),
        changePercent: (prev?.postsPublished ?? 0) > 0 ? ((data.totals.postsPublished - (prev!.postsPublished)) / prev!.postsPublished) * 100 : 0,
      },
    };

    const platformPerformance = (data.platforms || []).map(p => ({
      platform: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
      reach: p.reach,
      engagement: p.engagement,
      averageEngagementRate: p.averageEngagementRate,
      color: getPlatformColor(p.platform),
    }));

    const topPerformingPosts = (data.topPosts || []).map(tp => ({
      id: tp.id,
      platform: tp.platform.charAt(0).toUpperCase() + tp.platform.slice(1),
      content: tp.caption,
      thumbnail: tp.mediaUrl,
      publishedAt: new Date(tp.scheduledDate || Date.now()),
      reach: tp.reach,
      likes: tp.likes,
      comments: tp.comments,
      shares: tp.shares,
    }));

        const d = (translations[language as Language] ?? translations.de).dashboard;
    const insightValue = cmp.engagement.changePercent >= 0 ? `+${cmp.engagement.changePercent.toFixed(1)}%` : `${cmp.engagement.changePercent.toFixed(1)}%`;
        const d = (translations[language as Language] ?? translations.de).dashboard;
    const insightValue = cmp.engagement.changePercent >= 0 ? `+${cmp.engagement.changePercent.toFixed(1)}%` : `${cmp.engagement.changePercent.toFixed(1)}%`;
    const insights = [
      {
        title: d.bestPostingTime || 'Best Posting Time',
        description: d.bestPostingTimeDesc || 'Posts in the afternoon get more engagement',
        value: insightValue,
        trend: (cmp.engagement.change >= 0 ? 'up' : 'down') as 'up'|'down',
        color: cmp.engagement.change >= 0 ? '#10B981' : '#EF4444',
      },
    ];

    const recommendations = [
      {
        title: d.createMoreVideo || 'Create More Video Content',
        description: d.createMoreVideoDesc || 'Videos often perform better. Plan 3-4 videos per week.',
        action: d.createReels || 'Plan Video',
        priority: 'high' as const,
        color: '#EF4444',
      },
    ];

    return {
      weekStart: new Date(data.weekStart),
      weekEnd: new Date(data.weekEnd),
      totalReach: data.totals.reach,
      totalEngagement: data.totals.engagement,
      newFollowers: data.totals.newFollowers,
      postsPublished: data.totals.postsPublished,
      comparisonToPreviousWeek: cmp,
      topPerformingPosts,
      platformPerformance,
      insights,
      recommendations,
    };
  }, [data, language]);

  return { data: weeklyData, isLoading };
}
