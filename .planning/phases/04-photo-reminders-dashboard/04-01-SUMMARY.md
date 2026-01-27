---
phase: 04-photo-reminders-dashboard
plan: 01
subsystem: telegram-bot
tags: [telegram, s3, aws-sdk, photos, streaks, grammy, inline-keyboard]

# Dependency graph
requires:
  - phase: 03-voice-commands
    provides: Voice handler pattern with file download and cleanup
provides:
  - Photo upload to S3 with permanent URLs (no Telegram expiration)
  - Before/After photo type selection via inline keyboard
  - Automatic current appointment detection
  - Photo streak tracking (consecutive days with photos)
affects: [04-02-photo-reminders, 04-03-dashboard, social-media-posting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "File download pattern: hydrateFiles plugin with @ts-expect-error"
    - "S3 upload with automatic temp file cleanup in finally block"
    - "Inline keyboard callbacks with regex pattern matching"
    - "photoUrlCache Map for temporary storage between message and callback"

key-files:
  created:
    - apps/telegram-bot/src/services/photo-upload.ts
    - apps/telegram-bot/src/services/streak.ts
    - apps/telegram-bot/src/handlers/photos.ts
  modified:
    - apps/telegram-bot/src/handlers/index.ts
    - apps/telegram-bot/src/index.ts

key-decisions:
  - "Store photo URLs in Map cache between photo upload and callback selection"
  - "Priority-based current appointment detection (IN_PROGRESS > CHECKED_IN > CONFIRMED > COMPLETED)"
  - "Photo streak logic: increment if yesterday had photos, reset to 1 if gap"
  - "Always cleanup temp files in finally block to prevent disk bloat"

patterns-established:
  - "Photo upload flow: Download → S3 upload → Inline keyboard → Callback → Database save → Streak update"
  - "Appointment detection uses scheduledAt field with startOfDay/endOfDay bounds"
  - "Inline keyboard data format: photo:{type}:{appointmentId}:{messageId}"

# Metrics
duration: 7min
completed: 2026-01-27
---

# Phase 4 Plan 1: Photo Upload & Streak Tracking Summary

**S3 photo storage with Before/After inline keyboard selection and automatic streak tracking for consecutive photo days**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-27T00:29:49Z
- **Completed:** 2026-01-27T00:37:10Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Photos sent to Telegram are uploaded to S3 and saved with permanent URLs (not temporary Telegram URLs)
- Before/After photo type selection via inline keyboard with instant feedback
- Photo streak tracking updates automatically after photo attachment
- Current appointment auto-detected using priority-based logic (IN_PROGRESS → CHECKED_IN → CONFIRMED → COMPLETED)
- Temp file cleanup prevents disk bloat from photo downloads

## Task Commits

Each task was committed atomically:

1. **Task 1: Create photo upload service** - `b6b324a` (feat)
   - photo-upload.ts with S3 upload, current appointment detection, photo attachment
   - streak.ts with updatePhotoStreak logic

2. **Task 2: Create photo handler with Before/After keyboard and streak update** - `b51fac6` (feat)
   - photos.ts handler with inline keyboard
   - Registered in handlers/index.ts and index.ts

**Bug fix:** `200320c` (fix) - Changed `date` field to `scheduledAt` in Appointment queries

## Files Created/Modified
- `apps/telegram-bot/src/services/photo-upload.ts` - S3 upload, appointment detection, photo attachment
- `apps/telegram-bot/src/services/streak.ts` - Photo streak calculation and update
- `apps/telegram-bot/src/handlers/photos.ts` - Photo handler with inline keyboard for Before/After selection
- `apps/telegram-bot/src/handlers/index.ts` - Export photosHandler
- `apps/telegram-bot/src/index.ts` - Register photosHandler before bookingsHandler

## Decisions Made

**Photo URL caching approach:**
- Store photo URLs in a Map (messageId → photoUrl) temporarily between upload and callback
- Alternative considered: Store in TelegramContext table, but Map is simpler for ephemeral data
- Map cleared after successful callback to prevent memory leak

**Current appointment detection priority:**
1. IN_PROGRESS today (most likely current groom)
2. CHECKED_IN today (next up)
3. CONFIRMED today in future (scheduled for later)
4. COMPLETED today most recent (just finished, after hours)

This priority order ensures Kimmie can send photos during grooming (IN_PROGRESS) or immediately after (COMPLETED today).

**Photo streak logic:**
- First photo of the day: Check yesterday's stats
- If yesterday had photos → increment streak
- If yesterday had no photos → reset to 1
- Updates KimmieStats.photoStreak field for today

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed scheduledAt field name in Appointment queries**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** Used `date` field but Appointment schema has `scheduledAt` field
- **Fix:** Changed all `date` references to `scheduledAt` in findCurrentAppointment queries and orderBy clauses
- **Files modified:** apps/telegram-bot/src/services/photo-upload.ts
- **Verification:** TypeScript compiles with no errors in photo-related files
- **Committed in:** 200320c (separate bug fix commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix necessary for database queries to match schema. No scope creep.

## Issues Encountered

None - plan executed smoothly after schema field name fix.

## User Setup Required

**External services require manual configuration.** AWS S3 setup needed:

**Environment variables to add:**
```env
AWS_REGION=us-west-2  # Or your preferred region
AWS_ACCESS_KEY_ID=<from AWS Console -> IAM -> Users -> Security credentials>
AWS_SECRET_ACCESS_KEY=<from AWS Console -> IAM -> Users -> Security credentials>
S3_BUCKET=looking-glass-photos  # Or your chosen bucket name
```

**Dashboard configuration steps:**
1. Go to AWS Console → S3 → Create bucket
2. Bucket name: `looking-glass-photos` (or your choice)
3. Region: Match AWS_REGION env var
4. Enable public read access for photos (or configure CloudFront)
5. Create IAM user with S3 PutObject permissions
6. Generate access keys and add to .env

**Verification commands:**
```bash
# Test S3 upload (after bot running):
# 1. Send a photo to the Telegram bot
# 2. Check S3 bucket for uploaded file
# 3. Verify URL format: https://{bucket}.s3.amazonaws.com/photos/{timestamp}-{fileId}.jpg
```

## Next Phase Readiness

**Ready for next phase (04-02: Photo Reminders):**
- Photo upload infrastructure complete
- AppointmentPhoto records created in database
- Photo streak tracking functional
- Can now build reminder logic on top of this foundation

**No blockers or concerns.**

**Available for future phases:**
- S3 photos can be used for social media posting
- Photo streak can be displayed in dashboard
- AppointmentPhoto records can be queried for before/after galleries

---
*Phase: 04-photo-reminders-dashboard*
*Completed: 2026-01-27*
