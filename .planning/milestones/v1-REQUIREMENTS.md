# Requirements Archive: v1 MoGo Replacement

**Archived:** 2026-01-27
**Status:** SHIPPED

This is the archived requirements specification for v1.
For current requirements, see `.planning/PROJECT.md` (Validated section).

---

# Requirements: Cheshire AI Administrative Assistant

**Defined:** 2026-01-25
**Core Value:** Kimmie can look up any client or pet by name/phone and see everything about them - instantly, accurately, without touching a computer.

## v1 Requirements

Requirements for MoGo replacement milestone. Each maps to roadmap phases.

### Calendar Sync

- [x] **CAL-01**: Calendar event ID stored when appointment created
- [x] **CAL-02**: Calendar event updated when appointment rescheduled
- [x] **CAL-03**: Calendar event deleted when appointment cancelled

### Client/Pet Lookup

- [x] **LOOKUP-01**: Search clients by name returns matching profiles
- [x] **LOOKUP-02**: Search clients by phone returns matching profiles
- [x] **LOOKUP-03**: Client profile shows all pets with summary
- [x] **LOOKUP-04**: Pet profile shows photo, age, breed, spayed status
- [x] **LOOKUP-05**: Pet profile shows spicy meter (1-3 peppers)
- [x] **LOOKUP-06**: Pet profile shows grooming preferences and allergies
- [x] **LOOKUP-07**: Visit history shows last 5 appointments with services
- [x] **LOOKUP-08**: Natural language queries work ("who's the lady with the corgi")

### Voice Commands

- [x] **VOICE-01**: Voice messages transcribed via Whisper API
- [x] **VOICE-02**: Transcribed text processed through Cheshire brain
- [x] **VOICE-03**: Response sent back as text message

### Photo Reminders

- [x] **PHOTO-01**: Photos uploaded via Telegram saved to appointment
- [x] **PHOTO-02**: Before/After photo type selection works
- [x] **PHOTO-03**: End-of-day reminder if no photos posted
- [x] **PHOTO-04**: Photo streak tracking displayed

### Dashboard

- [x] **DASH-01**: Today's schedule visible at a glance
- [x] **DASH-02**: Quick client search from dashboard
- [x] **DASH-03**: Morning briefing sent via Telegram

### Revenue

- [x] **REV-01**: Today's revenue from Stripe displayed
- [x] **REV-02**: Week's revenue calculated and displayed
- [x] **REV-03**: Month's revenue with progress toward $8-10K goal
- [x] **REV-04**: YTD revenue available

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAL-01 | Phase 1 | Complete |
| CAL-02 | Phase 1 | Complete |
| CAL-03 | Phase 1 | Complete |
| LOOKUP-01 | Phase 2 | Complete |
| LOOKUP-02 | Phase 2 | Complete |
| LOOKUP-03 | Phase 2 | Complete |
| LOOKUP-04 | Phase 2 | Complete |
| LOOKUP-05 | Phase 2 | Complete |
| LOOKUP-06 | Phase 2 | Complete |
| LOOKUP-07 | Phase 2 | Complete |
| LOOKUP-08 | Phase 2 | Complete |
| VOICE-01 | Phase 3 | Complete |
| VOICE-02 | Phase 3 | Complete |
| VOICE-03 | Phase 3 | Complete |
| PHOTO-01 | Phase 4 | Complete |
| PHOTO-02 | Phase 4 | Complete |
| PHOTO-03 | Phase 4 | Complete |
| PHOTO-04 | Phase 4 | Complete |
| DASH-01 | Phase 4 | Complete |
| DASH-02 | Phase 4 | Complete |
| DASH-03 | Phase 4 | Complete |
| REV-01 | Phase 5 | Complete |
| REV-02 | Phase 5 | Complete |
| REV-03 | Phase 5 | Complete |
| REV-04 | Phase 5 | Complete |

---

## Milestone Summary

**Shipped:** 25 of 25 v1 requirements
**Adjusted:** VOICE-01 requires OPENAI_API_KEY configuration (code complete)
**Dropped:** None

---
*Archived: 2026-01-27 as part of v1 milestone completion*
