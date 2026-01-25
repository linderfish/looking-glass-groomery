# Architecture

**Analysis Date:** 2026-01-25

## Pattern Overview

**Overall:** Multi-app monorepo with layered services architecture. Three independent apps communicate through a centralized Prisma database and shared type definitions. Cheshire Cat (API) acts as a facade for AI orchestration and business logic, while the web app provides frontend interactions and the Telegram bot handles async notifications.

**Key Characteristics:**
- **Monorepo structure**: Turbo-managed apps and shared packages with strict dependency boundaries
- **Microservice-oriented**: Each app runs independently on different runtimes (Bun, Node.js, Next.js)
- **Intent-driven routing**: Incoming messages parsed for intent (BOOKING, PRICING, ESCALATE) and routed to specialized handlers
- **State machine booking flow**: Multi-step conversational booking with database persistence
- **AI orchestration layer**: Central AI package abstracts Claude/OpenAI with provider fallback

## Layers

**API Layer (Cheshire - apps/cheshire/src/routes/):**
- Purpose: HTTP endpoints accepting messages from web, webhooks, and social platforms
- Location: `apps/cheshire/src/routes/`
- Contains: Hono route handlers (chat, webhook, oauth, waiver, health)
- Depends on: Services layer, AI package, database
- Used by: Web app (via API proxy), Instagram/Facebook webhooks, Telegram forwarding

**Services Layer (apps/cheshire/src/services/):**
- Purpose: Business logic for conversation handling, intent detection, booking orchestration
- Location: `apps/cheshire/src/services/`
- Contains: booking.ts, conversation.ts, intent.ts, calendar.ts, availability.ts, response.ts, escalation.ts
- Depends on: Database, AI package, personality adapter
- Used by: Route handlers, Telegram bot

**Database Layer (packages/db/):**
- Purpose: Prisma schema and client for PostgreSQL persistence
- Location: `packages/db/prisma/schema.prisma`
- Contains: Client, Pet, Appointment, Conversation, Message, GroomingDesign, Service models
- Depends on: PostgreSQL (DATABASE_URL)
- Used by: All apps

**AI Orchestration (packages/ai/):**
- Purpose: LLM calls, image generation, design preview creation
- Location: `packages/ai/src/`
- Contains: llm.ts (Anthropic/OpenAI), fal.ts (FAL.ai image generation), looking-glass/ (design system)
- Depends on: External APIs (Claude, OpenAI, FAL.ai), prompts
- Used by: Cheshire services, web API handlers

**Shared Types (packages/shared/):**
- Purpose: Zod schemas and TypeScript types for type safety across apps
- Location: `packages/shared/src/`
- Contains: types.ts (BookingRequestSchema, DesignBlueprintSchema, ChatIntentSchema), constants.ts
- Depends on: Zod
- Used by: All apps for request/response validation

**Frontend (apps/web/src/):**
- Purpose: Next.js customer-facing website with Wonderland theme
- Location: `apps/web/src/`
- Contains: App Router pages, React components, styles, Zustand stores
- Depends on: Cheshire API (via /api/chat proxy)
- Used by: Public visitors

**Telegram Bot (apps/telegram-bot/src/):**
- Purpose: Notification delivery and admin interface for Kimmie
- Location: `apps/telegram-bot/src/`
- Contains: Command handlers, services (achievements, stats, reminders), scheduling
- Depends on: Grammy framework, database, AI package
- Used by: Cheshire (for escalations/notifications), Kimmie directly

## Data Flow

**Chat Flow (Website/Social):**

1. User message arrives at Cheshire chat endpoint (`POST /chat` or webhook)
2. `getOrCreateConversation()` retrieves or creates Conversation record
3. Message stored in database via `addMessage()`
4. `detectIntent()` analyzes message + history → returns ChatIntent (BOOKING, PRICING, etc.)
5. Intent routes to specialized handler:
   - BOOKING → `handleBookingFlow()` manages state machine
   - PRICING/SERVICES/HOURS/LOCATION → `getFAQResponse()` or `generateResponse()`
   - ESCALATE → `escalateConversation()` → `notifyKimmieEscalation()` → Telegram
6. Response generated via `cheshireChat()` (Claude/OpenAI)
7. Response stored in database, returned to client
8. Client displays response in Chat widget

**Booking State Machine:**

```
INITIAL
  ↓ (user says "book")
COLLECTING_PET (Ask pet name and species)
  ↓
COLLECTING_DATE (Ask preferred date)
  ↓ (if phone missing)
COLLECTING_PHONE
  ↓
COLLECTING_SERVICE (Ask what service)
  ↓
CONFIRMING (Summarize, ask confirmation)
  ↓ (user confirms)
CREATE APPOINTMENT → Notify Kimmie via Telegram → Calendar event (Google)
```

Each state persists intent data (extracted pet name, requested date, services). Availability checked via `canBookSlot()` before confirmation.

**Design/Looking Glass Flow (Optional):**

1. User uploads photo and describes style in chat
2. Style parsed via `parseStyleDescription()` → DesignBlueprint
3. `generateFullPreview()` calls FAL.ai to generate multi-angle previews (front, left, right, back, top)
4. Blueprint and preview URLs stored in GroomingDesign record
5. Design marked as PENDING_APPROVAL, Kimmie notified
6. Kimmie can review on Telegram or admin panel, update status to APPROVED

