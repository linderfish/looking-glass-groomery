# Phase 4: Photo Reminders + Dashboard - Research

**Researched:** 2026-01-26
**Domain:** Telegram photo handling, scheduled reminders, web dashboard, gamification
**Confidence:** HIGH

## Summary

Phase 4 combines photo capture and management with schedule visibility. The core challenge is implementing reliable photo upload to cloud storage, intelligent attachment to appointments, and timezone-aware scheduled reminders. The existing codebase already has Grammy (@grammyjs/files), AWS SDK (@aws-sdk/client-s3), and node-cron infrastructure in place.

**Technical Foundation:**
- Grammy inline keyboards provide clean UI for Before/After selection via callback queries
- AWS S3 is already installed and is the standard for cloud photo storage
- node-cron with timezone support handles scheduled reminders reliably
- Existing KimmieStats and gamification infrastructure ready for photo streak tracking
- Express with express-basic-auth provides simple password protection for web dashboard

**Primary recommendation:** Build on existing infrastructure - Grammy file handling is proven (voice messages work), S3 SDK is installed, scheduler pattern is established. Focus on photo attachment logic (auto-attach to IN_PROGRESS appointment) and streak calculation rules (consecutive work days with appointments AND photos).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| grammy | ^1.30.0 | Telegram bot framework | Already in use, excellent TypeScript support, official docs |
| @grammyjs/files | ^1.2.0 | Photo download from Telegram | Already integrated, Grammy ecosystem plugin |
| @aws-sdk/client-s3 | ^3.966.0 | Cloud storage | Already installed, industry standard for object storage |
| node-cron | Latest | Scheduled tasks | Lightweight, timezone-aware, already in use for daily digest |
| date-fns | ^4.1.0 | Date manipulation | Already in use, timezone handling with Intl API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| express-basic-auth | Latest | Simple password protection | For basic auth on web dashboard without complex auth flow |
| InlineKeyboard | Grammy built-in | Before/After selection UI | Creating buttons with callback queries |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AWS S3 | Google Cloud Storage | Both viable - S3 SDK already installed, stick with it |
| express-basic-auth | Passport.js | Passport is overkill for single-user dashboard with static password |
| node-cron | Agenda/Bull | Those require Redis/Mongo, node-cron sufficient for this scale |

**Installation:**
```bash
# Only new dependency needed:
npm install express-basic-auth --workspace=@looking-glass/telegram-bot
```

## Architecture Patterns

### Recommended Project Structure
```
apps/telegram-bot/src/
├── handlers/
│   └── photos.ts           # New: photo upload + Before/After selection
├── services/
│   ├── scheduler.ts        # Enhance: add end-of-day photo reminder
│   ├── daily-digest.ts     # Enhance: add photo streak display
│   ├── photo-upload.ts     # New: S3 upload + appointment attachment
│   └── streak.ts           # New: photo streak calculation logic
├── routes/
│   └── dashboard.ts        # New: Express app for /today web view

apps/web/app/
├── dashboard/
│   └── page.tsx            # New: simple today's schedule page
```

### Pattern 1: Photo Upload to S3 with Telegram
**What:** Receive photo from Telegram → download to temp → upload to S3 → save URL to database → cleanup temp file
**When to use:** Any file upload from Telegram bot
**Example:**
```typescript
// Source: Grammy files docs + AWS S3 best practices
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, unlink } from 'fs';
import { promisify } from 'util';

const s3 = new S3Client({ region: process.env.AWS_REGION });
const unlinkAsync = promisify(unlink);

bot.on('message:photo', async (ctx) => {
  // Get largest photo size
  const photo = ctx.message.photo[ctx.message.photo.length - 1];

  // Download from Telegram
  const file = await ctx.getFile();
  const tempPath = `./tmp/${file.file_id}.jpg`;
  await file.download(tempPath);

  // Upload to S3
  const s3Key = `photos/${Date.now()}-${file.file_id}.jpg`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: s3Key,
    Body: createReadStream(tempPath),
    ContentType: 'image/jpeg'
  }));

  const photoUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${s3Key}`;

  // Cleanup temp file immediately
  await unlinkAsync(tempPath);

  return photoUrl;
});
```

### Pattern 2: Inline Keyboard for Before/After Selection
**What:** Send photo, immediately show inline buttons to mark type
**When to use:** When user action is needed after bot message
**Example:**
```typescript
// Source: https://grammy.dev/plugins/keyboard
import { InlineKeyboard } from 'grammy';

