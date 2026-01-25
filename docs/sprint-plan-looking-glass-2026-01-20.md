# Sprint Plan: Through the Looking Glass Groomery

**Date:** 2026-01-20
**Scrum Master:** Eric (via BMAD)
**Project Level:** 2 (Medium - 5-15 stories)
**Total Stories:** 13
**Total Points:** 61
**Planned Sprints:** 4 (1-week sprints)
**Target Completion:** 2026-02-17

---

## Executive Summary

This sprint plan covers the remaining development work to fully replace MoGo ($180/month) with a custom booking system, then add Google Business integration for enhanced discoverability.

**Key Metrics:**
- Total Stories: 13
- Total Points: 61
- Sprints: 4 (1-week each)
- Team Capacity: ~15 points per sprint
- MoGo Cancellation Target: After Sprint 3 (Week 3)
- Full Completion: Week 4

---

## Story Inventory

### Phase 3: SMS Reminders (Twilio) - 11 Points

#### STORY-301: Twilio Account Setup and Integration

**Epic:** SMS Reminders
**Priority:** Must Have
**Points:** 3

**User Story:**
As a system administrator
I want Twilio configured and integrated with Cheshire
So that the system can send SMS messages

**Acceptance Criteria:**
- [ ] Twilio account created with phone number provisioned
- [ ] Twilio credentials added to Cheshire environment
- [ ] Basic SMS send function implemented and tested
- [ ] Error handling for failed SMS delivery

**Technical Notes:**
- Use Twilio Node.js SDK
- Store credentials in environment variables
- Add to `apps/cheshire/src/services/sms.ts`

**Dependencies:** None

---

#### STORY-302: Appointment Reminder Service

**Epic:** SMS Reminders
**Priority:** Must Have
**Points:** 5

**User Story:**
As a pet owner with an appointment
I want to receive SMS reminders before my appointment
So that I don't forget and can prepare my pet

**Acceptance Criteria:**
- [ ] 24-hour reminder sent automatically
- [ ] 2-hour reminder sent automatically
- [ ] Reminder includes: date, time, services, address
- [ ] Opt-out link included in SMS
- [ ] Reminders logged to database

**Technical Notes:**
- Create scheduled job (cron or Bun scheduler)
- Query upcoming appointments from database
- Template: "Hi {name}! Reminder: {pet}'s grooming appt tomorrow at {time}. Through the Looking Glass, {address}. Reply STOP to opt out."

**Dependencies:** STORY-301

---

#### STORY-303: SMS Templates and Confirmation Messages

**Epic:** SMS Reminders
**Priority:** Should Have
**Points:** 3

**User Story:**
As a pet owner
I want to receive SMS confirmation when I book
So that I have a record of my appointment

**Acceptance Criteria:**
- [ ] Booking confirmation SMS sent immediately after booking
- [ ] Cancellation confirmation SMS sent
- [ ] Reschedule confirmation SMS sent
- [ ] Templates stored in config (easily editable)

**Technical Notes:**
- Integrate with booking flow in `booking.ts`
- Add SMS templates to shared config
- Include calendar link in confirmation

**Dependencies:** STORY-301, STORY-302

---

### Phase 4: Native Booking Widget - 23 Points

#### STORY-401: Booking Widget UI Components

**Epic:** Native Booking Widget
**Priority:** Must Have
**Points:** 5

**User Story:**
As a website visitor
I want a beautiful booking widget that matches the Wonderland theme
So that I can book appointments directly on the website

**Acceptance Criteria:**
- [ ] Service selection step with pricing displayed
- [ ] Pet information step (name, breed, size)
- [ ] Date/time selection with available slots
- [ ] Contact information collection
- [ ] Booking confirmation display
- [ ] Mobile responsive design
- [ ] Alice in Wonderland themed styling

**Technical Notes:**
- Create in `apps/web/src/components/booking/`
- Use existing Tailwind + Wonderland theme
- Multi-step wizard pattern

**Dependencies:** None

---

#### STORY-402: Booking Widget API Endpoints

**Epic:** Native Booking Widget
**Priority:** Must Have
**Points:** 5

