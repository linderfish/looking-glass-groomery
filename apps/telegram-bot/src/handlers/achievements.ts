// apps/telegram-bot/src/handlers/achievements.ts
import { Composer } from 'grammy'
import { getRandomEasterEgg, checkForEasterEggTrigger, getEasterEggResponse } from '../services/kimmie-persona'

type BotContext = import('../bot').BotContext

export const achievementsHandler = new Composer<BotContext>()

interface Achievement {
  id: string
  name: string
  description: string
  emoji: string
  xpReward: number
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_booking',
    name: 'Down the Rabbit Hole',
    description: 'Complete your first booking through Looking Glass',
    emoji: '🐰',
    xpReward: 100,
  },
  {
    id: 'photo_streak_3',
    name: 'Shutterbug',
    description: 'Maintain a 3-day before/after photo streak',
    emoji: '📸',
    xpReward: 150,
  },
  {
    id: 'photo_streak_7',
    name: 'Paparazzi Pro',
    description: 'Maintain a 7-day before/after photo streak',
    emoji: '🌟',
    xpReward: 300,
  },
  {
    id: 'photo_streak_30',
    name: 'Documentary Director',
    description: 'Maintain a 30-day before/after photo streak',
    emoji: '🎬',
    xpReward: 1000,
  },
  {
    id: 'content_posted_10',
    name: 'Influencer Rising',
    description: 'Post 10 pieces of content',
    emoji: '📱',
    xpReward: 250,
  },
  {
    id: 'content_posted_50',
    name: 'Content Queen',
    description: 'Post 50 pieces of content',
    emoji: '👑',
    xpReward: 750,
  },
  {
    id: 'shelter_angel_1',
    name: 'Shelter Angel',
    description: 'Complete your first shelter pet grooming',
    emoji: '😇',
    xpReward: 200,
  },
  {
    id: 'shelter_angel_10',
    name: 'Guardian Angel',
    description: 'Complete 10 shelter pet groomings',
    emoji: '👼',
    xpReward: 500,
  },
  {
    id: 'pokemon_fan',
    name: 'Gotta Groom Em All',
    description: 'Trigger the Pokemon easter egg',
    emoji: '🎮',
    xpReward: 50,
  },
  {
    id: 'greys_fan',
    name: "McDreamy's Groomer",
    description: "Trigger the Grey's Anatomy easter egg",
    emoji: '🏥',
    xpReward: 50,
  },
  {
    id: 'dino_fan',
    name: 'Jurassic Groomer',
    description: 'Trigger the dinosaur easter egg',
    emoji: '🦕',
    xpReward: 50,
  },
  {
    id: 'lizard_fan',
    name: 'Serotonin Seeker',
    description: 'Trigger the lizard button easter egg',
    emoji: '🦎',
    xpReward: 50,
  },
  {
    id: 'mormon_fan',
    name: 'Reality TV Royalty',
    description: 'Trigger the Mormon Wives easter egg',
    emoji: '📺',
    xpReward: 50,
  },
]

/**
 * Send achievement unlocked notification
 */
export async function notifyAchievementUnlocked(
  ctx: BotContext,
  achievementId: string
): Promise<void> {
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId)
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

    // Check if this is a new easter egg discovery
    // TODO: Check database for existing achievement
    // const existing = await prisma.kimmieAchievement.findFirst({
    //   where: { achievementId: `${easterEggCategory.toLowerCase()}_fan` }
    // })
    // if (!existing) {
    //   await notifyAchievementUnlocked(ctx, `${easterEggCategory.toLowerCase()}_fan`)
    // }
  }

  await next()
})

// Command to view achievements
achievementsHandler.command('achievements', async (ctx) => {
  // TODO: Fetch from database
  const unlockedCount = 3 // Placeholder
  const totalXP = 450 // Placeholder
  const level = 2 // Placeholder

  const message = `
👑 <b>Kimmie's Achievement Gallery</b> 👑

🎮 Level ${level} | ${totalXP.toLocaleString()} XP
🏆 Achievements: ${unlockedCount}/${ACHIEVEMENTS.length}

<b>Unlocked:</b>
${ACHIEVEMENTS.slice(0, unlockedCount)
  .map((a) => `${a.emoji} ${a.name}`)
  .join('\n')}

<b>Locked:</b>
${ACHIEVEMENTS.slice(unlockedCount)
  .map((a) => `🔒 ${a.name}`)
  .join('\n')}

Keep grinding, queen! ✨
`

  await ctx.reply(message, { parse_mode: 'HTML' })
})

// Command to view stats
achievementsHandler.command('stats', async (ctx) => {
  // TODO: Fetch from database
  const stats = {
    totalBookings: 127,
    thisWeek: 12,
    photoStreak: 5,
    contentStreak: 3,
    shelterPets: 8,
    level: 2,
    xp: 450,
    nextLevelXP: 500,
  }

  const progressBar = createProgressBar(stats.xp, stats.nextLevelXP)

  const message = `
📊 <b>Your Stats, Queen</b> 📊

👑 Level ${stats.level}
${progressBar} ${stats.xp}/${stats.nextLevelXP} XP

📅 <b>Bookings</b>
Total: ${stats.totalBookings}
This week: ${stats.thisWeek}

📸 <b>Streaks</b>
Photo streak: ${stats.photoStreak} days 🔥
Content streak: ${stats.contentStreak} days 📱

😇 <b>Shelter Angels</b>
Pets helped: ${stats.shelterPets}

You're doing AMAZING! ✨
`

  await ctx.reply(message, { parse_mode: 'HTML' })
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
