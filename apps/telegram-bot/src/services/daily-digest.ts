// apps/telegram-bot/src/services/daily-digest.ts
import { prisma } from '@looking-glass/db'
import { bot } from '../bot'
import { getSettings } from './settings'
import { startOfDay, endOfDay, format } from 'date-fns'

/**
 * Send the daily digest to Kimmie
 * Called by the scheduler at her preferred dailySummaryTime
 */
export async function sendDailyDigest(): Promise<void> {
  const settings = await getSettings()
  const today = new Date()

  // Get today's appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay(today),
        lte: endOfDay(today)
      },
      status: { in: ['CONFIRMED', 'PENDING'] }
    },
    include: {
      pet: true,
      client: true,
      services: true
    },
    orderBy: { scheduledAt: 'asc' }
  })

  // Build the message
  let message = `Good morning, ${settings.preferredName}!\n\n`

  if (appointments.length === 0) {
    message += `No appointments today - enjoy your day off!`
  } else {
    message += `You have ${appointments.length} appointment${appointments.length > 1 ? 's' : ''} today:\n\n`

    for (const apt of appointments) {
      const time = format(apt.scheduledAt, 'h:mm a')
      const services = apt.services.map(s => s.name).join(', ') || 'Full Groom'
      const statusEmoji = apt.status === 'CONFIRMED' ? '' : ' (pending)'

      message += `${time} - ${apt.pet.name} (${apt.pet.species.toLowerCase()})\n`
      message += `   ${apt.client.firstName} | ${services}${statusEmoji}\n\n`
    }
  }

  // Get photo streak if it exists
  try {
    const stats = await prisma.kimmieStats.findFirst()
    if (stats && stats.photoStreak > 0) {
      message += `\nPhoto streak: ${stats.photoStreak} days!`
    }
  } catch {
    // KimmieStats might not exist yet, that's fine
  }

  // Send the message
  await bot.api.sendMessage(process.env.TELEGRAM_KIMMIE_CHAT_ID!, message)

  console.log(`Daily digest sent at ${format(today, 'h:mm a')}`)
}

/**
 * Get a preview of what the daily digest would look like
 * Useful for testing and the /today command
 */
export async function getDailyDigestPreview(): Promise<string> {
  const settings = await getSettings()
  const today = new Date()

  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay(today),
        lte: endOfDay(today)
      },
      status: { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS'] }
    },
    include: {
      pet: true,
      client: true,
      services: true
    },
    orderBy: { scheduledAt: 'asc' }
  })

  let message = `Today's Schedule (${format(today, 'EEEE, MMMM d')})\n\n`

  if (appointments.length === 0) {
    message += `No appointments - enjoy your day off!`
  } else {
    for (const apt of appointments) {
      const time = format(apt.scheduledAt, 'h:mm a')
      const services = apt.services.map(s => s.name).join(', ') || 'Full Groom'

      // Status indicator
      let statusIcon = ''
      switch (apt.status) {
        case 'PENDING': statusIcon = ' (pending)'; break
        case 'CONFIRMED': statusIcon = ''; break
        case 'CHECKED_IN': statusIcon = ' [checked in]'; break
        case 'IN_PROGRESS': statusIcon = ' [in progress]'; break
      }

      message += `${time} - ${apt.pet.name}${statusIcon}\n`
      message += `   ${apt.client.firstName} ${apt.client.lastName}\n`
      message += `   ${services}\n\n`
    }
  }

  return message
}
