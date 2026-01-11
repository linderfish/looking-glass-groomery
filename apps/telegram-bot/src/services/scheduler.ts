// apps/telegram-bot/src/services/scheduler.ts
import * as cron from 'node-cron'
import { getSettings, updateSettings } from './settings'
import { sendDailyDigest } from './daily-digest'
import { bot } from '../bot'
import { prisma } from '@looking-glass/db'

// NOTE: lastDigestDate is now stored in database (KimmieSettings.lastDigestDate)
// This ensures state survives bot restarts

/**
 * Initialize the scheduler with cron jobs
 * Call this after bot.start() in index.ts
 */
export function initializeScheduler(): void {
  // Check every minute if it's time for the daily digest
  // This approach allows dynamic time changes from settings
  cron.schedule('* * * * *', async () => {
    try {
      await checkDailyDigest()
    } catch (error) {
      console.error('Scheduler error (daily digest):', error)
    }
  })

  console.log('Scheduler initialized - daily digest ready')
}

/**
 * Check if it's time to send the daily digest
 * Uses database-backed state to survive restarts
 * Now timezone-aware using Kimmie's configured timezone
 */
async function checkDailyDigest(): Promise<void> {
  const settings = await getSettings()
  const now = new Date()
  const timezone = settings.timezone || 'America/Los_Angeles'

  // Get current time in Kimmie's timezone (HH:MM format)
  const kimmieTime = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  // Get today's date in Kimmie's timezone (YYYY-MM-DD format)
  const kimmieDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

  // Skip if already sent today (check database, not memory)
  if (settings.lastDigestDate === kimmieDate) {
    return
  }

  // Check if current time matches the configured dailySummaryTime
  if (kimmieTime !== settings.dailySummaryTime) {
    return
  }

  // Check weekend mode - get day of week in Kimmie's timezone
  const kimmieWeekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(now)
  const isWeekend = kimmieWeekday === 'Sat' || kimmieWeekday === 'Sun'

  // If weekendMode is enabled, skip on weekends
  if (settings.weekendMode && isWeekend) {
    console.log('Skipping daily digest - weekend mode enabled')
    // Mark as "sent" in database to prevent repeated checks
    await updateSettings({ lastDigestDate: kimmieDate })
    return
  }

  // Send the daily digest
  console.log(`Sending daily digest at ${kimmieTime} (${timezone})...`)
  await sendDailyDigest()
  // Persist to database (survives restarts)
  await updateSettings({ lastDigestDate: kimmieDate })
}

/**
 * Schedule a reminder for a specific appointment
 * Call this when an appointment is confirmed
 */
export function scheduleAppointmentReminder(
  appointmentId: string,
  scheduledAt: Date,
  minutesBefore: number
): NodeJS.Timeout | null {
  const reminderTime = new Date(scheduledAt.getTime() - minutesBefore * 60 * 1000)
  const now = new Date()

  // Only schedule if reminder time is in the future
  if (reminderTime <= now) {
    return null
  }

  const delay = reminderTime.getTime() - now.getTime()

  const timeout = setTimeout(async () => {
    try {
      await bot.api.sendMessage(
        process.env.TELEGRAM_KIMMIE_CHAT_ID!,
        `Appointment in ${minutesBefore} minutes!`
      )
    } catch (error) {
      console.error(`Failed to send reminder for appointment ${appointmentId}:`, error)
    }
  }, delay)

  console.log(
    `Scheduled reminder for appointment ${appointmentId} at ${reminderTime.toLocaleTimeString()}`
  )

  return timeout
}

/**
 * Schedule photo reminder after check-in or completion
 * Call this when appointment status changes to CHECKED_IN or COMPLETED
 */
export function schedulePhotoReminder(
  appointmentId: string,
  type: 'before' | 'after',
  delayMinutes: number = 0
): NodeJS.Timeout {
  const message = type === 'before'
    ? `Don't forget the BEFORE photo for this appointment!`
    : `Time for the AFTER photo - capture that transformation!`

  const timeout = setTimeout(async () => {
    try {
      await bot.api.sendMessage(process.env.TELEGRAM_KIMMIE_CHAT_ID!, message)
    } catch (error) {
      console.error(`Failed to send ${type} photo reminder for ${appointmentId}:`, error)
    }
  }, delayMinutes * 60 * 1000)

  return timeout
}

/**
 * Manually trigger the daily digest (for testing or /today command)
 */
export async function triggerDailyDigest(): Promise<void> {
  await sendDailyDigest()
}

/**
 * Recover pending appointment reminders after a restart
 * Call this on startup to reschedule any reminders that were lost
 */
export async function recoverPendingReminders(): Promise<void> {
  const now = new Date()
  const settings = await getSettings()

  // Skip if reminders are disabled
  if (!settings.appointmentReminder || settings.appointmentReminder <= 0) {
    console.log('Appointment reminders disabled - skipping recovery')
    return
  }

  // Find future confirmed appointments
  const pendingAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: now },
      status: 'CONFIRMED'
    }
  })

  let scheduledCount = 0
  for (const apt of pendingAppointments) {
    const reminderTime = new Date(apt.scheduledAt.getTime() - settings.appointmentReminder * 60 * 1000)

    // Only schedule if reminder time is still in the future
    if (reminderTime > now) {
      scheduleAppointmentReminder(apt.id, apt.scheduledAt, settings.appointmentReminder)
      scheduledCount++
    }
  }

  console.log(`Recovered ${scheduledCount}/${pendingAppointments.length} appointment reminders`)
}
