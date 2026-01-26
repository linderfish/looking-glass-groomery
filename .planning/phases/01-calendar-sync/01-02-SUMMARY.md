# Plan 01-02 Summary: Wire calendar sync on creation + reschedule/cancel handlers

**Completed:** 2026-01-26
**Status:** ✅ SUCCESS

## What Was Done

### Task 1: Store calendarEventId on booking creation
- Modified `apps/cheshire/src/services/booking.ts` (lines 661-684)
- Added `prisma.appointment.update()` call after `createCalendarEvent()` succeeds
- This stores the returned event ID on the Appointment record
- **This was the critical missing link** - previously the calendarEventId was logged but never persisted

Before (broken):
```typescript
const calendarEventId = await createCalendarEvent({...})
console.log(`Created calendar event: ${calendarEventId}`) // ID was lost!
```

After (fixed):
```typescript
const calendarEventId = await createCalendarEvent({...})
await prisma.appointment.update({
  where: { id: appointment.id },
  data: { calendarEventId },
})
console.log(`Created and linked calendar event: ${calendarEventId}`)
```

### Task 2: Create reschedule endpoint
- Created `apps/cheshire/src/routes/appointment.ts`
- `POST /appointment/reschedule` endpoint
  - Validates request with Zod schema (appointmentId, newScheduledAt, optional newDuration)
  - Fetches appointment with pet, client, services relations
  - Updates appointment in database (scheduledAt, endTime, duration)
  - Calls `updateCalendarEvent()` if calendarEventId exists
  - Gracefully handles calendar sync failures (doesn't fail the operation)

### Task 3: Create cancel endpoint
- `POST /appointment/cancel` endpoint in same file
  - Validates request with Zod schema (appointmentId, optional reason)
  - Validates appointment can be cancelled (not already cancelled, not completed)
  - Updates appointment status to CANCELLED with timestamp and reason
  - Calls `deleteCalendarEvent()` if calendarEventId exists
  - Gracefully handles calendar sync failures

### Task 4: Register routes
- Added import and route registration in `apps/cheshire/src/index.ts`
- Routes available at `/appointment/reschedule` and `/appointment/cancel`

## Files Modified

| File | Changes |
|------|---------|
| `apps/cheshire/src/services/booking.ts` | Added prisma.appointment.update() to persist calendarEventId |
| `apps/cheshire/src/routes/appointment.ts` | **NEW** - Reschedule and cancel endpoints |
| `apps/cheshire/src/index.ts` | Added appointment routes registration |

## Verification

All verification steps passed:
1. ✅ `grep -B2 -A5 "Store the calendar event ID" booking.ts` - shows prisma.appointment.update call
2. ✅ `grep -n "reschedule" appointment.ts` - shows endpoint definition
3. ✅ `grep -n "cancel" appointment.ts` - shows endpoint definition
4. ✅ `grep "updateCalendarEvent\|deleteCalendarEvent" appointment.ts` - shows imports and usage
5. ✅ `grep "appointment" index.ts` - shows route registration
6. ✅ `npm run build` - compiles without errors

## API Endpoints

### POST /appointment/reschedule
```json
{
  "appointmentId": "string",
  "newScheduledAt": "2026-01-30T14:00:00.000Z",
  "newDuration": 90  // optional
}
```

Response:
```json
{
  "success": true,
  "appointment": {
    "id": "string",
    "scheduledAt": "date",
    "endTime": "date",
    "calendarSynced": true
  }
}
```

### POST /appointment/cancel
```json
{
  "appointmentId": "string",
  "reason": "Client requested"  // optional
}
```

Response:
```json
{
  "success": true,
  "appointment": {
    "id": "string",
    "status": "CANCELLED",
    "cancelledAt": "date",
    "calendarDeleted": true
  }
}
```
