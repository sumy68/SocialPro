import { z } from 'zod';
import { publicProcedure } from '../../../../create-context';

export const getTikTokAnalyticsProcedure = publicProcedure
  .input(z.object({
    accessToken: z.string(),
    openId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      console.log('[TikTok Analytics] Fetching analytics for user:', input.openId);

      const headers = {
        'Authorization': `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      };

      const userInfoUrl = `https://open.tiktokapis.com/v2/user/info/?fields=display_name,follower_count,following_count,video_count,likes_count`;
      const userInfoResponse = await fetch(userInfoUrl, { headers });
      const userInfoData = await userInfoResponse.json();

      if (!userInfoResponse.ok) {
        console.error('[TikTok Analytics] API Error:', userInfoData);
        throw new Error(userInfoData.error?.message || 'Failed to fetch TikTok analytics');
      }

      const userData = userInfoData.data?.user || {};

      console.log('[TikTok Analytics] Successfully fetched user data');

      return {
        displayName: userData.display_name || '',
        followers: userData.follower_count || 0,
        following: userData.following_count || 0,
        videoCount: userData.video_count || 0,
        likesCount: userData.likes_count || 0,
      };
    } catch (error) {
      console.error('[TikTok Analytics] Error:', error);
      throw error;
    }
  });

export const getTikTokVideoAnalyticsProcedure = publicProcedure
  .input(z.object({
    accessToken: z.string(),
    openId: z.string(),
    limit: z.number().optional().default(20),
  }))
  .query(async ({ input }) => {
    try {
      console.log('[TikTok Analytics] Fetching video analytics for user:', input.openId);

      const headers = {
        'Authorization': `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      };

      const videosUrl = `https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,share_url,view_count,like_count,comment_count,share_count,create_time&max_count=${input.limit}`;
      const videosResponse = await fetch(videosUrl, { 
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const videosData = await videosResponse.json();

      if (!videosResponse.ok) {
        console.error('[TikTok Analytics] Videos API Error:', videosData);
        throw new Error(videosData.error?.message || 'Failed to fetch TikTok videos');
      }

      const videos = videosData.data?.videos || [];
      const videosWithAnalytics = videos.map((video: any) => ({
        id: video.id,
        title: video.title || '',
        description: video.video_description || '',
        duration: video.duration || 0,
        coverUrl: video.cover_image_url || '',
        shareUrl: video.share_url || '',
        viewCount: video.view_count || 0,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        shares: video.share_count || 0,
        createdAt: video.create_time || Date.now(),
        engagement: (video.like_count || 0) + (video.comment_count || 0) + (video.share_count || 0),
      }));

      console.log('[TikTok Analytics] Successfully fetched video analytics:', videosWithAnalytics.length);

      return {
        videos: videosWithAnalytics,
        totalCount: videos.length,
      };
    } catch (error) {
      console.error('[TikTok Analytics] Error:', error);
      throw error;
    }
  });