// After photo uploaded
const keyboard = new InlineKeyboard()
  .text('📸 Before', `photo:before:${appointmentId}`)
  .text('✨ After', `photo:after:${appointmentId}`);

await ctx.reply('Photo saved! What type?', {
  reply_markup: keyboard
});

// Handle callback
bot.callbackQuery(/^photo:(before|after):(.+)$/, async (ctx) => {
  const type = ctx.match[1]; // 'before' or 'after'
  const aptId = ctx.match[2];

  await ctx.answerCallbackQuery({ text: `Marked as ${type}!` });
  await ctx.editMessageText(`Photo saved as ${type.toUpperCase()}! 📸`);

  // Update database
  await savePhotoType(aptId, type, photoUrl);
});

// CRITICAL: Handle unmatched callbacks to prevent loading animation
bot.on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery();
});
```

### Pattern 3: Timezone-Aware Cron Jobs
**What:** Schedule reminders that respect Kimmie's configured timezone
**When to use:** Daily reminders, morning briefings, end-of-day checks
**Example:**
```typescript
// Source: node-cron with timezone support
import cron from 'node-cron';

// Current pattern: check every minute (already in scheduler.ts)
cron.schedule('* * * * *', async () => {
  const settings = await getSettings();
  const timezone = settings.timezone || 'America/Los_Angeles';

  // Get current time in Kimmie's timezone
  const kimmieTime = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date());

  if (kimmieTime === '18:00') {
    await sendEndOfDayPhotoReminder();
  }
});
```

### Pattern 4: Auto-Attach Photo to Current Appointment
**What:** Smart attachment - find appointment IN_PROGRESS or next CONFIRMED today
**When to use:** Photo upload without explicit appointment selection
**Example:**
```typescript
async function findCurrentAppointment(): Promise<string | null> {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  // Priority 1: Appointment currently in progress
  const inProgress = await prisma.appointment.findFirst({
    where: {
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: 'IN_PROGRESS'
    }
  });
  if (inProgress) return inProgress.id;

  // Priority 2: Next confirmed appointment today
  const nextToday = await prisma.appointment.findFirst({
    where: {
      scheduledAt: { gte: now, lte: dayEnd },
      status: { in: ['CONFIRMED', 'CHECKED_IN'] }
    },
    orderBy: { scheduledAt: 'asc' }
  });
  if (nextToday) return nextToday.id;

  // Priority 3: Last appointment today (if after hours)
  const lastToday = await prisma.appointment.findFirst({
    where: {
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: 'COMPLETED'
    },
    orderBy: { scheduledAt: 'desc' }
  });
  return lastToday?.id || null;
}
```

### Pattern 5: Streak Calculation
**What:** Count consecutive work days (days with appointments AND photos)
**When to use:** Daily stat updates, morning briefing display
**Example:**
```typescript
async function calculatePhotoStreak(): Promise<number> {
  // Work backwards from yesterday (today doesn't count until end of day)
  let streak = 0;
  let checkDate = subDays(startOfDay(new Date()), 1);

  while (true) {
    const dayStart = startOfDay(checkDate);
    const dayEnd = endOfDay(checkDate);

    // Did Kimmie have appointments this day?
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['COMPLETED', 'IN_PROGRESS'] }
      }
    });

    if (appointments.length === 0) {
      // No work day - doesn't break streak
      checkDate = subDays(checkDate, 1);
      continue;
    }

    // Work day - did she post photos?
    const photosThisDay = await prisma.appointmentPhoto.findFirst({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd }
      }
    });

    if (!photosThisDay) {
      // Work day with no photos - streak broken
      break;
    }

    // Work day with photos - increment streak
    streak++;
    checkDate = subDays(checkDate, 1);

    // Safety: stop after 365 days
    if (streak >= 365) break;
  }

  return streak;
}
```

### Pattern 6: Simple Web Dashboard with Basic Auth
**What:** Express route with password protection, server-side rendered HTML
**When to use:** Simple internal tools, non-public admin views
**Example:**
```typescript
// Source: express-basic-auth npm docs
import express from 'express';
import basicAuth from 'express-basic-auth';

