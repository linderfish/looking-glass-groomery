// apps/telegram-bot/src/handlers/bookings.ts
import { Composer } from 'grammy'
import { getKimmieMessage } from '../services/kimmie-persona'
import { format, addDays, setHours, setMinutes, startOfDay } from 'date-fns'
import { prisma } from '@looking-glass/db'
import { createCalendarEvent, isCalendarConfigured } from '../services/calendar'
import { sendBeforePhotoReminder, sendAfterPhotoReminder } from './reminders'
import { notifyAchievementUnlocked } from './achievements'
import { getStats, incrementCompletionStats } from '../services/stats'
import { checkAndUnlockAchievements } from '../services/achievements'
import { createWaiverRequest, checkWaiverStatus } from '../services/waiver'

type BotContext = import('../bot').BotContext

export const bookingsHandler = new Composer<BotContext>()

// /today command - show today's appointments with actions
bookingsHandler.command('today', async (ctx) => {
  const today = new Date()

  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay(today),
        lte: new Date(startOfDay(today).getTime() + 24 * 60 * 60 * 1000),
      },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    include: {
      pet: true,
      client: true,
      services: true,
    },
    orderBy: { scheduledAt: 'asc' },
  })

  if (appointments.length === 0) {
    await ctx.reply('📅 No appointments today - enjoy your day off! 💅')
    return
  }

  let message = `📅 <b>Today's Appointments</b>\n\n`

  for (const apt of appointments) {
    const time = format(apt.scheduledAt, 'h:mm a')
    const statusEmoji: Record<string, string> = {
      PENDING: '⏳',
      CONFIRMED: '✅',
      CHECKED_IN: '📍',
      IN_PROGRESS: '✂️',
      COMPLETED: '🎉',
    }

    message += `${statusEmoji[apt.status] || '❓'} <b>${time}</b> - ${apt.pet.name}\n`
    message += `   ${apt.client.firstName} | ${apt.status.replace('_', ' ')}\n\n`
  }

  // Build inline keyboard for actionable appointments
  const buttons: Array<Array<{ text: string; callback_data: string }>> = []
  for (const apt of appointments) {
    if (apt.status === 'CONFIRMED') {
      buttons.push([{ text: `📍 Check In: ${apt.pet.name}`, callback_data: `checkin:${apt.id}` }])
    } else if (apt.status === 'CHECKED_IN') {
      buttons.push([{ text: `✂️ Start: ${apt.pet.name}`, callback_data: `start:${apt.id}` }])
    } else if (apt.status === 'IN_PROGRESS') {
      buttons.push([{ text: `✅ Complete: ${apt.pet.name}`, callback_data: `complete:${apt.id}` }])
    }
  }

  await ctx.reply(message, {
    parse_mode: 'HTML',
    reply_markup: buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
  })
})

/**
 * Parse a natural language time string into a Date
 */
function parseTimeInput(input: string): Date | null {
  try {
    const timeMatch = input.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i)
    if (!timeMatch) return null

    let hours = parseInt(timeMatch[1])
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
    const meridian = timeMatch[3]?.toLowerCase()

    if (meridian === 'pm' && hours < 12) hours += 12
    if (meridian === 'am' && hours === 12) hours = 0

    const lowerInput = input.toLowerCase()
    let targetDate = new Date()

    if (lowerInput.includes('tomorrow')) {
      targetDate = addDays(targetDate, 1)
    } else if (lowerInput.includes('monday')) {
      targetDate = getNextWeekday(targetDate, 1)
    } else if (lowerInput.includes('tuesday')) {
      targetDate = getNextWeekday(targetDate, 2)
    } else if (lowerInput.includes('wednesday')) {
      targetDate = getNextWeekday(targetDate, 3)
    } else if (lowerInput.includes('thursday')) {
      targetDate = getNextWeekday(targetDate, 4)
    } else if (lowerInput.includes('friday')) {
      targetDate = getNextWeekday(targetDate, 5)
    } else if (lowerInput.includes('saturday')) {
      targetDate = getNextWeekday(targetDate, 6)
    } else {
      targetDate = addDays(targetDate, 1) // Default to tomorrow
    }

    return setHours(setMinutes(startOfDay(targetDate), minutes), hours)
  } catch {
    return null
  }
}

