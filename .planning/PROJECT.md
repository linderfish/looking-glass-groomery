# Cheshire AI Administrative Assistant

## What This Is

Transform the existing Telegram bot for Through the Looking Glass Groomery from a notification receiver into a full AI Administrative Assistant. Kimmie can run her entire grooming business from Telegram - client lookups, revenue tracking, photo reminders, voice commands - replacing the $180/month MoGo software she left behind.

## Core Value

Kimmie can look up any client or pet by name/phone and see everything about them - instantly, accurately, without touching a computer.

## Requirements

### Validated

- [x] Booking state machine processes conversational bookings — existing
- [x] Google Calendar integration creates events on booking — existing
- [x] Telegram notifications alert Kimmie of new bookings — existing
- [x] Website chat widget connects to Cheshire API — existing
- [x] Facebook/Instagram webhooks receive and respond to DMs — existing
- [x] Pet passport stores grooming history and preferences — existing
- [x] Daily digest shows today's appointments — existing

### Active

- [ ] Calendar events update when appointments are rescheduled
- [ ] Client lookup by name or phone shows full profile
- [ ] Pet lookup shows photo, age, spayed, haircut style, spicy meter, notes
- [ ] Visit history shows last 5 appointments with services and notes
- [ ] Voice messages transcribed and understood via Whisper
- [ ] Photo uploads save as Before/After to appointments
- [ ] Daily reminder if no photos posted
- [ ] Web dashboard shows today's schedule at a glance
- [ ] Revenue tracking from Stripe (today, week, month, YTD)
- [ ] Progress toward $8-10K monthly goal visible

### Out of Scope

- AI answering phone calls — Kimmie wants personal touch, human connection
- Auto-posting to social media — Must show preview and get approval first
- Complex AI backgrounds — v2 feature after basics work
- Gmail integration — v2 after core admin features
- Proactive intelligence (empty slot alerts) — v2 after usage patterns established

## Context

**Business Context:**
- Solo groomer in Nuevo, CA serving dogs, cats, goats, pigs, guinea pigs
- Alice in Wonderland / Through the Looking Glass theme
- Left MoGo ($180/month) - needs same functionality for free
- Revenue goal: $8-10K per month
- Takes photos of EVERY groom - forgets to post, not lacks time

**Technical Environment:**
- Monorepo: apps/web (Next.js), apps/cheshire (Bun + Hono), apps/telegram-bot (Grammy)
- Database: PostgreSQL with Prisma
- AI: Claude/OpenAI for chat, FAL.ai for image generation
- Infrastructure: dev-server-v2 via Cloudflare tunnel

**Known Issues:**
- calendarEventId not stored on Appointment - reschedules don't sync to Google Calendar
- Booking creation not wrapped in transaction - potential consistency issues
- File-based logging needed for PM2 + Bun visibility

**User Research (Discovery Interview 2026-01-25):**
- Priority #1: Client/Pet Lookup (like MoGo - search shows everything)
- Priority #2: Photo Posting Reminders (forgets, not lacks time)
- Priority #3: Revenue Dashboard (estimates from calendar now)
- Priority #4: Voice Messages (hands dirty while grooming)
- Dealbreakers: Too complicated, makes mistakes
- Spicy Meter: 1-3 pepper rating for pet behavior (puppy bite → actively trying to eat you)

## Constraints

- **Runtime**: Telegram bot on Grammy + Node.js, Cheshire on Bun + Hono
- **Infrastructure**: Must run on dev-server-v2 (GCP), Cloudflare tunnel for public access
- **Simplicity**: Must be simple enough for Kimmie to use without training
- **Accuracy**: Cannot make mistakes with client info or bookings - trust is critical
- **Cost**: Free to use (replaces $180/month MoGo)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Telegram-first admin interface | Kimmie already uses Telegram, hands dirty while grooming | — Pending |
| Voice via Whisper API | Best transcription quality, OpenAI already integrated | — Pending |
| Spicy Meter (1-3 peppers) | Kimmie's existing mental model for pet behavior | — Pending |
| No auto-post to social | Kimmie wants approval before anything goes public | — Pending |
| v1 = MoGo replacement | Focus on proven value before adding new features | — Pending |

---
*Last updated: 2026-01-25 after initialization*
