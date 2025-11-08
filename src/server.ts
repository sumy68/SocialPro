import { Hono } from 'hono'
import { linkedinRouter } from './backend/routes/linkedin'
import { instagramRouter } from './backend/routes/instagram' // <— hinzufügen

export const app = new Hono()

app.get('/health', c => c.json({ status: 'ok' }))

app.route('/api/oauth/linkedin', linkedinRouter)
app.route('/api/oauth/instagram', instagramRouter) // <— hinzufügen

export default app
