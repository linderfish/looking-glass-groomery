# Phase 8: Kimmie's Personalized Experience - The Queen's Private Garden

## Overview

This phase creates Kimmie's personalized dashboard and Telegram experience - filled with easter eggs, achievements, gamification, and that "whimsical feminine fun energy" she deserves. Every interaction should feel like a delightful surprise, not a chore.

## The Vibe

```
✨ Playful but Professional
💜 Whimsical but Functional
🦋 Feminine Energy with Power
🎮 Gamified but Not Childish
🔮 Magical but Real Results
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Kimmie's Royal Experience                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Telegram Kingdom                           │   │
│  │                                                               │   │
│  │  🏆 Achievements    📊 Quick Stats    🎯 Daily Goals         │   │
│  │  🌟 Streak Tracker  💰 Revenue Game   🦎 Easter Eggs        │   │
│  │  📸 Photo Hub       🗓️ Schedule View  💬 Quick Actions       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Achievement Engine                         │   │
│  │                                                               │   │
│  │  Track Progress → Detect Milestones → Trigger Celebrations   │   │
│  │  Daily Quests → Weekly Challenges → Seasonal Events          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Easter Egg System                          │   │
│  │                                                               │   │
│  │  🦖 Dinosaur Mode       🧪 Dr. Grey References               │   │
│  │  ⚡ Mimikyu Surprises    📺 Mormon Wives Quotes               │   │
│  │  🦎 Lizard Button        🎲 Random Delights                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Dependencies

- Phase 1 (Database) - Required
- Phase 2 (Telegram Hub) - Required
- Phase 3 (Cheshire Cat) - For personality integration

## Implementation

### Step 1: Achievement System

```typescript
// packages/gamification/src/achievements/achievement-types.ts

export type AchievementCategory =
  | 'MILESTONES'      // Business milestones
  | 'STREAKS'         // Consistency achievements
  | 'CREATIVE'        // Creative grooming achievements
  | 'SHELTER_ANGEL'   // Shelter work achievements
  | 'SOCIAL'          // Social media achievements
  | 'SECRET'          // Hidden easter egg achievements

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  icon: string
  points: number
  secret: boolean
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  condition: AchievementCondition
  reward?: AchievementReward
}

export interface AchievementCondition {
  type: string
  target: number
  current?: number
}

export interface AchievementReward {
  type: 'BADGE' | 'TITLE' | 'UNLOCK' | 'CELEBRATION'
  value: string
}

