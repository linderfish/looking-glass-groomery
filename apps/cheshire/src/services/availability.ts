// apps/cheshire/src/services/availability.ts
// Unified availability engine combining database appointments and Google Calendar

import { prisma } from '@looking-glass/db'
import { addDays, addMinutes, format, startOfDay, setHours, setMinutes, isBefore, isAfter, areIntervalsOverlapping } from 'date-fns'
import { hasRefreshToken, getCalendarBusyTimes } from './calendar-oauth'

// Use OAuth calendar instead of service account
const isCalendarConfigured = hasRefreshToken

// Buffer time between appointments (minutes)
const APPOINTMENT_BUFFER = 15

// Working hours configuration
// VERIFIED from MoeGo: https://booking.moego.pet/ol/landing?name=ThroughTheLookingGlassGroomery
export const BUSINESS_HOURS = {
  MONDAY: { start: 10, end: 17 },    // 10am - 5pm
  TUESDAY: { start: 10, end: 17 },
  WEDNESDAY: { start: 10, end: 17 },
  THURSDAY: { start: 10, end: 17 },
  FRIDAY: { start: 10, end: 17 },
  SATURDAY: { start: 10, end: 15 },  // 10am - 3pm
  SUNDAY: null,                       // Closed
} as const

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const

export interface TimeSlot {
  start: Date
  end: Date
  formatted: string
}

export interface BusyBlock {
  start: Date
  end: Date
  source: 'database' | 'google_calendar'
  appointmentId?: string
}

export interface AvailabilityResult {
  slots: TimeSlot[]
  busyBlocks: BusyBlock[]
  date: Date
}

/**
 * Get all busy blocks from database appointments
 * Includes buffer time before and after each appointment
 */
async function getDatabaseBusyBlocks(startDate: Date, endDate: Date): Promise<BusyBlock[]> {
  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'],
      },
    },
    select: {
      id: true,
      scheduledAt: true,
      endTime: true,
      duration: true,
    },
  })

  return appointments.map(apt => ({
    // Add buffer before and after
    start: addMinutes(apt.scheduledAt, -APPOINTMENT_BUFFER),
    end: addMinutes(apt.endTime, APPOINTMENT_BUFFER),
    source: 'database' as const,
    appointmentId: apt.id,
  }))
}

/**
 * Get busy blocks from Google Calendar (if configured)
 * Converts Google Calendar events to BusyBlock format
 */
async function getGoogleCalendarBusyBlocks(startDate: Date, endDate: Date): Promise<BusyBlock[]> {
  if (!isCalendarConfigured()) {
    console.log('[Availability] ⚠️ Google Calendar not configured - skipping calendar check')
    return []
  }

  try {
    console.log(`[Availability] Fetching Google Calendar busy times: ${startDate.toISOString()} - ${endDate.toISOString()}`)
    const busyTimes = await getCalendarBusyTimes(startDate, endDate)
    console.log(`[Availability] Got ${busyTimes.length} busy times from Google Calendar`)

    return busyTimes.map(busy => ({
      start: busy.start,
      end: busy.end,
      source: 'google_calendar' as const,
    }))
  } catch (error) {
    console.error('[Availability] ❌ Failed to get Google Calendar busy blocks:', error)
    return []
  }
}

/**
 * Merge overlapping busy blocks into consolidated blocks
 */
function mergeBusyBlocks(blocks: BusyBlock[]): BusyBlock[] {
  if (blocks.length === 0) return []

  // Sort by start time
  const sorted = [...blocks].sort((a, b) => a.start.getTime() - b.start.getTime())
  const merged: BusyBlock[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]

    // If current overlaps with last, extend last
    if (current.start <= last.end) {
      last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()))
    } else {
      merged.push(current)
    }
  }

  return merged
}

/**
 * Check if a specific time slot is available
 */
export function isSlotAvailable(
  slotStart: Date,
  slotEnd: Date,
  busyBlocks: BusyBlock[]
): boolean {
  for (const block of busyBlocks) {
    if (areIntervalsOverlapping(
      { start: slotStart, end: slotEnd },
      { start: block.start, end: block.end }
    )) {
      return false
    }
  }
  return true
}

/**
 * Check if a specific slot can be booked (main entry point for booking validation)
 */
