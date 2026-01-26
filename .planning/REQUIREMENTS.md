# Requirements: Cheshire AI Administrative Assistant

**Defined:** 2026-01-25
**Core Value:** Kimmie can look up any client or pet by name/phone and see everything about them - instantly, accurately, without touching a computer.

## v1 Requirements

Requirements for MoGo replacement milestone. Each maps to roadmap phases.

### Calendar Sync

- [ ] **CAL-01**: Calendar event ID stored when appointment created
- [ ] **CAL-02**: Calendar event updated when appointment rescheduled
- [ ] **CAL-03**: Calendar event deleted when appointment cancelled

### Client/Pet Lookup

- [ ] **LOOKUP-01**: Search clients by name returns matching profiles
- [ ] **LOOKUP-02**: Search clients by phone returns matching profiles
- [ ] **LOOKUP-03**: Client profile shows all pets with summary
- [ ] **LOOKUP-04**: Pet profile shows photo, age, breed, spayed status
- [ ] **LOOKUP-05**: Pet profile shows spicy meter (1-3 peppers)
- [ ] **LOOKUP-06**: Pet profile shows grooming preferences and allergies
- [ ] **LOOKUP-07**: Visit history shows last 5 appointments with services
- [ ] **LOOKUP-08**: Natural language queries work ("who's the lady with the corgi")

### Voice Commands

- [ ] **VOICE-01**: Voice messages transcribed via Whisper API
- [ ] **VOICE-02**: Transcribed text processed through Cheshire brain
- [ ] **VOICE-03**: Response sent back as text message

### Photo Reminders

- [ ] **PHOTO-01**: Photos uploaded via Telegram saved to appointment
- [ ] **PHOTO-02**: Before/After photo type selection works
- [ ] **PHOTO-03**: End-of-day reminder if no photos posted
- [ ] **PHOTO-04**: Photo streak tracking displayed

### Dashboard

- [ ] **DASH-01**: Today's schedule visible at a glance
- [ ] **DASH-02**: Quick client search from dashboard
- [ ] **DASH-03**: Morning briefing sent via Telegram

### Revenue

- [ ] **REV-01**: Today's revenue from Stripe displayed
- [ ] **REV-02**: Week's revenue calculated and displayed
- [ ] **REV-03**: Month's revenue with progress toward $8-10K goal
- [ ] **REV-04**: YTD revenue available

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Social Posting

- **SOCIAL-01**: Photo posted to Instagram with AI-generated caption
- **SOCIAL-02**: Photo posted to Facebook with AI-generated caption
- **SOCIAL-03**: Preview shown before posting for approval
- **SOCIAL-04**: Wonderland-themed AI backgrounds available

### Proactive Intelligence

- **PROACT-01**: Alert for empty slots tomorrow
- **PROACT-02**: Follow-up suggestions for inactive clients (60+ days)
- **PROACT-03**: Celebration messages for achievements
- **PROACT-04**: Photo streak risk warnings

### Productivity Integrations

- **PROD-01**: Gmail inbox accessible via Telegram
- **PROD-02**: Email replies drafted and sent via Telegram
- **PROD-03**: Weather in morning briefing

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI answering phone calls | Kimmie wants personal touch, human connection |
| Auto-posting without approval | Must show preview first, trust is critical |
| Complex AI backgrounds for photos | v2 after basics work |
| Web-based admin dashboard | Telegram-first, web dashboard is simple view only |
| Client-facing mobile app | Web and Telegram sufficient for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAL-01 | Phase 1 | Pending |
| CAL-02 | Phase 1 | Pending |
| CAL-03 | Phase 1 | Pending |
| LOOKUP-01 | Phase 2 | Pending |
| LOOKUP-02 | Phase 2 | Pending |
| LOOKUP-03 | Phase 2 | Pending |
| LOOKUP-04 | Phase 2 | Pending |
| LOOKUP-05 | Phase 2 | Pending |
| LOOKUP-06 | Phase 2 | Pending |
| LOOKUP-07 | Phase 2 | Pending |
| LOOKUP-08 | Phase 2 | Pending |
| VOICE-01 | Phase 3 | Pending |
| VOICE-02 | Phase 3 | Pending |
| VOICE-03 | Phase 3 | Pending |
| PHOTO-01 | Phase 4 | Pending |
| PHOTO-02 | Phase 4 | Pending |
| PHOTO-03 | Phase 4 | Pending |
| PHOTO-04 | Phase 4 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| REV-01 | Phase 5 | Pending |
| REV-02 | Phase 5 | Pending |
| REV-03 | Phase 5 | Pending |
| REV-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-01-25*
*Last updated: 2026-01-25 after initial definition*
