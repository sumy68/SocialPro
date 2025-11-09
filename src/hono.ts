// src/hono.ts
import { Hono, type Context } from 'hono';
import { linkedinRouter } from './backend/routes/linkedin.js';
import { instagramRouter } from './backend/routes/instagram.js';

const app = new Hono();

// request logger
app.use('*', async (c, next) => {
  const t0 = Date.now();
  await next();
  console.log(JSON.stringify({
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    status: c.res.status,
    ms: Date.now() - t0,
  }));
});

console.log('[BOOT] start hono.ts');
app.route('/api/oauth/linkedin', linkedinRouter);
app.route('/api/oauth/instagram', instagramRouter);

// 🔥 INLINE: ping direkt hier (soll NICHT 404 sein)
app.get('/api/oauth/instagram/ping-inline', (c: Context) => c.text('ig inline ok'));
// optional: gleiche URL wie Router, um zu “überschatten”
app.get('/api/oauth/instagram/ping', (c: Context) => c.text('ig inline ok (shadow)'));

app.get('/health', (c: Context) => c.text('ok-ig-inline'));

export default app;
export { app };
