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
 * (This will be expanded to support Instagram/Facebook/SMS responses)
 */
export async function notifyClientBookingConfirmed(
  channel: 'INSTAGRAM' | 'FACEBOOK' | 'WEBSITE',
  externalId: string,
  appointmentDetails: {
    petName: string
    date: Date
    time: string
  }
): Promise<boolean> {
  // TODO: Implement per-channel client notification
  // For now, the booking flow response handles this
  console.log(`Would notify client via ${channel}:`, externalId, appointmentDetails)
  return true
}