const app = express();

// Protect entire dashboard with static credentials
app.use('/dashboard', basicAuth({
  users: { 'kimmie': process.env.DASHBOARD_PASSWORD || 'lookinglass' },
  challenge: true, // Shows browser popup
  realm: 'Looking Glass Dashboard'
}));

// Today's schedule route
app.get('/dashboard/today', async (req, res) => {
  const appointments = await getTodayAppointments();

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Today's Schedule</title></head>
      <body>
        <h1>Today's Schedule</h1>
        ${appointments.map(apt => `
          <div>
            <strong>${format(apt.scheduledAt, 'h:mm a')}</strong> -
            ${apt.pet.name} (${apt.client.firstName})
          </div>
        `).join('')}
      </body>
    </html>
  `;

  res.send(html);
});
```

### Anti-Patterns to Avoid
- **Storing photos in database as BLOB:** Use S3 URLs, not binary data in Postgres
- **Storing photos on Telegram servers permanently:** Telegram can expire file URLs, always upload to S3
- **Breaking streak on weekends/off days:** Only count work days (days with appointments)
- **Complex OAuth for single-user dashboard:** express-basic-auth is sufficient for Kimmie-only access
- **Not cleaning up temp files:** Always delete downloaded files after S3 upload to prevent disk bloat

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File upload to cloud | Custom HTTP multipart logic | @aws-sdk/client-s3 with streams | Handles retries, credentials, multi-region, signed URLs |
| Telegram file download | Raw Bot API file.getFile() | @grammyjs/files with ctx.getFile() | Already configured, handles file paths, hydration |
| Inline keyboard callbacks | Parse ctx.message manually | bot.callbackQuery() with regex | Type-safe, built-in routing, automatic parsing |
| Timezone conversions | Manual UTC offset math | Intl.DateTimeFormat with timeZone | Handles DST automatically, all timezones |
| Basic auth middleware | Custom password checking | express-basic-auth | Timing-safe comparison, challenge mode, tested |
| Streak calculation | Simple counter in memory | Database-backed with date range queries | Survives restarts, audit trail, handles edge cases |

**Key insight:** Grammy and AWS SDK handle the tricky parts (file hydration, multipart uploads, auth). Focus on business logic (which appointment? before or after?) not infrastructure.

## Common Pitfalls

### Pitfall 1: Telegram File URL Expiration
**What goes wrong:** Store Telegram file URLs directly, they expire after ~1 hour, photos disappear
**Why it happens:** Telegram's getFile() returns temporary URLs for security
**How to avoid:** Always download → upload to S3 → store S3 URL in database
**Warning signs:** Photos work immediately after upload but 404 later

### Pitfall 2: Timezone Confusion in Streak Calculation
**What goes wrong:** Streak resets incorrectly because server timezone differs from Kimmie's timezone
**Why it happens:** Using `new Date()` directly gives server time, not Kimmie's local time
**How to avoid:** Always use Intl.DateTimeFormat with Kimmie's configured timezone for date boundaries
**Warning signs:** Streak resets at wrong time (e.g., 5pm PST instead of midnight PST)

### Pitfall 3: Callback Query Loading Animation
**What goes wrong:** User clicks inline button, sees loading spinner for 60 seconds
**Why it happens:** Bot doesn't call answerCallbackQuery() after handling callback
**How to avoid:** Always call ctx.answerCallbackQuery() in callback handlers, add catch-all handler
**Warning signs:** Buttons work but show spinning circle for long time

### Pitfall 4: Photo Attachment Ambiguity
**What goes wrong:** Photo uploaded but attached to wrong appointment (yesterday's instead of today's)
**Why it happens:** Auto-attachment logic picks COMPLETED status when multiple appointments exist
**How to avoid:** Priority order: IN_PROGRESS > CHECKED_IN > CONFIRMED (future) > COMPLETED (recent)
**Warning signs:** Kimmie says "that's not the right pet!" after photo upload

### Pitfall 5: Temp File Disk Bloat
**What goes wrong:** Server disk fills up with temp photo files, bot crashes
**Why it happens:** Grammy downloads to temp folder but files aren't cleaned up after S3 upload
**How to avoid:** Always unlink temp file in try/finally block after S3 upload succeeds
**Warning signs:** Disk usage grows linearly with photo uploads, /tmp fills up

### Pitfall 6: Streak Counting Weekend Days
**What goes wrong:** Kimmie's streak breaks on weekends even though she doesn't work weekends
**Why it happens:** Naive "consecutive days" logic doesn't account for work schedule
**How to avoid:** Skip days with no appointments when calculating streak (those aren't work days)
**Warning signs:** Streak resets every Monday even when Friday had photos

### Pitfall 7: End-of-Day Reminder Spam
**What goes wrong:** "No photos today" reminder fires even when there were no appointments
**Why it happens:** Reminder cron job doesn't check if there were appointments that day
**How to avoid:** Only send photo reminder on days that had at least one appointment
**Warning signs:** Reminder on days off, Kimmie annoyed by unnecessary notifications

## Code Examples

Verified patterns from official sources:

### Photo Upload Handler (Complete Flow)
```typescript
// Complete pattern: Telegram → Temp → S3 → Database → Cleanup
import { Composer, InlineKeyboard } from 'grammy';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, unlink } from 'fs';
import { promisify } from 'util';
import { BotContext } from '../bot';

const s3 = new S3Client({ region: process.env.AWS_REGION });
const unlinkAsync = promisify(unlink);

export const photosHandler = new Composer<BotContext>();

photosHandler.on('message:photo', async (ctx) => {
  try {
    // Get largest photo
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const file = await ctx.getFile();
    const tempPath = `./tmp/${file.file_id}.jpg`;

    // Download from Telegram
    await file.download(tempPath);

    // Upload to S3
    const s3Key = `photos/${Date.now()}-${file.file_id}.jpg`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: s3Key,
      Body: createReadStream(tempPath),
      ContentType: 'image/jpeg'
    }));

    const photoUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${s3Key}`;

    // Find current appointment
    const appointmentId = await findCurrentAppointment();

    if (!appointmentId) {
      await ctx.reply('Photo saved! But I couldn\'t figure out which appointment. Use /attach?');
      return;
    }

    // Ask Before or After
    const keyboard = new InlineKeyboard()
      .text('📸 Before', `photo:before:${appointmentId}:${photoUrl}`)
      .text('✨ After', `photo:after:${appointmentId}:${photoUrl}`);

    await ctx.reply('Photo uploaded! Before or After?', {
      reply_markup: keyboard
    });

  } catch (error) {
    console.error('Photo upload failed:', error);
    await ctx.reply('Oops! Photo upload failed 😿 Try again?');
  } finally {
    // CRITICAL: Always cleanup temp file
    if (tempPath) {
      try {
        await unlinkAsync(tempPath);
      } catch {
        console.error(`Failed to delete temp file: ${tempPath}`);
      }
    }
  }
});

