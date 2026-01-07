// apps/cheshire/src/services/notifications.ts
// Telegram notifications for Cheshire - sends booking alerts to Kimmie

const TELEGRAM_API = 'https://api.telegram.org/bot'

interface BookingNotification {
  id: string
  petName: string
  clientName: string
  date: Date
  time: string
  services: string[]
  source: string
}

/**
 * Send a new booking notification to Kimmie via Telegram
 */
export async function notifyKimmieNewBooking(booking: BookingNotification): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_KIMMIE_CHAT_ID

  if (!token || !chatId) {
    console.warn('Telegram credentials not configured - skipping notification')
    return false
  }

  const formattedDate = booking.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const message = `🐾 <b>NEW BOOKING REQUEST</b> 🐾

<b>Pet:</b> ${booking.petName}
<b>Client:</b> ${booking.clientName}
<b>When:</b> ${formattedDate} at ${booking.time}
<b>Services:</b> ${booking.services.join(', ')}
<b>Via:</b> ${booking.source}

Tap to manage this booking, queen! 👑`

  try {
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Confirm', callback_data: `confirm_booking:${booking.id}` },
              { text: '📝 Reschedule', callback_data: `reschedule_booking:${booking.id}` },
            ],
            [
              { text: '❌ Decline', callback_data: `decline_booking:${booking.id}` },
            ],
          ],
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Telegram notification failed:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    return false
  }
}

/**
 * Send a booking confirmation to client via their original channel
 */
export async function notifyClientBookingConfirmed(
  channel: 'INSTAGRAM' | 'FACEBOOK' | 'WEBSITE',
  externalId: string,
  appointmentDetails: {
    petName: string
    date: Date
    time: string
    services?: string[]
  }
): Promise<boolean> {
  const formattedDate = appointmentDetails.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const servicesText = appointmentDetails.services?.length
    ? `\n🛁 Services: ${appointmentDetails.services.join(', ')}`
    : ''

  const message = `✨ Your appointment is confirmed! ✨

🐾 Pet: ${appointmentDetails.petName}
📅 When: ${formattedDate} at ${appointmentDetails.time}${servicesText}

📍 Through the Looking Glass Groomery
22489 Ramona Avenue, Nuevo, CA 92567
📞 951-532-4205

We can't wait to see ${appointmentDetails.petName}! If you need to reschedule, just message us here.`

  try {
    switch (channel) {
      case 'FACEBOOK':
        return await sendFacebookMessage(externalId, message)
      case 'INSTAGRAM':
        return await sendInstagramMessage(externalId, message)
      case 'WEBSITE':
        // Website bookings don't have a message channel - they see confirmation on screen
        console.log('Website booking confirmed (no message channel)')
        return true
      default:
        console.warn(`Unknown channel: ${channel}`)
        return false
    }
  } catch (error) {
    console.error(`Failed to notify client via ${channel}:`, error)
    return false
  }
}

/**
 * Send message via Facebook Messenger API
 */
async function sendFacebookMessage(recipientId: string, message: string): Promise<boolean> {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

  if (!accessToken) {
    console.error('FACEBOOK_PAGE_ACCESS_TOKEN not configured - cannot send client notification')
    return false
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
      return false
    }

    console.log(`✅ Sent booking confirmation to Facebook user ${recipientId}`)
    return true
  } catch (error) {
    console.error('Failed to send Facebook message:', error)
    return false
  }
}

/**
 * Send message via Instagram Messaging API
 */
async function sendInstagramMessage(recipientId: string, message: string): Promise<boolean> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

  if (!accessToken) {
    console.error('INSTAGRAM_ACCESS_TOKEN not configured - cannot send client notification')
    return false
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
      return false
    }

    console.log(`✅ Sent booking confirmation to Instagram user ${recipientId}`)
    return true
  } catch (error) {
    console.error('Failed to send Instagram message:', error)
    return false
  }
}
