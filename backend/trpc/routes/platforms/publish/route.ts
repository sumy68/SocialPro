import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

const platformSchema = z.enum(['instagram', 'linkedin', 'tiktok', 'youtube']);

export const publishPostProcedure = publicProcedure
  .input(z.object({
    platform: platformSchema,
    caption: z.string(),
    mediaUrls: z.array(z.string()).optional(),
    mediaType: z.enum(['image', 'video']).optional(),
    accessToken: z.string(),
    userId: z.string().optional(),
    contentType: z.enum(['post', 'reel']).optional(),
  }))
  .mutation(async ({ input }) => {
    console.log('[Publish] Publishing to', input.platform);

    try {
      switch (input.platform) {
        case 'instagram':
          return await publishToInstagram(input);
        case 'linkedin':
          return await publishToLinkedIn(input);
        case 'tiktok':
          return await publishToTikTok(input);
        case 'youtube':
          return await publishToYouTube(input);
        default:
          throw new Error(`Unsupported platform: ${input.platform}`);
      }
    } catch (error: any) {
      console.error(`[Publish] Error publishing to ${input.platform}:`, error);
      throw new Error(`Failed to publish to ${input.platform}: ${error.message}`);
    }
  });

async function publishToInstagram(input: any) {
  const { accessToken, userId, caption, mediaUrls, mediaType, contentType } = input;

  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error('Instagram requires at least one media file');
  }

  const isVideo = mediaType === 'video';
  const isReel = contentType === 'reel';
  
  const createMediaEndpoint = isVideo || isReel
    ? `https://graph.instagram.com/v18.0/${userId}/media`
    : `https://graph.instagram.com/v18.0/${userId}/media`;

  const mediaParams: any = {
    caption,
    access_token: accessToken,
  };

  if (isVideo || isReel) {
    mediaParams.media_type = isReel ? 'REELS' : 'VIDEO';
    mediaParams.video_url = mediaUrls[0];
  } else {
    mediaParams.image_url = mediaUrls[0];
  }

  const mediaResponse = await fetch(createMediaEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mediaParams),
  });

  if (!mediaResponse.ok) {
    const error = await mediaResponse.json();
    throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
  }

  const { id: mediaId } = await mediaResponse.json();

  const publishResponse = await fetch(`https://graph.instagram.com/v18.0/${userId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: mediaId,
      access_token: accessToken,
    }),
  });

  if (!publishResponse.ok) {
    const error = await publishResponse.json();
    throw new Error(`Instagram publish error: ${JSON.stringify(error)}`);
  }

  const result = await publishResponse.json();
  return { postId: result.id, platform: 'instagram' };
}

async function publishToLinkedIn(input: any) {
  const { accessToken, userId, caption, mediaUrls } = input;

  const sharePayload: any = {
    author: `urn:li:person:${userId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: caption },
        shareMediaCategory: mediaUrls && mediaUrls.length > 0 ? 'IMAGE' : 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  if (mediaUrls && mediaUrls.length > 0) {
    sharePayload.specificContent['com.linkedin.ugc.ShareContent'].media = mediaUrls.map((url: string) => ({
      status: 'READY',
      originalUrl: url,
    }));
  }

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(sharePayload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`LinkedIn API error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  return { postId: result.id, platform: 'linkedin' };
}

async function publishToTikTok(input: any) {
  const { accessToken, caption, mediaUrls } = input;

  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error('TikTok requires a video file');
  }

  const uploadResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: caption.substring(0, 150),
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_url: mediaUrls[0],
      },
    }),
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.json();
    throw new Error(`TikTok API error: ${JSON.stringify(error)}`);
  }

  const result = await uploadResponse.json();
  return { postId: result.data?.publish_id, platform: 'tiktok' };
}

async function publishToYouTube(input: any) {
  const { accessToken, caption, mediaUrls, mediaType } = input;

  if (mediaType !== 'video' || !mediaUrls || mediaUrls.length === 0) {
    throw new Error('YouTube requires a video file');
  }

  const metadata = {
    snippet: {
      title: caption.substring(0, 100),
      description: caption,
      tags: [],
      categoryId: '22',
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false,
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/*',
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube API error: ${JSON.stringify(error)}`);
  }

  const uploadUrl = response.headers.get('Location');
  
  return { postId: uploadUrl, platform: 'youtube', uploadUrl };
}
