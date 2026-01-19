// apps/telegram-bot/src/index.ts
// CRITICAL: Load dotenv FIRST before any other imports
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../../.env') })

// Now safe to import modules that use process.env
import { bot } from './bot'
import {
  bookingsHandler,
  remindersHandler,
  achievementsHandler,
  helpHandler,
  sendRandomHype,
} from './handlers'
import {
  checkForEasterEggTrigger,
  getEasterEggResponse,
  getRandomEasterEgg,
} from './services/kimmie-persona'
import { initializeScheduler, recoverPendingReminders } from './services/scheduler'
import { prisma } from '@looking-glass/db'

// Register handlers - ORDER MATTERS!
// helpHandler must come early to intercept messages in help mode
bot.use(helpHandler)
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

// Start the bot with infinite retry logic for 409 conflicts
// This handles cases where another instance might be running (e.g., on production)
async function start(attempt = 1) {
  console.log('🐱 Cheshire Cat is waking up...')
  console.log(`📱 Configured for chat ID: ${process.env.TELEGRAM_KIMMIE_CHAT_ID}`)

  // Verify database connection on first attempt
  if (attempt === 1) {
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Database connection verified')
    } catch (err) {
      console.error('❌ Database connection FAILED:', err)
      process.exit(1)
    }

    initializeScheduler()
    await recoverPendingReminders()
  }

  try {
    // Start polling with drop pending updates to clear any stale state
    await bot.start({
      drop_pending_updates: true,
      onStart: (botInfo) => {
        console.log(`✨ @${botInfo.username} is now online!`)
        console.log('Ready to serve the queen~ 👑')
      },
    })
  } catch (err: unknown) {
    const error = err as { error_code?: number; message?: string }
    // Handle 409 conflict (another instance running) - retry indefinitely
    if (error.error_code === 409) {
      // Stop the current bot instance before retrying
      try {
        bot.stop()
      } catch { /* ignore stop errors */ }

      // Base delay of 30s + random jitter (0-30s) to avoid collision with other instance
      const baseDelay = 30000
      const jitter = Math.random() * 30000
      const delay = baseDelay + jitter
      console.log(`⏳ Bot conflict detected (another instance may be running). Retrying in ${Math.round(delay/1000)}s (attempt ${attempt})...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return start(attempt + 1)
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
