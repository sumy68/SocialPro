import { Hono } from 'hono';

const app = new Hono();

// Get Instagram Insights for last 7 days
app.get('/instagram', async (c) => {
  const { accessToken, userId } = c.req.query();
  
  if (!accessToken || !userId) {
    return c.json({ error: 'Missing accessToken or userId' }, 400);
  }

  try {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const since = Math.floor(weekAgo / 1000);
    const until = Math.floor(now / 1000);

    // Get account insights
    const insightsUrl = `https://graph.facebook.com/v18.0/${userId}/insights`;
    const params = new URLSearchParams({
      metric: 'follower_count,impressions,reach,profile_views',
      period: 'day',
      since: since.toString(),
      until: until.toString(),
      access_token: accessToken,
    });

    const response = await fetch(`${insightsUrl}?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      return c.json({ error: error.error?.message || 'Instagram API error' }, response.status as any);
    }

    const data = await response.json();
    
    // Aggregate weekly totals
    const insights = {
      reach: 0,
      impressions: 0,
      profileViews: 0,
      followerCount: 0,
    };

    data.data?.forEach((metric: any) => {
      const values = metric.values || [];
      const total = values.reduce((sum: number, v: any) => sum + (v.value || 0), 0);
      
      switch(metric.name) {
        case 'reach':
          insights.reach = total;
          break;
        case 'impressions':
          insights.impressions = total;
          break;
        case 'profile_views':
          insights.profileViews = total;
          break;
        case 'follower_count':
          insights.followerCount = values[values.length - 1]?.value || 0;
          break;
      }
    });

    return c.json({ success: true, insights });
    
  } catch (error: any) {
    console.error('[Instagram Insights] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