// The achievement catalog - Kimmie's trophies!
export const ACHIEVEMENTS: Achievement[] = [
  // === MILESTONE ACHIEVEMENTS ===
  {
    id: 'first_groom',
    name: 'Down the Rabbit Hole',
    description: 'Complete your first groom with the new system',
    category: 'MILESTONES',
    icon: '🐰',
    points: 10,
    secret: false,
    rarity: 'COMMON',
    condition: { type: 'GROOMS_COMPLETED', target: 1 },
  },
  {
    id: 'grooms_100',
    name: 'The Queen\'s Court',
    description: 'Complete 100 grooms',
    category: 'MILESTONES',
    icon: '👑',
    points: 100,
    secret: false,
    rarity: 'RARE',
    condition: { type: 'GROOMS_COMPLETED', target: 100 },
  },
  {
    id: 'grooms_500',
    name: 'Ruler of Wonderland',
    description: 'Complete 500 grooms',
    category: 'MILESTONES',
    icon: '🏰',
    points: 500,
    secret: false,
    rarity: 'EPIC',
    condition: { type: 'GROOMS_COMPLETED', target: 500 },
  },
  {
    id: 'grooms_1000',
    name: 'Legend of the Looking Glass',
    description: 'Complete 1000 grooms - you absolute QUEEN',
    category: 'MILESTONES',
    icon: '✨',
    points: 1000,
    secret: false,
    rarity: 'LEGENDARY',
    condition: { type: 'GROOMS_COMPLETED', target: 1000 },
    reward: { type: 'TITLE', value: 'Legendary Groomer' },
  },

  // === STREAK ACHIEVEMENTS ===
  {
    id: 'streak_7',
    name: 'Week of Wonder',
    description: '7-day photo streak - every groom captured!',
    category: 'STREAKS',
    icon: '📸',
    points: 50,
    secret: false,
    rarity: 'COMMON',
    condition: { type: 'PHOTO_STREAK', target: 7 },
  },
  {
    id: 'streak_30',
    name: 'Monthly Magic',
    description: '30-day photo streak - content QUEEN!',
    category: 'STREAKS',
    icon: '🌟',
    points: 200,
    secret: false,
    rarity: 'RARE',
    condition: { type: 'PHOTO_STREAK', target: 30 },
  },
  {
    id: 'streak_100',
    name: 'Centurion of Content',
    description: '100-day photo streak - UNSTOPPABLE!',
    category: 'STREAKS',
    icon: '🔥',
    points: 1000,
    secret: false,
    rarity: 'LEGENDARY',
    condition: { type: 'PHOTO_STREAK', target: 100 },
  },
  {
    id: 'no_snooze_week',
    name: 'Quick on the Draw',
    description: 'One week without snoozing any photo reminders',
    category: 'STREAKS',
    icon: '⚡',
    points: 75,
    secret: false,
    rarity: 'RARE',
    condition: { type: 'NO_SNOOZE_STREAK', target: 7 },
  },

  // === CREATIVE ACHIEVEMENTS ===
  {
    id: 'first_creative',
    name: 'Paint the Roses',
    description: 'Complete your first creative groom',
    category: 'CREATIVE',
    icon: '🎨',
    points: 25,
    secret: false,
    rarity: 'COMMON',
    condition: { type: 'CREATIVE_GROOMS', target: 1 },
  },
  {
    id: 'rainbow_warrior',
    name: 'Rainbow Warrior',
    description: 'Use 5+ colors in a single creative groom',
    category: 'CREATIVE',
    icon: '🌈',
    points: 100,
    secret: false,
    rarity: 'RARE',
    condition: { type: 'COLORS_IN_GROOM', target: 5 },
  },
  {
    id: 'creative_50',
    name: 'Master of Illusion',
    description: '50 creative grooms completed',
    category: 'CREATIVE',
    icon: '🦋',
    points: 250,
    secret: false,
    rarity: 'EPIC',
    condition: { type: 'CREATIVE_GROOMS', target: 50 },
  },
  {
    id: 'asian_fusion_master',
    name: 'East Meets West',
    description: '25 Asian Fusion grooms',
    category: 'CREATIVE',
    icon: '🌸',
    points: 150,
    secret: false,
    rarity: 'RARE',
    condition: { type: 'ASIAN_FUSION_GROOMS', target: 25 },
  },

  // === SHELTER ANGEL ACHIEVEMENTS ===
  {
    id: 'first_shelter',
    name: 'Angel Wings',
    description: 'Complete your first Shelter Angel groom',
    category: 'SHELTER_ANGEL',
    icon: '😇',
    points: 50,
    secret: false,
    rarity: 'COMMON',
    condition: { type: 'SHELTER_GROOMS', target: 1 },
  },
  {
    id: 'shelter_25',
    name: 'Guardian of Strays',
    description: '25 shelter pets transformed',
    category: 'SHELTER_ANGEL',
    icon: '🛡️',
    points: 250,
    secret: false,
    rarity: 'RARE',
    condition: { type: 'SHELTER_GROOMS', target: 25 },
  },
  {
    id: 'shelter_100',
    name: 'Saint of the Shelters',
    description: '100 shelter pets given a second chance',
    category: 'SHELTER_ANGEL',
    icon: '💫',
    points: 1000,
    secret: false,
    rarity: 'LEGENDARY',
    condition: { type: 'SHELTER_GROOMS', target: 100 },
    reward: { type: 'TITLE', value: 'Shelter Saint' },
  },
  {
    id: 'adoption_catalyst',
    name: 'Adoption Catalyst',
    description: 'A shelter pet you groomed gets adopted within 48 hours',
    category: 'SHELTER_ANGEL',
    icon: '🏠',
    points: 100,
    secret: false,
    rarity: 'EPIC',
    condition: { type: 'QUICK_ADOPTION', target: 1 },
  },

  // === SOCIAL ACHIEVEMENTS ===
  {
    id: 'viral_moment',
    name: 'Gone Viral',
    description: 'A post gets 1000+ likes',
    category: 'SOCIAL',
    icon: '🚀',
    points: 500,
    secret: false,
    rarity: 'EPIC',
    condition: { type: 'POST_LIKES', target: 1000 },
  },
  {
    id: 'consistent_creator',
    name: 'Consistent Creator',
    description: 'Post every day for 30 days',
    category: 'SOCIAL',
    icon: '📱',
    points: 300,
    secret: false,
    rarity: 'RARE',
    condition: { type: 'DAILY_POST_STREAK', target: 30 },
  },

  // === SECRET ACHIEVEMENTS (Easter Eggs!) ===
  {
    id: 'its_a_mimikyu',
    name: 'It\'s Mimikyu!',
    description: '???',
    category: 'SECRET',
    icon: '⚡',
    points: 100,
    secret: true,
    rarity: 'EPIC',
    condition: { type: 'EASTER_EGG', target: 1 },
  },
  {
    id: 'dinosaur_mode',
    name: 'Clever Girl',
    description: '???',
    category: 'SECRET',
    icon: '🦖',
    points: 50,
    secret: true,
    rarity: 'RARE',
    condition: { type: 'EASTER_EGG', target: 1 },
  },
  {
    id: 'greys_anatomy',
    name: 'It\'s a Beautiful Day to Save Lives',
    description: '???',
    category: 'SECRET',
    icon: '🏥',
    points: 75,
    secret: true,
    rarity: 'RARE',
    condition: { type: 'EASTER_EGG', target: 1 },
  },
  {
    id: 'mormon_wives',
    name: 'Soft Swinging',
    description: '???',
    category: 'SECRET',
    icon: '📺',
    points: 50,
    secret: true,
    rarity: 'RARE',
    condition: { type: 'EASTER_EGG', target: 1 },
  },
  {
    id: 'lizard_button',
    name: 'Hehe Lizard',
    description: 'Found the lizard button!',
    category: 'SECRET',
    icon: '🦎',
    points: 25,
    secret: true,
    rarity: 'COMMON',
    condition: { type: 'EASTER_EGG', target: 1 },
  },
  {
    id: 'midnight_groomer',
    name: 'Midnight Madness',
    description: 'Complete a groom after midnight',
    category: 'SECRET',
    icon: '🌙',
    points: 50,
    secret: true,
    rarity: 'RARE',
    condition: { type: 'MIDNIGHT_GROOM', target: 1 },
  },
  {
    id: 'five_in_one_day',
    name: 'Absolute Unit',
    description: 'Complete 5 grooms in a single day',
    category: 'SECRET',
    icon: '💪',
    points: 150,
    secret: true,
    rarity: 'EPIC',
    condition: { type: 'GROOMS_IN_DAY', target: 5 },
  },
]
```

### Step 2: Achievement Engine

```typescript
// packages/gamification/src/achievements/achievement-engine.ts

import { prisma } from '@ttlg/database'
import { telegramBot } from '@ttlg/telegram'
import { ACHIEVEMENTS, Achievement, AchievementCategory } from './achievement-types'

