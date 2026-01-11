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
  // Clear previous conversation and set help mode (persisted to DB)
  await clearSession()
  await setSessionMode('help_mode')

  // Get welcome message
  const welcome = await getHelpWelcome()
  await ctx.reply(welcome)
})

// Also respond to "help", "?", or "/ help" (with space) in messages
helpHandler.hears(/^(help|\?|\/\s*help)$/i, async (ctx) => {
  // Clear previous conversation and set help mode (persisted to DB)
  await clearSession()
  await setSessionMode('help_mode')

  const welcome = await getHelpWelcome()
  await ctx.reply(welcome)
})

/**
 * Handle messages while in help mode
 */
helpHandler.on('message:text', async (ctx, next) => {
  // Check if in help mode (from persistent database storage)
  const sessionMode = await getSessionMode()
  if (sessionMode !== 'help_mode') {
    return next()
  }

  const userMessage = ctx.message.text.toLowerCase().trim()

  // Exit keywords
  if (['exit', 'bye', 'thanks', 'done', 'quit', 'nevermind'].includes(userMessage)) {
    await clearSession()
    await ctx.reply("Anytime, queen! I'm just a /help away if you need me~ ✨")
    return
  }

  // If user types another command, exit help mode and let it through
  if (userMessage.startsWith('/')) {
    await clearSession()
    return next()
  }

  // Get conversation history from database
  const history = await getConversationHistory()

  // Add user message to history
  history.push({ role: 'user', content: ctx.message.text })

  try {
    // Get assistant response
    const response = await assistantChat(history)

    // Process any setting updates
    for (const update of response.settingUpdates) {
      await processSettingUpdate(update.key, update.value)
    }

    // Add assistant response to history
    history.push({ role: 'assistant', content: response.content })

    // Save updated history to database
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
