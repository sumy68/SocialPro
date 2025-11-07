import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { instagramRouter } from './backend/routes/instagram';
import { linkedinRouter } from './backend/routes/linkedin';


const app = new Hono();

// CORS (falls du die Start-URL im In-App Browser öffnest)
app.use('*', cors());

// Healthcheck für Render
app.get('/health', (c) => c.text('ok'));

// Mount unter /api/oauth/instagram
app.route('/api/oauth/instagram', instagramRouter);
app.route('/api/oauth/linkedin', linkedinRouter);
import { tiktokRouter } from './backend/routes/tiktok';
import { youtubeRouter } from './backend/routes/youtube';
app.route('/api/oauth/tiktok', tiktokRouter);
app.route('/api/oauth/youtube', youtubeRouter);

// Optional: andere Router hier mounten
// app.route('/api/xyz', xyzRouter);

const port = Number(process.env.PORT) || 10000;
console.log(`[server] listening on :${port}`);
serve({ fetch: app.fetch, port });
