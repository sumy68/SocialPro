// src/backend/trpc/app-router.ts
import { router, publicProcedure } from "./trpc.js";
import { z } from "zod";

// Import DB
import { db, type ScheduledPost } from '../db/database.js';
import { randomUUID } from 'crypto';

// SCHEDULE POST
const schedulePostProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    platform: z.enum(['instagram', 'linkedin', 'tiktok', 'youtube']),
    caption: z.string(),
    mediaUrls: z.array(z.string()).optional(),
    mediaType: z.enum(['image', 'video']).optional(),
    contentType: z.enum(['post', 'reel']).optional(),
    scheduledDate: z.string(),
    accessToken: z.string(),
    platformUserId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    const id = randomUUID();
    
    const stmt = db.prepare(`
      INSERT INTO scheduled_posts (
        id, user_id, platform, caption, media_urls, media_type, 
        content_type, scheduled_date, access_token, platform_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.userId,
      input.platform,
      input.caption,
      input.mediaUrls ? JSON.stringify(input.mediaUrls) : null,
      input.mediaType || null,
      input.contentType || null,
      input.scheduledDate,
      input.accessToken,
      input.platformUserId || null
    );

    console.log('[Schedule] Post scheduled:', id, 'for', input.scheduledDate);

    return { 
      success: true, 
      postId: id,
      scheduledDate: input.scheduledDate 
    };
  });

// LIST POSTS
const listScheduledPostsProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    status: z.enum(['scheduled', 'published', 'failed']).optional(),
  }))
  .query(({ input }) => {
    let query = 'SELECT * FROM scheduled_posts WHERE user_id = ?';
    const params: any[] = [input.userId];

    if (input.status) {
      query += ' AND status = ?';
      params.push(input.status);
    }

    query += ' ORDER BY scheduled_date DESC';

    const stmt = db.prepare(query);
    const posts = stmt.all(...params) as ScheduledPost[];

    return posts.map(post => ({
      ...post,
      media_urls: post.media_urls ? JSON.parse(post.media_urls) : null,
    }));
  });

export const appRouter = router({
  "platforms.getToken": publicProcedure
    .input(z.object({}).optional())
    .query(async () => {
      return { token: null };
    }),
  
  "posts.schedule": schedulePostProcedure,
  "posts.list": listScheduledPostsProcedure,
});

export type AppRouter = typeof appRouter;
