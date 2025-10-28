// hono.ts (bereinigt, minimal lauffähig)
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

const app = new Hono();

// Middlewares
app.use('*', logger());
app.use('*', cors());

// Health / Status
app.get('/status', (c) =>
  c.json({
    ok: true,
    service: 'socialpro-backend',
    timestamp: new Date().toISOString(),
  })
);

// Root
app.get('/', (c) => c.json({ message: 'SocialPro backend up' }));

export default app;
