// apps/telegram-bot/src/services/stats.ts
import { prisma } from '@looking-glass/db'
import { startOfDay, startOfWeek, endOfDay } from 'date-fns'

export interface KimmieStatsData {
  // All-time totals
  totalBookings: number
  totalCompleted: number
  totalPhotos: number
  totalContent: number
  shelterPets: number

  // This week
  thisWeek: number

  // Streaks
  photoStreak: number
  contentStreak: number

  // XP & Level
  xp: number
  level: number
  nextLevelXP: number
  levelTitle: string
}

// XP rewards for different actions
const XP_REWARDS = {
  BOOKING_COMPLETED: 10,
  PHOTO_UPLOADED: 5,
  CONTENT_POSTED: 15,
  SHELTER_GROOM: 25,
} as const

// Level titles
const LEVEL_TITLES: Record<number, string> = {
  1: 'Curious Cat',
  2: 'Apprentice Groomer',
  3: 'Scissor Specialist',
  4: 'Fur Fashionista',
  5: 'Pet Perfectionist',
  6: 'Grooming Guru',
  7: 'Style Sorcerer',
  8: 'Transformation Artist',
  9: 'Legendary Groomer',
  10: 'Queen of the Looking Glass',
}

/**
 * Calculate level from XP
 * Level 1: 0-99 XP
 * Level 2: 100-249 XP
 * Level 3: 250-449 XP
 * etc. (exponential growth)
 */
function calculateLevel(xp: number): { level: number; nextLevelXP: number } {
  let level = 1
  let threshold = 100

  while (xp >= threshold && level < 10) {
    level++
    threshold += 150 * level // Exponential growth
  }

  return { level, nextLevelXP: threshold }
}

/**
 * Get all stats for Kimmie
 */
export async function getStats(): Promise<KimmieStatsData> {
  const today = startOfDay(new Date())
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday

  // Get all-time appointment counts
  const [totalBookings, totalCompleted, shelterPets, thisWeekCount] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    prisma.appointment.count({
      where: {
        status: 'COMPLETED',
        // Shelter appointments are marked with specific notes or pet type
        clientNotes: { contains: 'shelter', mode: 'insensitive' },
      },
    }),
    prisma.appointment.count({
      where: {
        completedAt: {
          gte: weekStart,
          lte: endOfDay(new Date()),
        },
      },
    }),
  ])

  // Get all-time photo count
  const totalPhotos = await prisma.appointmentPhoto.count()

  // Get content count (placeholder - would need a content model)
  const totalContent = 0 // TODO: Add when content tracking is implemented

  // Get today's stats for streaks
  const todayStats = await prisma.kimmieStats.findFirst({
    where: { date: today },
  })

  // Get most recent stats record for current streak
  const recentStats = await prisma.kimmieStats.findFirst({
    orderBy: { date: 'desc' },
  })

  const photoStreak = recentStats?.photoStreak ?? 0
  const contentStreak = recentStats?.contentStreak ?? 0

  // Calculate XP from all activities
  const xp =
    totalCompleted * XP_REWARDS.BOOKING_COMPLETED +
    totalPhotos * XP_REWARDS.PHOTO_UPLOADED +
    totalContent * XP_REWARDS.CONTENT_POSTED +
    shelterPets * XP_REWARDS.SHELTER_GROOM

  // Calculate level
  const { level, nextLevelXP } = calculateLevel(xp)
  const levelTitle = LEVEL_TITLES[level] || LEVEL_TITLES[10]

  return {
    totalBookings,
    totalCompleted,
    totalPhotos,
    totalContent,
    shelterPets,
    thisWeek: thisWeekCount,
    photoStreak,
    contentStreak,
    xp,
    level,
    nextLevelXP,
    levelTitle,
  }
}

/**
 * Increment stats for an appointment completion
 */
export async function incrementCompletionStats(): Promise<void> {
  const today = startOfDay(new Date())

  // Get or create today's stats
  let stats = await prisma.kimmieStats.findFirst({
    where: { date: today },
  })

  if (!stats) {
    // Check yesterday's streak
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const yesterdayStats = await prisma.kimmieStats.findFirst({
      where: { date: yesterday },
    })

    stats = await prisma.kimmieStats.create({
      data: {
        date: today,
        appointmentsCompleted: 1,
        photoStreak: yesterdayStats?.photoStreak ?? 0,
        contentStreak: yesterdayStats?.contentStreak ?? 0,
      },
    })
  } else {
    stats = await prisma.kimmieStats.update({
      where: { id: stats.id },
      data: {
        appointmentsCompleted: stats.appointmentsCompleted + 1,
      },
    })
  }

  console.log(`Stats updated: ${stats.appointmentsCompleted} appointments completed today`)
}
