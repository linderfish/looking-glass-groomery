# Appointment Lifecycle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add check-in and completion workflow to the Telegram bot so Kimmie can track appointment status through CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED

**Architecture:** Extend existing bookings handler with inline buttons for status transitions. Each status change updates DB and triggers appropriate notifications/reminders.

**Tech Stack:** Grammy (Telegram), Prisma (DB), TypeScript

---

## Task 1: Add Check-In Button to Confirmed Appointments

**Files:**
- Modify: `apps/telegram-bot/src/handlers/bookings.ts:116-143`

**Step 1: Update the confirm callback to include Check-In button**

In the `confirm_booking` callback handler, after confirming, add a new inline keyboard with the Check-In button:

```typescript
// After line 143 (after showing appointment details), replace the ctx.reply with:
await ctx.reply(
  `✅ <b>Confirmed:</b> ${appointment.pet.name}\n` +
  `📅 ${format(appointment.scheduledAt, 'EEEE, MMM d')} at ${format(appointment.scheduledAt, 'h:mm a')}\n` +
  `👤 ${appointment.client.firstName} ${appointment.client.lastName}` +
  calendarNote,
  {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📍 Check In', callback_data: `checkin:${appointment.id}` },
        ],
      ],
    },
  }
)
```

**Step 2: Verify change compiles**

Run: `cd /home/bitvise/projects/kimmie && npx tsc --noEmit -p apps/telegram-bot/tsconfig.json`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/telegram-bot/src/handlers/bookings.ts
git commit -m "feat: add check-in button after booking confirmation"
```

---

## Task 2: Add Check-In Callback Handler

**Files:**
- Modify: `apps/telegram-bot/src/handlers/bookings.ts` (add after line 192)

**Step 1: Add the checkin callback handler**

Add after the decline_booking handler:

```typescript
// Handle check-in
bookingsHandler.callbackQuery(/^checkin:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  try {
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
      },
      include: {
        pet: true,
        client: true,
      },
    })

    await ctx.answerCallbackQuery({ text: 'Checked in! 📍' })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })

    await ctx.reply(
      `📍 <b>${appointment.pet.name} has arrived!</b>\n\n` +
      `Don't forget to take a BEFORE photo! 📸\n\n` +
      `Tap when you start grooming:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✂️ Start Grooming', callback_data: `start:${appointment.id}` },
            ],
          ],
        },
      }
    )
  } catch (error) {
    console.error('Failed to check in:', error)
    await ctx.answerCallbackQuery({ text: 'Error checking in 😿' })
  }
})
```

**Step 2: Verify change compiles**

Run: `cd /home/bitvise/projects/kimmie && npx tsc --noEmit -p apps/telegram-bot/tsconfig.json`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/telegram-bot/src/handlers/bookings.ts
git commit -m "feat: add check-in callback handler with start grooming button"
```

---

## Task 3: Add Start Grooming Handler (IN_PROGRESS)

**Files:**
- Modify: `apps/telegram-bot/src/handlers/bookings.ts` (add after checkin handler)

**Step 1: Add the start grooming callback handler**

```typescript
// Handle start grooming (IN_PROGRESS)
bookingsHandler.callbackQuery(/^start:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  try {
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'IN_PROGRESS',
      },
      include: {
        pet: true,
      },
    })

    await ctx.answerCallbackQuery({ text: 'Grooming started! ✂️' })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })

    await ctx.reply(
      `✂️ <b>Grooming ${appointment.pet.name}!</b>\n\n` +
      `Work your magic, queen! 💅\n\n` +
      `Tap when done:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Complete', callback_data: `complete:${appointment.id}` },
            ],
          ],
        },
      }
    )
  } catch (error) {
    console.error('Failed to start grooming:', error)
    await ctx.answerCallbackQuery({ text: 'Error starting grooming 😿' })
  }
})
```

**Step 2: Verify change compiles**

Run: `cd /home/bitvise/projects/kimmie && npx tsc --noEmit -p apps/telegram-bot/tsconfig.json`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/telegram-bot/src/handlers/bookings.ts
git commit -m "feat: add start grooming handler for IN_PROGRESS status"
```

---

## Task 4: Add Complete Handler (COMPLETED)

**Files:**
- Modify: `apps/telegram-bot/src/handlers/bookings.ts` (add after start handler)

**Step 1: Add the complete callback handler**

```typescript
// Handle completion
bookingsHandler.callbackQuery(/^complete:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  try {
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        pet: true,
        client: true,
      },
    })

    await ctx.answerCallbackQuery({ text: 'Completed! 🎉' })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })

    await ctx.reply(
      `🎉 <b>${appointment.pet.name} is all done!</b>\n\n` +
      `Time for that AFTER photo! 📸\n\n` +
      `${appointment.pet.name} is looking fabulous, I just know it! ✨`,
      { parse_mode: 'HTML' }
    )

    // TODO: In Sprint 3, trigger photo reminder here
    // TODO: In Sprint 4, update stats and check achievements here
  } catch (error) {
    console.error('Failed to complete appointment:', error)
    await ctx.answerCallbackQuery({ text: 'Error completing appointment 😿' })
  }
})
```

**Step 2: Verify change compiles**

Run: `cd /home/bitvise/projects/kimmie && npx tsc --noEmit -p apps/telegram-bot/tsconfig.json`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/telegram-bot/src/handlers/bookings.ts
git commit -m "feat: add complete handler for COMPLETED status with TODOs for future sprints"
```

