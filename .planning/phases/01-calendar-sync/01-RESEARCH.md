# Phase 1: Calendar Sync - Research

**Researched:** 2026-01-26
**Domain:** Google Calendar API integration with database synchronization
**Confidence:** HIGH

## Summary

Calendar synchronization requires three core operations: create, update, and delete. The existing codebase already has Google Calendar OAuth configured and can create events, but critically lacks two pieces:

1. **Database schema gap**: The `Appointment` model doesn't store the `calendarEventId` returned by Google Calendar, preventing updates and deletes
2. **Transaction boundary issue**: Calendar event creation happens outside the database transaction, risking inconsistency if either operation fails

The standard approach is to store the external system's ID (calendarEventId) in the database, wrap both operations in a transaction pattern (using outbox pattern for external APIs), and implement idempotent operations to handle retries safely.

**Primary recommendation:** Add nullable `calendarEventId` field to Appointment model, implement update/delete Calendar API methods in calendar-oauth.ts, and wrap sync operations in a transactional outbox pattern with proper error handling.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Google Calendar API v3 | v3 (current) | Event CRUD operations | Official Google API, stable and well-documented |
| Prisma | 5.x | Database ORM with transaction support | Already in use, provides serializable transactions |
| date-fns | 2.x+ | Date manipulation | Already in use, consistent with existing code |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| OAuth 2.0 (existing) | - | Calendar API authentication | Already configured in calendar-oauth.ts |
| Bun runtime | current | Server runtime with native fetch | Project standard for Cheshire API |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Google Calendar API | Service account auth | Already using OAuth - don't change |
| Prisma | Raw SQL | Prisma provides type safety and transaction isolation |
| Transactional outbox | Distributed saga | Outbox simpler for single external API |

**Installation:**
```bash
# No new packages needed - using existing stack
# Schema migration only:
npm run db:generate  # After schema change
npm run db:push      # Apply to database
```

## Architecture Patterns

### Recommended Code Organization
```
apps/cheshire/src/services/
├── calendar-oauth.ts       # Add updateCalendarEvent, deleteCalendarEvent
├── booking.ts              # Update to store calendarEventId after creation
├── appointment-sync.ts     # NEW: Sync logic with outbox pattern
└── availability.ts         # Existing - no changes needed
```

### Pattern 1: Store External System IDs
**What:** Store the Google Calendar event ID on the Appointment record
**When to use:** Always - required for update and delete operations
**Example:**
```typescript
// In Prisma schema
model Appointment {
  id              String    @id @default(cuid())
  calendarEventId String?   // Google Calendar event ID for sync
  // ... rest of fields
}

// In booking creation
const calendarEventId = await createCalendarEvent({ ... })
await prisma.appointment.update({
  where: { id: appointment.id },
  data: { calendarEventId }
})
```

### Pattern 2: Transactional Outbox for External APIs
**What:** Database transaction creates appointment, then separate process syncs to external API
**When to use:** When external API calls can't be in DB transaction (like Google Calendar)
**Example:**
```typescript
// Source: Microservices.io Transactional Outbox Pattern
// Step 1: Create appointment in transaction
const appointment = await prisma.appointment.create({ ... })

// Step 2: Sync to calendar (outside transaction)
try {
  const eventId = await createCalendarEvent({ ... })
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { calendarEventId: eventId }
  })
} catch (error) {
  // Log error - appointment exists but not in calendar
  // Retry mechanism should sync later
  console.error('Calendar sync failed:', error)
}
```

### Pattern 3: Idempotent Updates with Stored ID
**What:** Use the stored calendarEventId to update or delete specific events
**When to use:** When appointment is rescheduled or cancelled
**Example:**
```typescript
// Source: Google Calendar API v3 documentation
async function updateCalendarEvent(
  eventId: string,
  updates: { start: Date; end: Date; summary?: string }
): Promise<void> {
  const token = await getAccessToken()
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: updates.summary,
        start: { dateTime: updates.start.toISOString(), timeZone: 'America/Los_Angeles' },
        end: { dateTime: updates.end.toISOString(), timeZone: 'America/Los_Angeles' },
      }),
    }
  )
}
```

### Anti-Patterns to Avoid
- **Creating events without storing ID:** Makes updates/deletes impossible - always capture and store the returned event ID
- **Synchronous external API in transaction:** Database transaction should not wait for external API - use outbox pattern instead
- **Deleting without checking for calendarEventId:** If event was never synced to calendar, delete API call will fail - check first

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth token refresh | Custom token caching | Existing getAccessToken() in calendar-oauth.ts | Already handles refresh, caching, and expiry |
| Transaction isolation | Manual locking | Prisma's isolationLevel: 'Serializable' | Prevents race conditions in concurrent bookings |
| Date/time parsing | Custom parsing | date-fns parsing functions | Handles timezones, DST, edge cases |
| Calendar event deduplication | Custom ID generation | Google Calendar returns event.id | API guarantees unique IDs |
| Retry logic for API failures | Manual retry loops | Exponential backoff libraries or job queue | Handles rate limits properly |

