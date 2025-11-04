// server.ts
// Starte Hono auf Render

import { serve } from "@hono/node-server";
import app from "./backend/socialpro-backend/hono";

const port = Number(process.env.PORT || 10000);

console.log(`[server] Running on 0.0.0.0:${port}`);

serve({
  fetch: app.fetch,
  hostname: "0.0.0.0", // notwendig für Render
  port,
});