export class AchievementEngine {
  /**
   * Check for newly unlocked achievements
   */
  async checkAchievements(userId: string): Promise<Achievement[]> {
    const unlocked: Achievement[] = []
    const existing = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    })
    const existingIds = new Set(existing.map(a => a.achievementId))

    for (const achievement of ACHIEVEMENTS) {
      if (existingIds.has(achievement.id)) continue

      const isUnlocked = await this.checkCondition(userId, achievement)

      if (isUnlocked) {
        await this.unlockAchievement(userId, achievement)
        unlocked.push(achievement)
      }
    }

    return unlocked
  }

  /**
   * Check if achievement condition is met
   */
  private async checkCondition(
    userId: string,
    achievement: Achievement
  ): Promise<boolean> {
    const { condition } = achievement

    switch (condition.type) {
      case 'GROOMS_COMPLETED':
        const groomCount = await prisma.appointment.count({
          where: { status: 'COMPLETED' },
        })
        return groomCount >= condition.target

      case 'PHOTO_STREAK':
        return await this.checkPhotoStreak(condition.target)

      case 'NO_SNOOZE_STREAK':
        return await this.checkNoSnoozeStreak(condition.target)

      case 'CREATIVE_GROOMS':
        const creativeCount = await prisma.appointment.count({
          where: {
            status: 'COMPLETED',
            services: {
              some: { category: 'CREATIVE' },
            },
          },
        })
        return creativeCount >= condition.target

      case 'COLORS_IN_GROOM':
        // Check if any groom used 5+ colors
        const designs = await prisma.groomingDesign.findMany({
          where: { status: 'COMPLETED' },
          select: { colors: true },
        })
        return designs.some(d => (d.colors as string[])?.length >= condition.target)

      case 'SHELTER_GROOMS':
        const shelterCount = await prisma.appointment.count({
          where: {
            status: 'COMPLETED',
            isShelterAngel: true,
          },
        })
        return shelterCount >= condition.target

      case 'MIDNIGHT_GROOM':
        const midnightGrooms = await prisma.appointment.count({
          where: {
            status: 'COMPLETED',
            completedAt: {
              not: null,
            },
          },
        })
        // Would need to check actual completion time
        return false // Simplified for now

      case 'GROOMS_IN_DAY':
        // Check if any day had 5+ completed grooms
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todayGrooms = await prisma.appointment.count({
          where: {
            status: 'COMPLETED',
            completedAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        })
        return todayGrooms >= condition.target

      case 'EASTER_EGG':
        // Easter eggs are unlocked via specific triggers
        return false

      default:
        return false
    }
  }

  /**
   * Check photo streak
   */
  private async checkPhotoStreak(target: number): Promise<boolean> {
    // Get appointments from last N days
    const days: boolean[] = []

    for (let i = 0; i < target; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const appointments = await prisma.appointment.count({
        where: {
          status: 'COMPLETED',
          scheduledStart: { gte: date, lt: nextDate },
        },
      })

      if (appointments === 0) {
        days.push(true) // No appointments = streak continues
        continue
      }

      const withPhotos = await prisma.appointment.count({
        where: {
          status: 'COMPLETED',
          scheduledStart: { gte: date, lt: nextDate },
          photos: {
            some: { type: 'BEFORE' },
          },
          AND: {
            photos: { some: { type: 'AFTER' } },
          },
        },
      })

      days.push(withPhotos === appointments)
    }

    return days.every(d => d)
  }

  /**
   * Check no-snooze streak
   */
  private async checkNoSnoozeStreak(target: number): Promise<boolean> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - target)

    const snoozedReminders = await prisma.photoReminder.count({
      where: {
        createdAt: { gte: startDate },
        followUpCount: { gt: 0 },
      },
    })

    return snoozedReminders === 0
  }

  /**
   * Unlock an achievement
   */
  async unlockAchievement(
    userId: string,
    achievement: Achievement
  ): Promise<void> {
    await prisma.userAchievement.create({
      data: {
        odinguserId: userId,
        achievementId: achievement.id,
        unlockedAt: new Date(),
      },
    })

    // Update total points
    await prisma.user.update({
      where: { id: userId },
      data: {
        achievementPoints: { increment: achievement.points },
      },
    })

    // Send celebration!
    await this.celebrateAchievement(achievement)
  }

  /**
   * Manually unlock an easter egg achievement
   */
  async unlockEasterEgg(
    userId: string,
    achievementId: string
  ): Promise<Achievement | null> {
    const achievement = ACHIEVEMENTS.find(
      a => a.id === achievementId && a.category === 'SECRET'
    )

    if (!achievement) return null

    const existing = await prisma.userAchievement.findFirst({
      where: { odinguserId: userId, achievementId },
    })

    if (existing) return null

    await this.unlockAchievement(userId, achievement)
    return achievement
  }

  /**
   * Send achievement celebration to Telegram
   */
  private async celebrateAchievement(achievement: Achievement): Promise<void> {
    const rarityEmojis = {
      COMMON: '⭐',
      RARE: '💎',
      EPIC: '🔮',
      LEGENDARY: '👑',
    }

    const rarityColors = {
      COMMON: 'a nice',
      RARE: 'a RARE',
      EPIC: 'an EPIC',
      LEGENDARY: 'a LEGENDARY',
    }

    let message = `
🎉 **ACHIEVEMENT UNLOCKED!** 🎉

${achievement.icon} **${achievement.name}** ${rarityEmojis[achievement.rarity]}

${achievement.description}

_${rarityColors[achievement.rarity]} achievement worth ${achievement.points} points!_
`

    if (achievement.reward) {
      message += `\n🎁 **Reward:** ${achievement.reward.type === 'TITLE' ? `New title: "${achievement.reward.value}"` : achievement.reward.value}`
    }

    // Add fun flavor based on achievement
    const flavorTexts = this.getFlavorText(achievement.id)
    if (flavorTexts) {
      message += `\n\n_${flavorTexts}_`
    }

    await telegramBot.api.sendMessage(
      process.env.KIMMIE_TELEGRAM_ID!,
      message,
      { parse_mode: 'Markdown' }
    )

    // Send celebratory sticker for legendary achievements
    if (achievement.rarity === 'LEGENDARY') {
      await telegramBot.api.sendSticker(
        process.env.KIMMIE_TELEGRAM_ID!,
        'CAACAgIAAxkBAAEBabc...' // Celebration sticker
      )
    }
  }

  /**
   * Get flavor text for specific achievements
   */
  private getFlavorText(achievementId: string): string | null {
    const flavors: Record<string, string> = {
      'first_groom': 'Welcome to Wonderland, Queen! 🐰',
      'grooms_1000': 'You absolute LEGEND. Time for champagne! 🥂',
      'streak_100': 'Your consistency is UNMATCHED. Content machine!',
      'its_a_mimikyu': 'Pika-WHAT? No wait... that\'s Mimikyu! ⚡',
      'dinosaur_mode': 'Life, uh... finds a way. 🦖',
      'greys_anatomy': 'Pick me. Choose me. Groom me. 💉',
      'mormon_wives': 'Living your best plural life! 📺',
      'lizard_button': 'Hehe. You found it. 🦎',
      'midnight_groomer': 'Who needs sleep when there are floof to beautify?',
      'five_in_one_day': 'You MACHINE. Take a bubble bath tonight!',
    }

    return flavors[achievementId] || null
  }

  /**
   * Get user's achievement progress
   */
  async getProgress(userId: string): Promise<{
    unlocked: number
    total: number
    points: number
    byCategory: Record<AchievementCategory, { unlocked: number; total: number }>
  }> {
    const unlockedAchievements = await prisma.userAchievement.findMany({
      where: { odinguserId: userId },
    })

    const unlockedIds = new Set(unlockedAchievements.map(a => a.achievementId))

    const byCategory: Record<AchievementCategory, { unlocked: number; total: number }> = {
      MILESTONES: { unlocked: 0, total: 0 },
      STREAKS: { unlocked: 0, total: 0 },
      CREATIVE: { unlocked: 0, total: 0 },
      SHELTER_ANGEL: { unlocked: 0, total: 0 },
      SOCIAL: { unlocked: 0, total: 0 },
      SECRET: { unlocked: 0, total: 0 },
    }

    let totalPoints = 0

    for (const achievement of ACHIEVEMENTS) {
      byCategory[achievement.category].total++
      if (unlockedIds.has(achievement.id)) {
        byCategory[achievement.category].unlocked++
        totalPoints += achievement.points
      }
    }

    return {
      unlocked: unlockedIds.size,
      total: ACHIEVEMENTS.filter(a => !a.secret).length,
      points: totalPoints,
      byCategory,
    }
  }
}
```

### Step 3: Easter Egg System

```typescript
// packages/gamification/src/easter-eggs/easter-egg-triggers.ts

