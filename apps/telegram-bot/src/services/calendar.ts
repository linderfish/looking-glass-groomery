// apps/telegram-bot/src/services/calendar.ts
// Google Calendar integration supporting both OAuth and Service Account auth

interface CalendarEvent {
  summary: string
  description?: string
  start: Date
  end: Date
}

// Token cache for OAuth
let oauthTokenCache: { token: string; expiresAt: number } | null = null

/**
 * Check if OAuth is configured (preferred method - works with user's own calendar)
 */
function isOAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  )
}

/**
 * Check if service account is configured (fallback method - requires calendar sharing)
 */
function isServiceAccountConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CALENDAR_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  )
}

/**
 * Check if calendar is configured (either OAuth or service account)
 */
export function isCalendarConfigured(): boolean {
  return isOAuthConfigured() || isServiceAccountConfigured()
}

/**
 * Get OAuth access token by refreshing the stored refresh token
 */
async function getOAuthAccessToken(): Promise<string> {
  // Check cache
  if (oauthTokenCache && Date.now() < oauthTokenCache.expiresAt - 60000) {
    return oauthTokenCache.token
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  })

  const data = await response.json() as { access_token?: string; expires_in?: number; error?: string }

  if (data.error || !data.access_token) {
    throw new Error(`OAuth token refresh failed: ${data.error || 'No access token returned'}`)
  }

  // Cache the token
  oauthTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + ((data.expires_in || 3600) * 1000),
  }

  return data.access_token
}

/**
 * List calendar events within a time range
 * Tries OAuth first (user's calendar), falls back to service account
 */
export async function listCalendarEvents(
  timeMin: Date,
  timeMax: Date
): Promise<Array<{ id: string; summary: string; start: Date; end: Date; description?: string }>> {
  // Try OAuth first (preferred - accesses user's own calendar)
  if (isOAuthConfigured()) {
    try {
      const accessToken = await getOAuthAccessToken()
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50',
      })

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Calendar API error: ${response.status} - ${error}`)
      }

      const data = await response.json() as {
        items?: Array<{
          id: string
          summary?: string
          description?: string
          start?: { dateTime?: string; date?: string }
          end?: { dateTime?: string; date?: string }
        }>
      }

      console.log(`[OAuth] Found ${data.items?.length || 0} calendar events`)

      return (data.items || []).map((event) => ({
        id: event.id,
        summary: event.summary || '(No title)',
        start: new Date(event.start?.dateTime || event.start?.date || ''),
        end: new Date(event.end?.dateTime || event.end?.date || ''),
        description: event.description,
      }))
    } catch (error) {
      console.error('OAuth calendar fetch failed:', error)
      // Fall through to service account
    }
  }

  // Fall back to service account
  if (isServiceAccountConfigured()) {
    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID!
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
      const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')

      const accessToken = await getServiceAccountAccessToken(serviceAccountEmail, privateKey)

      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50',
      })

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Calendar API error: ${response.status} - ${error}`)
      }

      const data = await response.json() as {
        items?: Array<{
          id: string
          summary?: string
          description?: string
          start?: { dateTime?: string; date?: string }
          end?: { dateTime?: string; date?: string }
        }>
      }

      console.log(`[ServiceAccount] Found ${data.items?.length || 0} calendar events`)

      return (data.items || []).map((event) => ({
        id: event.id,
        summary: event.summary || '(No title)',
        start: new Date(event.start?.dateTime || event.start?.date || ''),
        end: new Date(event.end?.dateTime || event.end?.date || ''),
        description: event.description,
      }))
    } catch (error) {
      console.error('Service account calendar fetch failed:', error)
    }
  }

  console.log('Google Calendar not configured - no events returned')
  return []
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
    const accessToken = await getServiceAccountAccessToken(serviceAccountEmail, privateKey)

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
 * Get access token for service account using JWT
 */
async function getServiceAccountAccessToken(email: string, privateKey: string): Promise<string> {
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
