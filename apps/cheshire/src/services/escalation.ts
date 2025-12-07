// apps/cheshire/src/services/escalation.ts
import { prisma } from '@looking-glass/db'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const KIMMIE_CHAT_ID = process.env.TELEGRAM_KIMMIE_CHAT_ID!

/**
 * Notify Kimmie via Telegram about an escalation
 */
export async function notifyKimmieEscalation(
  conversationId: string,
  triggerMessage: string
): Promise<void> {
  try {
    // Get conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        client: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!conversation) {
      console.error(`Conversation ${conversationId} not found for escalation`)
      return
    }

    const clientInfo = conversation.client
      ? `${conversation.client.firstName} ${conversation.client.lastName}`
      : 'Unknown visitor'

    const recentMessages = conversation.messages
      .reverse()
      .map(m => `${m.role === 'USER' ? '👤' : '🐱'} ${m.content}`)
      .join('\n\n')

    const message = `🚨 <b>Escalation Alert!</b> 🚨

Someone wants to talk to the real queen!

👤 <b>Who:</b> ${clientInfo}
📱 <b>Channel:</b> ${conversation.channel}
💬 <b>Trigger:</b> "${triggerMessage}"

<b>Recent conversation:</b>
${recentMessages}

<i>Conversation ID: ${conversationId}</i>`

    // Send to Telegram
    await sendTelegramMessage(message)

    // Log escalation
    console.log(`Escalation sent to Kimmie for conversation ${conversationId}`)
  } catch (error) {
    console.error('Failed to notify Kimmie of escalation:', error)
  }
}

/**
 * Send a message via Telegram Bot API
 */
async function sendTelegramMessage(message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: KIMMIE_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Telegram API error: ${error}`)
  }
}

/**
 * Notify about new booking that needs attention
 */
export async function notifyNewBookingRequest(
  conversationId: string,
  bookingDetails: {
    petName?: string
    services?: string[]
    preferredTime?: string
    clientName?: string
  }
): Promise<void> {
  const message = `📅 <b>New Booking Request!</b>

🐾 <b>Pet:</b> ${bookingDetails.petName || 'Unknown'}
👤 <b>Client:</b> ${bookingDetails.clientName || 'New client'}
✂️ <b>Services:</b> ${bookingDetails.services?.join(', ') || 'TBD'}
🕐 <b>Preferred Time:</b> ${bookingDetails.preferredTime || 'Flexible'}

<i>From Cheshire conversation ${conversationId}</i>`

  await sendTelegramMessage(message)
}

/**
 * Notify about completed booking
 */
export async function notifyBookingConfirmed(
  appointmentId: string,
  details: {
    petName: string
    clientName: string
    dateTime: string
    services: string[]
  }
): Promise<void> {
  const message = `✅ <b>Booking Confirmed!</b>

🐾 <b>${details.petName}</b>
👤 ${details.clientName}
📅 ${details.dateTime}
✂️ ${details.services.join(', ')}

Cheshire did the work so you don't have to! 😸✨`

  await sendTelegramMessage(message)
}