import { telegramBot } from '@ttlg/telegram'
import { AchievementEngine } from '../achievements/achievement-engine'
import { InlineKeyboard } from 'grammy'

const achievementEngine = new AchievementEngine()

/**
 * Easter egg trigger patterns
 */
const EASTER_EGG_PATTERNS = {
  // Mimikyu - triggered by Pokemon references
  mimikyu: {
    patterns: [/mimikyu/i, /pikachu/i, /pokemon/i, /pika/i],
    achievementId: 'its_a_mimikyu',
    response: async (ctx: any) => {
      await ctx.reply(
        `⚡ *A wild Mimikyu appeared!*\n\n` +
        `_It's disguised as a Pikachu, but we know the truth..._\n\n` +
        `Mimikyu just wants to be loved! 💜\n\n` +
        `🎶 _"Mi-mi-kyu! Mi-mi-kyu!"_ 🎶`,
        { parse_mode: 'Markdown' }
      )
      // Send Mimikyu sticker
      await ctx.replyWithSticker('CAACAgIAAxkBAAEB...') // Mimikyu sticker
    },
  },

  // Dinosaur Mode - triggered by dinosaur references
  dinosaur: {
    patterns: [/dinosaur/i, /dino/i, /rawr/i, /t-?rex/i, /jurassic/i, /clever girl/i],
    achievementId: 'dinosaur_mode',
    response: async (ctx: any) => {
      await ctx.reply(
        `🦖 **DINOSAUR MODE ACTIVATED** 🦕\n\n` +
        `*RAWR!* That means "you're doing amazing" in dinosaur!\n\n` +
        `_"Life, uh... finds a way."_ - Dr. Ian Malcolm\n\n` +
        `🌴 Welcome to Jurassic Bark! 🐕🦴`,
        { parse_mode: 'Markdown' }
      )
    },
  },

  // Grey's Anatomy - triggered by medical/Grey's references
  greys: {
    patterns: [
      /grey'?s anatomy/i,
      /meredith/i,
      /derek/i,
      /mcdreamy/i,
      /mcsteamy/i,
      /it'?s a beautiful day/i,
      /pick me/i,
      /you'?re my person/i,
      /seriously/i,
    ],
    achievementId: 'greys_anatomy',
    response: async (ctx: any) => {
      const quotes = [
        `"It's a beautiful day to save lives... and groom floofy babies!" 💉`,
        `"You're my person, and these dogs are our patients." 🏥`,
        `"Pick me. Choose me. GROOM me." 💜`,
        `"We're adults. When did that happen? And how do we make it stop?" 🍷`,
        `"Seriously? SERIOUSLY?" 😤`,
        `"The carousel never stops turning." 🎠`,
      ]
      const quote = quotes[Math.floor(Math.random() * quotes.length)]

      await ctx.reply(
        `🏥 **Grey's Sloan Memorial Groomery** 🏥\n\n` +
        `${quote}\n\n` +
        `_Dr. Kimmie Grey, Attending Groomer_`,
        { parse_mode: 'Markdown' }
      )
    },
  },

  // Mormon Wives - triggered by show references
  mormonWives: {
    patterns: [
      /mormon wives/i,
      /soft swing/i,
      /sister wife/i,
      /plural/i,
      /lds/i,
      /utah/i,
    ],
    achievementId: 'mormon_wives',
    response: async (ctx: any) => {
      await ctx.reply(
        `📺 **The Secret Lives of Groomer Wives** 📺\n\n` +
        `_*Camera pans dramatically*_\n\n` +
        `"I'm not saying I would soft swing with a Goldendoodle... but I'm not NOT saying it either." 🐩\n\n` +
        `_This week on TLC..._`,
        { parse_mode: 'Markdown' }
      )
    },
  },

  // Lizard Button - the classic meme
  lizard: {
    patterns: [/lizard/i, /hehe/i, /gecko/i, /reptile/i],
    achievementId: 'lizard_button',
    response: async (ctx: any) => {
      const keyboard = new InlineKeyboard()
        .text('🦎 Hehe', 'lizard_hehe')

      await ctx.reply(
        `🦎 **You found the lizard button!**`,
        { reply_markup: keyboard }
      )
    },
  },
}

