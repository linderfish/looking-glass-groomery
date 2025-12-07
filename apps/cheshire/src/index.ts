// apps/cheshire/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { healthRoutes } from './routes/health'
import { chatRoutes } from './routes/chat'
import { webhookRoutes } from './routes/webhook'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: [
    'https://throughthelookingglass.pet',
    'http://localhost:3000',
  ],
  credentials: true,
}))

// Routes
app.route('/health', healthRoutes)
app.route('/chat', chatRoutes)
app.route('/webhook', webhookRoutes)

// Root
app.get('/', (c) => c.json({
  name: 'Cheshire Cat AI',
  status: 'grinning',
  message: "We're all mad here~ 😼",
}))

const port = process.env.PORT || 3001

console.log(`😼 Cheshire Cat is awakening on port ${port}...`)

export default {
  port,
  fetch: app.fetch,
}
