// apps/cheshire/src/routes/chat.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '@looking-glass/db'
import {
  getOrCreateConversation,
  addMessage,
  formatHistoryForLLM,
  escalateConversation,
} from '../services/conversation'
import { detectIntent } from '../services/intent'
import { generateResponse, getFAQResponse } from '../services/response'
import { handleBookingFlow } from '../services/booking'
import { notifyKimmieEscalation } from '../services/escalation'

export const chatRoutes = new Hono()

const chatRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
  clientId: z.string().optional(),
})

chatRoutes.post(
  '/',
  zValidator('json', chatRequestSchema),
  async (c) => {
    const { message, sessionId, clientId } = c.req.valid('json')

    try {
      // Get or create conversation
      const conversation = await getOrCreateConversation(
        'WEBSITE',
        sessionId || crypto.randomUUID(),
        clientId
      )

      // Add user message
      await addMessage(conversation.id, 'USER', message)

      // Get conversation history
      const history = formatHistoryForLLM(conversation.messages)

      // Detect intent
      const intent = await detectIntent(message, history)

      let response: string

      // Route based on intent
      const bookingContext = {
        conversationId: conversation.id,
        channel: 'WEBSITE' as const,
        externalId: sessionId || conversation.id,
      }

      switch (intent.intent) {
        case 'BOOKING':
          response = await handleBookingFlow(message, conversation, intent, bookingContext)
          break

        case 'PRICING':
          response = getFAQResponse('pricing') || await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
          break

        case 'SERVICES':
          response = getFAQResponse('services') || await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
          break

        case 'HOURS':
          response = getFAQResponse('hours') || await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
          break

        case 'LOCATION':
          response = getFAQResponse('location') || await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
          break

        case 'CONSULTATION':
          response = getFAQResponse('consultation') || await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
          break

        case 'ESCALATE':
          await escalateConversation(conversation.id)
          await notifyKimmieEscalation(conversation.id, message)
          response = `I'm getting Kimmie for you right now! 🐱

She'll reach out shortly. In the meantime, is there anything quick I can help with?`
          break

        default:
          response = await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
      }

      // Save assistant response
      await addMessage(conversation.id, 'ASSISTANT', response)

      return c.json({
        response,
        sessionId: conversation.externalId,
        intent: intent.intent,
      })
    } catch (error) {
      console.error('Chat error:', error)
      return c.json({
        response: "Curiouser and curiouser... something went wrong! 🙀 Try again?",
        error: true,
      }, 500)
    }
  }
)

// Get conversation history
chatRoutes.get('/history/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId')

  try {
    const conversation = await getOrCreateConversation('WEBSITE', sessionId)

    return c.json({
      sessionId,
      messages: conversation.messages.map(m => ({
        role: m.role.toLowerCase(),
        content: m.content,
        timestamp: m.createdAt,
      })),
    })
  } catch (error) {
    console.error('History error:', error)
    return c.json({ error: 'Failed to get history' }, 500)
  }
})

// End/resolve a conversation
chatRoutes.post('/end/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId')

  try {
    const conversation = await getOrCreateConversation('WEBSITE', sessionId)

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: 'RESOLVED' },
    })

    return c.json({ success: true, message: 'Conversation ended' })
  } catch (error) {
    console.error('End conversation error:', error)
    return c.json({ error: 'Failed to end conversation' }, 500)
  }
})