/**
 * Check message for easter egg triggers
 */
export async function checkForEasterEggs(
  ctx: any,
  userId: string,
  message: string
): Promise<boolean> {
  for (const [name, egg] of Object.entries(EASTER_EGG_PATTERNS)) {
    for (const pattern of egg.patterns) {
      if (pattern.test(message)) {
        // Trigger the easter egg response
        await egg.response(ctx)

        // Unlock the achievement (if not already unlocked)
        const unlocked = await achievementEngine.unlockEasterEgg(
          userId,
          egg.achievementId
        )

        if (unlocked) {
          // Small delay before achievement notification
          await new Promise(resolve => setTimeout(resolve, 1500))
        }

        return true
      }
    }
  }

  return false
}

/**
 * Lizard button callback handler
 */
telegramBot.callbackQuery('lizard_hehe', async (ctx) => {
  await ctx.answerCallbackQuery('Hehe 🦎')

  // Random lizard responses
  const responses = [
    'hehe',
    'hehe hehe',
    'hehehehehehe',
    '🦎',
    '🦎🦎🦎',
    '*happy lizard noises*',
  ]

  const response = responses[Math.floor(Math.random() * responses.length)]
  await ctx.reply(response)
})

/**
 * Random delight - occasional surprise messages
 */
export async function maybeRandomDelight(ctx: any): Promise<void> {
  // 5% chance of random delight
  if (Math.random() > 0.05) return

  const delights = [
    `✨ Random reminder: You're doing AMAZING! ✨`,
    `🌸 Fun fact: Dogs have a sense of time and miss you when you're gone! 🐕`,
    `💜 You are literally making pets and owners happier every day. That's magic!`,
    `🎵 _"You're simply the best, better than all the rest!"_ 🎵`,
    `🦋 A butterfly somewhere just flapped its wings because you're awesome.`,
    `🌈 Plot twist: YOU'RE the real rainbow today!`,
    `☕ This is your sign to get a fancy coffee. You've earned it!`,
    `🛁 Bubble bath tonight? You deserve it, Queen! 👑`,
  ]

  const delight = delights[Math.floor(Math.random() * delights.length)]

  // Small delay to feel more natural
  await new Promise(resolve => setTimeout(resolve, 2000))
  await ctx.reply(delight)
}
```

### Step 4: Daily Dashboard

```typescript
// packages/telegram/src/handlers/daily-dashboard.ts

import { Context, InlineKeyboard } from 'grammy'
import { prisma } from '@ttlg/database'
import { telegramBot } from '../bot'
import { AchievementEngine } from '@ttlg/gamification'

const achievementEngine = new AchievementEngine()

/**
 * Send daily morning dashboard
 */
export async function sendDailyDashboard(): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get today's appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledStart: { gte: today, lt: tomorrow },
      status: { in: ['CONFIRMED', 'PENDING'] },
    },
    include: {
      pet: { include: { client: true } },
      services: true,
    },
    orderBy: { scheduledStart: 'asc' },
  })

  // Get stats
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const weeklyStats = await prisma.appointment.aggregate({
    where: {
      completedAt: { gte: weekStart },
      status: 'COMPLETED',
    },
    _count: true,
    _sum: { totalPrice: true },
  })

  // Photo streak
  const photoStreak = await calculatePhotoStreak()

  // Achievement progress
  const progress = await achievementEngine.getProgress('kimmie')

  // Get a motivational greeting based on day/time
  const greeting = getGreeting()

  let message = `${greeting}\n\n`

  // Today's Schedule
  message += `📅 **Today's Royal Schedule**\n`
  message += `━━━━━━━━━━━━━━━━━━\n`

  if (appointments.length === 0) {
    message += `\n_No appointments scheduled!_\n`
    message += `Time for self-care? Or squeeze in a shelter angel? 😇\n`
  } else {
    for (const apt of appointments) {
      const time = apt.scheduledStart.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
      const services = apt.services.map(s => s.name).join(', ')
      const isCreative = apt.services.some(s => s.category === 'CREATIVE')

      message += `\n⏰ **${time}** - ${apt.pet.name} ${isCreative ? '🎨' : '✂️'}\n`
      message += `   _${apt.pet.breed || apt.pet.species}_ • ${services}\n`
      message += `   👤 ${apt.pet.client.firstName}\n`
    }
  }

  // Quick Stats
  message += `\n\n📊 **This Week's Magic**\n`
  message += `━━━━━━━━━━━━━━━━━━\n`
  message += `✂️ Grooms: ${weeklyStats._count}\n`
  message += `💰 Revenue: $${weeklyStats._sum.totalPrice?.toFixed(2) || '0.00'}\n`
  message += `📸 Photo Streak: ${photoStreak} days ${photoStreak >= 7 ? '🔥' : ''}\n`
  message += `🏆 Achievement Points: ${progress.points}\n`

  // Daily Goal
  const dailyGoal = getDailyGoal(appointments.length)
  message += `\n\n🎯 **Today's Quest**\n`
  message += `━━━━━━━━━━━━━━━━━━\n`
  message += `${dailyGoal}\n`

  const keyboard = new InlineKeyboard()
    .text('📸 Upload Photo', 'quick_photo')
    .text('📝 Quick Note', 'quick_note')
    .row()
    .text('🏆 Achievements', 'view_achievements')
    .text('📊 Full Stats', 'view_stats')
    .row()
    .text('😇 Add Shelter Angel', 'add_shelter_angel')

  await telegramBot.api.sendMessage(
    process.env.KIMMIE_TELEGRAM_ID!,
    message,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }
  )
}

/**
 * Get time-appropriate greeting
 */