export async function canBookSlot(
  startTime: Date,
  durationMinutes: number
): Promise<{ available: boolean; conflictReason?: string }> {
  const endTime = addMinutes(startTime, durationMinutes)

  // Check working hours
  const dayOfWeek = DAY_NAMES[startTime.getDay()]
  const hours = BUSINESS_HOURS[dayOfWeek]

  if (!hours) {
    return { available: false, conflictReason: 'We are closed on Sundays' }
  }

  const dayStart = setHours(setMinutes(startOfDay(startTime), 0), hours.start)
  const dayEnd = setHours(setMinutes(startOfDay(startTime), 0), hours.end)

  if (isBefore(startTime, dayStart)) {
    return { available: false, conflictReason: `We don't open until ${hours.start}am` }
  }

  if (isAfter(endTime, dayEnd)) {
    return { available: false, conflictReason: `We close at ${hours.end > 12 ? hours.end - 12 : hours.end}pm` }
  }

  // Check for conflicting appointments
  const dayStartBuffer = addMinutes(startTime, -APPOINTMENT_BUFFER)
  const dayEndBuffer = addMinutes(endTime, APPOINTMENT_BUFFER)

  console.log(`[Availability] Checking slot: ${startTime.toISOString()} - ${endTime.toISOString()}`)

  const dbBlocks = await getDatabaseBusyBlocks(dayStartBuffer, dayEndBuffer)
  console.log(`[Availability] DB busy blocks (${dbBlocks.length}):`, dbBlocks.map(b => `${b.start.toISOString()} - ${b.end.toISOString()}`))

  const googleBlocks = await getGoogleCalendarBusyBlocks(dayStartBuffer, dayEndBuffer)
  console.log(`[Availability] Google Calendar busy blocks (${googleBlocks.length}):`, googleBlocks.map(b => `${b.start.toISOString()} - ${b.end.toISOString()}`))

  const allBlocks = mergeBusyBlocks([...dbBlocks, ...googleBlocks])
  console.log(`[Availability] Merged busy blocks (${allBlocks.length}):`, allBlocks.map(b => `${b.start.toISOString()} - ${b.end.toISOString()}`))

  if (!isSlotAvailable(startTime, endTime, allBlocks)) {
    console.log(`[Availability] ❌ Slot NOT available - conflicts found`)
    return { available: false, conflictReason: 'This time slot is already booked' }
  }

  console.log(`[Availability] ✅ Slot is available`)
  return { available: true }
}

/**
 * Get available time slots for a specific duration
 * Combines database appointments and Google Calendar
 */
export async function getAvailableSlots(
  startDate: Date = new Date(),
  daysAhead: number = 7,
  slotDuration: number = 60
): Promise<TimeSlot[]> {
  const slots: TimeSlot[] = []
  const endDate = addDays(startDate, daysAhead)

  // Get all busy blocks
  const dbBlocks = await getDatabaseBusyBlocks(startDate, endDate)
  const googleBlocks = await getGoogleCalendarBusyBlocks(startDate, endDate)
  const allBlocks = mergeBusyBlocks([...dbBlocks, ...googleBlocks])

  // Generate slots for each day
  for (let d = 0; d < daysAhead; d++) {
    const date = addDays(startDate, d)
    const dayOfWeek = DAY_NAMES[date.getDay()]
    const hours = BUSINESS_HOURS[dayOfWeek]

    if (!hours) continue // Closed this day

    let currentTime = setHours(setMinutes(startOfDay(date), 0), hours.start)
    const dayEnd = setHours(setMinutes(startOfDay(date), 0), hours.end)

    while (isBefore(addMinutes(currentTime, slotDuration), dayEnd) ||
           addMinutes(currentTime, slotDuration).getTime() === dayEnd.getTime()) {

      const slotEnd = addMinutes(currentTime, slotDuration)

      // Skip past times and check availability
      if (isAfter(currentTime, new Date()) && isSlotAvailable(currentTime, slotEnd, allBlocks)) {
        slots.push({
          start: currentTime,
          end: slotEnd,
          formatted: format(currentTime, "EEEE 'at' h:mm a"),
        })
      }

      // Move to next slot (30 min increments for better granularity)
      currentTime = addMinutes(currentTime, 30)
    }
  }

  return slots.slice(0, 12) // Return max 12 slots
}

/**
 * Get detailed availability for a specific date
 */
export async function getDateAvailability(
  date: Date,
  slotDuration: number = 60
): Promise<AvailabilityResult> {
  const dayStart = startOfDay(date)
  const dayEnd = addDays(dayStart, 1)

  const dbBlocks = await getDatabaseBusyBlocks(dayStart, dayEnd)
  const googleBlocks = await getGoogleCalendarBusyBlocks(dayStart, dayEnd)
  const allBlocks = mergeBusyBlocks([...dbBlocks, ...googleBlocks])

  const dayOfWeek = DAY_NAMES[date.getDay()]
  const hours = BUSINESS_HOURS[dayOfWeek]
  const slots: TimeSlot[] = []

  if (hours) {
    let currentTime = setHours(setMinutes(dayStart, 0), hours.start)
    const dayEndTime = setHours(setMinutes(dayStart, 0), hours.end)

    while (isBefore(addMinutes(currentTime, slotDuration), dayEndTime) ||
           addMinutes(currentTime, slotDuration).getTime() === dayEndTime.getTime()) {

      const slotEnd = addMinutes(currentTime, slotDuration)

      if (isAfter(currentTime, new Date()) && isSlotAvailable(currentTime, slotEnd, allBlocks)) {
        slots.push({
          start: currentTime,
          end: slotEnd,
          formatted: format(currentTime, 'h:mm a'),
        })
      }

      currentTime = addMinutes(currentTime, 30)
    }
  }

  return {
    slots,
    busyBlocks: allBlocks,
    date,
  }
}
