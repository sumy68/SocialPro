import { Hono } from 'hono';

const app = new Hono();

// Get Weekly Insights from all connected platforms
app.get('/weekly', async (c) => {
  const { platforms } = c.req.query();
  
  if (!platforms) {
    return c.json({ error: 'Missing platforms parameter' }, 400);
  }

  try {
    // platforms format: "instagram:token:userId,linkedin:token:orgId,tiktok:token:openId"
    const platformList = platforms.split(',');
    
    const results = await Promise.allSettled(
      platformList.map(async (platformStr) => {
        const [platform, accessToken, userId] = platformStr.split(':');
        
        const baseUrl = c.req.url.replace('/weekly', `/${platform}`);
        const params = new URLSearchParams({ accessToken, userId });
        
        const response = await fetch(`${baseUrl}?${params}`);
        const data = await response.json();
        
        return {
          platform,
          data: data.insights || {},
          success: data.success || false,
        };
      })
    );

    // Aggregate totals
    let totalReach = 0;
    let totalEngagement = 0;
    let totalFollowers = 0;

    const platformInsights = results
      .filter(r => r.status === 'fulfilled')
      .map((r: any) => r.value)
      .map((p: any) => {
        const insights = p.data;
        
        // Instagram
        if (p.platform === 'instagram') {
          totalReach += insights.reach || 0;
          totalEngagement += insights.profileViews || 0;
          totalFollowers += insights.followerCount || 0;
        }
        
        // LinkedIn
        if (p.platform === 'linkedin') {
          totalReach += insights.impressions || 0;
          totalEngagement += insights.engagement || 0;
        }
        
        // TikTok
        if (p.platform === 'tiktok') {
          totalReach += insights.weeklyViews || 0;
          totalEngagement += insights.engagement || 0;
          totalFollowers += insights.followers || 0;
        }
        
        return {
          platform: p.platform,
          insights,
        };
      });

    const weeklyData = {
      weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      weekEnd: new Date().toISOString(),
      totals: {
        reach: totalReach,
        engagement: totalEngagement,
        followers: totalFollowers,
      },
      platforms: platformInsights,
    };

    return c.json({ success: true, data: weeklyData });
    
  } catch (error: any) {
    console.error('[Weekly Insights] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