**User Story:**
As a booking widget
I need API endpoints for availability and booking
So that users can complete their booking flow

**Acceptance Criteria:**
- [ ] GET /api/booking/services - List available services
- [ ] GET /api/booking/availability?date=X - Get available slots
- [ ] POST /api/booking/create - Create new booking
- [ ] Input validation with Zod schemas
- [ ] Rate limiting to prevent abuse
- [ ] CORS configured for website origin

**Technical Notes:**
- Add routes to `apps/cheshire/src/routes/`
- Reuse existing availability logic from Cheshire
- Connect to existing database schema

**Dependencies:** None

---

#### STORY-403: Availability Calendar Component

**Epic:** Native Booking Widget
**Priority:** Must Have
**Points:** 5

**User Story:**
As a customer booking online
I want to see available dates and times clearly
So that I can choose a convenient slot

**Acceptance Criteria:**
- [ ] Calendar view showing available dates (green/gray indicators)
- [ ] Time slot selection for chosen date
- [ ] Real-time availability (no double-booking)
- [ ] Timezone handling
- [ ] Loading states while fetching availability

**Technical Notes:**
- Use date-fns for date manipulation
- Integrate with canBookSlot() availability logic
- Consider using @tanstack/react-query for caching

**Dependencies:** STORY-402

---

#### STORY-404: Widget Integration and Calendly Replacement

**Epic:** Native Booking Widget
**Priority:** Must Have
**Points:** 5

**User Story:**
As the business owner
I want the native widget to replace Calendly on the website
So that all bookings go through our system

**Acceptance Criteria:**
- [ ] Widget embedded on /wonderland/contact page
- [ ] Old Calendly embed removed
- [ ] Booking creates entry in database
- [ ] Booking triggers Telegram notification to Kimmie
- [ ] Booking creates Google Calendar event
- [ ] Success page with booking confirmation

**Technical Notes:**
- Update `apps/web/src/app/wonderland/contact/page.tsx`
- Remove `CALENDLY_URL` constant
- Ensure full integration with existing Cheshire booking flow

**Dependencies:** STORY-401, STORY-402, STORY-403

---

#### STORY-405: Booking Widget Testing and Polish

**Epic:** Native Booking Widget
**Priority:** Should Have
**Points:** 3

**User Story:**
As a developer
I want the booking widget thoroughly tested
So that customers have a smooth booking experience

**Acceptance Criteria:**
- [ ] Unit tests for all booking components
- [ ] Integration tests for booking flow
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile device testing
- [ ] Error state handling (network errors, server errors)
- [ ] Loading state animations

**Technical Notes:**
- Use Vitest for unit tests
- Use Playwright for integration tests
- Test edge cases: fully booked days, last-minute bookings

**Dependencies:** STORY-404

---

### Phase 5: Stripe Deposits - 11 Points

#### STORY-501: Stripe Account Setup and Integration

**Epic:** Stripe Deposits
**Priority:** Must Have
**Points:** 3

**User Story:**
As a system administrator
I want Stripe configured and integrated
So that we can collect deposits securely

**Acceptance Criteria:**
- [ ] Stripe account configured (or use existing)
- [ ] Stripe API keys added to environment
- [ ] Stripe SDK installed and configured
- [ ] Test mode working with test cards

**Technical Notes:**
- Schema already has Stripe fields (stripePaymentIntentId, etc.)
- Use Stripe Node.js SDK
- Add to `apps/cheshire/src/services/stripe.ts`

**Dependencies:** None

---

#### STORY-502: Deposit Collection Flow

**Epic:** Stripe Deposits
**Priority:** Must Have
**Points:** 5

**User Story:**
As a customer booking a grooming appointment
I want to pay a deposit to secure my booking
So that the groomer knows I'm committed

**Acceptance Criteria:**
- [ ] Deposit amount shown during booking ($25 default)
- [ ] Stripe Payment Element integrated in booking widget
- [ ] Payment intent created on booking start
- [ ] Payment confirmed before booking finalized
- [ ] Booking marked as "deposit paid" in database
- [ ] Failed payments handled gracefully

