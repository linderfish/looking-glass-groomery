// apps/telegram-bot/src/services/daily-digest.ts
import { prisma } from '@looking-glass/db'
import { bot } from '../bot'
import { getSettings } from './settings'
import { listCalendarEvents, isCalendarConfigured } from './calendar'
import { startOfDay, endOfDay, format } from 'date-fns'

/**
 * Send the daily digest to Kimmie
 * Called by the scheduler at her preferred dailySummaryTime
 * Now fetches from Google Calendar (primary source) with Prisma as fallback
 */
export async function sendDailyDigest(): Promise<void> {
  const settings = await getSettings()
  const today = new Date()
  const dayStart = startOfDay(today)
  const dayEnd = endOfDay(today)

  // Build the message
  let message = `Good morning, ${settings.preferredName}! ☀️\n\n`

  // Try Google Calendar first (primary source of truth)
  let hasAppointments = false

  if (isCalendarConfigured()) {
    try {
      const calendarEvents = await listCalendarEvents(dayStart, dayEnd)
      console.log(`Found ${calendarEvents.length} Google Calendar events for today`)

      if (calendarEvents.length > 0) {
        hasAppointments = true
        message += `📅 You have ${calendarEvents.length} appointment${calendarEvents.length > 1 ? 's' : ''} today:\n\n`

        for (const event of calendarEvents) {
          const time = format(event.start, 'h:mm a')
          message += `🐾 <b>${time}</b> - ${event.summary}\n`
          if (event.description) {
            // Show first line of description (usually has client/pet info)
            const firstLine = event.description.split('\n')[0]
            if (firstLine) message += `   ${firstLine}\n`
          }
          message += '\n'
        }
      }
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error)
      // Fall through to Prisma fallback
    }
  }

  // Fallback to Prisma database if no calendar events found
  if (!hasAppointments) {
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['CONFIRMED', 'PENDING'] }
      },
      include: { pet: true, client: true, services: true },
      orderBy: { scheduledAt: 'asc' }
    })

    if (appointments.length > 0) {
      hasAppointments = true
      message += `📅 You have ${appointments.length} appointment${appointments.length > 1 ? 's' : ''} today:\n\n`

      for (const apt of appointments) {
        const time = format(apt.scheduledAt, 'h:mm a')
        const services = apt.services.map(s => s.name).join(', ') || 'Full Groom'
        const statusEmoji = apt.status === 'CONFIRMED' ? '' : ' (pending)'

        message += `🐾 <b>${time}</b> - ${apt.pet.name} (${apt.pet.species.toLowerCase()})\n`
        message += `   ${apt.client.firstName} | ${services}${statusEmoji}\n\n`
      }
    }
  }

  if (!hasAppointments) {
    message += `No appointments today - enjoy your day off! 💅`
  }

  // Get photo streak if it exists
  try {
    const stats = await prisma.kimmieStats.findFirst()
    if (stats && stats.photoStreak > 0) {
      message += `\n📸 Photo streak: ${stats.photoStreak} days!`
    }
  } catch {
    // KimmieStats might not exist yet, that's fine
  }

  // Send the message with HTML formatting
  await bot.api.sendMessage(process.env.TELEGRAM_KIMMIE_CHAT_ID!, message, {
    parse_mode: 'HTML'
  })

  console.log(`Daily digest sent at ${format(today, 'h:mm a')}`)
}

/**
 * Get a preview of what the daily digest would look like
 * Useful for testing and the /today command
 * Now fetches from Google Calendar (primary source) with Prisma as fallback
 */
export async function getDailyDigestPreview(): Promise<string> {
  const today = new Date()
  const dayStart = startOfDay(today)
  const dayEnd = endOfDay(today)

  let message = `📅 <b>Today's Schedule</b> (${format(today, 'EEEE, MMMM d')})\n\n`
  let hasAppointments = false

  // Try Google Calendar first (primary source of truth)
  if (isCalendarConfigured()) {
    try {
      const calendarEvents = await listCalendarEvents(dayStart, dayEnd)
      console.log(`Found ${calendarEvents.length} Google Calendar events for today`)

      if (calendarEvents.length > 0) {
        hasAppointments = true

        for (const event of calendarEvents) {
          const time = format(event.start, 'h:mm a')
          message += `🐾 <b>${time}</b> - ${event.summary}\n`
          if (event.description) {
            // Show description lines (usually has client/pet info)
            const lines = event.description.split('\n').slice(0, 2)
            for (const line of lines) {
              if (line.trim()) message += `   ${line.trim()}\n`
            }
          }
          message += '\n'
        }
      }
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error)
      // Fall through to Prisma fallback
    }
  }

  // Fallback to Prisma database if no calendar events found
  if (!hasAppointments) {
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS'] }
      },
      include: { pet: true, client: true, services: true },
      orderBy: { scheduledAt: 'asc' }
    })

    if (appointments.length > 0) {
      hasAppointments = true

      for (const apt of appointments) {
        const time = format(apt.scheduledAt, 'h:mm a')
        const services = apt.services.map(s => s.name).join(', ') || 'Full Groom'

        // Status indicator
        let statusIcon = ''
        switch (apt.status) {
          case 'PENDING': statusIcon = ' ⏳'; break
          case 'CONFIRMED': statusIcon = ' ✅'; break
          case 'CHECKED_IN': statusIcon = ' 📍'; break
          case 'IN_PROGRESS': statusIcon = ' ✂️'; break
        }

        message += `🐾 <b>${time}</b> - ${apt.pet.name}${statusIcon}\n`
        message += `   ${apt.client.firstName} ${apt.client.lastName}\n`
        message += `   ${services}\n\n`
      }
    }
  }

  if (!hasAppointments) {
    message += `No appointments - enjoy your day off! 💅`
  }

  return message
}
