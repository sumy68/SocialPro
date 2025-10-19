import { z } from 'zod';
import { publicProcedure } from '../../../../create-context';

export const getYouTubeAnalyticsProcedure = publicProcedure
  .input(z.object({
    accessToken: z.string(),
    channelId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      console.log('[YouTube Analytics] Fetching analytics for channel:', input.channelId);

      const headers = {
        'Authorization': `Bearer ${input.accessToken}`,
      };

      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${input.channelId}`;
      const channelResponse = await fetch(channelUrl, { headers });
      const channelData = await channelResponse.json();

      if (!channelResponse.ok) {
        console.error('[YouTube Analytics] API Error:', channelData);
        throw new Error(channelData.error?.message || 'Failed to fetch YouTube analytics');
      }

      const channel = channelData.items?.[0];
      if (!channel) {
        throw new Error('Channel not found');
      }

      const statistics = channel.statistics || {};

      console.log('[YouTube Analytics] Successfully fetched channel data');

      return {
        channelTitle: channel.snippet?.title || '',
        subscribers: parseInt(statistics.subscriberCount || '0', 10),
        totalViews: parseInt(statistics.viewCount || '0', 10),
        videoCount: parseInt(statistics.videoCount || '0', 10),
      };
    } catch (error) {
      console.error('[YouTube Analytics] Error:', error);
      throw error;
    }
  });

export const getYouTubeVideoAnalyticsProcedure = publicProcedure
  .input(z.object({
    accessToken: z.string(),
    channelId: z.string(),
    maxResults: z.number().optional().default(25),
  }))
  .query(async ({ input }) => {
    try {
      console.log('[YouTube Analytics] Fetching video analytics for channel:', input.channelId);

      const headers = {
        'Authorization': `Bearer ${input.accessToken}`,
      };

      const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${input.channelId}&maxResults=${input.maxResults}&order=date&type=video`;
      const videosResponse = await fetch(videosUrl, { headers });
      const videosData = await videosResponse.json();

      if (!videosResponse.ok) {
        console.error('[YouTube Analytics] Videos API Error:', videosData);
        throw new Error(videosData.error?.message || 'Failed to fetch YouTube videos');
      }

      const videos = videosData.items || [];
      const videoIds = videos.map((v: any) => v.id.videoId).join(',');

      if (!videoIds) {
        return {
          videos: [],
          totalCount: 0,
        };
      }

      const statisticsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}`;
      const statisticsResponse = await fetch(statisticsUrl, { headers });
      const statisticsData = await statisticsResponse.json();

      if (!statisticsResponse.ok) {
        console.error('[YouTube Analytics] Statistics API Error:', statisticsData);
        throw new Error(statisticsData.error?.message || 'Failed to fetch video statistics');
      }

      const videosWithAnalytics = (statisticsData.items || []).map((video: any) => {
        const stats = video.statistics || {};
        const viewCount = parseInt(stats.viewCount || '0', 10);
        const likeCount = parseInt(stats.likeCount || '0', 10);
        const commentCount = parseInt(stats.commentCount || '0', 10);

        return {
          id: video.id,
          title: video.snippet?.title || '',
          description: video.snippet?.description || '',
          thumbnailUrl: video.snippet?.thumbnails?.medium?.url || '',
          publishedAt: video.snippet?.publishedAt || '',
          views: viewCount,
          likes: likeCount,
          comments: commentCount,
          engagement: likeCount + commentCount,
        };
      });

      console.log('[YouTube Analytics] Successfully fetched video analytics:', videosWithAnalytics.length);

      return {
        videos: videosWithAnalytics,
        totalCount: videosWithAnalytics.length,
      };
    } catch (error) {
      console.error('[YouTube Analytics] Error:', error);
      throw error;
    }
  });
