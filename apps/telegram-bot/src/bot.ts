// apps/telegram-bot/src/bot.ts
import { Bot, Context, session, SessionFlavor } from 'grammy'
import { hydrateFiles } from '@grammyjs/files'

interface SessionData {
  awaitingAction?: string
  pendingBookingId?: string
  lastInteraction?: Date
  inHelpMode?: boolean
  helpHistory?: { role: 'user' | 'assistant'; content: string }[]
}

type BotContext = Context & SessionFlavor<SessionData>

// Lazy initialization to allow dotenv to load first
let _bot: Bot<BotContext> | null = null
let _chatId: string | null = null

export function getBot(): Bot<BotContext> {
  if (!_bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN environment variable is required')
    }

    _chatId = process.env.TELEGRAM_KIMMIE_CHAT_ID || ''

    _bot = new Bot<BotContext>(token)

    // File handling plugin
    _bot.api.config.use(hydrateFiles(_bot.token))

    // Session middleware
    _bot.use(session({
      initial: (): SessionData => ({})
    }))

    // Security: Only respond to Kimmie
    _bot.use(async (ctx, next) => {
      if (_chatId && ctx.chat?.id.toString() !== _chatId) {
        console.log(`Unauthorized access attempt from chat ID: ${ctx.chat?.id}`)
        return
      }
      await next()
    })
  }
  return _bot
}

export function getKimmieChatId(): string {
  if (!_chatId) {
    _chatId = process.env.TELEGRAM_KIMMIE_CHAT_ID || ''
  }
  return _chatId
}

// For backwards compatibility - access via getter
export const bot = {
  get use() { return getBot().use.bind(getBot()) },
  get command() { return getBot().command.bind(getBot()) },
  get on() { return getBot().on.bind(getBot()) },
  get catch() { return getBot().catch.bind(getBot()) },
  get start() { return getBot().start.bind(getBot()) },
  get stop() { return getBot().stop.bind(getBot()) },
  get api() { return getBot().api },
} as unknown as Bot<BotContext>

export { BotContext }
