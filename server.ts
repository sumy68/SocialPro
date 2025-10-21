// server.ts
import { serve } from '@hono/node-server';

async function loadApp() {
  try {
    const mod = await import('@/backend/hono'); // tsconfig-Alias
    return mod.default;
  } catch {
    const mod = await import('./backend/hono'); // Fallback
    return mod.default;
  }
}

(async () => {
  const app = await loadApp();
  const port = Number(process.env.PORT) || 3000;

  const fetchHandler = (req: Request) => {
    const url = new URL(req.url);

    // ✅ Healthcheck direkt hier beantworten
    if (url.pathname === '/healthz') {
      return new Response(
        JSON.stringify({ status: 'ok', message: 'API is running' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Sonst an deine Hono-App weiterreichen
    return app.fetch(req);
  };

  serve({ fetch: fetchHandler, port });
  console.log(`[server] Running on port ${port} (health: /healthz)`);
})().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
