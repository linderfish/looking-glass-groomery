import { Composer, InlineKeyboard } from 'grammy';
import type { BotContext } from '../bot';
import { uploadPhotoToS3, findCurrentAppointment, attachPhotoToAppointment } from '../services/photo-upload';
import { updatePhotoStreak } from '../services/streak';
import { unlink } from 'fs/promises';

export const photosHandler = new Composer<BotContext>();

// Store photo URLs temporarily (maps message_id -> photoUrl)
const photoUrlCache = new Map<number, string>();

// Handle incoming photos
photosHandler.on('message:photo', async (ctx) => {
  let filePath: string | undefined;

  try {
    await ctx.replyWithChatAction('typing');

    // Get largest photo from array
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const fileId = photo.file_id;

    // Download photo from Telegram
    const file = await ctx.getFile();
    // @ts-expect-error - hydrateFiles plugin adds download() method
    filePath = await file.download() as string;

    // Upload to S3 (cleanup happens inside uploadPhotoToS3)
    const photoUrl = await uploadPhotoToS3(filePath, fileId);
    filePath = undefined; // Cleared by uploadPhotoToS3

    // Find current appointment
    const appointmentId = await findCurrentAppointment();

    if (!appointmentId) {
      await ctx.reply("Photo saved to S3! But couldn't find a current appointment to attach it to.");
      return;
    }

    // Store photo URL for callback
    const messageId = ctx.message.message_id;
    photoUrlCache.set(messageId, photoUrl);

    // Show Before/After selection keyboard
    const keyboard = new InlineKeyboard()
      .text('📸 BEFORE', `photo:before:${appointmentId}:${messageId}`)
      .text('✨ AFTER', `photo:after:${appointmentId}:${messageId}`);

    await ctx.reply('Is this a BEFORE or AFTER photo?', {
      reply_markup: keyboard,
    });
  } catch (error) {
    // Clean up temp file on error
    if (filePath) {
      await unlink(filePath).catch(() => {});
    }
    console.error('Photo upload error:', error);
    await ctx.reply("Couldn't upload photo - try again?");
  }
});

// Handle Before/After selection callback
photosHandler.callbackQuery(/^photo:(before|after):(.+):(.+)$/, async (ctx) => {
  try {
    const match = ctx.match;
    const type = match[1].toUpperCase() as 'BEFORE' | 'AFTER';
    const appointmentId = match[2];
    const messageId = parseInt(match[3]);

    // Retrieve photo URL from cache
    const photoUrl = photoUrlCache.get(messageId);
    if (!photoUrl) {
      await ctx.answerCallbackQuery({ text: 'Photo URL not found - please resend photo' });
      return;
    }

    // Attach photo to appointment
    await attachPhotoToAppointment(appointmentId, type, photoUrl);

    // Update photo streak
    const streak = await updatePhotoStreak();

    // Clear from cache
    photoUrlCache.delete(messageId);

    // Confirm selection
    await ctx.answerCallbackQuery({ text: 'Saved!' });
    await ctx.editMessageText(
      `${type === 'BEFORE' ? '📸' : '✨'} ${type} photo saved! 🔥 Streak: ${streak} day${streak === 1 ? '' : 's'}`
    );
  } catch (error) {
    console.error('Photo attachment error:', error);
    await ctx.answerCallbackQuery({ text: 'Error saving photo - try again?' });
  }
});

// Catch-all callback handler to prevent loading animations
photosHandler.on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery();
});
