export type Platform = 'linkedin' | 'instagram' | 'tiktok' | 'youtube';

export type PostStatus = 'scheduled' | 'posted' | 'failed' | 'draft';

export interface Post {
  id: string;
  platforms: Platform[];
  caption: string;
  hashtags: string[];
  mediaUrls?: string[];
  mediaType?: 'image' | 'video';
  scheduledDate: string;
  status: PostStatus;
  autoPost?: boolean;
  contentType?: 'post' | 'reel';
  postedAt?: string;
  performance?: {
    platform: Platform;
    reach: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    clicks: number;
  }[];
}

export type TonePreference =
  | 'casual'
  | 'serious'
  | 'inspiring'
  | 'professional'
  | 'friendly'
  | 'educational'
  | 'authoritative'
  | 'playful'
  | 'empathetic';

export interface CompanyInfo {
  companyName: string;
  industry: string;
  targetAudience: string;
  contentGoals: string;
  postingFrequency: 'daily' | 'weekly' | 'biweekly';
  tonePreference: TonePreference;
}

export interface ConnectedPlatform {
  platform: Platform;
  connected: boolean;
  accountName?: string;
  accountId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export type SubscriptionPlan = 'monthly' | 'yearly' | null;

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trialEndsAt?: string;
  expiresAt?: string;
}
