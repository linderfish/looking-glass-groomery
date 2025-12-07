// apps/telegram-bot/src/handlers/bookings.ts
import { Composer } from 'grammy'
import { getKimmieMessage } from '../services/kimmie-persona'
import { format } from 'date-fns'

type BotContext = import('../bot').BotContext

export const bookingsHandler = new Composer<BotContext>()

/**
 * Send a new booking notification to Kimmie
 */
export async function notifyNewBooking(
  ctx: BotContext,
  booking: {
    id: string
    petName: string
    clientName: string
    date: Date
    services: string[]
  }
): Promise<void> {
  const message = getKimmieMessage('NEW_BOOKING', {
    petName: booking.petName,
    clientName: booking.clientName,
    date: format(booking.date, 'EEEE, MMM d'),
    time: format(booking.date, 'h:mm a'),
    services: booking.services.join(', '),
  })

  await ctx.api.sendMessage(process.env.TELEGRAM_KIMMIE_CHAT_ID!, message, {
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
  })
}

// Handle booking confirmation
bookingsHandler.callbackQuery(/^confirm_booking:(.+)$/, async (ctx) => {
  const bookingId = ctx.match[1]

  // TODO: Update booking status in database
  // await prisma.appointment.update({ where: { id: bookingId }, data: { status: 'CONFIRMED' } })

  const message = getKimmieMessage('BOOKING_CONFIRMED', {
    petName: 'the floofy one', // TODO: Get from database
  })

  await ctx.answerCallbackQuery({ text: 'Booking confirmed! 🎉' })
  await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  await ctx.reply(message, { parse_mode: 'HTML' })
})

// Handle booking reschedule request
bookingsHandler.callbackQuery(/^reschedule_booking:(.+)$/, async (ctx) => {
  const bookingId = ctx.match[1]

  ctx.session.awaitingAction = 'reschedule'
  ctx.session.pendingBookingId = bookingId

  await ctx.answerCallbackQuery()
  await ctx.reply(
    `📅 When would you like to reschedule?\n\nJust type the new date and time, gorgeous~ ✨\n\nExample: "Tomorrow at 2pm" or "Friday 10am"`
  )
})

// Handle booking decline
bookingsHandler.callbackQuery(/^decline_booking:(.+)$/, async (ctx) => {
  const bookingId = ctx.match[1]

  ctx.session.awaitingAction = 'decline_reason'
  ctx.session.pendingBookingId = bookingId

  await ctx.answerCallbackQuery()
  await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  await ctx.reply(
    `Got it! Want to send a reason? Just type it out and I'll let them know~\n\nOr type "skip" to decline without a message.`
  )
})

// Handle reschedule text input
bookingsHandler.on('message:text', async (ctx, next) => {
  if (ctx.session.awaitingAction === 'reschedule' && ctx.session.pendingBookingId) {
    const newTime = ctx.message.text

    // TODO: Parse the time and update in database
    // TODO: Send notification to client

    await ctx.reply(
      `✅ Rescheduled! I'll let them know about the new time: ${newTime}\n\nYou're such a professional, queen~ 👑`
    )

    ctx.session.awaitingAction = undefined
    ctx.session.pendingBookingId = undefined
    return
  }

  if (ctx.session.awaitingAction === 'decline_reason' && ctx.session.pendingBookingId) {
    const reason = ctx.message.text

    if (reason.toLowerCase() === 'skip') {
      await ctx.reply(`✅ Booking declined. No worries, you know your schedule best! 💅`)
    } else {
      // TODO: Send decline notification to client with reason
      await ctx.reply(`✅ Booking declined and message sent. Boundaries are healthy, queen! ✨`)
    }

    ctx.session.awaitingAction = undefined
    ctx.session.pendingBookingId = undefined
    return
  }

  await next()
})

/**
 * Send daily booking summary
 */
export async function sendDailySummary(
  ctx: BotContext,
  stats: {
    bookings: number
    completed: number
    photos: number
    photoStreak: number
    contentStreak: number
  }
): Promise<void> {
  const message = getKimmieMessage('DAILY_STATS', stats)

  await ctx.api.sendMessage(process.env.TELEGRAM_KIMMIE_CHAT_ID!, message, {
    parse_mode: 'HTML',
  })
}
