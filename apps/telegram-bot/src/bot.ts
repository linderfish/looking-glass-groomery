// apps/telegram-bot/src/bot.ts
import { Bot, Context, session, SessionFlavor } from 'grammy'

interface SessionData {
  awaitingAction?: string
  pendingBookingId?: string
  lastInteraction?: Date
}

type BotContext = Context & SessionFlavor<SessionData>

const KIMMIE_CHAT_ID = process.env.TELEGRAM_KIMMIE_CHAT_ID!

export const bot = new Bot<BotContext>(process.env.TELEGRAM_BOT_TOKEN!)

// Session middleware
bot.use(session({
  initial: (): SessionData => ({})
}))

// Security: Only respond to Kimmie
bot.use(async (ctx, next) => {
  if (ctx.chat?.id.toString() !== KIMMIE_CHAT_ID) {
    console.log(`Unauthorized access attempt from chat ID: ${ctx.chat?.id}`)
    return
  }
  await next()
})

export { BotContext, KIMMIE_CHAT_ID }
