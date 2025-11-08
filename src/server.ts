import 'dotenv/config'
import { serve } from '@hono/node-server'
import { app } from './hono'

const port = Number(process.env.PORT) || 10000
console.log(`[server] listening on :${port}`)
serve({ fetch: app.fetch, port })
