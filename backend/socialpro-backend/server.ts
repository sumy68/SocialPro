// backend/socialpro-backend/server.ts
import { serve } from "@hono/node-server";
import app from "./hono";

const PORT = Number(process.env.PORT) || 3000;

console.log(`[Hono] starting on http://localhost:${PORT}`);
serve({
  fetch: app.fetch,
  port: PORT,
});
