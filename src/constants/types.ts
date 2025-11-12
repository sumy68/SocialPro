export type Platform = "instagram" | "linkedin" | "tiktok";

export type TonePreference =
  | "neutral" | "freundlich" | "professionell"
  | "casual"  | "serious"    | "inspiring"
  | "friendly"| "educational"| "authoritative"
  | "playful" | "empathetic";

export type CompanyInfo = {
  name?: string;
  companyName?: string;
  industry?: string;
  website?: string;
};

export type ConnectedPlatform = {
  platform: Platform;
  connected?: boolean;
  connectedAt?: string;
  accountName?: string;
  accountId?: string;
  accessToken?: string;
};

export type SubscriptionInfo = {
  plan: "free" | "pro" | "business" | "monthly" | "yearly";
  status?: "trial" | "active" | "expired";
  renewsAt?: string | null;
};

export type PostPerformance = {
  platform: Platform;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  impressions: number;
};

export type Post = {
  id: string;
  caption: string;
  createdAt?: string;
  postedAt?: string;
  scheduledDate?: string;
  status?: "draft" | "scheduled" | "posted";
  autoPost?: boolean;
  platform?: Platform;
  platforms?: Platform[];
  mediaUrls?: string[];
  mediaType?: "image" | "video" | "text";
  contentType?: "post" | "reel";
  performance?: PostPerformance[];
};
