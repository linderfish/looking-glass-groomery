// apps/telegram-bot/src/handlers/help.ts
import { Composer } from 'grammy'
import { assistantChat, getHelpWelcome } from '../services/assistant'
import {
  updateSettings,
  parseTimeString,
  getSettings,
  getSessionMode,
  setSessionMode,
  getConversationHistory,
  saveConversationHistory,
  clearSession
} from '../services/settings'

type BotContext = import('../bot').BotContext

export const helpHandler = new Composer<BotContext>()

/**
 * Enter help mode
 */
helpHandler.command('help', async (ctx) => {
  console.log(`[HELP] >>> command('help') MATCHED`)

  // Set help mode in Grammy session (synchronous, fast - no race condition)
  ctx.session.inHelpMode = true
  ctx.session.helpHistory = []

  // Also persist to DB for recovery across bot restarts
  await clearSession()
  await setSessionMode('help_mode')

  // Get welcome message
  const welcome = await getHelpWelcome()
  await ctx.reply(welcome)
})

// Also respond to "help", "?", or "/ help" (with space) in messages
helpHandler.hears(/^(help|\?|\/\s*help)$/i, async (ctx) => {
  console.log(`[HELP] >>> hears() MATCHED for: "${ctx.message?.text}"`)

  // Set help mode in Grammy session (synchronous, fast - no race condition)
  ctx.session.inHelpMode = true
  ctx.session.helpHistory = []

  // Also persist to DB for recovery across bot restarts
  await clearSession()
  await setSessionMode('help_mode')

  const welcome = await getHelpWelcome()
  await ctx.reply(welcome)
})

/**
 * Handle messages while in help mode
 */
helpHandler.on('message:text', async (ctx, next) => {
  // Log IMMEDIATELY when this handler is entered (before any async)
  console.log(`[HELP] >>> on('message:text') ENTERED - message: "${ctx.message.text.substring(0, 50)}"`)

  // Check if in help mode using Grammy session (SYNCHRONOUS - no race condition!)
  console.log(`[HELP] Session check: inHelpMode=${ctx.session.inHelpMode}`)

  // If session says not in help mode, check DB for recovery (bot might have restarted)
  if (!ctx.session.inHelpMode) {
    const dbSessionMode = await getSessionMode()
    if (dbSessionMode === 'help_mode') {
      // Recover session from database after bot restart
      console.log('[HELP] Recovering session from database after restart')
      ctx.session.inHelpMode = true
      ctx.session.helpHistory = await getConversationHistory()
    } else {
      console.log('[HELP] Not in help mode, passing to next handler')
      return next()
    }
  }

  console.log('[HELP] In help mode, processing message...')
  const userMessage = ctx.message.text.toLowerCase().trim()

  // Exit keywords
  if (['exit', 'bye', 'thanks', 'done', 'quit', 'nevermind'].includes(userMessage)) {
    ctx.session.inHelpMode = false
    ctx.session.helpHistory = []
    await clearSession()
    await ctx.reply("Anytime, queen! I'm just a /help away if you need me~ ✨")
    return
  }

  // If user types another command, exit help mode and let it through
  if (userMessage.startsWith('/')) {
    ctx.session.inHelpMode = false
    ctx.session.helpHistory = []
    await clearSession()
    return next()
  }

  // Get conversation history from session (fast) with DB fallback
  let history = ctx.session.helpHistory || []
  if (history.length === 0) {
    // Try to recover from database (in case of mid-conversation restart)
    history = await getConversationHistory()
    ctx.session.helpHistory = history
  }
  console.log(`[HELP] Loaded history with ${history.length} messages`)

  // Add user message to history
  history.push({ role: 'user' as const, content: ctx.message.text })
  console.log(`[HELP] Added user message, calling AI assistant...`)

  try {
    // Get assistant response
    const response = await assistantChat(history)
    console.log(`[HELP] Got AI response with ${response.settingUpdates.length} setting updates`)

    // Process any setting updates
    for (const update of response.settingUpdates) {
      try {
        await processSettingUpdate(update.key, update.value)
        console.log(`[Help] ✅ Saved setting: ${update.key}=${update.value}`)
      } catch (err) {
        console.error(`[Help] ❌ FAILED to save setting ${update.key}:`, err)
      }
    }

    // Add assistant response to history
    history.push({ role: 'assistant' as const, content: response.content })

    // Save to session (fast) and database (persistent)
    ctx.session.helpHistory = history
    await saveConversationHistory(history)

    // Send response
    await ctx.reply(response.content)

    // Check if onboarding just completed
    const onboardingComplete = response.settingUpdates.find(
      u => u.key === 'onboardingComplete' && u.value === 'true'
    )
    if (onboardingComplete) {
      await ctx.reply(
        "You're all set up! You can type /help anytime to chat with me, or just start using the other commands.\n\n" +
        "Pro tip: Try /stats to see your progress, or /hype when you need a boost!"
      )
      // Clear both session and database
      ctx.session.inHelpMode = false
      ctx.session.helpHistory = []
      await clearSession()
    }
  } catch (error) {
    console.error('Assistant error:', error)
    await ctx.reply(
      "Oops! I had a little hiccup there. Try again?\n\n" +
      "(If this keeps happening, the AI service might be down)"
    )
  }
})

/**
 * Process a setting update from the assistant
 */
async function processSettingUpdate(key: string, value: string): Promise<void> {
  const settings = await getSettings()

  switch (key) {
    case 'dailySummaryTime': {
      const parsed = parseTimeString(value) || value
      await updateSettings({ dailySummaryTime: parsed })
      break
    }
    case 'appointmentReminder': {
      const minutes = parseInt(value)
      if (!isNaN(minutes) && minutes >= 0 && minutes <= 120) {
        await updateSettings({ appointmentReminder: minutes })
      }
      break
    }
    case 'photoReminderLevel': {
      if (['chill', 'medium', 'pushy'].includes(value.toLowerCase())) {
        await updateSettings({ photoReminderLevel: value.toLowerCase() })
      }
      break
    }
    case 'googleCalendarSync': {
      await updateSettings({ googleCalendarSync: value === 'true' })
      break
    }
    case 'autoConfirmReturning': {
      await updateSettings({ autoConfirmReturning: value === 'true' })
      break
    }
    case 'weekendMode': {
      await updateSettings({ weekendMode: value === 'true' })
      break
    }
    case 'preferredName': {
      await updateSettings({ preferredName: value })
      break
    }
    case 'hypeFrequency': {
      if (['low', 'normal', 'high'].includes(value.toLowerCase())) {
        await updateSettings({ hypeFrequency: value.toLowerCase() })
      }
      break
    }
    case 'onboardingComplete': {
      await updateSettings({
        onboardingComplete: value === 'true',
        onboardingStep: value === 'true' ? 999 : settings.onboardingStep,
      })
      break
    }
    case 'onboardingStep': {
      const step = parseInt(value)
      if (!isNaN(step)) {
        await updateSettings({ onboardingStep: step })
      }
      break
    }
    case 'timezone': {
      // Validate timezone string using Intl
      try {
        Intl.DateTimeFormat('en-US', { timeZone: value })
        await updateSettings({ timezone: value })
      } catch {
        console.warn(`Invalid timezone: ${value}`)
      }
      break
    }
    default:
      console.warn(`Unknown setting update: ${key}=${value}`)
  }
}
