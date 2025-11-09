// src/hono.ts
import { Hono } from 'hono';
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
console.log('[BOOT] hono.ts loaded');
console.log('[BOOT] mounting /api/oauth/linkedin + /api/oauth/instagram');
app.route('/api/oauth/linkedin', linkedinRouter);
app.route('/api/oauth/instagram', instagramRouter);
// 🔥 Inline-Test-Routen (müssen nach dem Build im dist/hono.js auftauchen!)
app.get('/api/oauth/instagram/ping-inline', (c) => c.text('ig inline ok'));
app.get('/api/oauth/instagram/ping', (c) => c.text('ig inline ok (shadow)'));
app.get('/health', (c) => c.text('ok-ig-inline'));
export default app;
export { app };
