import { getBaseUrl } from "./api";
import { fetchWithTimeout } from "./fetchWithTimeout";
import type { WeeklyInsight, Platform } from "@/types/insights";

export async function fetchWeeklyInsights(params: {
  platforms: Array<{ platform: Platform; accessToken: string; userId: string }>;
}): Promise<WeeklyInsight> {
  const base = getBaseUrl();
  
  try {
    // Build platforms query string: "instagram:token:userId,linkedin:token:orgId,..."
    const platformsStr = params.platforms
      .map(p => `${p.platform}:${p.accessToken}:${p.userId}`)
      .join(',');
    
    const url = `${base}/api/insights/weekly?platforms=${encodeURIComponent(platformsStr)}`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const json = await res.json();
    
    if (!json.success) {
      throw new Error(json.error || 'API returned error');
    }
    
    const data = json.data;
    
    // Transform to WeeklyInsight format
    const weeklyInsight: WeeklyInsight = {
      weekStart: data.weekStart,
      weekEnd: data.weekEnd,
      totals: {
        reach: data.totals.reach || 0,
        engagement: data.totals.engagement || 0,
        newFollowers: data.totals.followers || 0,
        postsPublished: 0, // We don't track this yet
      },
      previousWeek: {
        reach: 0, // TODO: Implement previous week tracking
        engagement: 0,
        newFollowers: 0,
        postsPublished: 0,
      },
      platforms: data.platforms.map((p: any) => ({
        platform: p.platform,
        reach: p.insights.reach || p.insights.impressions || p.insights.weeklyViews || 0,
        engagement: p.insights.engagement || 0,
        averageEngagementRate: 0, // Calculate from reach/engagement
      })),
      topPosts: [], // TODO: Implement top posts from actual post data
    };
    
    return weeklyInsight;
    
  } catch (err) {
    console.error('[fetchWeeklyInsights] Error:', err);

    // Bei Fehler KEINE erfundenen Zahlen zurückgeben – das wäre irreführend
    // (Apple/Nutzervertrauen). Stattdessen Null-Werte mit error-Flag, damit
    // das UI einen ehrlichen "keine Daten"-Zustand anzeigen kann.
    const now = new Date();
    const weekEnd = now.toISOString();
    const weekStart = new Date(now.getTime() - 7 * 864e5).toISOString();

    return {
      weekStart,
      weekEnd,
      totals: { reach: 0, engagement: 0, newFollowers: 0, postsPublished: 0 },
      previousWeek: { reach: 0, engagement: 0, newFollowers: 0, postsPublished: 0 },
      platforms: params.platforms.map(p => ({
        platform: p.platform,
        reach: 0,
        engagement: 0,
        averageEngagementRate: 0,
      })),
      topPosts: [],
      error: err instanceof Error ? err.message : 'Daten konnten nicht geladen werden.',
    };
  }
}