function getNextWeekday(from: Date, targetDay: number): Date {
  const current = from.getDay()
  let daysUntil = targetDay - current
  if (daysUntil <= 0) daysUntil += 7
  return addDays(from, daysUntil)
}

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

  try {
    // Update booking status in database
    const appointment = await prisma.appointment.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: {
        pet: true,
        client: true,
      },
    })

    const message = getKimmieMessage('BOOKING_CONFIRMED', {
      petName: appointment.pet.name,
    })

    await ctx.answerCallbackQuery({ text: 'Booking confirmed! 🎉' })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
    await ctx.reply(message, { parse_mode: 'HTML' })

    // Create Google Calendar event if configured
    let calendarNote = ''
    if (isCalendarConfigured()) {
      const eventId = await createCalendarEvent({
        summary: `🐾 ${appointment.pet.name} - ${appointment.clientNotes || 'Grooming'}`,
        description: `Client: ${appointment.client.firstName} ${appointment.client.lastName}\nPet: ${appointment.pet.name}\nServices: ${appointment.clientNotes || 'Full Groom'}`,
        start: appointment.scheduledAt,
        end: appointment.endTime,
      })
      calendarNote = eventId ? '\n📅 Added to Google Calendar!' : ''
    }

    // Show appointment details with Check-In button
    await ctx.reply(
      `✅ <b>Confirmed:</b> ${appointment.pet.name}\n` +
      `📅 ${format(appointment.scheduledAt, 'EEEE, MMM d')} at ${format(appointment.scheduledAt, 'h:mm a')}\n` +
      `👤 ${appointment.client.firstName} ${appointment.client.lastName}` +
      calendarNote,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📍 Check In', callback_data: `checkin:${appointment.id}` },
            ],
          ],
        },
      }
    )

    // Create waiver request and send link to Kimmie
    const waiverRequest = await createWaiverRequest(appointment.clientId)
    if (waiverRequest) {
      await ctx.reply(
        `📋 <b>Waiver Link for ${appointment.client.firstName}:</b>\n\n` +
        `${waiverRequest.waiverUrl}\n\n` +
        `Send this to the client before their appointment! `,
        { parse_mode: 'HTML' }
      )
    }
  } catch (error) {
    console.error('Failed to confirm booking:', error)
    await ctx.answerCallbackQuery({ text: 'Error confirming booking 😿' })
    await ctx.reply(`Oops! Something went wrong confirming this booking. The ID might be invalid.`)
  }
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

  // Get appointment details before prompting for reason
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: bookingId },
      include: { pet: true },
    })

    if (!appointment) {
      await ctx.answerCallbackQuery({ text: 'Booking not found' })
      return
    }

    ctx.session.awaitingAction = 'decline_reason'
    ctx.session.pendingBookingId = bookingId

    await ctx.answerCallbackQuery()
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
    await ctx.reply(
      `Declining ${appointment.pet.name}'s appointment.\n\nWant to send a reason? Just type it out and I'll save it~\n\nOr type "skip" to decline without a message.`
    )
  } catch (error) {
    console.error('Failed to get booking for decline:', error)
    await ctx.answerCallbackQuery({ text: 'Error loading booking' })
  }
})

// Handle check-in
bookingsHandler.callbackQuery(/^checkin:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  try {
    // Get appointment first to check waiver status
    const appointmentData = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true },
    })

    if (!appointmentData) {
      await ctx.answerCallbackQuery({ text: 'Appointment not found' })
      return
    }

    // Check waiver status (soft check - warn but don't block)
    const waiverSigned = await checkWaiverStatus(appointmentData.clientId)
    let waiverWarning = ''
    if (!waiverSigned) {
      waiverWarning = `\n\n⚠️ <b>Note:</b> Waiver not yet signed!`
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
      },
      include: {
        pet: true,
        client: true,
      },
    })

    await ctx.answerCallbackQuery({ text: 'Checked in! 📍' })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })

    await ctx.reply(
      `📍 <b>${appointment.pet.name} has arrived!</b>${waiverWarning}\n\n` +
      `Tap when you start grooming:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✂️ Start Grooming', callback_data: `start:${appointment.id}` },
            ],
          ],
        },
      }
    )

    // Send before photo reminder
    await sendBeforePhotoReminder(ctx, {
      petName: appointment.pet.name,
      appointmentId: appointment.id,
      type: 'before',
    })
  } catch (error) {
    console.error('Failed to check in:', error)
    await ctx.answerCallbackQuery({ text: 'Error checking in 😿' })
  }
})

// Handle start grooming (IN_PROGRESS)
bookingsHandler.callbackQuery(/^start:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  try {
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'IN_PROGRESS',
      },
      include: {
        pet: true,
      },
    })

    await ctx.answerCallbackQuery({ text: 'Grooming started! ✂️' })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })

    await ctx.reply(
      `✂️ <b>Grooming ${appointment.pet.name}!</b>\n\n` +
      `Work your magic, queen! 💅\n\n` +
      `Tap when done:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Complete', callback_data: `complete:${appointment.id}` },
            ],
          ],
        },
      }
    )
  } catch (error) {
    console.error('Failed to start grooming:', error)
    await ctx.answerCallbackQuery({ text: 'Error starting grooming 😿' })
  }
})

