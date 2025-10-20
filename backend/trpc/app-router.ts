import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { instagramOAuthInitProcedure, instagramOAuthCallbackProcedure } from "./routes/platforms/oauth/instagram/route";
import { linkedinOAuthInitProcedure, linkedinOAuthCallbackProcedure } from "./routes/platforms/oauth/linkedin/route";
import { tiktokOAuthInitProcedure, tiktokOAuthCallbackProcedure } from "./routes/platforms/oauth/tiktok/route";
import { youtubeOAuthInitProcedure, youtubeOAuthCallbackProcedure } from "./routes/platforms/oauth/youtube/route";
import { publishPostProcedure } from "./routes/platforms/publish/route";
import { savePlatformTokenProcedure, getPlatformTokenProcedure, disconnectPlatformProcedure, refreshPlatformTokenProcedure } from "./routes/platforms/connect/route";
import { getInstagramAnalyticsProcedure, getInstagramMediaInsightsProcedure } from "./routes/platforms/analytics/instagram/route";
import { getLinkedInAnalyticsProcedure, getLinkedInPostAnalyticsProcedure } from "./routes/platforms/analytics/linkedin/route";
import { getTikTokAnalyticsProcedure, getTikTokVideoAnalyticsProcedure } from "./routes/platforms/analytics/tiktok/route";
import { getYouTubeAnalyticsProcedure, getYouTubeVideoAnalyticsProcedure } from "./routes/platforms/analytics/youtube/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  platforms: createTRPCRouter({
    oauth: createTRPCRouter({
      instagram: createTRPCRouter({
        init: instagramOAuthInitProcedure,
        callback: instagramOAuthCallbackProcedure,
      }),
      linkedin: createTRPCRouter({
        init: linkedinOAuthInitProcedure,
        callback: linkedinOAuthCallbackProcedure,
      }),
      tiktok: createTRPCRouter({
        init: tiktokOAuthInitProcedure,
        callback: tiktokOAuthCallbackProcedure,
      }),
      youtube: createTRPCRouter({
        init: youtubeOAuthInitProcedure,
        callback: youtubeOAuthCallbackProcedure,
      }),
    }),
    analytics: createTRPCRouter({
      instagram: createTRPCRouter({
        getProfile: getInstagramAnalyticsProcedure,
        getMediaInsights: getInstagramMediaInsightsProcedure,
      }),
      linkedin: createTRPCRouter({
        getProfile: getLinkedInAnalyticsProcedure,
        getPosts: getLinkedInPostAnalyticsProcedure,
      }),
      tiktok: createTRPCRouter({
        getProfile: getTikTokAnalyticsProcedure,
        getVideos: getTikTokVideoAnalyticsProcedure,
      }),
      youtube: createTRPCRouter({
        getChannel: getYouTubeAnalyticsProcedure,
        getVideos: getYouTubeVideoAnalyticsProcedure,
      }),
    }),
    publish: publishPostProcedure,
    saveToken: savePlatformTokenProcedure,
    getToken: getPlatformTokenProcedure,
    disconnect: disconnectPlatformProcedure,
    refreshToken: refreshPlatformTokenProcedure,
  }),
});