function getGreeting(): string {
  const hour = new Date().getHours()
  const dayOfWeek = new Date().getDay()

  const greetings = {
    earlyMorning: [
      `🌅 Good morning, Queen! Rise and shine!`,
      `☀️ Early bird gets the floofs!`,
      `🌸 Morning, gorgeous! Ready to make magic?`,
    ],
    morning: [
      `☕ Good morning! Coffee + Floofy babies = Perfect day`,
      `🌺 Morning, beautiful! The salon awaits!`,
      `✨ Rise and slay, Queen!`,
    ],
    afternoon: [
      `🌻 Afternoon check-in! You're crushing it!`,
      `☀️ Hope your day is going wonderfully!`,
      `💪 Afternoon power hour!`,
    ],
    evening: [
      `🌙 Evening wind-down time!`,
      `🛁 Almost time for that well-deserved rest!`,
      `🌸 What a day you've had!`,
    ],
  }

  let timeOfDay: keyof typeof greetings
  if (hour < 7) timeOfDay = 'earlyMorning'
  else if (hour < 12) timeOfDay = 'morning'
  else if (hour < 17) timeOfDay = 'afternoon'
  else timeOfDay = 'evening'

  const options = greetings[timeOfDay]
  let greeting = options[Math.floor(Math.random() * options.length)]

  // Monday motivation
  if (dayOfWeek === 1) {
    greeting += `\n_Monday motivation: You've got this!_ 💜`
  }
  // Friday vibes
  if (dayOfWeek === 5) {
    greeting += `\n_Friday feeling! Almost weekend!_ 🎉`
  }

  return greeting
}

/**
 * Get daily goal based on schedule
 */
function getDailyGoal(appointmentCount: number): string {
  const goals = {
    none: [
      `🧘 Rest day goal: Do something that makes YOU happy!`,
      `📚 Learn something new about grooming techniques`,
      `📱 Engage with 5 comments on social media`,
    ],
    light: [
      `📸 Capture before/after for every floof today!`,
      `💬 Ask one client for a Google review`,
      `🎨 Try one new technique today`,
    ],
    moderate: [
      `⚡ Power through and take all the photos!`,
      `🌟 Make every pet feel like royalty`,
      `📱 Share one behind-the-scenes story`,
    ],
    heavy: [
      `💪 Marathon mode! Pace yourself, Queen!`,
      `☕ Remember to hydrate and take breaks!`,
      `🏆 You're going to CRUSH this day!`,
    ],
  }

  let intensity: keyof typeof goals
  if (appointmentCount === 0) intensity = 'none'
  else if (appointmentCount <= 2) intensity = 'light'
  else if (appointmentCount <= 4) intensity = 'moderate'
  else intensity = 'heavy'

  const options = goals[intensity]
  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Calculate current photo streak
 */
async function calculatePhotoStreak(): Promise<number> {
  let streak = 0
  let date = new Date()
  date.setHours(0, 0, 0, 0)

  while (true) {
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const appointments = await prisma.appointment.count({
      where: {
        scheduledStart: { gte: date, lt: nextDate },
        status: 'COMPLETED',
      },
    })

    // Skip days with no appointments
    if (appointments === 0) {
      date.setDate(date.getDate() - 1)
      continue
    }

    const withPhotos = await prisma.appointment.count({
      where: {
        scheduledStart: { gte: date, lt: nextDate },
        status: 'COMPLETED',
        photos: {
          some: { type: 'BEFORE' },
        },
        AND: {
          photos: { some: { type: 'AFTER' } },
        },
      },
    })

    if (withPhotos === appointments) {
      streak++
      date.setDate(date.getDate() - 1)
    } else {
      break
    }

    // Don't go back more than a year
    if (streak > 365) break
  }

  return streak
}

/**
 * Handler for viewing achievements
 */
telegramBot.callbackQuery('view_achievements', async (ctx) => {
  await ctx.answerCallbackQuery()

  const progress = await achievementEngine.getProgress('kimmie')

  let message = `🏆 **Achievement Trophy Case** 🏆\n\n`
  message += `📊 Progress: ${progress.unlocked}/${progress.total} unlocked\n`
  message += `⭐ Total Points: ${progress.points}\n\n`

  message += `**By Category:**\n`

  const categoryEmojis: Record<string, string> = {
    MILESTONES: '🏰',
    STREAKS: '🔥',
    CREATIVE: '🎨',
    SHELTER_ANGEL: '😇',
    SOCIAL: '📱',
    SECRET: '🔮',
  }

  for (const [category, stats] of Object.entries(progress.byCategory)) {
    const emoji = categoryEmojis[category] || '•'
    const bar = getProgressBar(stats.unlocked, stats.total)
    message += `${emoji} ${category}: ${bar} ${stats.unlocked}/${stats.total}\n`
  }

  message += `\n_${progress.byCategory.SECRET.unlocked} secret achievements found!_ 🤫`

  const keyboard = new InlineKeyboard()
    .text('📜 View All', 'achievements_list')
    .text('🔙 Back', 'back_to_dashboard')

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  })
})

/**
 * Generate progress bar
 */
function getProgressBar(current: number, total: number): string {
  const filled = Math.round((current / total) * 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}
```

### Step 5: Telegram Commands for Kimmie

```typescript
// packages/telegram/src/handlers/kimmie-commands.ts

import { Context, InlineKeyboard } from 'grammy'
import { telegramBot } from '../bot'
import { checkForEasterEggs, maybeRandomDelight } from '@ttlg/gamification'

/**
 * /me - Kimmie's personal stats
 */
telegramBot.command('me', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('🏆 Achievements', 'view_achievements')
    .text('📊 Stats', 'view_stats')
    .row()
    .text('🔥 Streaks', 'view_streaks')
    .text('🎯 Goals', 'view_goals')
    .row()
    .text('🦎 Hehe', 'lizard_hehe')

  await ctx.reply(
    `👑 **Queen Kimmie's Profile** 👑\n\n` +
      `What would you like to see?`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }
  )
})

/**
 * /mood - Set daily mood (affects Cheshire Cat's personality)
 */