// Handle completion
bookingsHandler.callbackQuery(/^complete:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  try {
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        pet: true,
        client: true,
      },
    })

    await ctx.answerCallbackQuery({ text: 'Completed! 🎉' })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })

    await ctx.reply(
      `🎉 <b>${appointment.pet.name} is all done!</b>\n\n` +
      `${appointment.pet.name} is looking fabulous, I just know it! ✨`,
      { parse_mode: 'HTML' }
    )

    // Send after photo reminder
    await sendAfterPhotoReminder(ctx, {
      petName: appointment.pet.name,
      appointmentId: appointment.id,
      type: 'after',
    })

    // Update stats and check for new achievements
    try {
      await incrementCompletionStats()
      const stats = await getStats()
      const newAchievements = await checkAndUnlockAchievements(stats)

      // Notify for each new achievement
      for (const achievementId of newAchievements) {
        await notifyAchievementUnlocked(ctx, achievementId)
      }
    } catch (statsError) {
      console.error('Failed to update stats/achievements:', statsError)
      // Don't fail the completion if stats update fails
    }
  } catch (error) {
    console.error('Failed to complete appointment:', error)
    await ctx.answerCallbackQuery({ text: 'Error completing appointment 😿' })
  }
})

// Handle reschedule text input
bookingsHandler.on('message:text', async (ctx, next) => {
  if (ctx.session.awaitingAction === 'reschedule' && ctx.session.pendingBookingId) {
    const newTime = ctx.message.text
    const bookingId = ctx.session.pendingBookingId

    // Parse the time
    const parsedDate = parseTimeInput(newTime)

    if (!parsedDate) {
      await ctx.reply(
        `Hmm, I couldn't understand that time. Try something like:\n• "Tomorrow at 2pm"\n• "Friday 10am"\n• "Monday 3:30 PM"`
      )
      return
    }

    try {
      // Update in database
      const duration = 60 // Default duration
      const endTime = new Date(parsedDate.getTime() + duration * 60000)

      const appointment = await prisma.appointment.update({
        where: { id: bookingId },
        data: {
          scheduledAt: parsedDate,
          endTime,
        },
        include: {
          pet: true,
          client: true,
        },
      })

      await ctx.reply(
        `✅ <b>Rescheduled!</b>\n\n` +
        `${appointment.pet.name} is now booked for:\n` +
        `📅 ${format(parsedDate, 'EEEE, MMM d')} at ${format(parsedDate, 'h:mm a')}\n\n` +
        `You're such a professional, queen~ 👑`,
        { parse_mode: 'HTML' }
      )
    } catch (error) {
      console.error('Failed to reschedule:', error)
      await ctx.reply(`Oops! Something went wrong rescheduling. Please try again.`)
    }

    ctx.session.awaitingAction = undefined
    ctx.session.pendingBookingId = undefined
    return
  }

  if (ctx.session.awaitingAction === 'decline_reason' && ctx.session.pendingBookingId) {
    const reason = ctx.message.text
    const bookingId = ctx.session.pendingBookingId

    try {
      // Update booking status in database
      const appointment = await prisma.appointment.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason.toLowerCase() === 'skip' ? null : reason,
        },
        include: {
          pet: true,
        },
      })

      if (reason.toLowerCase() === 'skip') {
        await ctx.reply(
          `✅ ${appointment.pet.name}'s booking declined.\n\nNo worries, you know your schedule best! 💅`
        )
      } else {
        await ctx.reply(
          `✅ ${appointment.pet.name}'s booking declined.\n\nReason saved: "${reason}"\n\nBoundaries are healthy, queen! ✨`
        )
      }
    } catch (error) {
      console.error('Failed to decline booking:', error)
      await ctx.reply(`Oops! Something went wrong declining this booking.`)
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
