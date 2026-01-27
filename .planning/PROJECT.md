# Cheshire AI Administrative Assistant

## What This Is

A full AI Administrative Assistant for Through the Looking Glass Groomery. Kimmie runs her entire solo grooming business from Telegram — client lookups, voice commands, photo tracking, revenue visibility — replacing the $180/month MoGo software she left behind.

## Core Value

Kimmie can look up any client or pet by name/phone and see everything about them — instantly, accurately, without touching a computer.

## Current State (v1 Shipped)

**Shipped:** 2026-01-27
**Codebase:** 19,012 LOC TypeScript (Next.js, Bun/Hono, Grammy)
**Status:** Production-ready pending environment configuration

**What Works:**
- Client/pet lookup via Telegram (name, phone, natural language)
- Spicy meter (1-3 peppers) and visit history display
- Voice commands via Whisper transcription
- Photo uploads with Before/After and streak tracking
- Revenue dashboard with Stripe integration
- Web dashboard at /dashboard/today and /dashboard/revenue

**Configuration Required:**
- `OPENAI_API_KEY` — Voice transcription
- `AWS_*` credentials — Photo uploads to S3
- `DASHBOARD_PASSWORD` — Web dashboard access

## Requirements

### Validated

- [x] Booking state machine processes conversational bookings — existing
- [x] Google Calendar integration creates events on booking — existing
- [x] Telegram notifications alert Kimmie of new bookings — existing
- [x] Website chat widget connects to Cheshire API — existing
- [x] Facebook/Instagram webhooks receive and respond to DMs — existing
- [x] Pet passport stores grooming history and preferences — existing
- [x] Daily digest shows today's appointments — existing
- [x] Calendar events update when appointments are rescheduled — v1
- [x] Client lookup by name or phone shows full profile — v1
- [x] Pet lookup shows photo, age, spayed, haircut style, spicy meter, notes — v1
- [x] Visit history shows last 5 appointments with services and notes — v1
- [x] Voice messages transcribed and understood via Whisper — v1 (pending API key)
- [x] Photo uploads save as Before/After to appointments — v1
- [x] Daily reminder if no photos posted — v1
- [x] Web dashboard shows today's schedule at a glance — v1
- [x] Revenue tracking from Stripe (today, week, month, YTD) — v1
- [x] Progress toward $8-10K monthly goal visible — v1

### Active

(None — v1 complete. Next milestone requirements TBD.)

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
- Left MoGo ($180/month) — replaced with free Cheshire v1
- Revenue goal: $8-10K per month
- Takes photos of EVERY groom — forgets to post, not lacks time

**Technical Environment:**
- Monorepo: apps/web (Next.js), apps/cheshire (Bun + Hono), apps/telegram-bot (Grammy)
- Database: PostgreSQL with Prisma
- AI: Claude/OpenAI for chat, Whisper for voice, FAL.ai for image generation
- Infrastructure: dev-server-v2 via Cloudflare tunnel

**v1 Technical Additions:**
- libphonenumber-js for phone normalization
- pg_trgm extension for fuzzy name search
- @grammyjs/files for Telegram file handling
- Stripe SDK for revenue queries
- express-basic-auth for dashboard protection
- AWS S3 SDK for photo storage

**Resolved Issues (v1):**
- ✓ calendarEventId now stored on Appointment — reschedules sync correctly
- ✓ Calendar operations are graceful — failures don't break bookings

**Remaining Issues:**
- Booking creation not wrapped in transaction — addressed via graceful error handling
- File-based logging needed for PM2 + Bun visibility

## Constraints

- **Runtime**: Telegram bot on Grammy + Node.js, Cheshire on Bun + Hono
- **Infrastructure**: Must run on dev-server-v2 (GCP), Cloudflare tunnel for public access
- **Simplicity**: Must be simple enough for Kimmie to use without training
- **Accuracy**: Cannot make mistakes with client info or bookings — trust is critical
- **Cost**: Free to use (replaces $180/month MoGo)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Telegram-first admin interface | Kimmie already uses Telegram, hands dirty while grooming | ✓ Works well — voice + text both functional |
| Voice via Whisper API | Best transcription quality, OpenAI already integrated | ✓ Good — needs API key config |
| Spicy Meter (1-3 peppers) | Kimmie's existing mental model for pet behavior | ✓ Good — maps ANXIOUS/FEARFUL/AGGRESSIVE |
| No auto-post to social | Kimmie wants approval before anything goes public | ✓ Validated — deferred to v2 |
| v1 = MoGo replacement | Focus on proven value before adding new features | ✓ Shipped — all core features work |
| libphonenumber-js for phones | E.164 normalization handles any format | ✓ Good — (555) 123-4567, 555.123.4567 all work |
| pg_trgm for fuzzy search | PostgreSQL native, no external service | ✓ Good — fast fuzzy name matching |
| Express for dashboard | Integrate with existing webhook server | ✓ Good — single port handles both |
| Photo URLs in Map cache | Simple ephemeral storage between upload and callback | ✓ Good — no database overhead |
| Priority-based appointment detection | IN_PROGRESS > CHECKED_IN > CONFIRMED > COMPLETED | ✓ Good — photos attach to current groom |

---
*Last updated: 2026-01-27 after v1 milestone*
