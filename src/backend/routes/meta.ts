// z.B. src/backend/routes/meta.ts
import { Hono } from 'hono';
export const meta = new Hono();
meta.get('/__version', (c) => c.text(
  `commit=${process.env.RENDER_GIT_COMMIT ?? 'unknown'}`
));
