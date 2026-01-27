import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@looking-glass/db';
import { readFile, unlink } from 'fs/promises';
import { startOfDay, endOfDay } from 'date-fns';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET || 'looking-glass-photos';

/**
 * Upload a photo file to S3 and return the public URL
 * @param filePath - Local temp file path from Telegram download
 * @param fileId - Telegram file ID for unique naming
 * @returns Full S3 URL of uploaded photo
 */
export async function uploadPhotoToS3(filePath: string, fileId: string): Promise<string> {
  try {
    // Read file content
    const fileContent = await readFile(filePath);

    // Generate unique S3 key
    const timestamp = Date.now();
    const key = `photos/${timestamp}-${fileId}.jpg`;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: 'image/jpeg',
      })
    );

    // Return public URL
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  } finally {
    // CRITICAL: Always cleanup temp file, even on error
    await unlink(filePath).catch(() => {});
  }
}

/**
 * Find the current appointment Kimmie is likely working on
 * Priority order:
 * 1. IN_PROGRESS today (most likely current groom)
 * 2. CHECKED_IN today (next up)
 * 3. CONFIRMED today in future (scheduled for later)
 * 4. COMPLETED today most recent (just finished, after hours)
 *
 * @returns Appointment ID or null if no current appointment found
 */
export async function findCurrentAppointment(): Promise<string | null> {
  const now = new Date();
  const today = {
    start: startOfDay(now),
    end: endOfDay(now),
  };

  // Try IN_PROGRESS first
  const inProgress = await prisma.appointment.findFirst({
    where: {
      status: 'IN_PROGRESS',
      scheduledAt: {
        gte: today.start,
        lte: today.end,
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });
  if (inProgress) return inProgress.id;

  // Try CHECKED_IN next
  const checkedIn = await prisma.appointment.findFirst({
    where: {
      status: 'CHECKED_IN',
      scheduledAt: {
        gte: today.start,
        lte: today.end,
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });
  if (checkedIn) return checkedIn.id;

  // Try CONFIRMED in future
  const confirmed = await prisma.appointment.findFirst({
    where: {
      status: 'CONFIRMED',
      scheduledAt: {
        gte: now,
        lte: today.end,
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });
  if (confirmed) return confirmed.id;

  // Finally, try most recent COMPLETED today
  const completed = await prisma.appointment.findFirst({
    where: {
      status: 'COMPLETED',
      scheduledAt: {
        gte: today.start,
        lte: today.end,
      },
    },
    orderBy: { scheduledAt: 'desc' },
  });
  if (completed) return completed.id;

  return null;
}

/**
 * Attach a photo to an appointment with Before/After type
 * @param appointmentId - Appointment to attach to
 * @param type - BEFORE or AFTER
 * @param photoUrl - S3 URL of the photo
 */
export async function attachPhotoToAppointment(
  appointmentId: string,
  type: 'BEFORE' | 'AFTER',
  photoUrl: string
): Promise<void> {
  await prisma.appointmentPhoto.create({
    data: {
      appointmentId,
      type,
      originalUrl: photoUrl,
      status: 'PENDING_REVIEW',
    },
  });
}
