// apps/telegram-bot/src/services/achievements.ts
import { prisma } from '@looking-glass/db'
import type { KimmieStatsData } from './stats'

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  emoji: string
  xpReward: number
  checkUnlocked: (stats: KimmieStatsData) => boolean
}

// All achievement definitions with unlock conditions
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Booking milestones
  {
    id: 'first_booking',
    name: 'Down the Rabbit Hole',
    description: 'Complete your first booking through Looking Glass',
    emoji: '🐰',
    xpReward: 100,
    checkUnlocked: (stats) => stats.totalCompleted >= 1,
  },
  {
    id: 'bookings_10',
    name: 'Getting Warmed Up',
    description: 'Complete 10 grooming appointments',
    emoji: '✂️',
    xpReward: 150,
    checkUnlocked: (stats) => stats.totalCompleted >= 10,
  },
  {
    id: 'bookings_50',
    name: 'Scissor Savant',
    description: 'Complete 50 grooming appointments',
    emoji: '🌟',
    xpReward: 300,
    checkUnlocked: (stats) => stats.totalCompleted >= 50,
  },
  {
    id: 'bookings_100',
    name: 'Century Club',
    description: 'Complete 100 grooming appointments',
    emoji: '💯',
    xpReward: 500,
    checkUnlocked: (stats) => stats.totalCompleted >= 100,
  },

  // Photo streaks
  {
    id: 'photo_streak_3',
    name: 'Shutterbug',
    description: 'Maintain a 3-day before/after photo streak',
    emoji: '📸',
    xpReward: 150,
    checkUnlocked: (stats) => stats.photoStreak >= 3,
  },
  {
    id: 'photo_streak_7',
    name: 'Paparazzi Pro',
    description: 'Maintain a 7-day before/after photo streak',
    emoji: '🌟',
    xpReward: 300,
    checkUnlocked: (stats) => stats.photoStreak >= 7,
  },
  {
    id: 'photo_streak_30',
    name: 'Documentary Director',
    description: 'Maintain a 30-day before/after photo streak',
    emoji: '🎬',
    xpReward: 1000,
    checkUnlocked: (stats) => stats.photoStreak >= 30,
  },

  // Photo count
  {
    id: 'photos_25',
    name: 'Photo Album',
    description: 'Upload 25 photos',
    emoji: '📷',
    xpReward: 100,
    checkUnlocked: (stats) => stats.totalPhotos >= 25,
  },
  {
    id: 'photos_100',
    name: 'Photo Gallery',
    description: 'Upload 100 photos',
    emoji: '🖼️',
    xpReward: 250,
    checkUnlocked: (stats) => stats.totalPhotos >= 100,
  },

  // Content
  {
    id: 'content_posted_10',
    name: 'Influencer Rising',
    description: 'Post 10 pieces of content',
    emoji: '📱',
    xpReward: 250,
    checkUnlocked: (stats) => stats.totalContent >= 10,
  },
  {
    id: 'content_posted_50',
    name: 'Content Queen',
    description: 'Post 50 pieces of content',
    emoji: '👑',
    xpReward: 750,
    checkUnlocked: (stats) => stats.totalContent >= 50,
  },

  // Shelter angels
  {
    id: 'shelter_angel_1',
    name: 'Shelter Angel',
    description: 'Complete your first shelter pet grooming',
    emoji: '😇',
    xpReward: 200,
    checkUnlocked: (stats) => stats.shelterPets >= 1,
  },
  {
    id: 'shelter_angel_10',
    name: 'Guardian Angel',
    description: 'Complete 10 shelter pet groomings',
    emoji: '👼',
    xpReward: 500,
    checkUnlocked: (stats) => stats.shelterPets >= 10,
  },

  // Easter egg achievements (unlocked via special triggers, not stats)
  {
    id: 'pokemon_fan',
    name: 'Gotta Groom Em All',
    description: 'Trigger the Pokemon easter egg',
    emoji: '🎮',
    xpReward: 50,
    checkUnlocked: () => false, // Unlocked via easter egg trigger
  },
  {
    id: 'greys_fan',
    name: "McDreamy's Groomer",
    description: "Trigger the Grey's Anatomy easter egg",
    emoji: '🏥',
    xpReward: 50,
    checkUnlocked: () => false,
  },
  {
    id: 'animal_crossing_fan',
    name: 'Island Representative',
    description: 'Trigger the Animal Crossing easter egg',
    emoji: '🏝️',
    xpReward: 50,
    checkUnlocked: () => false,
  },
]

/**
 * Check and unlock any new achievements based on current stats
 * Returns array of newly unlocked achievement IDs
 */
export async function checkAndUnlockAchievements(
  stats: KimmieStatsData
): Promise<string[]> {
  const newlyUnlocked: string[] = []

  // Get all currently unlocked achievements
  const existing = await prisma.kimmieAchievement.findMany({
    select: { achievementType: true },
  })
  const unlockedIds = new Set(existing.map((a) => a.achievementType))

  // Check each achievement definition
  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    // Skip if already unlocked
    if (unlockedIds.has(achievement.id)) continue

    // Check if should be unlocked
    if (achievement.checkUnlocked(stats)) {
      // Unlock it!
      await prisma.kimmieAchievement.create({
        data: {
          achievementType: achievement.id,
          metadata: {
            xpReward: achievement.xpReward,
            statsSnapshot: {
              totalCompleted: stats.totalCompleted,
              photoStreak: stats.photoStreak,
              totalPhotos: stats.totalPhotos,
            },
          },
        },
      })

      newlyUnlocked.push(achievement.id)
      console.log(`🏆 Achievement unlocked: ${achievement.name}`)
    }
  }

  return newlyUnlocked
}

/**
 * Unlock a specific achievement (for easter eggs, etc.)
 */
export async function unlockAchievement(achievementId: string): Promise<boolean> {
  // Check if already unlocked
  const existing = await prisma.kimmieAchievement.findFirst({
    where: { achievementType: achievementId },
  })

  if (existing) return false

  const achievement = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId)
  if (!achievement) return false

  await prisma.kimmieAchievement.create({
    data: {
      achievementType: achievementId,
      metadata: {
        xpReward: achievement.xpReward,
        unlockedVia: 'special_trigger',
      },
    },
  })

  console.log(`🏆 Achievement unlocked: ${achievement.name}`)
  return true
}

/**
 * Get all unlocked achievements
 */
export async function getUnlockedAchievements(): Promise<string[]> {
  const achievements = await prisma.kimmieAchievement.findMany({
    select: { achievementType: true },
  })
  return achievements.map((a) => a.achievementType)
}

/**
 * Calculate total XP from achievements
 */
export function calculateAchievementXP(unlockedIds: string[]): number {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => unlockedIds.includes(a.id)).reduce(
    (sum, a) => sum + a.xpReward,
    0
  )
}
