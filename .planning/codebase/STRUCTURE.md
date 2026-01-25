# Codebase Structure

**Analysis Date:** 2026-01-25

## Directory Layout

```
looking-glass-groomery/
├── apps/
│   ├── cheshire/           # Hono + Bun - AI concierge API (port 3001)
│   ├── web/                # Next.js 14 - Customer website (port 3000)
│   └── telegram-bot/       # Grammy - Admin notifications & scheduler (port 3005)
├── packages/
│   ├── ai/                 # AI service integrations (Claude, OpenAI, FAL.ai)
│   ├── db/                 # Prisma schema, PostgreSQL client
│   └── shared/             # Zod schemas, TypeScript types, constants
├── docs/                   # Sprint plans, workflow status, stories
├── bmad/                   # BMAD method configuration (project management)
├── .planning/              # GSD orchestrator planning documents
├── .env                    # Environment variables (not committed)
├── package.json            # Monorepo root with Turbo configuration
└── turbo.json              # Turbo build orchestration
```

## Directory Purposes

**apps/**
- Purpose: Three independent applications in Turbo workspace
- Contains: Next.js frontend, Hono API, Grammy Telegram bot
- Key files: Each has its own package.json, tsconfig.json, src/ directory

**apps/cheshire/**
- Purpose: AI concierge API - receives messages, detects intent, orchestrates responses
- Contains: Routes (chat, webhook, oauth), Services (booking, conversation, intent), Utils, Personality adapters
- Key files:
  - `src/index.ts` - Hono server entry point
  - `src/routes/chat.ts` - Chat endpoint with intent routing
  - `src/routes/webhook.ts` - Social media webhooks (Facebook, Instagram, Telegram)
  - `src/services/booking.ts` - Booking state machine logic
  - `src/services/conversation.ts` - Conversation management and message history
  - `src/services/intent.ts` - Intent detection with pattern matching + LLM

**apps/cheshire/src/routes/**
- `health.ts` - Health check endpoints
- `chat.ts` - POST /chat (message + sessionId) → response
- `webhook.ts` - POST /webhook/facebook, /webhook/instagram for social media DMs
- `oauth.ts` - Google Calendar OAuth callback handling
- `waiver.ts` - Digital waiver signing flow

**apps/cheshire/src/services/**
- `booking.ts` (25KB) - Largest service, manages booking state machine, service lookup, slot availability, appointment creation
- `intent.ts` - Pattern matching + LLM for intent detection
- `conversation.ts` - Conversation CRUD, message history, escalation
- `calendar.ts` - Google Calendar event creation and availability checking
- `availability.ts` - Slot availability logic with calendar integration
- `response.ts` - Response generation (FAQ lookup or LLM call)
- `notifications.ts` - Telegram notifications to Kimmie
- `escalation.ts` - Handoff to human (mark as HANDED_OFF, notify Kimmie)
- `calendar-oauth.ts` - Google OAuth token refresh and management

**apps/web/**
- Purpose: Next.js 14 customer website with Wonderland Alice theme
- Contains: App Router pages, React components, Tailwind styles, Zustand stores
- Key files:
  - `src/app/layout.tsx` - Root layout with fonts (Playfair, Inter, Pacifico)
  - `src/app/page.tsx` - Landing page
  - `src/app/wonderland/` - Feature pages (gallery, services, consultation)
  - `src/app/api/chat/route.ts` - Proxy to Cheshire API (fallback responses if offline)
  - `src/components/layout/CheshireChat.tsx` - Chat widget component
  - `src/components/effects/` - Background animations, Three.js effects

**apps/web/src/components/**
- `layout/` - Navigation, footer, chat widget, layout shells
- `entry/` - Immersive entry experience (RabbitHole, EatMeCookie)
- `effects/` - GSAP animations, Three.js backgrounds, AI-generated backgrounds
- `gallery/` - Portfolio gallery components
- `ui/` - Base UI components (buttons, cards, modals)
- `schema/` - SEO schema components (LocalBusinessSchema, FAQSchema)

**apps/telegram-bot/**
- Purpose: Grammy bot for Kimmie's admin interface and notifications
- Contains: Command handlers, message handlers, services, scheduled tasks
- Key files:
  - `src/index.ts` - Grammy bot setup with handler registration
  - `src/handlers/` - Help, bookings, reminders, achievements commands
  - `src/services/` - Business logic (kimmie-persona, achievements, stats, daily-digest, scheduler)

**packages/ai/**
- Purpose: AI orchestration and design preview generation
- Location: `packages/ai/src/`
- Contains:
  - `llm.ts` - Anthropic and OpenAI wrappers with provider fallback
  - `fal.ts` - FAL.ai image generation for pet photo transformations
  - `looking-glass/` - Design preview system:
    - `style-parser.ts` - Parse natural language style descriptions → DesignBlueprint
    - `preview-generator.ts` - Generate multi-angle previews (front, left, right, back, top)
    - `blueprint-generator.ts` - Create structured grooming instructions
  - `prompts/cheshire.ts` - System prompt for Cheshire Cat personality

**packages/db/**
- Purpose: Prisma schema and client
- Location: `packages/db/prisma/schema.prisma`
- Models organized by domain:
  - **Clients & Pets**: Client, Pet, PetPassport
  - **Design System**: GroomingDesign (with multi-angle preview URLs + blueprint JSON), GroomingRecord
  - **Appointments**: Appointment (with status state machine), Service
  - **Conversations**: Conversation, Message (with intent tracking)
  - **Waivers**: SignedWaiver, WaiverForm
  - **Payments**: Payment, Stripe integration
  - **Gamification**: KimmieAchievement, KimmieStats, DailyMood
  - **Shelter Integration**: ShelterPet, Donation (501c3 feature)
- Indexes on: clientId, petId, email, phone, scheduledAt, status (for query performance)

**packages/shared/**
- Purpose: Shared type definitions and constants
- Location: `packages/shared/src/`
- Contains:
  - `types.ts` - Zod schemas: BookingRequestSchema, DesignBlueprintSchema, ChatIntentSchema, ConversationContextSchema
  - `constants.ts` - FAQ content, service categories, availability rules

## Key File Locations

**Entry Points:**
- `apps/cheshire/src/index.ts` - Hono server (port 3001)
- `apps/web/src/app/layout.tsx` - Next.js root layout (port 3000)
- `apps/telegram-bot/src/index.ts` - Grammy bot with webhook listener (port 3005)

**Configuration:**
- `package.json` - Root monorepo config with workspaces and scripts
- `turbo.json` - Task dependencies and build caching
- `apps/cheshire/tsconfig.json` - TypeScript config for Bun
- `apps/web/next.config.js` - Next.js config (no special config visible)
- `packages/db/prisma/schema.prisma` - Database schema

**Core Logic:**
- `apps/cheshire/src/services/booking.ts` - Booking state machine (9449 bytes)
- `apps/cheshire/src/services/intent.ts` - Intent detection
- `apps/cheshire/src/routes/chat.ts` - Main chat route
- `apps/cheshire/src/routes/webhook.ts` - Social media webhook handlers
- `packages/ai/src/llm.ts` - LLM orchestration with fallback

**Testing:**
- No test files found in codebase (TESTING.md would note this as a gap)

## Naming Conventions

**Files:**
- Services: `{domain}.ts` (e.g., `booking.ts`, `conversation.ts`, `calendar.ts`)
- Routes: `{endpoint}.ts` (e.g., `chat.ts`, `webhook.ts`, `oauth.ts`)
- Handlers: `{feature}Handler.ts` (e.g., `bookingsHandler`)
- Types: Located in `packages/shared/src/types.ts` with `*Schema` suffix for Zod validators
- React components: PascalCase, `.tsx` extension (e.g., `CheshireChat.tsx`, `WonderlandNav.tsx`)

**Directories:**
- App directories: lowercase (e.g., `apps/cheshire`, `apps/web`, `apps/telegram-bot`)
- Feature directories: lowercase plural (e.g., `routes/`, `services/`, `handlers/`, `components/`)
- Package directories: lowercase plural (e.g., `packages/ai`, `packages/db`, `packages/shared`)

**Exports and Imports:**
- Services export named functions: `export async function handleBookingFlow(...)`
- Types export default schemas: `export const BookingRequestSchema = z.object(...)`
- Path aliases: `@looking-glass/ai`, `@looking-glass/db`, `@looking-glass/shared`
- Web app uses `@/*` alias for local paths

**Environment Variables:**
- All uppercase with underscore separation: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `FACEBOOK_VERIFY_TOKEN`
- Related vars grouped: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- Secrets: API keys and tokens never committed (use `.env.example`)

## Where to Add New Code

**New API Endpoint:**
1. Create file in `apps/cheshire/src/routes/{endpoint}.ts`
2. Export route handler as named export: `export const {endpoint}Routes = new Hono()`
3. Import and mount in `apps/cheshire/src/index.ts`: `app.route('/{path}', {endpoint}Routes)`
4. If endpoint needs database access, use services (don't query DB directly in route)
5. Validate input with Zod in `packages/shared/src/types.ts`, use `zValidator` middleware

**New Service/Business Logic:**
1. Create file in `apps/cheshire/src/services/{domain}.ts`
2. Export named functions with clear names: `export async function {action}(...)`
3. Accept Prisma client via import: `import { prisma } from '@looking-glass/db'`
4. If logic is shared with Telegram bot, consider moving to AI package
5. Document function purpose and parameters in JSDoc

**New Type/Schema:**
1. Add to `packages/shared/src/types.ts` with Zod schema
2. Export both schema and inferred type: `export const {Name}Schema = z.object(...)` and `export type {Name} = z.infer<typeof {Name}Schema>`
3. Import in route handlers for validation
4. Use in both request validation (`zValidator`) and TypeScript types

**New React Component:**
1. Create file in `apps/web/src/components/{category}/{ComponentName}.tsx`
2. Use `'use client'` directive if component uses hooks/state
3. Style with Tailwind classes (CSS Modules not used)
4. Export as default or named function: `export function ComponentName() { ... }`
5. Import in pages or other components via relative paths

**New Telegram Command:**
1. Create handler in `apps/telegram-bot/src/handlers/{feature}.ts`
2. Export as named function: `export const {feature}Handler = (bot) => { bot.on(...) }`
3. Register in `apps/telegram-bot/src/index.ts`: `bot.use({feature}Handler)`
4. Use Grammy's context methods for replies and database access via Prisma

**New Scheduled Task:**
1. Add to `apps/telegram-bot/src/services/scheduler.ts` with node-cron
2. Function pattern: `cron.schedule('{schedule}', async () => { ... })`
3. Access database and send notifications via Telegram API
4. Register task in `initializeScheduler()` at startup

## Special Directories

**.planning/codebase/**
- Purpose: GSD orchestrator planning documents
- Generated: Yes (by /gsd:map-codebase command)
- Committed: Yes (these guide future Claude instances)

**docs/**
- Purpose: Sprint plans, workflow status, task stories
- Generated: Yes (by BMAD method tools)
- Committed: Yes
- Contents: `sprint-plan-looking-glass-*.md`, `sprint-status.yaml`, `docs/stories/`

**packages/db/prisma/**
- Purpose: Prisma schema and migration artifacts
- Generated: Yes (migrations created by `npm run db:push`)
- Committed: Yes (schema.prisma committed, .env not committed)

**apps/web/.next/**
- Purpose: Next.js build output
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**apps/cheshire/dist/**
- Purpose: Bun build output
- Generated: Yes (by `bun build src/index.ts --outdir=dist`)
- Committed: No (in .gitignore)

**bmad/agent-overrides/**
- Purpose: Agent configuration for Claude Code in this project
- Generated: No (checked in)
- Committed: Yes (customizes Claude behavior for this project)

---

*Structure analysis: 2026-01-25*