---

## Task 5: Add /today Command for Quick View

**Files:**
- Modify: `apps/telegram-bot/src/handlers/bookings.ts` (add at top after handler creation)

**Step 1: Add /today command**

Add after `export const bookingsHandler = new Composer<BotContext>()`:

```typescript
import { getDailyDigestPreview } from '../services/daily-digest'

// /today command - show today's appointments with actions
bookingsHandler.command('today', async (ctx) => {
  const today = new Date()

  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay(today),
        lte: new Date(startOfDay(today).getTime() + 24 * 60 * 60 * 1000),
      },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    include: {
      pet: true,
      client: true,
      services: true,
    },
    orderBy: { scheduledAt: 'asc' },
  })

  if (appointments.length === 0) {
    await ctx.reply('📅 No appointments today - enjoy your day off! 💅')
    return
  }

  let message = `📅 <b>Today's Appointments</b>\n\n`

  for (const apt of appointments) {
    const time = format(apt.scheduledAt, 'h:mm a')
    const statusEmoji = {
      PENDING: '⏳',
      CONFIRMED: '✅',
      CHECKED_IN: '📍',
      IN_PROGRESS: '✂️',
      COMPLETED: '🎉',
    }[apt.status] || '❓'

    message += `${statusEmoji} <b>${time}</b> - ${apt.pet.name}\n`
    message += `   ${apt.client.firstName} | ${apt.status.replace('_', ' ')}\n\n`
  }

  // Build inline keyboard for actionable appointments
  const buttons = []
  for (const apt of appointments) {
    if (apt.status === 'CONFIRMED') {
      buttons.push([{ text: `📍 Check In: ${apt.pet.name}`, callback_data: `checkin:${apt.id}` }])
    } else if (apt.status === 'CHECKED_IN') {
      buttons.push([{ text: `✂️ Start: ${apt.pet.name}`, callback_data: `start:${apt.id}` }])
    } else if (apt.status === 'IN_PROGRESS') {
      buttons.push([{ text: `✅ Complete: ${apt.pet.name}`, callback_data: `complete:${apt.id}` }])
    }
  }

  await ctx.reply(message, {
    parse_mode: 'HTML',
    reply_markup: buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
  })
})
```

**Step 2: Update import at top of file**

Add `startOfDay` to the date-fns import if not already present (it is).

**Step 3: Verify change compiles**

Run: `cd /home/bitvise/projects/kimmie && npx tsc --noEmit -p apps/telegram-bot/tsconfig.json`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/telegram-bot/src/handlers/bookings.ts
git commit -m "feat: add /today command to view and manage today's appointments"
```

---

## Task 6: Deploy and Test

**Step 1: Push to remote**

```bash
git push
```

**Step 2: Deploy to production-stable**

```bash
ssh production-stable "cd ~/apps/looking-glass-groomery && git pull && pm2 restart telegram-bot"
```

**Step 3: Verify bot is running**

```bash
ssh production-stable "pm2 logs telegram-bot --lines 10 --nostream"
```
Expected: "Cheshire Cat is waking up..." and "Scheduler initialized"

**Step 4: Manual test in Telegram**

1. Type `/today` - should show today's appointments (or "no appointments" message)
2. If you have a confirmed appointment, tap "Check In"
3. Verify status changes to CHECKED_IN
4. Tap "Start Grooming"
5. Verify status changes to IN_PROGRESS
6. Tap "Complete"
7. Verify status changes to COMPLETED

**Step 5: Commit test verification note**

No commit needed - this is manual testing.

---

## Summary

After completing all tasks:

- ✅ Confirmed appointments show "Check In" button
- ✅ Check-in shows "Start Grooming" button
- ✅ Start grooming shows "Complete" button
- ✅ Completion shows success message with photo reminder
- ✅ `/today` command shows all today's appointments with action buttons
- ✅ Full lifecycle: PENDING → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED

**Next Sprint:** Photo Workflow (trigger reminders on CHECKED_IN and COMPLETED)
