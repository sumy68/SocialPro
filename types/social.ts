export interface Platform {
  name: string;
  followers: string;
  engagement: string;
  reach: string;
  color: string;
  change: string;
}

export interface Post {
  id: number;
  platform: string;
  content: string;
  engagement: string;
  reach: string;
  date: string;
  performance: "exceptional" | "good" | "average" | "poor";
}

export interface Stat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  color: string;
}

export interface ScheduledPost {
  id: number;
  date: string;
  time: string;
  platform: string;
  type: string;
  content: string;
  status: "scheduled" | "draft" | "published";
  color: string;
}

export interface AIInsight {
  type: "trend" | "timing" | "hashtag" | "content";
  title: string;
  description: string;
  action: string;
  color: string;
}

export interface SocialMediaAccount {
  id: string;
  platform: string;
  username: string;
  isConnected: boolean;
  accessToken?: string;
  profilePicture?: string;
  followers?: number;
  lastSync?: Date;
}

export interface MediaFile {
  id: string;
  uri: string;
  type: 'image' | 'video';
  name: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  duration?: number; // for videos
  uploadedAt: Date;
}

export interface WeeklyReviewData {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  totalReach: number;
  totalEngagement: number;
  newFollowers: number;
  profileVisits: number;
  postsPublished: number;
  topPerformingPosts: TopPerformingPost[];
  platformPerformance: PlatformWeeklyPerformance[];
  insights: WeeklyInsight[];
  recommendations: WeeklyRecommendation[];
  comparisonToPreviousWeek: WeeklyComparison;
}

export interface TopPerformingPost {
  id: string;
  platform: string;
  content: string;
  type: 'post' | 'reel' | 'story';
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  publishedAt: Date;
  thumbnail?: string;
}

export interface PlatformWeeklyPerformance {
  platform: string;
  reach: number;
  engagement: number;
  followers: number;
  posts: number;
  averageEngagementRate: number;
  color: string;
}

export interface WeeklyInsight {
  type: 'performance' | 'timing' | 'content' | 'audience';
  title: string;
  description: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export interface WeeklyRecommendation {
  type: 'content' | 'timing' | 'hashtag' | 'platform';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  color: string;
}

export interface WeeklyComparison {
  reach: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  engagement: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  followers: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  posts: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
}