telegramBot.command('mood', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('😊 Great!', 'mood_great')
    .text('😌 Good', 'mood_good')
    .row()
    .text('😐 Meh', 'mood_meh')
    .text('😤 Stressed', 'mood_stressed')
    .row()
    .text('🥱 Tired', 'mood_tired')
    .text('🔥 ON FIRE', 'mood_fire')

  await ctx.reply(
    `💜 **Mood Check!**\n\n` +
      `How are you feeling today, Queen?\n` +
      `_This helps me adjust my energy to match yours!_`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }
  )
})

// Mood handlers
telegramBot.callbackQuery(/^mood_(.+)$/, async (ctx) => {
  const [, mood] = ctx.match!

  const responses: Record<string, string> = {
    great: `🎉 YES QUEEN! Let's GOOOO! I'll match your energy! ⚡`,
    good: `😊 Love that for you! Ready to make some magic today! ✨`,
    meh: `💜 That's okay! Let's keep things chill. I'm here for whatever you need.`,
    stressed: `🫂 I hear you. Deep breaths. You've got this, and I'll keep things simple today.`,
    tired: `☕ Rest is important! I'll be extra gentle with notifications today.`,
    fire: `🔥🔥🔥 UNSTOPPABLE MODE ACTIVATED! Let's CRUSH this day! 🔥🔥🔥`,
  }

  await ctx.answerCallbackQuery(responses[mood] || '💜')

  // Store mood for Cheshire Cat personality adjustment
  await prisma.dailyMood.upsert({
    where: {
      date: new Date().toISOString().split('T')[0],
    },
    create: {
      date: new Date().toISOString().split('T')[0],
      mood,
    },
    update: { mood },
  })

  await ctx.editMessageText(
    `💜 **Mood Set: ${mood.toUpperCase()}**\n\n${responses[mood]}`,
    { parse_mode: 'Markdown' }
  )
})

/**
 * /treat - Give yourself a reward!
 */
telegramBot.command('treat', async (ctx) => {
  const treats = [
    { name: 'Coffee Break', emoji: '☕', duration: '15 min' },
    { name: 'Snack Time', emoji: '🍪', duration: '10 min' },
    { name: 'Fresh Air', emoji: '🌸', duration: '5 min' },
    { name: 'Dance Break', emoji: '💃', duration: '1 song' },
    { name: 'Stretch Session', emoji: '🧘', duration: '5 min' },
    { name: 'Pet Your Own Pet', emoji: '🐕', duration: '∞' },
  ]

  const treat = treats[Math.floor(Math.random() * treats.length)]

  await ctx.reply(
    `🎁 **YOU DESERVE A TREAT!** 🎁\n\n` +
      `${treat.emoji} **${treat.name}**\n` +
      `⏱️ _Recommended: ${treat.duration}_\n\n` +
      `Go ahead, Queen. You've earned it! 👑`,
    { parse_mode: 'Markdown' }
  )
})

/**
 * /hype - Get hyped up!
 */
telegramBot.command('hype', async (ctx) => {
  const hypes = [
    `🔥 YOU ARE A GROOMING GODDESS! 🔥\n\nThose pups don't know how LUCKY they are to be touched by your magic hands!`,
    `⚡ QUEEN ENERGY ACTIVATED! ⚡\n\nYou're about to make so many pets GORGEOUS today!`,
    `👑 REMINDER: 👑\n\nYou built this business from NOTHING. You're a BOSS. You're a LEGEND. Now go SLAY!`,
    `💜 HYPE CHECK! 💜\n\nYou're certified in SO many things. Fear-free? CHECK. Force-free? CHECK. Looking amazing? TRIPLE CHECK!`,
    `🚀 LET'S GOOOOO! 🚀\n\nThe floofs are waiting, the scissors are sharp, and YOU are UNSTOPPABLE!`,
    `✨ MAIN CHARACTER ENERGY! ✨\n\nThis is YOUR movie, YOUR salon, YOUR empire. Now make it ICONIC!`,
    `🦋 METAMORPHOSIS TIME! 🦋\n\nYou take scruffy and turn it into STUNNING. That's MAGIC, baby!`,
  ]

  const hype = hypes[Math.floor(Math.random() * hypes.length)]

  await ctx.reply(hype, { parse_mode: 'Markdown' })
})

/**
 * Listen for all messages to check for easter eggs
 */
telegramBot.on('message:text', async (ctx, next) => {
  const message = ctx.message.text

  // Check for easter eggs
  const triggered = await checkForEasterEggs(ctx, 'kimmie', message)

  if (!triggered) {
    // Maybe send a random delight
    await maybeRandomDelight(ctx)
  }

  await next()
})

/**
 * End of day summary (triggered by n8n at 8 PM)
 */
export async function sendEndOfDaySummary(): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Today's completed appointments
  const completed = await prisma.appointment.count({
    where: {
      completedAt: { gte: today, lt: tomorrow },
      status: 'COMPLETED',
    },
  })

  // Today's revenue
  const revenue = await prisma.appointment.aggregate({
    where: {
      completedAt: { gte: today, lt: tomorrow },
      status: 'COMPLETED',
    },
    _sum: { totalPrice: true },
  })

  // Photos captured
  const photosToday = await prisma.appointmentPhoto.count({
    where: {
      createdAt: { gte: today, lt: tomorrow },
    },
  })

  // New clients
  const newClients = await prisma.client.count({
    where: {
      createdAt: { gte: today, lt: tomorrow },
    },
  })

  // Generate summary message
  let message = `🌙 **End of Day Summary** 🌙\n\n`
  message += `_${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}_\n\n`

  message += `✂️ **Grooms Completed:** ${completed}\n`
  message += `💰 **Today's Revenue:** $${revenue._sum.totalPrice?.toFixed(2) || '0.00'}\n`
  message += `📸 **Photos Captured:** ${photosToday}\n`
  message += `🆕 **New Clients:** ${newClients}\n\n`

  // Celebratory message based on performance
  if (completed >= 5) {
    message += `🏆 **WOW!** ${completed} grooms?! You're a MACHINE! 💪\n`
  } else if (completed >= 3) {
    message += `⭐ **Great day!** Solid work, Queen! 👑\n`
  } else if (completed > 0) {
    message += `💜 **Quality over quantity!** Every floof matters! 🐕\n`
  } else {
    message += `🧘 **Rest day vibes!** Self-care is important too! 💆‍♀️\n`
  }

  // Tomorrow's preview
  const tomorrowAppts = await prisma.appointment.count({
    where: {
      scheduledStart: { gte: tomorrow },
      scheduledEnd: { lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) },
      status: { in: ['CONFIRMED', 'PENDING'] },
    },
  })

  message += `\n📅 **Tomorrow:** ${tomorrowAppts} appointments scheduled\n`

  // Sign off
  const signOffs = [
    `\n_Get some rest, Queen! You've earned it! 👑_`,
    `\n_Time for that bubble bath! 🛁_`,
    `\n_Sweet dreams of perfectly groomed floofs! 🐩_`,
    `\n_You're doing amazing things. Never forget that! 💜_`,
  ]

  message += signOffs[Math.floor(Math.random() * signOffs.length)]

  await telegramBot.api.sendMessage(process.env.KIMMIE_TELEGRAM_ID!, message, {
    parse_mode: 'Markdown',
  })
}
```

### Step 6: Prisma Schema Additions

```prisma
// Add to packages/database/prisma/schema.prisma

