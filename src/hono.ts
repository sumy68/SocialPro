// src/hono.ts
import { Hono, type Context } from 'hono';
import { linkedinRouter } from './backend/routes/linkedin.js';

const app = new Hono();

app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
  
    console.log(
      JSON.stringify({
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        status: c.res.status,
        ms,
      })
    );
  });
  

app.route('/api/oauth/linkedin', linkedinRouter);
app.get('/health', (c: Context) => c.text('ok'));

export default app;
export { app };
