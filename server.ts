// server.ts
import { serve } from "@hono/node-server";
import app from "./backend/hono"; // ✅ Pfad korrigiert

const port = Number(process.env.PORT || 10000);

// eindeutiges Boot-Log für Render-Logs
console.log("[BOOT] node dist/server.js -> src/backend/hono.ts OK");

serve({ fetch: app.fetch, hostname: "0.0.0.0", port });
