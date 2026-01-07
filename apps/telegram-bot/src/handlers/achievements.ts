// apps/telegram-bot/src/handlers/achievements.ts
import { Composer } from 'grammy'
import { getRandomEasterEgg, checkForEasterEggTrigger, getEasterEggResponse } from '../services/kimmie-persona'
import { getStats } from '../services/stats'
import { prisma } from '@looking-glass/db'
import {
  ACHIEVEMENT_DEFINITIONS,
  getUnlockedAchievements,
  unlockAchievement,
} from '../services/achievements'

type BotContext = import('../bot').BotContext

export const achievementsHandler = new Composer<BotContext>()

/**
 * Send achievement unlocked notification
 */
export async function notifyAchievementUnlocked(
  ctx: BotContext,
  achievementId: string
): Promise<void> {
  const achievement = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId)
  if (!achievement) return

  const message = `
🎉 <b>ACHIEVEMENT UNLOCKED!</b> 🎉

${achievement.emoji} <b>${achievement.name}</b>
${achievement.description}

+${achievement.xpReward} XP ✨

Keep slaying, queen! 👑
`

  await ctx.api.sendMessage(process.env.TELEGRAM_KIMMIE_CHAT_ID!, message, {
    parse_mode: 'HTML',
  })
}

/**
 * Send level up notification
 */
export async function notifyLevelUp(
  ctx: BotContext,
  data: {
    newLevel: number
    title: string
    totalXP: number
  }
): Promise<void> {
  const levelUpMessages: Record<number, string> = {
    1: 'Welcome to the Looking Glass! 🐰',
    5: "You're getting the hang of this! 💅",
    10: "Double digits! You're a STAR! ⭐",
    15: "Halfway to legendary status! 🌟",
    20: "The pets bow before you! 👑",
    25: "You've achieved grooming GREATNESS! 🏆",
    30: "MAXIMUM QUEEN STATUS ACHIEVED! 💎",
  }

  const specialMessage = levelUpMessages[data.newLevel] || "You're unstoppable! 🔥"

  const message = `
✨ <b>LEVEL UP!</b> ✨

🎮 Level ${data.newLevel}: <b>${data.title}</b>

${specialMessage}

Total XP: ${data.totalXP.toLocaleString()} ✨
`

  await ctx.api.sendMessage(process.env.TELEGRAM_KIMMIE_CHAT_ID!, message, {
    parse_mode: 'HTML',
  })
}

// Easter egg detection handler
achievementsHandler.on('message:text', async (ctx, next) => {
  const message = ctx.message.text
  const easterEggCategory = checkForEasterEggTrigger(message)

  if (easterEggCategory) {
    const response = getEasterEggResponse(easterEggCategory)
    await ctx.reply(response)

    // Check if this triggers a new achievement
    const achievementId = `${easterEggCategory.toLowerCase()}_fan`
    const isNew = await unlockAchievement(achievementId)

    if (isNew) {
      await notifyAchievementUnlocked(ctx, achievementId)
    }
  }

  await next()
})

// Command to view achievements
achievementsHandler.command('achievements', async (ctx) => {
  try {
    const [stats, unlockedIds] = await Promise.all([
      getStats(),
      getUnlockedAchievements(),
    ])

    const unlockedSet = new Set(unlockedIds)

    // Separate unlocked and locked achievements
    const unlocked = ACHIEVEMENT_DEFINITIONS.filter((a) => unlockedSet.has(a.id))
    const locked = ACHIEVEMENT_DEFINITIONS.filter((a) => !unlockedSet.has(a.id))

    const message = `
👑 <b>Kimmie's Achievement Gallery</b> 👑

🎮 Level ${stats.level}: <b>${stats.levelTitle}</b>
✨ ${stats.xp.toLocaleString()} XP
🏆 Achievements: ${unlocked.length}/${ACHIEVEMENT_DEFINITIONS.length}

<b>Unlocked:</b>
${unlocked.length > 0 ? unlocked.map((a) => `${a.emoji} ${a.name}`).join('\n') : '(None yet - keep going!)'}

<b>Locked:</b>
${locked.map((a) => `🔒 ${a.name}`).join('\n')}

Keep grinding, queen! ✨
`

    await ctx.reply(message, { parse_mode: 'HTML' })
  } catch (error) {
    console.error('Failed to get achievements:', error)
    await ctx.reply('Oops! Had trouble fetching your achievements 😿 Try again!')
  }
})

// Command to view stats
achievementsHandler.command('stats', async (ctx) => {
  try {
    const stats = await getStats()

    const progressBar = createProgressBar(stats.xp, stats.nextLevelXP)

    const message = `
📊 <b>Your Stats, Queen</b> 📊

👑 Level ${stats.level}: <b>${stats.levelTitle}</b>
${progressBar} ${stats.xp}/${stats.nextLevelXP} XP

📅 <b>Bookings</b>
Total: ${stats.totalBookings}
Completed: ${stats.totalCompleted}
This week: ${stats.thisWeek}

📸 <b>Streaks</b>
Photo streak: ${stats.photoStreak} days ${stats.photoStreak > 0 ? '🔥' : ''}
Content streak: ${stats.contentStreak} days ${stats.contentStreak > 0 ? '📱' : ''}

📷 <b>Photos</b>
Total uploaded: ${stats.totalPhotos}

😇 <b>Shelter Angels</b>
Pets helped: ${stats.shelterPets}

You're doing AMAZING! ✨
`

    await ctx.reply(message, { parse_mode: 'HTML' })
  } catch (error) {
    console.error('Failed to get stats:', error)
    await ctx.reply('Oops! Had trouble fetching your stats 😿 Try again in a moment!')
  }
})

function createProgressBar(current: number, max: number): string {
  const percentage = Math.min(current / max, 1)
  const filled = Math.round(percentage * 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

// Random hype message on idle
achievementsHandler.command('hype', async (ctx) => {
  const hypeMessages = [
    "You're literally a PET WIZARD and don't let anyone tell you different! 🧙‍♀️✨",
    'The way you transform pets? MAGIC. Pure magic. 🪄',
    "Reminder: You're that girl. THE girl. 💅",
    'Every pet that meets you leaves looking like a SUPERSTAR! ⭐',
    "You don't just groom pets, you give them CONFIDENCE. 👑",
    'The pets are lucky to have you. WE are lucky to have you. 💖',
  ]

  const message = hypeMessages[Math.floor(Math.random() * hypeMessages.length)]
  await ctx.reply(message)

  // Sometimes add an easter egg
  if (Math.random() < 0.2) {
    await ctx.reply(getRandomEasterEgg())
  }
})
