// server.ts
import { serve } from '@hono/node-server';

async function loadApp() {
  try {
    // Falls du später Aliases nutzt (z. B. @/backend/hono)
    const mod = await import('@/backend/hono');
    return mod.default;
  } catch {
    // ✅ Fallback ohne Alias — funktioniert garantiert
    const mod = await import('./backend/hono');
    return mod.default;
  }
}

(async () => {
  const app = await loadApp();
  const port = Number(process.env.PORT) || 3000;

  const fetchHandler = (req: Request) => {
    const url = new URL(req.url);

    // ✅ Render Healthcheck
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

    // Weiter an Hono
    return app.fetch(req);
  };

  serve({
    fetch: fetchHandler,
    port,
    hostname: '0.0.0.0', // ✅ wichtig für Render
  });

  console.log(`[server] Running on http://0.0.0.0:${port} (health: /healthz)`);
})().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
