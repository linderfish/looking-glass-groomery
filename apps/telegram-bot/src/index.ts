// apps/telegram-bot/src/index.ts
// CRITICAL: Load dotenv FIRST before any other imports
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../../.env') })

// Now safe to import modules that use process.env
import { bot, getBot } from './bot'
import {
  bookingsHandler,
  remindersHandler,
  achievementsHandler,
  helpHandler,
  lookupHandler,
  voiceHandler,
  photosHandler,
  sendRandomHype,
} from './handlers'
import {
  checkForEasterEggTrigger,
  getEasterEggResponse,
  getRandomEasterEgg,
} from './services/kimmie-persona'
import { initializeScheduler, recoverPendingReminders } from './services/scheduler'
import { prisma } from '@looking-glass/db'
import express from 'express'
import { dashboardRouter } from './routes/dashboard'

// Register handlers - ORDER MATTERS!
// helpHandler must come early to intercept messages in help mode
bot.use(helpHandler)
bot.use(lookupHandler)
bot.use(voiceHandler)
bot.use(photosHandler)
bot.use(bookingsHandler)
bot.use(remindersHandler)
bot.use(achievementsHandler)

// Start command
bot.command('start', async (ctx) => {
  await ctx.reply(
    `✨ *slowly materializes* ✨

Well, well, well~ Look who's here!

Hey gorgeous! I'm your Cheshire assistant, here to make your grooming life FABULOUS.

Here's what I can do for you:
📅 Notify you about new bookings
📸 Remind you about before/after photos
🏆 Track your achievements
📊 Show your stats

<b>Commands:</b>
/help - Chat with me! I can guide you through anything
/stats - View your stats
/achievements - See your trophy case
/hype - Get some motivation

Type /help to get started - I'll walk you through everything!

Let's make magic happen, queen! 👑`,
    { parse_mode: 'HTML' }
  )
})

// Note: /help is now handled by helpHandler (intelligent AI assistant)

// Random response to unhandled messages
bot.on('message:text', async (ctx) => {
  console.log(`[GENERIC] >>> Catch-all handler reached for: "${ctx.message.text.substring(0, 50)}"`)
  const text = ctx.message.text

  // Check for easter eggs first
  const easterEgg = checkForEasterEggTrigger(text)
  if (easterEgg) {
    await ctx.reply(getEasterEggResponse(easterEgg))
    return
  }

  // Generic responses
  const responses = [
    "I heard you! Not sure what to do with that though... 😸 Try /help?",
    "*tilts head* Interesting! But I'm not sure how to help with that~ Try /help!",
    "Ooh, words! I love words. But these ones confuse me 😹 /help has my tricks!",
    "My Cheshire brain is still learning~ Check /help for what I can do!",
  ]

  const response = responses[Math.floor(Math.random() * responses.length)]
  await ctx.reply(response)

  // Small chance of random easter egg
  if (Math.random() < 0.05) {
    await ctx.reply(getRandomEasterEgg())
  }
})

// Error handling
bot.catch((err) => {
  console.error('Bot error:', err)
})

// Webhook mode configuration
const USE_WEBHOOK = process.env.TELEGRAM_USE_WEBHOOK === 'true'
const WEBHOOK_PORT = parseInt(process.env.TELEGRAM_WEBHOOK_PORT || '3005')

// Start the bot - uses webhook mode by default to avoid 409 conflicts
async function start() {
  console.log('🐱 Cheshire Cat is waking up...')
  console.log(`📱 Configured for chat ID: ${process.env.TELEGRAM_KIMMIE_CHAT_ID}`)
  console.log(`🔗 Mode: ${USE_WEBHOOK ? 'Webhook' : 'Polling'}`)

  // Verify database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection verified')
  } catch (err) {
    console.error('❌ Database connection FAILED:', err)
    process.exit(1)
  }

  initializeScheduler()
  await recoverPendingReminders()

  if (USE_WEBHOOK) {
    // WEBHOOK MODE - Avoids 409 conflicts completely
    await startWebhookServer()
  } else {
    // POLLING MODE - May conflict with other instances
    await startPolling()
  }
}

/**
 * Start webhook server to receive updates from Telegram
 */
async function startWebhookServer() {
  const actualBot = getBot()

  // CRITICAL: Initialize bot before handling updates
  // This fetches bot info (username, etc.) from Telegram API
  await actualBot.init()
  console.log(`🤖 Bot initialized: @${actualBot.botInfo.username}`)

  // Register webhook URL with Telegram
  // This must be done because another instance may be polling and clearing webhooks
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || 'https://cheshire.lookingglassgroomery.com/webhook/telegram'
  try {
    await actualBot.api.setWebhook(webhookUrl)
    console.log(`🔗 Webhook registered: ${webhookUrl}`)
  } catch (err) {
    console.error('Failed to set webhook:', err)
  }

  // Create Express app
  const app = express()
  app.use(express.json())

  // Mount dashboard routes
  app.use('/dashboard', dashboardRouter)

  // Telegram webhook endpoint
  app.post('/webhook', async (req, res) => {
    try {
      const update = req.body
      console.log(`📥 Webhook update received: ${update.update_id}`)
      await actualBot.handleUpdate(update)
      res.status(200).send('OK')
    } catch (err) {
      console.error('Webhook processing error:', err)
      res.status(500).send('Error')
    }
  })

  // Health check endpoint
  app.get('/', (req, res) => {
    res.send('Telegram Bot Webhook Server')
  })

  app.listen(WEBHOOK_PORT, () => {
    console.log(`🔗 Webhook server listening on port ${WEBHOOK_PORT}`)
    console.log(`🌐 Dashboard available at /dashboard/today and /dashboard/search`)
    console.log(`✨ @Chechcatbot is now online (webhook mode)!`)
    console.log('Ready to serve the queen~ 👑')
  })
}

/**
 * Start polling mode (may have 409 conflicts)
 */
async function startPolling(attempt = 1) {
  try {
    await bot.start({
      drop_pending_updates: true,
      onStart: (botInfo) => {
        console.log(`✨ @${botInfo.username} is now online!`)
        console.log('Ready to serve the queen~ 👑')
      },
    })
  } catch (err: unknown) {
    const error = err as { error_code?: number; message?: string }
    if (error.error_code === 409) {
      try { bot.stop() } catch { /* ignore */ }
      const delay = 30000 + Math.random() * 30000
      console.log(`⏳ Bot conflict (409). Retrying in ${Math.round(delay/1000)}s (attempt ${attempt})...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return startPolling(attempt + 1)
    }
    throw err
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n😿 Cheshire Cat is fading away...')
  bot.stop()
})

process.once('SIGTERM', () => {
  console.log('\n😿 Cheshire Cat is fading away...')
  bot.stop()
})

start().catch((err) => {
  console.error('Failed to start bot:', err)
  process.exit(1)
})
