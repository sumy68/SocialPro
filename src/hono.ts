// src/hono.ts
import { Hono, type Context } from 'hono';
import { linkedinRouter } from './backend/routes/linkedin.js';

const app = new Hono();

app.route('/api/oauth/linkedin', linkedinRouter);
app.get('/health', (c: Context) => c.text('ok'));

export default app;
export { app };
