// trpc/app-router.ts
import { createTRPCRouter, publicProcedure } from "./create-context";

/** --- STUBS (ersetzt deine echten Routen, bis diese Dateien existieren) --- */
const hiRoute = publicProcedure.query(() => ({ message: "hi 👋" }));

// OAuth stubs
const instagramOAuthInitProcedure = publicProcedure.query(() => ({ provider: "instagram", step: "init", ok: true }));
const instagramOAuthCallbackProcedure = publicProcedure.query(() => ({ provider: "instagram", step: "callback", ok: true }));
const linkedinOAuthInitProcedure = publicProcedure.query(() => ({ provider: "linkedin", step: "init", ok: true }));
const linkedinOAuthCallbackProcedure = publicProcedure.query(() => ({ provider: "linkedin", step: "callback", ok: true }));
const tiktokOAuthInitProcedure = publicProcedure.query(() => ({ provider: "tiktok", step: "init", ok: true }));
const tiktokOAuthCallbackProcedure = publicProcedure.query(() => ({ provider: "tiktok", step: "callback", ok: true }));
const youtubeOAuthInitProcedure = publicProcedure.query(() => ({ provider: "youtube", step: "init", ok: true }));
const youtubeOAuthCallbackProcedure = publicProcedure.query(() => ({ provider: "youtube", step: "callback", ok: true }));

// Publish / Tokens
const publishPostProcedure = publicProcedure.mutation(() => ({ published: true }));
const savePlatformTokenProcedure = publicProcedure.mutation(() => ({ saved: true }));
const getPlatformTokenProcedure = publicProcedure.query(() => ({ token: null }));
const disconnectPlatformProcedure = publicProcedure.mutation(() => ({ disconnected: true }));
const refreshPlatformTokenProcedure = publicProcedure.mutation(() => ({ refreshed: true }));

// Analytics stubs
const getInstagramAnalyticsProcedure = publicProcedure.query(() => ({ profile: { followers: 0, posts: 0 } }));
const getInstagramMediaInsightsProcedure = publicProcedure.query(() => ({ media: [] }));
const getLinkedInAnalyticsProcedure = publicProcedure.query(() => ({ profile: { followers: 0, posts: 0 } }));
const getLinkedInPostAnalyticsProcedure = publicProcedure.query(() => ({ posts: [] }));
const getTikTokAnalyticsProcedure = publicProcedure.query(() => ({ profile: { followers: 0, videos: 0 } }));
const getTikTokVideoAnalyticsProcedure = publicProcedure.query(() => ({ videos: [] }));
const getYouTubeAnalyticsProcedure = publicProcedure.query(() => ({ channel: { subscribers: 0, videos: 0 } }));
const getYouTubeVideoAnalyticsProcedure = publicProcedure.query(() => ({ videos: [] }));
/** --- ENDE STUBS --- */

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

export type AppRouter = typeof appRouter;
