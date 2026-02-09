import { Hono } from 'hono';

const app = new Hono();

// Get TikTok User Info & Video Stats
app.get('/tiktok', async (c) => {
  const { accessToken, openId } = c.req.query();
  
  if (!accessToken || !openId) {
    return c.json({ error: 'Missing accessToken or openId' }, 400);
  }

  try {
    // Get user info (followers, likes)
    const userUrl = 'https://open.tiktokapis.com/v2/user/info/';
    const userParams = new URLSearchParams({
      fields: 'follower_count,likes_count,video_count',
    });

    const userResponse = await fetch(`${userUrl}?${userParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const error = await userResponse.json();
      return c.json({ error: error.error?.message || 'TikTok API error' }, userResponse.status as any);
    }

    const userData = await userResponse.json();
    
    // Get video list (last 7 days)
    const videosUrl = 'https://open.tiktokapis.com/v2/video/list/';
    const videosParams = new URLSearchParams({
      max_count: '20',
    });

    const videosResponse = await fetch(`${videosUrl}?${videosParams}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    if (videosResponse.ok) {
      const videosData = await videosResponse.json();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      videosData.data?.videos?.forEach((video: any) => {
        const createTime = video.create_time * 1000;
        if (createTime >= weekAgo) {
          totalViews += video.view_count || 0;
          totalLikes += video.like_count || 0;
          totalComments += video.comment_count || 0;
          totalShares += video.share_count || 0;
        }
      });
    }

    const insights = {
      followers: userData.data?.user?.follower_count || 0,
      totalLikes: userData.data?.user?.likes_count || 0,
      videoCount: userData.data?.user?.video_count || 0,
      weeklyViews: totalViews,
      weeklyLikes: totalLikes,
      weeklyComments: totalComments,
      weeklyShares: totalShares,
      engagement: totalLikes + totalComments + totalShares,
    };

    return c.json({ success: true, insights });
    
  } catch (error: any) {
    console.error('[TikTok Insights] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
