// apps/cheshire/src/routes/waiver.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  getWaiverForSigning,
  signWaiver,
  hasSignedWaiver,
  createWaiverRequest,
} from '../services/waivers'

const waiver = new Hono()

// Get waiver details for signing page
waiver.get(
  '/:waiverId',
  zValidator(
    'query',
    z.object({
      client: z.string(),
    })
  ),
  async (c) => {
    const waiverId = c.req.param('waiverId')
    const { client: clientId } = c.req.valid('query')

    const data = await getWaiverForSigning(waiverId, clientId)

    if (!data) {
      return c.json({ error: 'Waiver not found' }, 404)
    }

    return c.json(data)
  }
)

// Sign a waiver
waiver.post(
  '/:waiverId/sign',
  zValidator(
    'json',
    z.object({
      clientId: z.string(),
      signature: z.string(), // Base64 signature data
    })
  ),
  async (c) => {
    const waiverId = c.req.param('waiverId')
    const { clientId, signature } = c.req.valid('json')

    try {
      await signWaiver({
        waiverId,
        clientId,
        signatureData: signature,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        userAgent: c.req.header('user-agent'),
      })

      return c.json({ success: true, message: 'Waiver signed successfully' })
    } catch (error) {
      if (error instanceof Error && error.message === 'Waiver already signed') {
        return c.json({ error: 'Waiver already signed' }, 400)
      }
      console.error('Failed to sign waiver:', error)
      return c.json({ error: 'Failed to sign waiver' }, 500)
    }
  }
)

// Check waiver status for a client
waiver.get('/status/:clientId', async (c) => {
  const clientId = c.req.param('clientId')

  const signed = await hasSignedWaiver(clientId)

  return c.json({ clientId, signed })
})

// Create a waiver request (used by telegram bot)
waiver.post(
  '/request',
  zValidator(
    'json',
    z.object({
      clientId: z.string(),
    })
  ),
  async (c) => {
    const { clientId } = c.req.valid('json')

    const request = await createWaiverRequest(clientId)

    return c.json(request)
  }
)

export { waiver }
