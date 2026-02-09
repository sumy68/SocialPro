import { Hono } from 'hono';

const app = new Hono();

// Get LinkedIn Organization Statistics
app.get('/linkedin', async (c) => {
  const { accessToken, organizationId } = c.req.query();
  
  if (!accessToken || !organizationId) {
    return c.json({ error: 'Missing accessToken or organizationId' }, 400);
  }

  try {
    // LinkedIn Share Statistics API
    const statsUrl = `https://api.linkedin.com/v2/organizationalEntityShareStatistics`;
    const params = new URLSearchParams({
      q: 'organizationalEntity',
      organizationalEntity: `urn:li:organization:${organizationId}`,
    });

    const response = await fetch(`${statsUrl}?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      return c.json({ error: error.message || 'LinkedIn API error' }, response.status as any);
    }

    const data = await response.json();
    
    // Aggregate statistics
    let totalShares = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalImpressions = 0;
    
    data.elements?.forEach((stat: any) => {
      totalShares += stat.totalShareStatistics?.shareCount || 0;
      totalLikes += stat.totalShareStatistics?.likeCount || 0;
      totalComments += stat.totalShareStatistics?.commentCount || 0;
      totalImpressions += stat.totalShareStatistics?.impressionCount || 0;
    });

    const insights = {
      shares: totalShares,
      likes: totalLikes,
      comments: totalComments,
      impressions: totalImpressions,
      engagement: totalLikes + totalComments + totalShares,
    };

    return c.json({ success: true, insights });
    
  } catch (error: any) {
    console.error('[LinkedIn Insights] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
