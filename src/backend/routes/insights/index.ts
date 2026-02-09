import { Hono } from 'hono';
import instagramApp from './instagram';
import linkedinApp from './linkedin';
import tiktokApp from './tiktok';
import weeklyApp from './weekly';

const app = new Hono();

// Mount all insights routes
app.route('/', instagramApp);
app.route('/', linkedinApp);
app.route('/', tiktokApp);
app.route('/', weeklyApp);

export default app;
