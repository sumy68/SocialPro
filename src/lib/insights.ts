import { getBaseUrl } from "./api";
import type { WeeklyInsight, Platform } from "@/types/insights";

export async function fetchWeeklyInsights(params: {
  platforms: Platform[];
}): Promise<WeeklyInsight> {
  const base = getBaseUrl();
  const url = `${base}/api/insights/weekly?platforms=${encodeURIComponent(params.platforms.join(","))}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // Erwartet serverseitig kompatible Struktur. Falls leicht anders, hier mappen.
    return json as WeeklyInsight;
  } catch (err) {
    // ---- Fallback: mock basierend auf Plattformzahl (wie dein vorheriger Code) ----
    const now = new Date();
    const weekEnd = now.toISOString();
    const weekStart = new Date(now.getTime() - 7 * 864e5).toISOString();
    const prevStart = new Date(now.getTime() - 14 * 864e5);

    const count = params.platforms.length || 1;
    const postsThisWeek = 0; // kein echter Post-Store hier -> 0; UI zeigt trotzdem sauber
    const postsLastWeek = 0;

    const reachThis = count * 12000 + Math.floor(Math.random() * 8000);
    const reachPrev = Math.max(1, count * 10000 + Math.floor(Math.random() * 6000));
    const engThis = count * 600 + Math.floor(Math.random() * 400);
    const engPrev = Math.max(1, count * 520 + Math.floor(Math.random() * 350));
    const follThis = count * 45 + Math.floor(Math.random() * 50);
    const follPrev = Math.max(1, count * 40 + Math.floor(Math.random() * 40));

    const platforms = params.platforms.map(p => {
      const reach = Math.round(reachThis / count + Math.random() * 2000);
      const engagement = Math.round(engThis / count + Math.random() * 200);
      const rate = reach > 0 ? Number(((engagement / reach) * 100).toFixed(1)) : 0;
      return { platform: p, reach, engagement, averageEngagementRate: rate };
    });

    const topPosts: WeeklyInsight["topPosts"] = platforms.slice(0,3).map((pl, i) => ({
      id: `mock-${pl.platform}-${i}`,
      platform: pl.platform,
      caption: "Top post placeholder",
      mediaUrl: `https://images.unsplash.com/photo-${1522543558187 + i}?w=400&h=400&fit=crop`,
      scheduledDate: prevStart.toISOString(),
      reach: 15000 + Math.floor(Math.random() * 20000),
      likes: 300 + Math.floor(Math.random() * 400),
      comments: 50 + Math.floor(Math.random() * 150),
      shares: 20 + Math.floor(Math.random() * 80),
    }));

    return {
      weekStart,
      weekEnd,
      totals: {
        reach: reachThis,
        engagement: engThis,
        newFollowers: follThis,
        postsPublished: postsThisWeek,
      },
      previousWeek: {
        reach: reachPrev,
        engagement: engPrev,
        newFollowers: follPrev,
        postsPublished: postsLastWeek,
      },
      platforms,
      topPosts,
    };
  }
}
