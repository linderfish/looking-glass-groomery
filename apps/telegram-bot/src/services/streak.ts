import { prisma } from '@looking-glass/db';
import { startOfDay, endOfDay, subDays } from 'date-fns';

/**
 * Calculate photo streak counting consecutive work days with photos
 * - Work backwards from yesterday (today doesn't count until end of day)
 * - Non-work days (no appointments) are skipped and don't break streak
 * - Work day with no photos breaks the streak
 * - Safety limit: stop after 365 days
 *
 * @returns Current streak count (0 if no streak)
 */
export async function calculatePhotoStreak(): Promise<number> {
  let streak = 0;
  let checkDate = subDays(startOfDay(new Date()), 1); // Start from yesterday
  const maxDays = 365;

  for (let i = 0; i < maxDays; i++) {
    const dayStart = startOfDay(checkDate);
    const dayEnd = endOfDay(checkDate);

    // Check if this was a work day (had completed/in-progress appointments)
    const appointmentsCount = await prisma.appointment.count({
      where: {
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
      },
    });

    if (appointmentsCount === 0) {
      // Not a work day - skip, doesn't break streak
      checkDate = subDays(checkDate, 1);
      continue;
    }

    // Work day - check if any photos were uploaded that day
    const photosCount = await prisma.appointmentPhoto.count({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    });

    if (photosCount === 0) {
      // Work day with no photos - streak is broken
      break;
    }

    // Work day with photos - increment streak and continue
    streak++;
    checkDate = subDays(checkDate, 1);
  }

  return streak;
}

/**
 * Update photo streak after a photo is attached to an appointment
 * Increments photoStreak if yesterday had photos (consecutive days)
 * Resets to 1 if there was a gap
 *
 * @returns Current streak value after update
 */
export async function updatePhotoStreak(): Promise<number> {
  const today = startOfDay(new Date());

  // Get or create today's stats
  const todayStats = await prisma.kimmieStats.upsert({
    where: { date: today },
    create: {
      date: today,
      photosUploaded: 1,
      photoStreak: 1,
    },
    update: {
      photosUploaded: { increment: 1 },
    },
  });

  // If photoStreak is already set for today, return it
  if (todayStats.photosUploaded > 1) {
    return todayStats.photoStreak;
  }

  // This is the first photo today - calculate streak
  // Get yesterday's stats
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayStats = await prisma.kimmieStats.findUnique({
    where: { date: yesterday },
  });

  let newStreak = 1;
  if (yesterdayStats && yesterdayStats.photosUploaded > 0) {
    // Continue the streak
    newStreak = yesterdayStats.photoStreak + 1;
  }

  // Update today's streak
  await prisma.kimmieStats.update({
    where: { date: today },
    data: { photoStreak: newStreak },
  });

  return newStreak;
}
