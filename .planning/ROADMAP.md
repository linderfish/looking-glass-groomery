# Roadmap: Cheshire AI Administrative Assistant

## Overview

Transform the existing Telegram bot from a notification receiver into a full AI administrative assistant that replaces MoGo ($180/month). Five phases build progressively: fix calendar sync to establish data foundation, add client/pet lookup as core value, enable voice commands for hands-dirty grooming, add photo tracking and dashboard for daily operations, and complete with revenue visibility for business health. Each phase delivers working functionality Kimmie can use immediately.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Calendar Sync** - Fix calendar event lifecycle for accurate scheduling
- [x] **Phase 2: Client/Pet Lookup** - Core value: search anything, see everything
- [x] **Phase 3: Voice Commands** - Hands-free queries while grooming
- [x] **Phase 4: Photo Reminders + Dashboard** - Daily operations tracking
- [ ] **Phase 5: Revenue Dashboard** - Business health visibility

## Phase Details

### Phase 1: Calendar Sync
**Goal**: Kimmie's Google Calendar stays perfectly in sync with appointments - creates, updates, deletes all work correctly
**Depends on**: Nothing (first phase)
**Requirements**: CAL-01, CAL-02, CAL-03
**Success Criteria** (what must be TRUE):
  1. When a booking is confirmed, Kimmie sees the appointment appear in Google Calendar within seconds
  2. When Kimmie reschedules an appointment, the Google Calendar event moves to the new time
  3. When an appointment is cancelled, the Google Calendar event disappears
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md - Add calendarEventId field and Calendar API update/delete methods
- [x] 01-02-PLAN.md - Wire calendar sync on creation, add reschedule/cancel handlers

### Phase 2: Client/Pet Lookup
**Goal**: Kimmie can look up any client or pet and see their complete profile instantly from Telegram
**Depends on**: Phase 1
**Requirements**: LOOKUP-01, LOOKUP-02, LOOKUP-03, LOOKUP-04, LOOKUP-05, LOOKUP-06, LOOKUP-07, LOOKUP-08
**Success Criteria** (what must be TRUE):
  1. Kimmie types a client name in Telegram and sees matching client profiles with all their pets
  2. Kimmie types a phone number and sees the matching client profile
  3. Kimmie taps on a pet name and sees photo, age, breed, spayed status, spicy meter, preferences, and allergies
  4. Kimmie asks for visit history and sees the last 5 appointments with services performed
  5. Kimmie asks natural language questions ("who's the lady with the corgi") and gets accurate results
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md - Core search infrastructure (search service, phone normalization, /lookup command)
- [x] 02-02-PLAN.md - Pet profile display with spicy meter, demographics, and passport details
- [x] 02-03-PLAN.md - Visit history and natural language query support

### Phase 3: Voice Commands
**Goal**: Kimmie can speak queries into Telegram while her hands are dirty and get text responses
**Depends on**: Phase 2
**Requirements**: VOICE-01, VOICE-02, VOICE-03
**Success Criteria** (what must be TRUE):
  1. Kimmie sends a voice message and it gets transcribed accurately
  2. The transcribed text is understood by Cheshire (lookups, questions all work)
  3. Kimmie receives a text response she can glance at while grooming
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md - Voice infrastructure and natural language extraction
- [x] 03-02-PLAN.md - Voice handler with transcription and query processing

### Phase 4: Photo Reminders + Dashboard
**Goal**: Kimmie never forgets to post groom photos and has a quick view of today's schedule
**Depends on**: Phase 3
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-03, PHOTO-04, DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. Kimmie sends a photo to Telegram and it saves to the current appointment
  2. Kimmie can mark photos as Before or After
  3. At end of day, Kimmie gets a reminder if no photos were posted that day
  4. Kimmie can see her photo streak (consecutive days with photos)
  5. Kimmie can view today's schedule at a glance from Telegram or a simple web page
  6. Morning briefing arrives via Telegram with today's appointments
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md - Photo upload to S3 with Before/After selection and streak update
- [x] 04-02-PLAN.md - Photo streak tracking and end-of-day reminders
- [x] 04-03-PLAN.md - Web dashboard with schedule view and client search

**Note on dashboard requirements:**
- DASH-01 (/today command): Already exists in bookings.ts
- DASH-03 (morning briefing at 8:40am): Already exists via sendDailyDigest() in scheduler.ts
- DASH-02 (web dashboard with client search): New in 04-03-PLAN.md

### Phase 5: Revenue Dashboard
**Goal**: Kimmie can see her business revenue and progress toward monthly goals without checking Stripe directly
**Depends on**: Phase 4
**Requirements**: REV-01, REV-02, REV-03, REV-04
**Success Criteria** (what must be TRUE):
  1. Kimmie asks "how much did I make today" and sees today's revenue from Stripe
  2. Kimmie asks for weekly revenue and sees accurate week-to-date numbers
  3. Kimmie sees monthly revenue with visual progress toward $8-10K goal
  4. Kimmie can check YTD revenue to understand annual business health
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md - Stripe service + revenue formatting (core infrastructure)
- [ ] 05-02-PLAN.md - Natural language + voice handler integration (Telegram queries)
- [ ] 05-03-PLAN.md - Dashboard revenue route (web visibility)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Calendar Sync | 2/2 | Complete | 2026-01-26 |
| 2. Client/Pet Lookup | 3/3 | Complete | 2026-01-26 |
| 3. Voice Commands | 2/2 | Complete | 2026-01-26 |
| 4. Photo Reminders + Dashboard | 3/3 | Complete | 2026-01-27 |
| 5. Revenue Dashboard | 0/3 | Not started | - |

---
*Roadmap created: 2026-01-25*
*Last updated: 2026-01-27*
