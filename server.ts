// server.ts
import { serve } from "@hono/node-server";
import app from "./src/backend/hono"; // <- WICHTIG: src/backend/hono

const port = Number(process.env.PORT || 10000);
serve({ fetch: app.fetch, hostname: "0.0.0.0", port });
