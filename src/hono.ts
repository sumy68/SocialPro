import { Hono } from 'hono'
import { linkedinRouter } from './backend/routes/linkedin'

export const app = new Hono()

app.get('/health', c => c.json({ status: 'ok' }))

app.route('/api/oauth/linkedin', linkedinRouter)
