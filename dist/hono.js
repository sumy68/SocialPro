// src/hono.ts
import { Hono } from 'hono';
import { linkedinRouter } from './backend/routes/linkedin.js';
const app = new Hono();
app.route('/api/oauth/linkedin', linkedinRouter);
app.get('/health', (c) => c.text('ok'));
export default app;
export { app };
