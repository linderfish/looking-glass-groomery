// apps/telegram-bot/src/services/storage.ts
// R2 storage service for permanent photo storage

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getBot } from '../bot'

// Lazy initialization to allow dotenv to load first
let _s3: S3Client | null = null

function getS3Client(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _s3
}

/**
 * Check if R2 storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  )
}

/**
 * Upload a photo from Telegram to R2 permanent storage
 * Downloads the file from Telegram's temporary URL and uploads to R2
 */
export async function uploadPhotoFromTelegram(
  fileId: string,
  appointmentId: string,
  type: 'before' | 'after'
): Promise<{ url: string; key: string }> {
  const bot = getBot()

  // Get file info from Telegram
  const file = await bot.api.getFile(fileId)
  const telegramUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`

  // Download the file before it expires
  const response = await fetch(telegramUrl)
  if (!response.ok) {
    throw new Error(`Failed to download from Telegram: ${response.status}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())

  // Generate unique filename with organized path
  const ext = file.file_path?.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const key = `appointments/${appointmentId}/${type}-${timestamp}.${ext}`

  // Upload to R2
  const s3 = getS3Client()
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  }))

  const url = `${process.env.R2_PUBLIC_URL}/${key}`
  console.log(`Uploaded photo to R2: ${url}`)

  return { url, key }
}
