// apps/cheshire/src/services/calendar.ts
// Google Calendar integration for availability checking and event creation

import { addDays, format, startOfDay, setHours, setMinutes, isBefore, isAfter, addMinutes } from 'date-fns'

// Working hours configuration
const WORKING_HOURS = {
  MONDAY: { start: 9, end: 17 },    // 9am - 5pm
  TUESDAY: { start: 9, end: 17 },
  WEDNESDAY: { start: 9, end: 17 },
  THURSDAY: { start: 9, end: 17 },
  FRIDAY: { start: 9, end: 17 },
  SATURDAY: { start: 9, end: 15 },  // 9am - 3pm
  SUNDAY: null,                      // Closed
} as const

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const

interface TimeSlot {
  start: Date
  end: Date
  formatted: string
}

interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: Date
  end: Date
}

/**
 * Check if Google Calendar is configured
 */
export function isCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CALENDAR_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  )
}

/**
 * Get available time slots for a given date range
 * Falls back to working hours if Google Calendar is not configured
 */
export async function getAvailableSlots(
  startDate: Date = new Date(),
  daysAhead: number = 7,
  slotDuration: number = 60 // minutes
): Promise<TimeSlot[]> {
  const slots: TimeSlot[] = []

  // If Google Calendar is configured, use it
  if (isCalendarConfigured()) {
    return await getGoogleCalendarSlots(startDate, daysAhead, slotDuration)
  }

  // Fallback: Generate slots based on working hours only
  for (let d = 0; d < daysAhead; d++) {
    const date = addDays(startDate, d)
    const dayOfWeek = DAY_NAMES[date.getDay()]
    const hours = WORKING_HOURS[dayOfWeek]

    if (!hours) continue // Closed this day

    // Generate slots for this day
    let currentTime = setHours(setMinutes(startOfDay(date), 0), hours.start)
    const endTime = setHours(setMinutes(startOfDay(date), 0), hours.end)

    while (isBefore(addMinutes(currentTime, slotDuration), endTime) ||
           addMinutes(currentTime, slotDuration).getTime() === endTime.getTime()) {
      // Skip if the slot is in the past
      if (isAfter(currentTime, new Date())) {
        slots.push({
          start: currentTime,
          end: addMinutes(currentTime, slotDuration),
          formatted: format(currentTime, "EEEE 'at' h:mm a"),
        })
      }
      currentTime = addMinutes(currentTime, slotDuration)
    }
  }

  return slots.slice(0, 8) // Return max 8 slots
}

/**
 * Get slots from Google Calendar
 */
async function getGoogleCalendarSlots(
  startDate: Date,
  daysAhead: number,
  slotDuration: number
): Promise<TimeSlot[]> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID!
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')

  try {
    // Get access token using service account
    const accessToken = await getServiceAccountToken(serviceAccountEmail, privateKey)

    // Fetch busy times from Google Calendar
    const endDate = addDays(startDate, daysAhead)
    const busyTimes = await fetchBusyTimes(accessToken, calendarId, startDate, endDate)

    // Generate available slots by subtracting busy times from working hours
    const slots: TimeSlot[] = []

    for (let d = 0; d < daysAhead; d++) {
      const date = addDays(startDate, d)
      const dayOfWeek = DAY_NAMES[date.getDay()]
      const hours = WORKING_HOURS[dayOfWeek]

      if (!hours) continue

      let currentTime = setHours(setMinutes(startOfDay(date), 0), hours.start)
      const endTime = setHours(setMinutes(startOfDay(date), 0), hours.end)

      while (isBefore(addMinutes(currentTime, slotDuration), endTime) ||
             addMinutes(currentTime, slotDuration).getTime() === endTime.getTime()) {
        const slotEnd = addMinutes(currentTime, slotDuration)

        // Check if this slot overlaps with any busy time
        const isAvailable = !busyTimes.some(busy =>
          (isAfter(currentTime, busy.start) && isBefore(currentTime, busy.end)) ||
          (isAfter(slotEnd, busy.start) && isBefore(slotEnd, busy.end)) ||
          (isBefore(currentTime, busy.start) && isAfter(slotEnd, busy.end))
        )

        if (isAvailable && isAfter(currentTime, new Date())) {
          slots.push({
            start: currentTime,
            end: slotEnd,
            formatted: format(currentTime, "EEEE 'at' h:mm a"),
          })
        }

        currentTime = addMinutes(currentTime, slotDuration)
      }
    }

    return slots.slice(0, 8)
  } catch (error) {
    console.error('Google Calendar API error:', error)
    // Fall back to working hours only
    return getAvailableSlots(startDate, daysAhead, slotDuration)
  }
}

/**
 * Get OAuth access token for service account
 */
async function getServiceAccountToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const expiry = now + 3600

  // Create JWT header and claim
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
  }

  // Sign JWT (simplified - in production use a proper JWT library)
  const jwt = await signJWT(header, claim, privateKey)

  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const data = await response.json() as { access_token: string }
  return data.access_token
}

/**
 * Sign a JWT with RS256
 */
async function signJWT(
  header: object,
  payload: object,
  privateKey: string
): Promise<string> {
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header))
  const payloadB64 = btoa(JSON.stringify(payload))
  const signInput = `${headerB64}.${payloadB64}`

  // Import private key
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Sign
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signInput)
  )

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return `${headerB64}.${payloadB64}.${signatureB64}`
}

/**
 * Fetch busy times from Google Calendar
 */
async function fetchBusyTimes(
  accessToken: string,
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ start: Date; end: Date }>> {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/freeBusy',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: calendarId }],
      }),
    }
  )

  const data = await response.json() as {
    calendars: {
      [key: string]: {
        busy: Array<{ start: string; end: string }>
      }
    }
  }

  const busyTimes = data.calendars?.[calendarId]?.busy || []
  return busyTimes.map(b => ({
    start: new Date(b.start),
    end: new Date(b.end),
  }))
}

/**
 * Create a calendar event for a confirmed booking
 */
export async function createCalendarEvent(event: CalendarEvent): Promise<string | null> {
  if (!isCalendarConfigured()) {
    console.warn('Google Calendar not configured - skipping event creation')
    return null
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID!
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')

  try {
    // Need write scope for creating events
    const accessToken = await getServiceAccountTokenWithScope(
      serviceAccountEmail,
      privateKey,
      'https://www.googleapis.com/auth/calendar.events'
    )

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.start.toISOString(),
            timeZone: 'America/Los_Angeles',
          },
          end: {
            dateTime: event.end.toISOString(),
            timeZone: 'America/Los_Angeles',
          },
        }),
      }
    )

    const data = await response.json() as { id: string }
    return data.id
  } catch (error) {
    console.error('Failed to create calendar event:', error)
    return null
  }
}

/**
 * Get access token with specific scope
 */
async function getServiceAccountTokenWithScope(
  email: string,
  privateKey: string,
  scope: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const expiry = now + 3600

  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
  }

  const jwt = await signJWT(header, claim, privateKey)

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const data = await response.json() as { access_token: string }
  return data.access_token
}
