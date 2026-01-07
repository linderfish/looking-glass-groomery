// apps/telegram-bot/src/services/scheduler.ts
import * as cron from 'node-cron'
import { getSettings } from './settings'
import { sendDailyDigest } from './daily-digest'
import { bot } from '../bot'

// Track if daily digest was already sent today (prevent duplicates)
let lastDigestDate: string | null = null

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
 */
async function checkDailyDigest(): Promise<void> {
  const settings = await getSettings()
  const now = new Date()

  // Get current time in HH:MM format
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const todayDate = now.toDateString()

  // Skip if already sent today
  if (lastDigestDate === todayDate) {
    return
  }

  // Check if current time matches the configured dailySummaryTime
  if (currentTime !== settings.dailySummaryTime) {
    return
  }

  // Check weekend mode
  const dayOfWeek = now.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // If weekendMode is enabled, skip on weekends
  if (settings.weekendMode && isWeekend) {
    console.log('Skipping daily digest - weekend mode enabled')
    lastDigestDate = todayDate // Mark as "sent" to prevent repeated checks
    return
  }

  // Send the daily digest
  console.log(`Sending daily digest at ${currentTime}...`)
  await sendDailyDigest()
  lastDigestDate = todayDate
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