**Technical Notes:**
- Use Stripe Payment Element (latest recommended approach)
- Create PaymentIntent on server, confirm on client
- Handle 3D Secure authentication if required

**Dependencies:** STORY-501, STORY-404

---

#### STORY-503: Payment Receipts and Refunds

**Epic:** Stripe Deposits
**Priority:** Should Have
**Points:** 3

**User Story:**
As a customer who paid a deposit
I want to receive a receipt and understand the refund policy
So that I have documentation of my payment

**Acceptance Criteria:**
- [ ] Email receipt sent via Stripe (automatic)
- [ ] Receipt info included in booking confirmation SMS
- [ ] Refund endpoint for cancellations (admin only)
- [ ] Deposit applied to final bill (manual by Kimmie)

**Technical Notes:**
- Stripe handles email receipts automatically
- Add refund function for admin use
- Document refund policy in confirmation

**Dependencies:** STORY-502

---

### Phase 6: Reserve with Google - 16 Points

#### STORY-601: Google Business Profile API Setup

**Epic:** Reserve with Google
**Priority:** Must Have
**Points:** 5

**User Story:**
As a business
I want to connect to Google's business APIs
So that we can enable Reserve with Google

**Acceptance Criteria:**
- [ ] Google Cloud project configured
- [ ] Business Profile API enabled
- [ ] OAuth credentials for API access
- [ ] Verify business ownership programmatically

**Technical Notes:**
- Requires verified Google Business Profile (Kimmie prerequisite)
- Use Google Business Profile API
- Store credentials securely

**Dependencies:** Kimmie must set up Google Business Profile first

---

#### STORY-602: Reserve with Google API Endpoints

**Epic:** Reserve with Google
**Priority:** Must Have
**Points:** 5

**User Story:**
As a potential customer on Google Search/Maps
I want to see a "Book" button and reserve directly
So that I can book without leaving Google

**Acceptance Criteria:**
- [ ] Availability feed endpoint for Google
- [ ] Booking creation endpoint per Google spec
- [ ] Booking update/cancel endpoints
- [ ] Proper error responses per Google requirements

**Technical Notes:**
- Follow Reserve with Google technical requirements
- Real-time availability sync
- Handle Google's booking notifications

**Dependencies:** STORY-601, STORY-404

---

#### STORY-603: Booking Sync Between Systems

**Epic:** Reserve with Google
**Priority:** Must Have
**Points:** 3

**User Story:**
As a business owner
I want bookings from Google to appear in our system
So that I have one source of truth for appointments

**Acceptance Criteria:**
- [ ] Google bookings create entries in database
- [ ] Google bookings trigger Telegram notification
- [ ] Google bookings create Google Calendar event
- [ ] No double-booking between sources

**Technical Notes:**
- Reuse existing booking creation logic
- Ensure availability check includes Google bookings
- Mark booking source as "GOOGLE" in database

**Dependencies:** STORY-602

---

#### STORY-604: Reserve with Google Testing and Certification

**Epic:** Reserve with Google
**Priority:** Must Have
**Points:** 3

**User Story:**
As a business
I want to pass Google's certification requirements
So that Reserve with Google goes live

**Acceptance Criteria:**
- [ ] Pass Google's technical review
- [ ] Handle all test scenarios from Google
- [ ] Proper error handling for edge cases
- [ ] Documentation for maintenance

**Technical Notes:**
- Google provides test suite
- May require multiple iterations
- Timeline depends on Google review queue

**Dependencies:** STORY-603

---

## Sprint Allocation

### Sprint 1 (Week 1) - 16/15 points

**Goal:** Complete SMS reminders and start booking widget

**Stories:**
| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| STORY-301 | Twilio Setup | 3 | Must Have |
| STORY-302 | Reminder Service | 5 | Must Have |
| STORY-303 | SMS Templates | 3 | Should Have |
| STORY-401 | Widget UI Components | 5 | Must Have |

**Total:** 16 points (slight stretch)

**Deliverable:** SMS reminders fully functional

---

### Sprint 2 (Week 2) - 15/15 points

**Goal:** Complete native booking widget

