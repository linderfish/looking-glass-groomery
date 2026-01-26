# Phase 3: Voice Commands - Research

**Researched:** 2026-01-26
**Domain:** Telegram voice message handling + OpenAI Whisper transcription
**Confidence:** HIGH

## Summary

Voice command implementation in Telegram bots using Grammy framework and OpenAI Whisper API is a well-established pattern with clear best practices. The architecture is straightforward: Grammy handles voice message reception and file download, OpenAI Whisper transcribes audio to text, and the transcribed text flows through the existing natural language handler from Phase 2.

**Key findings:**
- Grammy's `@grammyjs/files` plugin simplifies voice message file download (install via npm, use `file.download()`)
- OpenAI Whisper API accepts multiple audio formats including OGG (Telegram's native format), costs $0.006/minute
- No format conversion needed - OGG files can be sent directly to Whisper API
- Voice messages from Telegram are typically under 20MB (API download limit), well below Whisper's 25MB file size limit
- Grammy provides built-in error handling (`bot.catch()`) and chat action support (`ctx.chatAction = "typing"`)

**Primary recommendation:** Use Grammy's files plugin + OpenAI SDK's `audio.transcriptions.create()` with direct OGG file upload. No conversion libraries needed. Echo transcription back to user for transparency ("I heard: 'who is Sarah'").

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| grammy | 1.30+ | Telegram bot framework | Already in use, excellent TypeScript support, active maintenance |
| @grammyjs/files | 1.2+ | File download plugin for Grammy | Official Grammy plugin, simplifies file operations |
| openai | Latest | OpenAI API client | Official SDK, includes Whisper transcription methods |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @grammyjs/auto-chat-action | Latest | Auto-send "typing" indicator | Optional: Better UX during long operations |
| @types/fluent-ffmpeg | 2.1+ | Type definitions for ffmpeg | Only if conversion becomes necessary (unlikely) |
| fluent-ffmpeg | Latest | Audio conversion wrapper | Only if OGG support proves problematic (research shows it works) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OpenAI Whisper | Google Speech-to-Text | More complex setup, higher cost, not already integrated |
| Grammy files plugin | Manual Telegram Bot API calls | More code, more error-prone, loses type safety |
| Direct OGG upload | Convert to MP3/WAV first | Adds complexity, processing time, dependencies (ffmpeg) |

**Installation:**
```bash
# Already installed
npm install grammy openai

# Add files plugin
npm install @grammyjs/files

# Optional: chat action automation
npm install @grammyjs/auto-chat-action
```

## Architecture Patterns

### Recommended Project Structure
```
apps/telegram-bot/src/
├── handlers/
│   └── voice.ts              # New: voice message handler
├── services/
│   ├── transcription.ts      # New: Whisper API wrapper
│   └── search.ts             # Existing: reused for voice queries
└── index.ts                  # Register voice handler
```

### Pattern 1: Voice Message Handler with Files Plugin
**What:** Grammy handler that downloads voice files and triggers transcription
**When to use:** All voice message processing
**Example:**
```typescript
// Source: https://grammy.dev/plugins/files
import { Bot } from "grammy";
import { hydrateFiles } from "@grammyjs/files";

bot.api.config.use(hydrateFiles(bot.token));

bot.on("message:voice", async (ctx) => {
  await ctx.replyWithChatAction("typing");

  const voice = ctx.message.voice;
  const file = await ctx.getFile(); // Returns file with download() method
  const path = await file.download(); // Downloads to temp location

  // Process downloaded file
  const transcription = await transcribeAudio(path);
  await ctx.reply(`I heard: "${transcription}"`);
});
```

### Pattern 2: OpenAI Whisper Transcription
**What:** Send audio file to Whisper API, receive text transcription
**When to use:** All audio-to-text conversion
**Example:**
```typescript
// Source: https://platform.openai.com/docs/guides/speech-to-text
import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function transcribeAudio(filePath: string): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1", // or "gpt-4o-transcribe" for better accuracy
  });

  return transcription.text;
}
```

### Pattern 3: Integration with Existing Natural Language Handler
**What:** Pass transcribed text through Phase 2's natural language lookup
**When to use:** After successful transcription
**Example:**
```typescript
// voice.ts
bot.on("message:voice", async (ctx) => {
  const transcription = await transcribeVoice(ctx);

  // Create synthetic text message context for natural language handler
  // This reuses all the existing search logic from Phase 2
  const textMessage = { ...ctx.message, text: transcription };
  const syntheticCtx = { ...ctx, message: textMessage };

  // Pass to existing natural language handler (from lookup.ts)
  await naturalLanguageHandler(syntheticCtx);
});
```

### Pattern 4: User Feedback During Processing
**What:** Send "typing" indicator while transcription is in progress
**When to use:** All voice message handling (transcription takes 2-5 seconds)
**Example:**
```typescript
// Source: https://www.npmjs.com/package/@grammyjs/auto-chat-action
import { autoChatAction } from "@grammyjs/auto-chat-action";

// Option 1: Manual chat action
bot.on("message:voice", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  // ... process voice ...
});

// Option 2: Auto chat action plugin (cleaner)
bot.use(autoChatAction());
bot.on("message:voice", async (ctx) => {
  ctx.chatAction = "typing"; // Automatically loops until handler completes
  // ... process voice ...
});
```

### Anti-Patterns to Avoid
- **Converting OGG to MP3/WAV unnecessarily:** Whisper API accepts OGG format directly. Adding conversion adds dependencies (ffmpeg), processing time, and potential audio quality loss.
- **Not echoing transcription back:** Users should see what the bot understood. Silent processing creates confusion when transcription is wrong.
- **Blocking other handlers during transcription:** Use async/await properly, don't block the event loop
- **Storing voice files permanently:** Voice messages are ephemeral. Download to temp location, process, delete. No need for permanent storage.
- **Skipping error handling on file download:** Network issues, file size limits, API errors all need graceful handling

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Downloading Telegram files | Manual Bot API file path construction + fetch | `@grammyjs/files` plugin | Handles auth, file paths, temp directories, type safety automatically |
| Audio transcription | Custom speech recognition model | OpenAI Whisper API | Production-ready, multi-language, handles noise/accents, $0.006/min is cheaper than hosting |
| Audio format conversion | Custom ffmpeg command strings | fluent-ffmpeg (if needed) | Type-safe API, handles edge cases, but likely unnecessary for this use case |
| Typing indicator loops | Manual setInterval + sendChatAction | `@grammyjs/auto-chat-action` | Handles cleanup, timing, errors automatically |

**Key insight:** Voice transcription is a solved problem. The hard parts (acoustic modeling, language modeling, noise reduction) are handled by Whisper. Don't try to build custom solutions - integrate existing services.

## Common Pitfalls

### Pitfall 1: Telegram Voice Format Assumptions
**What goes wrong:** Assuming Telegram voice messages need conversion before sending to Whisper
**Why it happens:** OGG OPUS is less common than MP3/WAV, unclear documentation about Whisper's OGG support
**How to avoid:** OpenAI's documentation lists OGG as a supported format (https://platform.openai.com/docs/guides/speech-to-text). Telegram voice messages (OGG OPUS) can be sent directly. Test with actual Telegram voice messages first before adding conversion logic.
**Warning signs:** Adding ffmpeg dependencies "just in case", conversion code that never gets used

### Pitfall 2: File Size and Duration Limits
**What goes wrong:** Hitting Whisper's 25MB file size limit on long voice messages
**Why it happens:** Not checking voice message duration/size before processing
**How to avoid:** Telegram voice messages are typically under 20MB (Bot API download limit). For edge cases, check `voice.file_size` before processing and reject messages over 20MB with friendly error. Typical voice messages are 1-2 minutes, well under limits.
**Warning signs:** Whisper API errors about file size, users reporting "it worked for short messages but not long ones"

### Pitfall 3: Not Handling Transcription Failures
**What goes wrong:** Bot crashes or hangs when Whisper API is down or returns errors
**Why it happens:** Network issues, API rate limits, audio quality too poor to transcribe
**How to avoid:** Wrap transcription in try-catch, use Grammy's `bot.catch()` error handler, reply with user-friendly fallback message: "Couldn't understand that - try again or type your question"
**Warning signs:** Unhandled promise rejections, bot stops responding after voice message, no error feedback to user

### Pitfall 4: Ignoring Background Noise
**What goes wrong:** Poor transcription accuracy in noisy grooming salon environment
**Why it happens:** Clippers, water, barking dogs create background noise that degrades transcription
**How to avoid:** Whisper is trained on noisy data and handles this reasonably well. For Phase 3, accept this limitation - voice is a backup feature. If accuracy becomes an issue, users can retype. Don't over-engineer noise reduction upfront.
**Warning signs:** User reports "it never understands me", spending time on audio preprocessing

### Pitfall 5: Synthetic Context Anti-Pattern
**What goes wrong:** Trying to reuse natural language handler by creating fake context objects
**Why it happens:** Desire to DRY (Don't Repeat Yourself) and reuse existing logic
**How to avoid:** Extract natural language processing logic into a shared service function that takes plain text, not Grammy context. Call this service from both text and voice handlers. Don't mutate or fake Grammy context objects.
**Warning signs:** Type errors with synthetic contexts, handler middleware not firing correctly, callback handlers breaking

### Pitfall 6: Rate Limiting Whisper API
**What goes wrong:** Hitting OpenAI rate limits during heavy usage
**Why it happens:** Not tracking or throttling Whisper API calls
**How to avoid:** For Phase 3 (single user - Kimmie), rate limits are not a concern. OpenAI's rate limits are generous (50+ requests/min). Monitor usage in production, add throttling only if needed. This is premature optimization for single-user bot.
**Warning signs:** 429 rate limit errors from OpenAI, spending time building request queues

## Code Examples

Verified patterns from official sources:

### Complete Voice Handler Integration
```typescript
// apps/telegram-bot/src/handlers/voice.ts
// Source: Grammy docs + OpenAI docs + Phase 2 lookup handler
import { Composer } from 'grammy';
import type { BotContext } from '../bot';
import { transcribeAudio } from '../services/transcription';

export const voiceHandler = new Composer<BotContext>();

voiceHandler.on('message:voice', async (ctx) => {
  try {
    // Show typing indicator
    await ctx.replyWithChatAction('typing');

    // Download voice file
    const file = await ctx.getFile();
    const path = await file.download(); // Downloads to temp location

    // Transcribe
    const transcription = await transcribeAudio(path);

    if (!transcription || transcription.trim().length === 0) {
      await ctx.reply("Couldn't hear anything - try again?");
      return;
    }

    // Echo what was heard (transparency)
    await ctx.reply(`I heard: "${transcription}"`);

    // Process through natural language handler
    // This is the KEY integration point with Phase 2
    // Instead of synthetic context, extract the logic to a service
    const result = await processNaturalLanguageQuery(transcription);
    await ctx.reply(result, { parse_mode: 'HTML' });

  } catch (error) {
    console.error('Voice transcription error:', error);
    await ctx.reply(
      "Couldn't understand that - try again or type your question"
    );
  }
});
```

### Transcription Service
```typescript
// apps/telegram-bot/src/services/transcription.ts
// Source: OpenAI documentation
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcribe audio file using OpenAI Whisper
 * @param filePath Path to audio file (any format Whisper supports)
 * @returns Transcribed text
 */
export async function transcribeAudio(filePath: string): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1', // Cost: $0.006/minute
      // Optional: specify language if known (improves accuracy)
      // language: 'en',
    });

    return transcription.text;
  } catch (error) {
    console.error('Whisper API error:', error);
    throw new Error('Transcription failed');
  }
}
```

### Files Plugin Setup
```typescript
// apps/telegram-bot/src/bot.ts
// Source: https://grammy.dev/plugins/files
import { Bot } from 'grammy';
import { hydrateFiles } from '@grammyjs/files';

export const bot = new Bot<BotContext>(process.env.TELEGRAM_BOT_TOKEN!);

// CRITICAL: Configure files plugin BEFORE registering handlers
bot.api.config.use(hydrateFiles(bot.token));

// Now handlers can use ctx.getFile() with download() method
```

### Error Handling Setup
```typescript
// apps/telegram-bot/src/index.ts
// Source: https://grammy.dev/guide/errors
import { GrammyError, HttpError } from 'grammy';

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }

  // Always reply to user with friendly message
  return ctx.reply('Something went wrong. Try again!');
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| whisper-1 model | gpt-4o-transcribe models available | Dec 2025 | Improved accuracy, especially with accents/noise, same API |
| Manual file downloads | @grammyjs/files plugin | Grammy v1.x | Simpler code, better type safety, automatic cleanup |
| Format conversion with ffmpeg | Direct OGG upload to Whisper | Always supported | Simpler architecture, no extra dependencies |
| Custom speech recognition | API-based (Whisper, Google, etc.) | 2023+ | Accuracy, maintenance burden, cost all favor API approach |

**Deprecated/outdated:**
- **whisper.cpp Node bindings:** Self-hosted Whisper requires GPU/CPU resources, complex setup. API is simpler and cost-effective for low-volume use ($0.006/min means hundreds of transcriptions per dollar).
- **Web-based audio recorders:** Telegram native voice messages are the UX standard. Don't try to build custom voice recording UI.

## Open Questions

Things that couldn't be fully resolved:

1. **Should we echo transcription back to user?**
   - What we know: Transparency is valuable for debugging transcription errors
   - What's unclear: Does the extra message clutter the conversation?
   - Recommendation: Start with echo ("I heard: X"), remove if Kimmie finds it annoying. Easy A/B test.

2. **What's the actual transcription accuracy in grooming salon environment?**
   - What we know: Whisper is trained on noisy audio, handles it reasonably well
   - What's unclear: How well it performs with specific grooming salon noise (clippers, water, barking)
   - Recommendation: Test with real voice messages from salon during work. Acceptable accuracy threshold: 80%+ (voice is backup feature). If accuracy is poor, users can retype.

3. **Should we use whisper-1 or gpt-4o-transcribe model?**
   - What we know: gpt-4o-transcribe has better accuracy (especially accents, noise), both are $0.006/min
   - What's unclear: Whether the accuracy improvement is noticeable for Kimmie's use case (English, single speaker)
   - Recommendation: Start with whisper-1 (tried and tested), upgrade to gpt-4o-transcribe if accuracy issues arise. Same API, easy swap.

4. **Do we need rate limiting or usage tracking?**
   - What we know: Single-user bot (Kimmie), OpenAI rate limits are generous (50+ req/min)
   - What's unclear: Will usage patterns ever hit rate limits?
   - Recommendation: Skip for Phase 3. Monitor OpenAI dashboard for usage. Add throttling only if 429 errors occur. YAGNI principle.

## Sources

### Primary (HIGH confidence)
- [Grammy files plugin documentation](https://grammy.dev/plugins/files) - Official docs, installation and usage
- [Grammy error handling guide](https://grammy.dev/guide/errors) - Official docs, bot.catch() pattern
- [OpenAI Speech-to-Text Guide](https://platform.openai.com/docs/guides/speech-to-text) - Official API documentation
- [@grammyjs/files npm package](https://www.npmjs.com/package/@grammyjs/files) - Latest version 1.2.0
- [OpenAI audio.transcriptions.create API reference](https://platform.openai.com/docs/api-reference/audio/createTranscription?lang=node) - Node.js SDK usage

### Secondary (MEDIUM confidence)
- [Building a Telegram bot with grammY (LogRocket, Feb 2025)](https://blog.logrocket.com/building-telegram-bot-grammy/) - Tutorial with voice handling examples
- [Grammy auto-chat-action plugin](https://www.npmjs.com/package/@grammyjs/auto-chat-action) - Typing indicator automation
- [Telegram voice message transcription best practices](https://core.telegram.org/api/transcribe) - Telegram's official voice transcription docs
- [OpenAI Whisper API pricing breakdown](https://brasstranscripts.com/blog/openai-whisper-api-pricing-2025-self-hosted-vs-managed) - $0.006/min confirmed

### Tertiary (LOW confidence)
- [OGG OPUS format with Whisper discussion](https://github.com/openai/openai-node/issues/109) - GitHub issue from 2023, claims OGG works but not well documented
- [Telegram voice message limits](https://limits.tginfo.me/en) - Community-maintained limits page, not official Telegram docs
- [fluent-ffmpeg usage examples](https://medium.com/@kusalkalingainfo/convert-audio-files-using-fluent-ffmpeg-library-86aeb3c1b6b7) - Community tutorial, only needed if conversion becomes necessary

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Grammy and OpenAI are well-established, official plugins/SDKs exist
- Architecture: HIGH - Clear patterns from official docs, existing Phase 2 integration point
- Pitfalls: MEDIUM - Some are documented (file size limits), others are experiential (noise handling needs testing)

**Research date:** 2026-01-26
**Valid until:** 60 days (stable domain - Grammy and Whisper API are mature, slow-changing)
