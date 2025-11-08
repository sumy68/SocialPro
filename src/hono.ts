import { Hono } from 'hono'
import { linkedinRouter } from './backend/routes/linkedin'
import { instagramRouter } from './backend/routes/instagram'

export const app = new Hono()

app.get('/health', c => c.json({ status: 'ok' }))

app.route('/api/oauth/linkedin', linkedinRouter)
app.route('/api/oauth/instagram', instagramRouter)

console.log('[boot] IG router mounted at /api/oauth/instagram')

// bump 1762624362