**Stories:**
| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| STORY-402 | Booking API Endpoints | 5 | Must Have |
| STORY-403 | Availability Calendar | 5 | Must Have |
| STORY-404 | Widget Integration | 5 | Must Have |

**Total:** 15 points

**Deliverable:** Native booking widget replaces Calendly

---

### Sprint 3 (Week 3) - 14/15 points

**Goal:** Add Stripe deposits + MoGo cancellation

**Stories:**
| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| STORY-405 | Widget Testing | 3 | Should Have |
| STORY-501 | Stripe Setup | 3 | Must Have |
| STORY-502 | Deposit Flow | 5 | Must Have |
| STORY-503 | Receipts/Refunds | 3 | Should Have |

**Total:** 14 points

**Deliverable:** Deposits functional → **CANCEL MOGO**

---

### Sprint 4 (Week 4+) - 16/15 points

**Goal:** Reserve with Google integration

**Stories:**
| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| STORY-601 | GBP API Setup | 5 | Must Have |
| STORY-602 | RwG Endpoints | 5 | Must Have |
| STORY-603 | Booking Sync | 3 | Must Have |
| STORY-604 | Testing/Cert | 3 | Must Have |

**Total:** 16 points (may extend to 2 weeks due to Google review)

**Deliverable:** Reserve with Google live

---

## Epic Traceability

| Epic | Stories | Total Points | Sprint |
|------|---------|--------------|--------|
| SMS Reminders | STORY-301, 302, 303 | 11 | Sprint 1 |
| Native Booking Widget | STORY-401, 402, 403, 404, 405 | 23 | Sprint 1-3 |
| Stripe Deposits | STORY-501, 502, 503 | 11 | Sprint 3 |
| Reserve with Google | STORY-601, 602, 603, 604 | 16 | Sprint 4 |

---

## Risks and Mitigation

**High:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Google RwG certification delays | Sprint 4 extends | Start GBP setup early (Kimmie action) |
| Stripe integration complexity | Delay deposits | Use existing schema, Stripe's hosted UI |

**Medium:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Availability sync bugs | Double bookings | Extensive testing, parallel run with MoGo |
| SMS delivery failures | Missed reminders | Use Twilio delivery webhooks, logging |

**Low:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Theme consistency | Poor UX | Reuse existing Wonderland components |

---

## External Dependencies

| Dependency | Owner | Status | Required By |
|------------|-------|--------|-------------|
| Twilio account | Eric/Kimmie | Not started | Sprint 1 |
| Stripe account | Kimmie | Existing? | Sprint 3 |
| Google Business Profile | Kimmie | Not started | Sprint 4 |
| GBP domain verification | Kimmie | Not started | Sprint 4 |

---

## Definition of Done

For a story to be considered complete:
- [ ] Code implemented and committed
- [ ] Unit tests passing
- [ ] Integration tested manually
- [ ] Code reviewed (self-review for solo dev)
- [ ] Deployed to production
- [ ] Acceptance criteria validated

---

## MoGo Cancellation Checkpoint

**After Sprint 3, verify:**
- [ ] SMS reminders working (sent and received)
- [ ] Native booking widget live on website
- [ ] Deposits collected successfully
- [ ] Telegram notifications working
- [ ] Google Calendar events created
- [ ] No critical bugs in 1 week parallel operation

**If all pass:** Cancel MoGo subscription → save $180/month

---

## Success Metrics

**Sprint 1:**
- SMS reminders sent for test appointments
- Widget UI components render correctly

**Sprint 2:**
- 3+ bookings through native widget
- No double-bookings

**Sprint 3:**
- Deposit collected successfully
- MoGo cancelled

**Sprint 4:**
- Reserve with Google button visible in search
- 1+ booking through Google

---

## Next Steps

**Immediate:** Begin Sprint 1

Run `/dev-story STORY-301` to start implementing Twilio setup.

Or work through stories in sequence:
1. STORY-301 → STORY-302 → STORY-303 (SMS complete)
2. STORY-401 → STORY-402 → STORY-403 → STORY-404 (Widget complete)

---

**This plan was created using BMAD Method v6 - Phase 4 (Implementation Planning)**
