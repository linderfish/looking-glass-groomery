// apps/telegram-bot/src/handlers/reminders.ts
import { Composer } from 'grammy'
import { getKimmieMessage, getRandomEasterEgg } from '../services/kimmie-persona'

type BotContext = import('../bot').BotContext

export const remindersHandler = new Composer<BotContext>()

interface PhotoReminderData {
  petName: string
  appointmentId: string
  type: 'before' | 'after'
}

/**
 * Send a before photo reminder
 */
export async function sendBeforePhotoReminder(
  ctx: BotContext,
  data: PhotoReminderData
): Promise<void> {
  const message = getKimmieMessage('PHOTO_REMINDER_BEFORE', {
    petName: data.petName,
  })

  await ctx.api.sendMessage(process.env.TELEGRAM_KIMMIE_CHAT_ID!, message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📸 Upload Before Photo', callback_data: `upload_before:${data.appointmentId}` },
        ],
        [
          { text: '⏭️ Skip (already took it)', callback_data: `skip_before:${data.appointmentId}` },
        ],
      ],
    },
  })
}

/**
 * Send an after photo reminder
 */
export async function sendAfterPhotoReminder(
  ctx: BotContext,
  data: PhotoReminderData
): Promise<void> {
  const message = getKimmieMessage('PHOTO_REMINDER_AFTER', {
    petName: data.petName,
  })

  await ctx.api.sendMessage(process.env.TELEGRAM_KIMMIE_CHAT_ID!, message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📸 Upload After Photo', callback_data: `upload_after:${data.appointmentId}` },
        ],
        [
          { text: '⏭️ Skip this time', callback_data: `skip_after:${data.appointmentId}` },
        ],
      ],
    },
  })
}

// Handle before photo upload request
remindersHandler.callbackQuery(/^upload_before:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  ctx.session.awaitingAction = 'before_photo'
  ctx.session.pendingBookingId = appointmentId

  await ctx.answerCallbackQuery()
  await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  await ctx.reply(
    `📸 Ready when you are!\n\nJust send me the before photo and I'll save it to ${appointmentId.slice(0, 6)}...'s record~ ✨`
  )
})

// Handle after photo upload request
remindersHandler.callbackQuery(/^upload_after:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  ctx.session.awaitingAction = 'after_photo'
  ctx.session.pendingBookingId = appointmentId

  await ctx.answerCallbackQuery()
  await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  await ctx.reply(
    `📸 Show me that GLOW UP!\n\nSend the after photo and I'll pair it with the before~ 👑`
  )
})

// Handle skip before
remindersHandler.callbackQuery(/^skip_before:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery({ text: 'Got it! You can always add it later~' })
  await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  await ctx.reply(`No worries! Focus on making magic happen ✨`)
})

// Handle skip after
remindersHandler.callbackQuery(/^skip_after:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery({ text: 'Skipped! Maybe next time~' })
  await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  await ctx.reply(`Totally get it! Not every groom needs to be documented 💅`)
})

// Handle photo uploads
remindersHandler.on('message:photo', async (ctx, next) => {
  const { awaitingAction, pendingBookingId } = ctx.session

  if (awaitingAction === 'before_photo' && pendingBookingId) {
    const photo = ctx.message.photo[ctx.message.photo.length - 1] // Get highest quality
    const fileId = photo.file_id

    // TODO: Save to database
    // await prisma.appointmentPhoto.create({
    //   data: { appointmentId: pendingBookingId, fileId, type: 'BEFORE' }
    // })

    const message = getKimmieMessage('BEFORE_PHOTO_SAVED', {})
    await ctx.reply(message, { parse_mode: 'HTML' })

    // Random easter egg chance
    if (Math.random() < 0.1) {
      await ctx.reply(getRandomEasterEgg())
    }

    ctx.session.awaitingAction = undefined
    ctx.session.pendingBookingId = undefined
    return
  }

  if (awaitingAction === 'after_photo' && pendingBookingId) {
    const photo = ctx.message.photo[ctx.message.photo.length - 1]
    const fileId = photo.file_id

    // TODO: Save to database
    // await prisma.appointmentPhoto.create({
    //   data: { appointmentId: pendingBookingId, fileId, type: 'AFTER' }
    // })

    const message = getKimmieMessage('AFTER_PHOTO_SAVED', {})
    await ctx.reply(message, { parse_mode: 'HTML' })

    // Offer to create social content
    await ctx.reply(
      `Want me to prep this for the 'gram? 📱✨`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✨ Yes, create content!', callback_data: `create_content:${pendingBookingId}` },
              { text: '🙅 Not this one', callback_data: 'skip_content' },
            ],
          ],
        },
      }
    )

    ctx.session.awaitingAction = undefined
    ctx.session.pendingBookingId = undefined
    return
  }

  // Random photo received
  const message = getKimmieMessage('PHOTO_RECEIVED_RANDOM', {})
  await ctx.reply(message, { parse_mode: 'HTML' })

  await next()
})

// Handle content creation request
remindersHandler.callbackQuery(/^create_content:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  await ctx.answerCallbackQuery({ text: 'Creating magic... ✨' })
  await ctx.editMessageReplyMarkup({ reply_markup: undefined })

  // TODO: Trigger AI caption generation and content creation
  // const content = await generateCaption(appointmentId)

  await ctx.reply(
    `🎨 Working on it!\n\nI'm generating some caption options for you. Give me a sec~ 💅`
  )

  // Placeholder for actual content generation
  setTimeout(async () => {
    await ctx.reply(
      `📝 Here are some caption ideas:\n\n` +
      `1️⃣ "Another transformation complete! ✨ #PetGrooming #Groom"\n\n` +
      `2️⃣ "From scruffy to stunning! 👑 #BeforeAndAfter"\n\n` +
      `3️⃣ "Every pet deserves to feel fabulous 💅 #ThroughTheLookingGlass"\n\n` +
      `Pick one or tell me to try again!`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1️⃣', callback_data: 'caption:1' },
              { text: '2️⃣', callback_data: 'caption:2' },
              { text: '3️⃣', callback_data: 'caption:3' },
            ],
            [
              { text: '🔄 Try again', callback_data: `regenerate_caption:${appointmentId}` },
            ],
          ],
        },
      }
    )
  }, 2000)
})

// Handle skip content
remindersHandler.callbackQuery('skip_content', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  await ctx.reply(`No prob! It's saved for later if you change your mind~ 💖`)
})

/**
 * Send a random content nudge
 */
export async function sendContentNudge(ctx: BotContext): Promise<void> {
  const message = getKimmieMessage('CONTENT_NUDGE', {})

  await ctx.api.sendMessage(process.env.TELEGRAM_KIMMIE_CHAT_ID!, message, {
    parse_mode: 'HTML',
  })
}

/**
 * Send random hype message
 */
export async function sendRandomHype(ctx: BotContext): Promise<void> {
  const message = getKimmieMessage('RANDOM_HYPE', {})

  await ctx.api.sendMessage(process.env.TELEGRAM_KIMMIE_CHAT_ID!, message, {
    parse_mode: 'HTML',
  })
}
