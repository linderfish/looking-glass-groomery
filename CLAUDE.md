# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Through the Looking Glass Groomery** - A full-stack pet grooming business platform with an Alice in Wonderland theme. Multi-app monorepo for a pet grooming business in Nuevo, CA featuring AI-powered consultations, whimsical website, and business management tools.

## Commands

```bash
# Development (runs all apps via Turbo)
npm run dev                 # Start web (:3000), cheshire API (:3001), telegram-bot

# Build & Lint
npm run build               # Build all apps
npm run lint                # Lint all apps

# Database (Prisma)
npm run db:generate         # Regenerate Prisma client after schema changes
npm run db:push             # Push schema changes to database
npx prisma studio           # Open Prisma Studio GUI (run from packages/db)

# Individual Apps
cd apps/web && npm run dev            # Next.js only
cd apps/cheshire && npm run dev       # Bun + Hono API only
cd apps/telegram-bot && npm run dev   # Grammy bot only

# Clean
npm run clean               # Remove all node_modules
```

## Architecture

```
looking-glass-groomery/
├── apps/
│   ├── web/              # Next.js 14 (App Router) - customer website
│   ├── cheshire/         # Hono + Bun - AI concierge API
│   └── telegram-bot/     # Grammy - Kimmie's assistant bot
├── packages/
│   ├── ai/               # AI service integrations (fal.ai, Claude, OpenAI)
│   ├── db/               # Prisma schema & client
│   └── shared/           # Zod schemas & constants
```

### Data Flow

1. **Customer Interactions**: Website/Social Media → Cheshire API → AI Services → Response
2. **Booking Flow**: Chat → Intent Detection → Booking Draft → Telegram Notification → Kimmie Approval
3. **Looking Glass**: Pet Photo Upload → Style Description → AI Preview Generation → Blueprint for Kimmie

### Booking State Machine

The conversational booking in `apps/cheshire/src/services/booking.ts` follows this state machine:

```
INITIAL → COLLECTING_PET → COLLECTING_DATE → COLLECTING_SERVICE → CONFIRMING → (create appointment)
                                    ↓
                           COLLECTING_PHONE (if phone missing)
```

Each state collects specific information before advancing. The `handleBookingFlow()` function manages state transitions based on detected intent and extracted data.

### Key Packages

**@looking-glass/ai** - AI orchestration layer:
- `fal.ts` - FAL.ai image generation (pet transformations)
- `llm.ts` - LLM calls via Claude/OpenAI
- `looking-glass/` - Design preview system:
  - `style-parser.ts` - Parse natural language style descriptions
  - `preview-generator.ts` - Generate multi-angle previews (front, left, right, back, top)
  - `blueprint-generator.ts` - Create structured grooming instructions

**@looking-glass/shared** - Type definitions with Zod:
- `BookingRequestSchema`, `BookingDraftSchema` - Appointment booking
- `DesignBlueprintSchema` - Structured grooming instructions per body region
- `TelegramMessageSchema` - Bot notification payloads
- `ChatIntentSchema` - Intent detection categories (BOOKING, PRICING, CONSULTATION, etc.)

**@looking-glass/db** - Prisma models organized by domain:
- Clients & Pets (Client, Pet, PetPassport)
- Designs (GroomingDesign with multi-angle previews)
- Appointments & Booking (Appointment, Service)
- Conversations (Conversation, Message with intent tracking)
- Shelter Angels 501(c)(3) (ShelterPet, Donation)
- Gamification (KimmieAchievement, KimmieStats, DailyMood)

### Tech Stack

| App | Runtime | Framework | Key Libraries |
|-----|---------|-----------|---------------|
| web | Node.js | Next.js 14 | Three.js, GSAP, Framer Motion, Zustand |
| cheshire | Bun | Hono 4.6 | Zod validator, date-fns |
| telegram-bot | Node.js | Grammy | tsx |

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection
- `FAL_AI_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` - AI services
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_KIMMIE_CHAT_ID` - Bot config
- `STRIPE_*` - Payment processing
- `INSTAGRAM_*`, `FACEBOOK_*` - Social media webhooks

## Development Patterns

### Adding Database Fields
1. Modify `packages/db/prisma/schema.prisma`
2. Run `npm run db:generate` then `npm run db:push`
3. Update relevant Zod schemas in `packages/shared/src/types.ts`

### Adding API Endpoints
1. Create route in `apps/cheshire/src/routes/`
2. Use `@hono/zod-validator` for request validation
3. Import shared types from `@looking-glass/shared`

### Working with AI Services
1. All AI calls go through `packages/ai/src/`
2. Image generation: `fal.ts` → FAL.ai
3. LLM calls: `llm.ts` → Claude/OpenAI with fallback
4. Looking Glass previews: Use `generateFullPreview()` or `generateSingleAngle()`

### Path Aliases
- Web app uses `@/*` → `./src/*`
- Packages are imported as `@looking-glass/{ai,db,shared}`

## Key Enums (from Prisma)

- **Species**: DOG, CAT, GOAT, PIG, GUINEA_PIG
- **MembershipTier**: NONE, CURIOUS, CURIOUSER, ROYALTY
- **AppointmentStatus**: PENDING → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED
- **DesignStatus**: DRAFT → PENDING_APPROVAL → APPROVED
- **ConversationChannel**: WEBSITE, INSTAGRAM, FACEBOOK, TELEGRAM, SMS
- **ServiceCategory**: FULL_GROOM, BATH_TIDY, A_LA_CARTE, CREATIVE, SPA, PACKAGE

## Production Deployment

**Infrastructure (on dev-server-v2):**
- Website: `lookingglassgroomery.com` → Cloudflare tunnel → port 3002
- Cheshire API: `cheshire.lookingglassgroomery.com` → port 3001 (also `cheshire-fb.server2.io`)
- Database: PostgreSQL `looking_glass`
- Process manager: PM2 with Bun runtime for Cheshire

**Facebook/Instagram Webhooks:**
- Webhook URL: `https://cheshire.lookingglassgroomery.com/webhook/facebook`
- App ID: 1923940378500045 (Cheshire app)
- Requires `FACEBOOK_PAGE_ACCESS_TOKEN` and `FACEBOOK_VERIFY_TOKEN` in environment

**Google Calendar Integration:**
- OAuth credentials via `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- Calendar events created on booking confirmation via `createCalendarEvent()`
- Availability checked via `canBookSlot()` which queries both Google Calendar and database

## Project Management (BMAD)

This project uses BMAD Method v6 for structured development:
- Config: `bmad/config.yaml`
- Workflow status: `docs/bmm-workflow-status.yaml`
- Sprint status: `docs/sprint-status.yaml`
- Sprint plan: `docs/sprint-plan-looking-glass-*.md`

Run `/workflow-status` to check current development phase.
