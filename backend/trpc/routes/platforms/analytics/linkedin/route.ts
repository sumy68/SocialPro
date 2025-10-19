import { z } from 'zod';
import { publicProcedure } from '../../../../create-context';

export const getLinkedInAnalyticsProcedure = publicProcedure
  .input(z.object({
    accessToken: z.string(),
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      console.log('[LinkedIn Analytics] Fetching analytics for user:', input.userId);

      const headers = {
        'Authorization': `Bearer ${input.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      };

      const profileUrl = `https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)`;
      const profileResponse = await fetch(profileUrl, { headers });
      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        console.error('[LinkedIn Analytics] API Error:', profileData);
        throw new Error('Failed to fetch LinkedIn profile');
      }

      const organizationUrl = `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${input.userId}`;
      const followerResponse = await fetch(organizationUrl, { headers });
      const followerData = await followerResponse.json();

      let followers = 0;
      if (followerResponse.ok && followerData.elements && followerData.elements.length > 0) {
        followers = followerData.elements[0].followerCounts?.organicFollowerCount || 0;
      }

      console.log('[LinkedIn Analytics] Successfully fetched profile data');

      return {
        followers,
        firstName: profileData.localizedFirstName,
        lastName: profileData.localizedLastName,
      };
    } catch (error) {
      console.error('[LinkedIn Analytics] Error:', error);
      throw error;
    }
  });

export const getLinkedInPostAnalyticsProcedure = publicProcedure
  .input(z.object({
    accessToken: z.string(),
    userId: z.string(),
    count: z.number().optional().default(25),
  }))
  .query(async ({ input }) => {
    try {
      console.log('[LinkedIn Analytics] Fetching post analytics for user:', input.userId);

      const headers = {
        'Authorization': `Bearer ${input.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      };

      const postsUrl = `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:${input.userId})&count=${input.count}`;
      const postsResponse = await fetch(postsUrl, { headers });
      const postsData = await postsResponse.json();

      if (!postsResponse.ok) {
        console.error('[LinkedIn Analytics] Posts API Error:', postsData);
        throw new Error('Failed to fetch LinkedIn posts');
      }

      const posts = postsData.elements || [];
      const postsWithAnalytics = [];

      for (const post of posts) {
        try {
          const shareUrn = post.id;
          const analyticsUrl = `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(shareUrn)}`;
          const analyticsResponse = await fetch(analyticsUrl, { headers });
          const analyticsData = await analyticsResponse.json();

          const likes = analyticsData.likesSummary?.totalLikes || 0;
          const comments = analyticsData.commentsSummary?.totalComments || 0;
          const shares = analyticsData.sharesSummary?.totalShares || 0;

          postsWithAnalytics.push({
            id: shareUrn,
            text: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
            createdAt: post.created?.time || Date.now(),
            likes,
            comments,
            shares,
            engagement: likes + comments + shares,
          });
        } catch (analyticsError) {
          console.warn('[LinkedIn Analytics] Could not fetch analytics for post:', post.id, analyticsError);
          postsWithAnalytics.push({
            id: post.id,
            text: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
            createdAt: post.created?.time || Date.now(),
            likes: 0,
            comments: 0,
            shares: 0,
            engagement: 0,
          });
        }
      }

      console.log('[LinkedIn Analytics] Successfully fetched post analytics:', postsWithAnalytics.length);

      return {
        posts: postsWithAnalytics,
        totalCount: posts.length,
      };
    } catch (error) {
      console.error('[LinkedIn Analytics] Error:', error);
      throw error;
    }
  });