// Handle Before/After selection
photosHandler.callbackQuery(/^photo:(before|after):([^:]+):(.+)$/, async (ctx) => {
  const type = ctx.match[1] as 'before' | 'after';
  const appointmentId = ctx.match[2];
  const photoUrl = ctx.match[3];

  await ctx.answerCallbackQuery({ text: `Marked as ${type}!` });
  await ctx.editMessageText(`📸 ${type.toUpperCase()} photo saved!`);

  // Save to database
  await prisma.appointmentPhoto.create({
    data: {
      appointmentId,
      type: type.toUpperCase() as 'BEFORE' | 'AFTER',
      originalUrl: photoUrl,
      status: 'PENDING_REVIEW'
    }
  });

  // Update streak
  await updatePhotoStreak();
});

// Catch-all to prevent loading animations
photosHandler.on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery();
});
```

### End-of-Day Photo Reminder
```typescript
// Add to scheduler.ts
async function checkEndOfDayPhotoReminder(): Promise<void> {
  const settings = await getSettings();
  const timezone = settings.timezone || 'America/Los_Angeles';
  const now = new Date();

  // Get today's date in Kimmie's timezone
  const kimmieDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  // Only remind if there were appointments today
  const todayAppointments = await prisma.appointment.count({
    where: {
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: { in: ['COMPLETED', 'IN_PROGRESS'] }
    }
  });

  if (todayAppointments === 0) {
    console.log('No appointments today - skipping photo reminder');
    return;
  }

  // Check if any photos posted today
  const photosToday = await prisma.appointmentPhoto.count({
    where: {
      createdAt: { gte: dayStart, lte: dayEnd }
    }
  });

  if (photosToday === 0) {
    await bot.api.sendMessage(
      process.env.TELEGRAM_KIMMIE_CHAT_ID!,
      `📸 Hey queen! You had ${todayAppointments} appointment${todayAppointments > 1 ? 's' : ''} today but no photos yet. Don't break that streak! 🔥`
    );
  }
}

