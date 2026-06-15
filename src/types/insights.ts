export type Platform = "instagram" | "linkedin" | "tiktok";

export type WeeklyInsight = {
  weekStart: string; // ISO
  weekEnd: string;   // ISO
  totals: {
    reach: number;
    engagement: number;
    newFollowers: number;
    postsPublished: number;
  };
  previousWeek?: {
    reach: number;
    engagement: number;
    newFollowers: number;
    postsPublished: number;
  };
  platforms: Array<{
    platform: Platform;
    reach: number;
    engagement: number;
    averageEngagementRate: number; // %
  }>;
  topPosts: Array<{
    id: string;
    platform: Platform;
    caption: string;
    mediaUrl?: string;
    scheduledDate?: string;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
  // Gesetzt, wenn die Live-Daten nicht geladen werden konnten (Werte = 0).
  error?: string;
};
