import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { instagramRouter } from './backend/routes/instagram';

const app = new Hono();

// CORS (falls du die Start-URL im In-App Browser öffnest)
app.use('*', cors());

// Healthcheck für Render
app.get('/health', (c) => c.text('ok'));

// Mount unter /api/oauth/instagram
app.route('/api/oauth/instagram', instagramRouter);

// Optional: andere Router hier mounten
// app.route('/api/xyz', xyzRouter);

const port = Number(process.env.PORT) || 10000;
console.log(`[server] listening on :${port}`);
serve({ fetch: app.fetch, port });
