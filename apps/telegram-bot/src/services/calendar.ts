// apps/telegram-bot/src/services/calendar.ts
// Simple Google Calendar event creation for confirmed bookings

interface CalendarEvent {
  summary: string
  description?: string
  start: Date
  end: Date
}

/**
 * Check if calendar is configured
 */
export function isCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CALENDAR_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  )
}

/**
 * Create a calendar event when a booking is confirmed
 */
export async function createCalendarEvent(event: CalendarEvent): Promise<string | null> {
  if (!isCalendarConfigured()) {
    console.log('Google Calendar not configured - skipping event creation')
    return null
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID!
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')

  try {
    const accessToken = await getAccessToken(serviceAccountEmail, privateKey)

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

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`)
    }

    const data = await response.json() as { id: string }
    console.log('Created calendar event:', data.id)
    return data.id
  } catch (error) {
    console.error('Failed to create calendar event:', error)
    return null
  }
}

/**
 * Get OAuth access token for service account
 */
async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const expiry = now + 3600

  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/calendar.events',
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

/**
 * Sign JWT with RS256
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
