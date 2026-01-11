// apps/cheshire/src/services/calendar-oauth.ts
// Google Calendar OAuth flow - replaces service account authentication

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
]

/**
 * Check if OAuth is configured
 */
export function isOAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  )
}

/**
 * Check if we have a valid refresh token
 */
export function hasRefreshToken(): boolean {
  return !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN
}

/**
 * Generate the authorization URL for Kimmie to click
 */
export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // Force consent to get refresh token
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
    }),
  })

  const data = await response.json() as any

  if (data.error) {
    throw new Error(`Token exchange failed: ${data.error_description || data.error}`)
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  }
}

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get a valid access token (refreshing if needed)
 */
export async function getAccessToken(): Promise<string> {
  // Check cache
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token
  }

  // Refresh the token
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

  const data = await response.json() as any

  if (data.error) {
    throw new Error(`Token refresh failed: ${data.error_description || data.error}`)
  }

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  }

  return data.access_token
}

/**
 * Get calendar busy times using OAuth
 */
export async function getCalendarBusyTimes(
  timeMin: Date,
  timeMax: Date,
  calendarId: string = 'primary'
): Promise<Array<{ start: string; end: string }>> {
  const token = await getAccessToken()

  const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    }),
  })

  const data = await response.json() as any

  if (data.error) {
    throw new Error(`Calendar API error: ${data.error.message}`)
  }

  return data.calendars?.[calendarId]?.busy || []
}

/**
 * List calendar events using OAuth
 */
export async function listCalendarEvents(
  timeMin: Date,
  timeMax: Date,
  calendarId: string = 'primary',
  maxResults: number = 50
): Promise<Array<{
  id: string
  summary: string
  start: Date
  end: Date
  description?: string
}>> {
  const token = await getAccessToken()

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: maxResults.toString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  })

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  const data = await response.json() as any

  if (data.error) {
    throw new Error(`Calendar API error: ${data.error.message}`)
  }

  return (data.items || []).map((event: any) => ({
    id: event.id,
    summary: event.summary || '(No title)',
    start: new Date(event.start?.dateTime || event.start?.date),
    end: new Date(event.end?.dateTime || event.end?.date),
    description: event.description,
  }))
}

/**
 * Create a calendar event using OAuth
 */
export async function createCalendarEvent(
  event: {
    summary: string
    description?: string
    start: Date
    end: Date
  },
  calendarId: string = 'primary'
): Promise<string> {
  const token = await getAccessToken()

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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

  const data = await response.json() as any

  if (data.error) {
    throw new Error(`Calendar API error: ${data.error.message}`)
  }

  console.log('Created calendar event:', data.id)
  return data.id
}
