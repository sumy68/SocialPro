import { Hono } from 'hono';

const app = new Hono();

// Get LinkedIn Share Statistics (filtered by time range)
app.get('/linkedin', async (c) => {
  const { accessToken, organizationId } = c.req.query();
  
  if (!accessToken || !organizationId) {
    return c.json({ error: 'Missing accessToken or organizationId' }, 400);
  }

  try {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Step 1: Get recent shares/posts from the organization
    const sharesUrl = `https://api.linkedin.com/v2/shares`;
    const sharesParams = new URLSearchParams({
      q: 'owners',
      owners: `urn:li:organization:${organizationId}`,
      sortBy: 'LAST_MODIFIED',
      count: '50', // Last 50 posts
    });

    const sharesResponse = await fetch(`${sharesUrl}?${sharesParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
    
    if (!sharesResponse.ok) {
      const error = await sharesResponse.json();
      return c.json({ error: error.message || 'LinkedIn API error' }, sharesResponse.status as any);
    }

    const sharesData = await sharesResponse.json();
    
    // Step 2: Filter posts from last 7 days and get their statistics
    let totalImpressions = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalClicks = 0;
    
    const recentShares = (sharesData.elements || []).filter((share: any) => {
      const createdTime = share.created?.time || 0;
      return createdTime >= weekAgo;
    });

    // Step 3: Get statistics for each recent share
    for (const share of recentShares) {
      const shareId = share.id;
      
      // Get share statistics
      const statsUrl = `https://api.linkedin.com/v2/organizationalEntityShareStatistics`;
      const statsParams = new URLSearchParams({
        q: 'organizationalEntity',
        organizationalEntity: `urn:li:organization:${organizationId}`,
        shares: `List(${shareId})`,
      });

      try {
        const statsResponse = await fetch(`${statsUrl}?${statsParams}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const stats = statsData.elements?.[0]?.totalShareStatistics;
          
          if (stats) {
            totalImpressions += stats.impressionCount || 0;
            totalLikes += stats.likeCount || 0;
            totalComments += stats.commentCount || 0;
            totalShares += stats.shareCount || 0;
            totalClicks += stats.clickCount || 0;
          }
        }
      } catch (err) {
        console.error(`[LinkedIn] Error fetching stats for share ${shareId}:`, err);
      }
    }

    const insights = {
      impressions: totalImpressions,
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares,
      clicks: totalClicks,
      engagement: totalLikes + totalComments + totalShares,
      postsInWeek: recentShares.length,
    };

    return c.json({ success: true, insights });
    
  } catch (error: any) {
    console.error('[LinkedIn Insights] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
