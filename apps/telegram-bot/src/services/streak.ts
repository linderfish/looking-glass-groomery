import { prisma } from '@looking-glass/db';
import { startOfDay } from 'date-fns';

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
