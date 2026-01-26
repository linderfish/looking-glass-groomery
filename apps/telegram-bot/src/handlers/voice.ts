import { Composer } from 'grammy';
import type { BotContext } from '../bot';
import { transcribeAudio } from '../services/transcription';
import { processNaturalLanguageQuery } from '../services/natural-language';
import { formatClientProfile, formatClientList } from '../services/formatting';
import fs from 'fs/promises';

export const voiceHandler = new Composer<BotContext>();

voiceHandler.on('message:voice', async (ctx) => {
  let filePath: string | undefined;

  try {
    await ctx.replyWithChatAction('typing');

    // Download voice message from Telegram
    const file = await ctx.getFile();
    // @ts-expect-error - hydrateFiles plugin adds download() method
    filePath = await file.download() as string;

    // Transcribe audio using OpenAI Whisper
    const transcription = await transcribeAudio(filePath);

    // Clean up temp file immediately after transcription
    await fs.unlink(filePath).catch(() => {});
    filePath = undefined;

    // Check for empty transcription
    if (!transcription?.trim()) {
      await ctx.reply("Couldn't hear anything - try again?");
      return;
    }

    // Echo what was heard
    await ctx.reply(`I heard: "${transcription}"`);

    // Process query using natural language service
    const result = await processNaturalLanguageQuery(transcription);

    // Render results based on type
    switch (result.type) {
      case 'client':
        await ctx.reply(formatClientProfile(result.data), { parse_mode: 'HTML' });
        break;
      case 'clients':
        await ctx.reply(formatClientList(result.data), { parse_mode: 'HTML' });
        break;
      case 'not_found':
        await ctx.reply(result.message);
        break;
    }
  } catch (error) {
    // Clean up temp file on error
    if (filePath) {
      await fs.unlink(filePath).catch(() => {});
    }
    console.error('Voice transcription error:', error);
    await ctx.reply("Couldn't understand that - try again or type your question");
  }
});
