// apps/cheshire/src/routes/health.ts
import { Hono } from 'hono'
import { prisma } from '@looking-glass/db'

export const healthRoutes = new Hono()

healthRoutes.get('/', async (c) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        ai: 'ready',
      },
      cheshire: 'grinning 😼',
    })
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})
