// apps/telegram-bot/src/services/settings.ts
import { prisma } from '@looking-glass/db'
import type { KimmieSettings } from '@prisma/client'

/**
 * Get Kimmie's settings (creates default if none exist)
 * This is a singleton - only one settings record for the whole system
 */
export async function getSettings(): Promise<KimmieSettings> {
  let settings = await prisma.kimmieSettings.findFirst()

  if (!settings) {
    settings = await prisma.kimmieSettings.create({
      data: {} // Uses all defaults from schema
    })
  }

  return settings
}

/**
 * Update settings with partial data
 */
export async function updateSettings(
  data: Partial<Omit<KimmieSettings, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<KimmieSettings> {
  const current = await getSettings()

  return prisma.kimmieSettings.update({
    where: { id: current.id },
    data
  })
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(): Promise<KimmieSettings> {
  return updateSettings({
    onboardingComplete: true,
    onboardingStep: 999 // Indicates fully complete
  })
}

/**
 * Advance onboarding to next step
 */
export async function advanceOnboarding(step: number): Promise<KimmieSettings> {
  return updateSettings({ onboardingStep: step })
}

/**
 * Parse time string like "9am", "2:30pm", "14:00" into "HH:MM" format
 */
export function parseTimeString(input: string): string | null {
  const trimmed = input.toLowerCase().trim()

  // Try "HH:MM" format first
  const militaryMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1])
    const minutes = militaryMatch[2]
    if (hours >= 0 && hours <= 23) {
      return `${hours.toString().padStart(2, '0')}:${minutes}`
    }
  }

  // Try "9am", "2pm", "9:30am" format
  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/)
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1])
    const minutes = ampmMatch[2] || '00'
    const meridian = ampmMatch[3]

    if (meridian === 'pm' && hours < 12) hours += 12
    if (meridian === 'am' && hours === 12) hours = 0

    if (hours >= 0 && hours <= 23) {
      return `${hours.toString().padStart(2, '0')}:${minutes}`
    }
  }

  // Try just a number like "9" (assume AM if <= 12, PM otherwise for business hours)
  const justNumber = trimmed.match(/^(\d{1,2})$/)
  if (justNumber) {
    let hours = parseInt(justNumber[1])
    // Assume business hours: 6-11 = AM, 12+ = as-is, 1-5 = PM
    if (hours >= 1 && hours <= 5) hours += 12
    if (hours >= 0 && hours <= 23) {
      return `${hours.toString().padStart(2, '0')}:00`
    }
  }

  return null
}

/**
 * Format time for display (e.g., "09:00" -> "9:00 AM")
 */
export function formatTimeForDisplay(time: string): string {
  const [hoursStr, minutes] = time.split(':')
  let hours = parseInt(hoursStr)
  const meridian = hours >= 12 ? 'PM' : 'AM'

  if (hours > 12) hours -= 12
  if (hours === 0) hours = 12

  return `${hours}:${minutes} ${meridian}`
}

/**
 * Get a friendly summary of current settings
 */
export async function getSettingsSummary(): Promise<string> {
  const settings = await getSettings()

  const lines = [
    `📊 Daily summary: ${formatTimeForDisplay(settings.dailySummaryTime)}`,
    `⏰ Appointment reminder: ${settings.appointmentReminder} min before`,
    `📸 Photo reminders: ${settings.photoReminderLevel}`,
    `📅 Google Calendar: ${settings.googleCalendarSync ? 'Connected' : 'Off'}`,
    `🔄 Auto-confirm returning: ${settings.autoConfirmReturning ? 'Yes' : 'No'}`,
    `🌙 Weekend mode: ${settings.weekendMode ? 'On' : 'Off'}`,
    `👑 Name: ${settings.preferredName}`,
  ]

  return lines.join('\n')
}
