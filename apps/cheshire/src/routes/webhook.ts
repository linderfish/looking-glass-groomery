// apps/cheshire/src/routes/webhook.ts
import { Hono } from 'hono'
import { appendFileSync } from 'fs'
import {
  getOrCreateConversation,
  addMessage,
  formatHistoryForLLM,
  isReturningClient,
} from '../services/conversation'
import { detectIntent } from '../services/intent'
import { generateResponse } from '../services/response'
import { handleBookingFlow } from '../services/booking'
import { ConversationChannel } from '@looking-glass/db'

// DEBUG: File-based logging since PM2+Bun doesn't capture console.log
const debugLog = (msg: string) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  console.log(line)
  try { appendFileSync('/tmp/cheshire-debug.log', line) } catch {}
}

export const webhookRoutes = new Hono()

// Telegram webhook - forward to telegram-bot's local webhook server
webhookRoutes.post('/telegram', async (c) => {
  console.log('📱 Telegram webhook received at:', new Date().toISOString())

  try {
    const body = await c.req.json()
    console.log('📥 Telegram update:', JSON.stringify(body, null, 2).substring(0, 500))

    // Forward to telegram-bot's webhook server running on port 3005
    const response = await fetch('http://127.0.0.1:3005/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error('Telegram-bot webhook error:', await response.text())
    }

    return c.text('OK')
  } catch (error) {
    console.error('Telegram webhook error:', error)
    // Still return OK to Telegram to prevent retries
    return c.text('OK')
  }
})

// Instagram webhook verification
webhookRoutes.get('/instagram', async (c) => {
  const mode = c.req.query('hub.mode')
  const token = c.req.query('hub.verify_token')
  const challenge = c.req.query('hub.challenge')

  const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Instagram webhook verified')
    return c.text(challenge || '')
  }

  return c.text('Verification failed', 403)
})

// Instagram incoming messages
webhookRoutes.post('/instagram', async (c) => {
  try {
    const body = await c.req.json()

    // Handle Instagram DM messages
    if (body.object === 'instagram') {
      for (const entry of body.entry || []) {
        for (const messaging of entry.messaging || []) {
          await handleInstagramMessage(messaging)
        }
      }
    }

    return c.text('EVENT_RECEIVED')
  } catch (error) {
    console.error('Instagram webhook error:', error)
    return c.text('ERROR', 500)
  }
})

// Alternative Facebook webhook path (to bypass cache)
webhookRoutes.get('/fb', async (c) => {
  const mode = c.req.query('hub.mode')
  const token = c.req.query('hub.verify_token')
  const challenge = c.req.query('hub.challenge')

  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Facebook webhook verified (alt path)')
    return c.text(challenge || '')
  }

  return c.text('Verification failed', 403)
})

webhookRoutes.post('/fb', async (c) => {
  console.log('🚨 WEBHOOK HIT (alt) AT:', new Date().toISOString())

  try {
    const body = await c.req.json()
    console.log('📥 Facebook webhook (alt) received:', JSON.stringify(body, null, 2))

    if (body.object === 'page') {
      for (const entry of body.entry || []) {
        for (const messaging of entry.messaging || []) {
          await handleFacebookMessage(messaging)
        }
      }
    }

    return c.text('EVENT_RECEIVED', 200, {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
  } catch (error) {
    console.error('Facebook webhook error:', error)
    return c.text('ERROR', 500)
  }
})

// Facebook webhook verification
webhookRoutes.get('/facebook', async (c) => {
  const mode = c.req.query('hub.mode')
  const token = c.req.query('hub.verify_token')
  const challenge = c.req.query('hub.challenge')

  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Facebook webhook verified')
    return c.text(challenge || '')
  }

  return c.text('Verification failed', 403)
})

// Facebook Messenger incoming messages
webhookRoutes.post('/facebook', async (c) => {
  // Log IMMEDIATELY before any async
  debugLog('🚨 WEBHOOK HIT - Facebook POST received')

  try {
    const body = await c.req.json()

    // Log ALL incoming webhook payloads for debugging
    debugLog(`📥 Facebook webhook body: ${JSON.stringify(body)}`)

    // Handle Messenger messages
    if (body.object === 'page') {
      for (const entry of body.entry || []) {
        for (const messaging of entry.messaging || []) {
          await handleFacebookMessage(messaging)
        }
      }
    }

    // Return with no-cache headers to prevent Cloudflare caching
    return c.text('EVENT_RECEIVED', 200, {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
  } catch (error) {
    console.error('Facebook webhook error:', error)
    return c.text('ERROR', 500, {
      'Cache-Control': 'no-store'
    })
  }
})

/**
 * Handle Instagram DM message
 */
async function handleInstagramMessage(messaging: {
  sender: { id: string }
  message?: { text: string; mid: string }
}): Promise<void> {
  if (!messaging.message?.text) return

  const senderId = messaging.sender.id
  const messageText = messaging.message.text

  console.log(`Instagram message from ${senderId}: ${messageText}`)

  // Process message through Cheshire
  const response = await processChannelMessage(
    'INSTAGRAM',
    senderId,
    messageText
  )

  // Send response back via Instagram API
  await sendInstagramReply(senderId, response)
}

/**
 * Handle Facebook Messenger message
 */
async function handleFacebookMessage(messaging: {
  sender: { id: string }
  message?: { text: string; mid: string }
}): Promise<void> {
  if (!messaging.message?.text) return

  const senderId = messaging.sender.id
  const messageText = messaging.message.text

  console.log(`Facebook message from ${senderId}: ${messageText}`)

  // Process message through Cheshire
  const response = await processChannelMessage(
    'FACEBOOK',
    senderId,
    messageText
  )

  // Send response back via Facebook API
  await sendFacebookReply(senderId, response)
}

/**
 * Process a message from any channel through Cheshire
 */
async function processChannelMessage(
  channel: ConversationChannel,
  externalId: string,
  message: string
): Promise<string> {
  // Get or create conversation
  const conversation = await getOrCreateConversation(channel, externalId)

  // Add user message
  await addMessage(conversation.id, 'USER', message)

  // Get history
  const history = formatHistoryForLLM(conversation.messages)

  // Detect intent
  const intent = await detectIntent(message, history)

  // Check if this is a returning client for personalized greetings
  const returning = await isReturningClient(conversation.client?.id)

  // Generate response based on intent
  let response: string

  if (intent.intent === 'BOOKING') {
    response = await handleBookingFlow(message, conversation, intent, {
      conversationId: conversation.id,
      channel: channel as 'INSTAGRAM' | 'FACEBOOK' | 'WEBSITE',
      externalId,
    })
  } else {
    response = await generateResponse(message, {
      conversationHistory: history,
      intent,
      isReturningClient: returning,
    })
  }

  // Save response
  await addMessage(conversation.id, 'ASSISTANT', response)

  return response
}

/**
 * Send reply via Instagram API
 */
async function sendInstagramReply(recipientId: string, message: string): Promise<void> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

  if (!accessToken) {
    console.error('Instagram access token not configured')
    return
  }

  const url = `https://graph.instagram.com/v18.0/me/messages`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Instagram API error:', error)
    }
  } catch (error) {
    console.error('Failed to send Instagram reply:', error)
  }
}

/**
 * Send reply via Facebook Messenger API
 */
async function sendFacebookReply(recipientId: string, message: string): Promise<void> {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

  if (!accessToken) {
    console.error('Facebook page access token not configured')
    return
  }

  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Facebook API error:', error)
    }
  } catch (error) {
    console.error('Failed to send Facebook reply:', error)
  }
}