// Add to cron schedule
cron.schedule('* * * * *', async () => {
  const settings = await getSettings();
  const timezone = settings.timezone || 'America/Los_Angeles';

  const kimmieTime = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date());

  // End of day reminder at 6pm
  if (kimmieTime === '18:00') {
    await checkEndOfDayPhotoReminder();
  }
});
```

### Web Dashboard with Basic Auth
```typescript
// New file: apps/telegram-bot/src/routes/dashboard.ts
import express from 'express';
import basicAuth from 'express-basic-auth';
import { prisma } from '@looking-glass/db';
import { startOfDay, endOfDay, format } from 'date-fns';

export const dashboardRouter = express.Router();

// Basic auth protection
dashboardRouter.use(basicAuth({
  users: { 'kimmie': process.env.DASHBOARD_PASSWORD || 'lookinglass' },
  challenge: true,
  realm: 'Looking Glass Dashboard'
}));

// Today's schedule
dashboardRouter.get('/today', async (req, res) => {
  try {
    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS'] }
      },
      include: { pet: true, client: true, services: true },
      orderBy: { scheduledAt: 'asc' }
    });

    // Get photo streak
    const stats = await prisma.kimmieStats.findFirst();
    const photoStreak = stats?.photoStreak || 0;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Today's Schedule - Looking Glass</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; }
            .appointment { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .time { font-size: 1.2em; font-weight: bold; color: #6d28d9; }
            .pet { font-size: 1.1em; margin: 5px 0; }
            .client { color: #666; }
            .streak { background: #f59e0b; color: white; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>📅 Today's Schedule</h1>
          <p>${format(today, 'EEEE, MMMM d, yyyy')}</p>

          ${photoStreak > 0 ? `<div class="streak">🔥 Photo Streak: ${photoStreak} days!</div>` : ''}

          ${appointments.length === 0 ? '<p>No appointments today - enjoy your day off! 💅</p>' : ''}

          ${appointments.map(apt => `
            <div class="appointment">
              <div class="time">${format(apt.scheduledAt, 'h:mm a')}</div>
              <div class="pet">🐾 ${apt.pet.name} (${apt.pet.species.toLowerCase()})</div>
              <div class="client">${apt.client.firstName} ${apt.client.lastName} | ${apt.client.phone}</div>
              <div>${apt.services.map(s => s.name).join(', ')}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Storing files on Telegram servers | Download → S3 → store URL | Always been best practice | Files persist, no expiration |
| Separate "cron" package | node-cron with timezone option | node-cron added timezone ~2020 | Simpler timezone handling |
| Manual timezone offset calculations | Intl.DateTimeFormat with timeZone | Built into Node.js 8+ (2017) | Automatic DST handling |
| Grammy Bot.api.getFile() | @grammyjs/files hydrateFiles() | @grammyjs/files v1.0 (2022) | Cleaner API, type-safe |
| Passport.js for all auth | express-basic-auth for simple cases | express-basic-auth gained popularity ~2018 | Less boilerplate for basic auth |

**Deprecated/outdated:**
- **node-telegram-bot-api**: Older library, Grammy has better TypeScript and docs
- **Manual multipart parsing for file uploads**: AWS SDK handles this now
- **UTC-only databases**: Postgres has timezone types but storing UTC + displaying in user's timezone is still best practice

## Open Questions

Things that couldn't be fully resolved:

1. **Photo Reminder Persistence Across Restarts**
   - What we know: Current scheduler uses in-memory cron jobs
   - What's unclear: Should end-of-day photo reminder be in PhotoReminder table like appointment reminders?
   - Recommendation: Keep it simple - cron job fires daily at 6pm, checks database state. No persistence needed since it's recurring (not one-time like appointment reminders).

2. **Multi-Photo Batch Handling**
   - What we know: Telegram allows sending multiple photos, each fires separate message:photo event
   - What's unclear: Should bot ask Before/After once for batch or once per photo?
   - Recommendation: Start with per-photo selection (simpler), can enhance to batch detection later if Kimmie sends many photos quickly.

3. **Streak Milestone Celebrations**
   - What we know: Achievement system exists for XP/levels
   - What's unclear: Should photo streaks unlock achievements (7 days, 30 days, etc.)?
   - Recommendation: Yes - add PHOTO_STREAK_7, PHOTO_STREAK_30 achievements. Use existing achievement notification system.

4. **Dashboard Deployment**
   - What we know: Telegram bot runs on port 3005 (webhook mode)
   - What's unclear: Should dashboard be separate Express server or same server different route?
   - Recommendation: Same server, different route (/dashboard/today). Simpler deployment, shared database connection.

## Sources

### Primary (HIGH confidence)
- [Grammy Inline Keyboards](https://grammy.dev/plugins/keyboard) - Official docs on inline keyboard patterns
- [Grammy InlineKeyboard API](https://grammy.dev/ref/core/InlineKeyboard) - Type definitions and methods
- [@grammyjs/files GitHub](https://github.com/grammyjs/files) - File handling plugin source
- [express-basic-auth npm](https://www.npmjs.com/package/express-basic-auth) - Basic auth middleware docs
- [express-basic-auth GitHub](https://github.com/LionC/express-basic-auth) - Implementation and examples

### Secondary (MEDIUM confidence)
- [Node.js cron jobs with timezone 2026](https://www.uptimia.com/learn/schedule-cron-jobs-node-js) - node-cron timezone patterns
- [node-cron timezone syntax 2026](https://www.freecodecamp.org/news/schedule-a-job-in-node-with-nodecron/) - Scheduling at exact times
- [AWS S3 Node.js upload best practices 2026](https://www.fullstackfoundations.com/blog/javascript-upload-file-to-s3) - File upload strategies
- [Streak gamification design 2026](https://yukaichou.com/gamification-study/master-the-art-of-streak-design-for-short-term-engagement-and-long-term-success/) - Streak ramp-down and emergency reserves
- [Designing streaks for long-term growth](https://www.mindtheproduct.com/designing-streaks-for-long-term-user-growth/) - Avoid streak shame, balance accomplishment with loss avoidance

### Tertiary (LOW confidence)
- [Telegram Bot S3 integration patterns](https://github.com/thelebster/s3-bucket-manager-telegram-bot) - Example implementation (not docs)
- [Grammy photo handling blog](https://blog.logrocket.com/building-telegram-bot-grammy/) - Third-party tutorial (2024)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use or well-documented
- Architecture: HIGH - Patterns verified against Grammy/AWS official docs
- Pitfalls: HIGH - Based on common issues documented in Grammy community and AWS S3 best practices
- Scheduler: HIGH - node-cron timezone support is documented, existing scheduler.ts uses same pattern
- Dashboard auth: MEDIUM - express-basic-auth is widely used but simpler than alternatives (could be over-simplified)
- Streak calculation: MEDIUM - Logic is custom, need to validate with Kimmie's actual workflow

**Research date:** 2026-01-26
**Valid until:** 60 days (stable stack - Grammy, AWS SDK, node-cron all mature)
