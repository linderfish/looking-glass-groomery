// apps/cheshire/src/routes/oauth.ts
// OAuth callback handler for Google Calendar authorization

import { Hono } from 'hono'
import {
  isOAuthConfigured,
  hasRefreshToken,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  listCalendarEvents,
} from '../services/calendar-oauth'

const oauth = new Hono()

/**
 * GET /oauth/status - Check OAuth configuration status
 */
oauth.get('/status', async (c) => {
  return c.json({
    configured: isOAuthConfigured(),
    hasRefreshToken: hasRefreshToken(),
    authUrl: isOAuthConfigured() ? getAuthorizationUrl() : null,
  })
})

/**
 * GET /oauth/authorize - Redirect to Google authorization
 */
oauth.get('/authorize', async (c) => {
  if (!isOAuthConfigured()) {
    return c.json({ error: 'OAuth not configured. Set GOOGLE_OAUTH_* environment variables.' }, 500)
  }

  const authUrl = getAuthorizationUrl()
  return c.redirect(authUrl)
})

/**
 * GET /oauth/callback - Handle OAuth callback from Google
 */
oauth.get('/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')

  if (error) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>❌ Authorization Failed</h1>
          <p>Error: ${error}</p>
          <p>Please try again or contact support.</p>
        </body>
      </html>
    `)
  }

  if (!code) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>❌ No Authorization Code</h1>
          <p>Something went wrong. Please try again.</p>
        </body>
      </html>
    `)
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    // Display the refresh token for the user to save
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
          <h1>✅ Authorization Successful!</h1>
          <p>Calendar access has been granted.</p>

          <h2>🔑 Save This Refresh Token</h2>
          <p>Add this to your <code>.env</code> file:</p>
          <pre style="background: #f4f4f4; padding: 20px; border-radius: 8px; overflow-x: auto; word-break: break-all;">GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}</pre>

          <p><strong>Important:</strong> This token is shown only once. Save it now!</p>

          <h3>Then restart your services:</h3>
          <pre style="background: #f4f4f4; padding: 15px; border-radius: 8px;">pm2 restart all</pre>

          <p style="margin-top: 40px; color: #666;">You can close this window after saving the token.</p>
        </body>
      </html>
    `)
  } catch (err: any) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>❌ Token Exchange Failed</h1>
          <p>Error: ${err.message}</p>
          <p>Please try again.</p>
        </body>
      </html>
    `)
  }
})

/**
 * GET /oauth/test - Test calendar access
 */
oauth.get('/test', async (c) => {
  if (!hasRefreshToken()) {
    return c.json({
      success: false,
      error: 'No refresh token. Visit /oauth/authorize first.',
    })
  }

  try {
    const now = new Date()
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const events = await listCalendarEvents(now, oneWeekLater, 'primary', 10)

    return c.json({
      success: true,
      message: 'Calendar access working!',
      upcomingEvents: events.length,
      events: events.map(e => ({
        summary: e.summary,
        start: e.start.toISOString(),
      })),
    })
  } catch (err: any) {
    return c.json({
      success: false,
      error: err.message,
    })
  }
})

export default oauth
