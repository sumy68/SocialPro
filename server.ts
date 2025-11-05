// server.ts
import { serve } from "@hono/node-server";
import app from "./src/backend/hono"; // ✅ zurück auf src/backend/hono

const port = Number(process.env.PORT || 10000);

console.log("[BOOT] node dist/server.js -> src/backend/hono.ts OK");

serve({ fetch: app.fetch, hostname: "0.0.0.0", port });
