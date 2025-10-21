// server.ts
import { serve } from '@hono/node-server';

async function loadApp() {
  try {
    // Versuche Alias-Import (wenn tsconfig "@/*" gesetzt ist)
    const mod = await import('@/backend/hono');
    return mod.default;
  } catch {
    // Fallback auf relativen Pfad
    const mod = await import('./backend/hono');
    return mod.default;
  }
}

(async () => {
  const app = await loadApp();

  // ✅ Render liefert PORT über Umgebungsvariable
  const port = Number(process.env.PORT) || 3000;

  serve({ fetch: app.fetch, port });
  console.log(`[server] Running on port ${port}`);
})().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