model UserAchievement {
  id            String   @id @default(cuid())
  odinguserId   String
  achievementId String
  unlockedAt    DateTime @default(now())

  @@unique([odinguserId, achievementId])
  @@index([odinguserId])
}

model DailyMood {
  id   String @id @default(cuid())
  date String @unique  // YYYY-MM-DD
  mood String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Add to User model
model User {
  // ... existing fields
  achievementPoints Int @default(0)
}
```

### Step 7: n8n Workflows for Kimmie's Experience

```json
// n8n-workflows/daily-dashboard.json

{
  "name": "Kimmie Daily Dashboard",
  "nodes": [
    {
      "name": "Morning Trigger",
      "type": "n8n-nodes-base.cron",
      "position": [250, 300],
      "parameters": {
        "triggerTimes": {
          "item": [
            {
              "mode": "custom",
              "cronExpression": "0 7 * * *"
            }
          ]
        }
      }
    },
    {
      "name": "Send Dashboard",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300],
      "parameters": {
        "url": "={{$env.API_URL}}/api/telegram/send-daily-dashboard",
        "method": "POST"
      }
    }
  ],
  "connections": {
    "Morning Trigger": {
      "main": [[{"node": "Send Dashboard", "type": "main", "index": 0}]]
    }
  }
}
```

```json
// n8n-workflows/end-of-day-summary.json

{
  "name": "End of Day Summary",
  "nodes": [
    {
      "name": "Evening Trigger",
      "type": "n8n-nodes-base.cron",
      "position": [250, 300],
      "parameters": {
        "triggerTimes": {
          "item": [
            {
              "mode": "custom",
              "cronExpression": "0 20 * * *"
            }
          ]
        }
      }
    },
    {
      "name": "Check Achievements",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300],
      "parameters": {
        "url": "={{$env.API_URL}}/api/achievements/check",
        "method": "POST"
      }
    },
    {
      "name": "Send Summary",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300],
      "parameters": {
        "url": "={{$env.API_URL}}/api/telegram/send-end-of-day",
        "method": "POST"
      }
    }
  ],
  "connections": {
    "Evening Trigger": {
      "main": [[{"node": "Check Achievements", "type": "main", "index": 0}]]
    },
    "Check Achievements": {
      "main": [[{"node": "Send Summary", "type": "main", "index": 0}]]
    }
  }
}
```

## Telegram Commands Summary

| Command | Description |
|---------|-------------|
| `/me` | View personal profile and quick stats |
| `/mood` | Set daily mood (affects Cheshire Cat energy) |
| `/treat` | Get a random self-care suggestion |
| `/hype` | Get hyped up with motivational messages |
| `/stats` | Detailed statistics dashboard |
| `/achievements` | View achievement progress |
| `/streak` | Check current streaks |

## Easter Egg Triggers

| Trigger | Achievement | Response |
|---------|-------------|----------|
| "mimikyu", "pikachu", "pokemon" | It's Mimikyu! | Pokemon-themed response |
| "dinosaur", "rawr", "jurassic" | Clever Girl | Dinosaur mode activation |
| "grey's anatomy", "mcdreamy", etc. | Beautiful Day | Medical drama quotes |
| "mormon wives", "soft swing" | Soft Swinging | Reality TV reference |
| "lizard", "hehe" | Hehe Lizard | The lizard button! |

## Daily Automation Schedule

| Time | Event |
|------|-------|
| 7:00 AM | Morning dashboard sent |
| Throughout day | Photo reminders based on appointments |
| 8:00 PM | End of day summary |
| Random | Achievement celebrations when unlocked |

## Achievement Categories

1. **Milestones** - Business growth achievements
2. **Streaks** - Consistency achievements (photos, posts)
3. **Creative** - Creative grooming achievements
4. **Shelter Angel** - Nonprofit work achievements
5. **Social** - Social media engagement achievements
6. **Secret** - Hidden easter egg achievements

## Testing

```bash
# Test achievement engine
pnpm --filter @ttlg/gamification test:achievements

# Test easter eggs
pnpm --filter @ttlg/gamification test:easter-eggs

# Test daily dashboard
pnpm --filter @ttlg/telegram test:dashboard

# E2E Kimmie experience test
pnpm test:e2e:kimmie
```

## The Vibe Checklist

- [x] Whimsical but not childish
- [x] Fun but functional
- [x] Personal easter eggs (Pokemon, Grey's, Mormon Wives, dinosaurs, lizard)
- [x] Gamification that motivates without overwhelming
- [x] Feminine energy without being patronizing
- [x] Celebrates wins both big and small
- [x] Adjusts to her mood
- [x] Random delights to brighten her day
- [x] Achievement system that feels rewarding
- [x] Daily rituals that feel special, not routine