**Notification Flow (Telegram Bot):**

1. Service creates notification event (new booking, photo reminder, achievement)
2. `notifyKimmie()` or scheduled task sends via Telegram API
3. Grammy bot receives message, invokes handler
4. Handler updates database, may respond with actions (inline buttons)
5. Admin interactions (approve booking, log achievements) update database

**State Management:**

- **Conversation state**: Persisted in Conversation + Message tables with conversation history (last 20 messages)
- **Booking draft state**: Stored in conversation intent data, used to track progress through state machine
- **Client/Pet state**: Linked via clientId in Conversation and Appointment records
- **Design state**: GroomingDesign status enum (DRAFT → PENDING_APPROVAL → APPROVED) tracks approval flow

## Key Abstractions

**Conversation:**
- Purpose: Encapsulates multi-turn chat session across channels (WEBSITE, INSTAGRAM, FACEBOOK, TELEGRAM)
- Examples: `apps/cheshire/src/services/conversation.ts`
- Pattern: Document-oriented (stores full message history), linked to Client via clientId

**Intent:**
- Purpose: Represents user's high-level goal extracted from message
- Examples: BOOKING, PRICING, ESCALATE, CONSULTATION
- Pattern: Pattern matching (regex) + LLM fallback, extracted data attached (pet name, requested date)

**BookingFlow:**
- Purpose: Manages multi-step conversational booking state machine
- Examples: `apps/cheshire/src/services/booking.ts` - `handleBookingFlow()`
- Pattern: State machine with side effects (calendar event creation, notifications, appointment creation)

**DesignBlueprint:**
- Purpose: Structured grooming instructions per body region (head, ears, body, legs, tail) with creative elements
- Examples: `packages/shared/src/types.ts` - `DesignBlueprintSchema`
- Pattern: Zod schema-validated JSON, stored as Json field in GroomingDesign

**Availability:**
- Purpose: Checks if a time slot can be booked by querying Google Calendar and database
- Examples: `apps/cheshire/src/services/availability.ts` - `canBookSlot()`
- Pattern: External API integration (Google Calendar OAuth) with caching considerations

## Entry Points

**Cheshire API (Hono Server):**
- Location: `apps/cheshire/src/index.ts`
- Triggers: HTTP requests from web, webhook endpoints from Facebook/Instagram, Telegram forwarding
- Responsibilities: Route requests to handlers, apply CORS/logging middleware, bind to port 3001
- Port: 3001

**Next.js Web App:**
- Location: `apps/web/src/app/page.tsx`, `apps/web/src/app/layout.tsx`
- Triggers: Browser navigation, static site generation
- Responsibilities: Render Wonderland theme pages, embed chat widget, proxy /api/chat to Cheshire
- Port: 3000

**Telegram Bot:**
- Location: `apps/telegram-bot/src/index.ts`
- Triggers: Scheduled tasks (node-cron), webhook from Telegram (@telegram/bot-api setWebhook)
- Responsibilities: Receive updates from Telegram, invoke handlers, send messages back
- Entry method: Webhook listener on port 3005 (for development), or polling in production

**Webhook Ingestion:**
- Location: `apps/cheshire/src/routes/webhook.ts`
- Endpoints:
  - `POST /webhook/facebook` - Messenger incoming messages
  - `POST /webhook/instagram` - Instagram DM messages
  - `POST /webhook/telegram` - Telegram updates (forwarded to bot's webhook)
- Flow: Parse payload → `processChannelMessage()` → Store + Generate response → Send back via platform API

## Error Handling

**Strategy:** Graceful degradation with fallback responses. Errors logged to console and file (Cheshire writes to `/tmp/cheshire-debug.log`), but always return 200 OK to webhooks to prevent platform retries.

**Patterns:**

- **API layer errors**: Try-catch wraps route handlers, returns 500 with error message (except webhooks → always 200)
- **Service layer errors**: Errors bubble up with context (e.g., "Failed to lookup services"), caught at route level
- **Database errors**: Wrapped in Prisma error handling, logged with operation context
- **LLM fallback**: If Anthropic fails, retry OpenAI. If both fail, use hardcoded FAQ responses
- **Webhook resilience**: File logging ensures visibility even when console capture fails (PM2 + Bun issue)

## Cross-Cutting Concerns

**Logging:**
- Console.log for local development
- File-based logging to `/tmp/cheshire-debug.log` for Bun/PM2 visibility
- Conversation message history stored in database for audit trail

**Validation:**
- Zod schemas in `packages/shared/src/types.ts` define all request/response shapes
- Hono `zValidator` middleware validates JSON requests before reaching handlers
- Intent data extraction uses pattern matching + optional LLM confirmation

**Authentication:**
- No client auth for chat endpoints (sessionId-based state tracking)
- Telegram bot validates update signatures via Grammy built-in verification
- Facebook/Instagram webhooks verify via token exchange (VERIFY_TOKEN env var)
- OAuth for Google Calendar (GOOGLE_CLIENT_ID, GOOGLE_REFRESH_TOKEN)

**Database Transactions:**
- Booking creation is NOT wrapped in transaction (potential consistency issue)
- Should be: Start transaction → Create appointment → Create calendar event → Commit
- Currently: Create appointment → Try calendar event → Manual cleanup on failure

---

*Architecture analysis: 2026-01-25*