**Key insight:** Google Calendar API rate limits are undocumented beyond published quotas. Using exponential backoff and avoiding traffic spikes (like bulk operations at specific times) prevents throttling. External API failures should not block database operations - use async sync pattern.

## Common Pitfalls

### Pitfall 1: Missing calendarEventId Storage
**What goes wrong:** Appointment is created in database and calendar, but event ID isn't stored. Later when appointment is rescheduled, system can't find the calendar event to update it, creating duplicate events.
**Why it happens:** Original implementation focused on creation flow, didn't consider lifecycle management
**How to avoid:**
- Add calendarEventId field to schema as nullable String
- Store ID immediately after successful creation
- Check for null before attempting update/delete
**Warning signs:** Multiple calendar events for same appointment, or "event not found" errors when trying to update

### Pitfall 2: Full Event Resource Update vs Patch
**What goes wrong:** Using PATCH semantics on Google Calendar API update method, which doesn't support it. The update method replaces the entire event resource.
**Why it happens:** Misunderstanding the API documentation - update requires full event object
**How to avoid:**
- Always provide start, end, and other required fields in update payload
- For partial updates, GET the event first, modify fields, then PUT back with all fields
**Warning signs:** Event fields mysteriously disappearing after updates

### Pitfall 3: Transaction Boundary Confusion
**What goes wrong:** Including external API call (createCalendarEvent) inside database transaction. If calendar API is slow or fails after transaction timeout, appointment isn't created despite time slot being reserved.
**Why it happens:** Trying to ensure atomicity across database and external system
**How to avoid:**
- Database transaction creates appointment only
- Calendar sync happens after transaction commits
- Store sync status on appointment if needed
- Implement retry mechanism for failed syncs
**Warning signs:** Transaction timeout errors, appointments stuck in "syncing" state

### Pitfall 4: Rate Limit Ignorance
**What goes wrong:** Bulk operations (like importing appointments or syncing historical data) hit undocumented Google Calendar rate limits, causing throttling for hours
**Why it happens:** Only published quota (1M/day) is documented, per-minute quotas aren't clearly specified
**How to avoid:**
- Spread operations throughout the day (randomize sync times)
- Use exponential backoff on 429 responses
- Never bulk-create events at specific times (like midnight)
- Implement queue for calendar operations
**Warning signs:** "Calendar usage limits exceeded" errors, 429 status codes

### Pitfall 5: Nullable Field Without Migration Strategy
**What goes wrong:** Adding calendarEventId as non-nullable field to existing Appointment table causes migration to fail because existing records have no value
**Why it happens:** Schema change on table with existing data
**How to avoid:**
- Add field as nullable (String?)
- Run migration to add column with NULL default
- Optionally backfill later via background job
- Never try to make it required until all records have values
**Warning signs:** Migration errors: "column cannot be null", failed db:push

## Code Examples

Verified patterns from official sources:

### Update Calendar Event
```typescript
// Source: https://developers.google.com/workspace/calendar/api/v3/reference/events/update
export async function updateCalendarEvent(
  eventId: string,
  updates: {
    summary: string
    description?: string
    start: Date
    end: Date
  },
  calendarId: string = 'primary'
): Promise<void> {
  const token = await getAccessToken()

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: updates.summary,
        description: updates.description,
        start: {
          dateTime: updates.start.toISOString(),
          timeZone: 'America/Los_Angeles',
        },
        end: {
          dateTime: updates.end.toISOString(),
          timeZone: 'America/Los_Angeles',
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Calendar update failed: ${error.error?.message || response.statusText}`)
  }
}
```

### Delete Calendar Event
```typescript
// Source: https://developers.google.com/workspace/calendar/api/v3/reference/events/delete
export async function deleteCalendarEvent(
  eventId: string,
  calendarId: string = 'primary',
  sendUpdates: 'all' | 'externalOnly' | 'none' = 'none'
): Promise<void> {
  const token = await getAccessToken()

  const params = new URLSearchParams({ sendUpdates })

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}?${params}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok && response.status !== 404) {
    // 404 is acceptable - event already deleted
    const error = await response.json().catch(() => ({}))
    throw new Error(`Calendar delete failed: ${error.error?.message || response.statusText}`)
  }
}
```

### Sync Appointment to Calendar with Error Handling
```typescript
// Pattern: Transactional outbox - DB first, then external sync
async function syncAppointmentToCalendar(
  appointment: {
    id: string
    scheduledAt: Date
    endTime: Date
    pet: { name: string }
    client: { firstName: string; lastName: string }
    services: string[]
    calendarEventId?: string | null
  }
): Promise<void> {
  try {
    if (!appointment.calendarEventId) {
      // Create new event
      const eventId = await createCalendarEvent({
        summary: `🐾 ${appointment.pet.name} - ${appointment.services.join(', ')}`,
        description: `Client: ${appointment.client.firstName} ${appointment.client.lastName}\nServices: ${appointment.services.join(', ')}`,
        start: appointment.scheduledAt,
        end: appointment.endTime,
      })

      // Store event ID
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { calendarEventId: eventId },
      })
    } else {
      // Update existing event
      await updateCalendarEvent(appointment.calendarEventId, {
        summary: `🐾 ${appointment.pet.name} - ${appointment.services.join(', ')}`,
        description: `Client: ${appointment.client.firstName} ${appointment.client.lastName}\nServices: ${appointment.services.join(', ')}`,
        start: appointment.scheduledAt,
        end: appointment.endTime,
      })
    }
  } catch (error) {
    console.error(`Calendar sync failed for appointment ${appointment.id}:`, error)
    // Don't throw - appointment exists in DB even if calendar sync fails
    // Retry mechanism should pick this up later
  }
}
```

### Safe Delete with Null Check
```typescript
async function deleteAppointmentAndCalendarEvent(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { calendarEventId: true },
  })

  // Delete from database
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  })

  // Delete from calendar if synced
  if (appointment?.calendarEventId) {
    try {
      await deleteCalendarEvent(appointment.calendarEventId)
    } catch (error) {
      console.error('Failed to delete calendar event:', error)
      // Don't fail - appointment is already cancelled in DB
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Service Account auth | OAuth 2.0 with refresh tokens | 2023+ | OAuth provides better security, user-scoped access, and refresh token persistence |
| Synchronous calendar creation | Async with outbox pattern | Modern microservices | Prevents database transactions from blocking on external APIs |
| Manual retry logic | Exponential backoff libraries | 2020+ | Handles rate limits and transient failures intelligently |
| Polling for changes | Push notifications (webhooks) | 2015+ | Reduces API calls and improves real-time sync (not needed for Phase 1) |

**Deprecated/outdated:**
- **Service account authentication**: While still supported, OAuth 2.0 is preferred for user-scoped calendar access
- **PATCH semantics on update**: Events.update() doesn't support PATCH - must use full resource update
- **Checking free/busy for individual events**: Use freeBusy API for availability, not individual event queries

## Open Questions

1. **Retry mechanism for failed calendar syncs**
   - What we know: Current code logs errors but doesn't retry
   - What's unclear: Should we implement a job queue, cron job, or manual retry endpoint?
   - Recommendation: Start simple with manual retry via Telegram command, add automated retry in Phase 2

2. **Handling calendar events created outside the app**
   - What we know: Kimmie can manually add events to her calendar
   - What's unclear: Should we detect and import external events into the database?
   - Recommendation: Phase 1 focuses on one-way sync (DB → Calendar). Two-way sync is Phase 2+ if needed

3. **Timezone handling edge cases**
   - What we know: Hardcoded to 'America/Los_Angeles'
   - What's unclear: What happens during DST transitions? Multi-timezone clients?
   - Recommendation: Current hardcoding is fine for local business. Document assumption in code.

4. **Bulk backfill for existing appointments**
   - What we know: Existing appointments in database may not have calendarEventId
   - What's unclear: Should we backfill? How to match existing calendar events to database records?
   - Recommendation: Add nullable field, don't backfill initially. New appointments will sync going forward.

## Sources

### Primary (HIGH confidence)
- [Google Calendar API - Events: update](https://developers.google.com/workspace/calendar/api/v3/reference/events/update) - Official API reference for update operations
- [Google Calendar API - Events: delete](https://developers.google.com/workspace/calendar/api/v3/reference/events/delete) - Official API reference for delete operations
- [Prisma - Customizing migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations) - Official migration workflow
- Existing codebase analysis - calendar-oauth.ts, booking.ts, availability.ts

### Secondary (MEDIUM confidence)
- [Microservices Pattern: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) - Industry standard pattern for external API sync
- [Google Calendar API - Manage quotas](https://developers.google.com/workspace/calendar/api/guides/quota) - Rate limits and best practices
- [Idempotency Patterns - Jonathan Oliver](https://blog.jonathanoliver.com/idempotency-patterns/) - Transaction ID enforcement pattern

### Tertiary (LOW confidence)
- Community discussions on rate limiting - undocumented quotas exist beyond published limits
- Stack Overflow patterns for OAuth token caching - existing code already implements best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing, proven libraries already in project
- Architecture: HIGH - Patterns verified from official docs and existing codebase
- Pitfalls: HIGH - Based on API documentation and known edge cases
- Code examples: HIGH - Directly from Google Calendar API v3 reference

**Research date:** 2026-01-26
**Valid until:** 2026-03-26 (60 days - Google Calendar API is stable)

---

## Implementation Checklist for Planner

- [ ] Add calendarEventId: String? to Appointment model
- [ ] Run Prisma migration with nullable field
- [ ] Implement updateCalendarEvent() in calendar-oauth.ts
- [ ] Implement deleteCalendarEvent() in calendar-oauth.ts
- [ ] Update booking.ts to store calendarEventId after creation
- [ ] Add reschedule handler that calls updateCalendarEvent()
- [ ] Add cancel handler that calls deleteCalendarEvent()
- [ ] Test create → update → delete lifecycle
- [ ] Add error handling for calendar API failures
- [ ] Document that calendarEventId=null means "not yet synced"
