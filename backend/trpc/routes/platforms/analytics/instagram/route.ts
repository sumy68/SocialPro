import { z } from 'zod';
import { publicProcedure } from '../../../../create-context';

export const getInstagramAnalyticsProcedure = publicProcedure
  .input(z.object({
    accessToken: z.string(),
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      console.log('[Instagram Analytics] Fetching analytics for user:', input.userId);

      const fieldsToFetch = 'followers_count,media_count,profile_views';
      const url = `https://graph.instagram.com/${input.userId}?fields=${fieldsToFetch}&access_token=${input.accessToken}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        console.error('[Instagram Analytics] API Error:', data);
        throw new Error(data.error?.message || 'Failed to fetch Instagram analytics');
      }

      console.log('[Instagram Analytics] Successfully fetched profile data');

      return {
        followers: data.followers_count || 0,
        mediaCount: data.media_count || 0,
        profileViews: data.profile_views || 0,
      };
    } catch (error) {
      console.error('[Instagram Analytics] Error:', error);
      throw error;
    }
  });

export const getInstagramMediaInsightsProcedure = publicProcedure
  .input(z.object({
    accessToken: z.string(),
    userId: z.string(),
    limit: z.number().optional().default(25),
  }))
  .query(async ({ input }) => {
    try {
      console.log('[Instagram Analytics] Fetching media insights for user:', input.userId);

      const mediaUrl = `https://graph.instagram.com/${input.userId}/media?fields=id,caption,media_type,media_url,timestamp,like_count,comments_count,permalink&limit=${input.limit}&access_token=${input.accessToken}`;
      
      const mediaResponse = await fetch(mediaUrl);
      const mediaData = await mediaResponse.json();

      if (!mediaResponse.ok) {
        console.error('[Instagram Analytics] Media API Error:', mediaData);
        throw new Error(mediaData.error?.message || 'Failed to fetch Instagram media');
      }

      const media = mediaData.data || [];
      const postsWithInsights = [];

      for (const post of media) {
        try {
          const insightsUrl = `https://graph.instagram.com/${post.id}/insights?metric=impressions,reach,engagement&access_token=${input.accessToken}`;
          const insightsResponse = await fetch(insightsUrl);
          const insightsData = await insightsResponse.json();

          const insights = insightsData.data || [];
          const impressions = insights.find((i: any) => i.name === 'impressions')?.values?.[0]?.value || 0;
          const reach = insights.find((i: any) => i.name === 'reach')?.values?.[0]?.value || 0;
          const engagement = insights.find((i: any) => i.name === 'engagement')?.values?.[0]?.value || 0;

          postsWithInsights.push({
            id: post.id,
            caption: post.caption || '',
            mediaType: post.media_type,
            mediaUrl: post.media_url,
            timestamp: post.timestamp,
            likes: post.like_count || 0,
            comments: post.comments_count || 0,
            impressions,
            reach,
            engagement,
            permalink: post.permalink,
          });
        } catch (insightError) {
          console.warn('[Instagram Analytics] Could not fetch insights for post:', post.id, insightError);
          postsWithInsights.push({
            id: post.id,
            caption: post.caption || '',
            mediaType: post.media_type,
            mediaUrl: post.media_url,
            timestamp: post.timestamp,
            likes: post.like_count || 0,
            comments: post.comments_count || 0,
            impressions: 0,
            reach: 0,
            engagement: 0,
            permalink: post.permalink,
          });
        }
      }

      console.log('[Instagram Analytics] Successfully fetched media insights:', postsWithInsights.length);

      return {
        posts: postsWithInsights,
        totalCount: mediaData.data?.length || 0,
      };
    } catch (error) {
      console.error('[Instagram Analytics] Error:', error);
      throw error;
    }
  });
