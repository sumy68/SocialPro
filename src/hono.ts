// src/hono.ts
import { Hono, type Context } from 'hono';
import { linkedinRouter } from './backend/routes/linkedin.js';
import { instagramRouter } from './backend/routes/instagram.js';

const app = new Hono();

// logging
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(JSON.stringify({
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    status: c.res.status,
    ms,
  }));
});

console.log('[BOOT] using src/hono.ts');
console.log('[BOOT] mounting /api/oauth/instagram');

app.route('/api/oauth/linkedin', linkedinRouter);
app.route('/api/oauth/instagram', instagramRouter);

app.get('/health', (c: Context) => c.text('ok'));

export default app;
export { app };
