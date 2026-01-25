# External Integrations

**Analysis Date:** 2026-01-25

## APIs & External Services

**LLM Providers:**
- Claude (Anthropic) - Primary AI for Cheshire Cat conversational responses
  - SDK: `@anthropic-ai/sdk`
  - Auth: `ANTHROPIC_API_KEY` env var
  - Model: `claude-sonnet-4-20250514`
  - Location: `packages/ai/src/llm.ts`

- OpenAI GPT - Fallback LLM provider
  - SDK: `openai`
  - Auth: `OPENAI_API_KEY` env var
  - Model: `gpt-4-turbo-preview`
  - Location: `packages/ai/src/llm.ts`

**Image Generation:**
- FAL.ai - Pet style preview generation (Looking Glass feature)
  - SDK: `@fal-ai/client`
  - Auth: `FAL_AI_KEY` env var
  - Model: `fal-ai/flux-pro/v1.1`
  - Purpose: Generate multi-angle grooming style previews
  - Location: `packages/ai/src/fal.ts`
  - Integration: `generateFullPreview()`, `generateSingleAngle()` functions

- Google Generative AI (Gemini) - Web app AI features
  - SDK: `@google/generative-ai`
  - Auth: Client-side key (NEXT_PUBLIC_* env var)
  - Usage: `apps/web/src/app/layout.tsx`

**Social Media & Messaging:**
- Facebook/Instagram Messenger - Customer booking requests
  - Webhook: `https://cheshire.lookingglassgroomery.com/webhook/facebook`
  - Endpoints: `/webhook/facebook`, `/webhook/fb` (dual paths for redundancy)
  - Auth: `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_VERIFY_TOKEN` env vars
  - Message handler: `apps/cheshire/src/routes/webhook.ts`
  - Notification: Send booking confirmations via Messenger API

- Instagram Direct Messages - Customer inquiries
  - Webhook: `https://cheshire.lookingglassgroomery.com/webhook/instagram`
  - Auth: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_VERIFY_TOKEN` env vars
  - Message handler: `apps/cheshire/src/routes/webhook.ts`
  - Integration: `handleInstagramMessage()` function

- Telegram Bot - Kimmie's assistant & booking notifications
  - Bot: Grammy framework (`apps/telegram-bot/src`)
  - Auth: `TELEGRAM_BOT_TOKEN` env var
  - Kimmie's chat ID: `TELEGRAM_KIMMIE_CHAT_ID` env var
  - Internal webhook: Telegram → Cheshire API (port 3001) → Telegram bot (port 3005)
  - Booking notifications: `notifyKimmieNewBooking()` in `apps/cheshire/src/services/notifications.ts`

- TikTok - Potential future integration
  - Auth: `TIKTOK_ACCESS_TOKEN` env var (defined but not yet implemented)

## Data Storage

**Databases:**
- PostgreSQL (primary)
  - Connection: `DATABASE_URL` env var
  - Client: Prisma ORM
  - Host: Defined in connection string
  - Models: Client, Pet, Appointment, GroomingDesign, Conversation, Payment, etc.
  - Schema: `packages/db/prisma/schema.prisma`
  - Migrations: Managed by Prisma

**File Storage:**
- AWS S3 - Telegram bot media uploads
  - SDK: `@aws-sdk/client-s3`
  - No explicit env vars found in `.env.example` but functionality present in `apps/telegram-bot/src`

- Local filesystem - Web app file serving
  - Next.js public directory for static assets

**Image CDN:**
- FAL.ai - Generated preview image hosting (image_url returned from API)
- Cloudflare - Static asset caching via reverse proxy
- Instagram CDN - User-uploaded pet photos (cdn.instagram.com, scontent.cdninstagram.com)
- Next.js Image Optimization - Remote image patterns configured in `apps/web/next.config.js`

**Caching:**
- None explicitly configured in stack (Redis not currently in use despite being available on dev-server-v2)

## Authentication & Identity

**Auth Provider:**
- Custom implementation - No OAuth/third-party auth library
- Google Calendar OAuth - Service account integration for availability checking
  - Credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` env vars
  - Implementation: `apps/cheshire/src/services/calendar-oauth.ts`
  - Callback URL: `https://cheshire.lookingglassgroomery.com/oauth/callback`

- Facebook/Instagram OAuth - Implicit (tokens provided by user setup)
  - Webhook verification tokens only

- Telegram Bot - Token-based (long polling or webhooks)

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, Rollbar, or similar integration

**Logs:**
- Console logging (Hono middleware: `logger()` in `apps/cheshire/src/index.ts`)
- File-based logging - Debug log written to `/tmp/cheshire-debug.log`
  - Purpose: Webhook debugging (PM2+Bun console.log capture issues)
  - Location: `apps/cheshire/src/routes/webhook.ts` - `debugLog()` function

- Browser console - React/Next.js client-side logging

**Metrics:**
- Not detected - No built-in metrics collection

## CI/CD & Deployment

**Hosting:**
- Cloudflare Tunnel - Public domain routing
  - Tunnel ID: `78aa0cc3-81a1-4481-a152-993cb15e2662`
  - Config: `/etc/cloudflared/config.yml`
  - Routes:
    - `cheshire.lookingglassgroomery.com` → port 3001 (main)
    - `cheshire.server2.io` → port 3001 (dev alias)
    - `cheshire-fb.server2.io` → port 3001 (webhook alias)
    - `lookingglassgroomery.com` → port 3002 (Next.js)

- PM2 Process Manager - Application lifecycle
  - Manages: Cheshire API, Telegram bot, Next.js server
  - Bun runtime for Cheshire: `bun run src/index.ts`

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or similar integration

## Environment Configuration

**Required env vars (from `.env.example`):**

**Database:**
- `DATABASE_URL` - PostgreSQL connection string

**AI Services:**
- `ANTHROPIC_API_KEY` - Claude API
- `OPENAI_API_KEY` - OpenAI GPT (optional fallback)
- `FAL_AI_KEY` - FAL.ai image generation

**Telegram:**
- `TELEGRAM_BOT_TOKEN` - Bot authentication
- `TELEGRAM_KIMMIE_CHAT_ID` - Kimmie's Telegram user ID

**Payment Processing:**
- `STRIPE_SECRET_KEY` - Stripe API key (backend)
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `STRIPE_PUBLISHABLE_KEY` - Client-side key (NEXT_PUBLIC_*)

**Social Media:**
- `INSTAGRAM_ACCESS_TOKEN` - Instagram Graph API token
- `INSTAGRAM_VERIFY_TOKEN` - Webhook verification
- `FACEBOOK_PAGE_ACCESS_TOKEN` - Facebook Graph API token
- `FACEBOOK_VERIFY_TOKEN` - Webhook verification
- `TIKTOK_ACCESS_TOKEN` - TikTok API (unused)

**Google Calendar:**
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_REFRESH_TOKEN` - Persistent refresh token
- `GOOGLE_CALENDAR_ID` - Target calendar for availability
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Service account email
- `GOOGLE_PRIVATE_KEY` - Service account private key

**Workflow Automation:**
- `N8N_API_KEY` - n8n automation platform
- `N8N_BASE_URL` - `https://n8n.server2.io`

**CRM Integration:**
- `TWENTY_API_KEY` - Twenty CRM platform
- `TWENTY_BASE_URL` - `https://crm.server2.io`

**Application:**
- `NEXT_PUBLIC_APP_URL` - Frontend canonical URL (default: `https://throughthelookingglass.pet`)
- `NODE_ENV` - Environment mode (development/production)

**Secrets location:**
- `.env` file (root, NOT committed to Git)
- Production: Environment variables set on deployment platform

## Webhooks & Callbacks

**Incoming Webhooks (Cheshire API receives):**

**Facebook Messenger:**
- `POST /webhook/facebook` - Message events
- `POST /webhook/fb` - Alternative path (cache bypass)
- `GET /webhook/facebook` - Verification challenge
- `GET /webhook/fb` - Alternative verification
- Verification token: `FACEBOOK_VERIFY_TOKEN`

**Instagram Direct Messages:**
- `POST /webhook/instagram` - Message events
- `GET /webhook/instagram` - Verification challenge
- Verification token: `INSTAGRAM_VERIFY_TOKEN`

**Telegram:**
- `POST /webhook/telegram` - Message events (forwarded to local bot service)
- Routes to: `http://127.0.0.1:3005/webhook` (Telegram bot internal)

**Outgoing Webhooks/API Calls:**

**Telegram Bot Notifications:**
- `sendMessage` to Telegram API - Booking notifications to Kimmie
- `sendMessage` to Telegram API - Booking confirmations to client
- Endpoint: `https://api.telegram.org/bot{token}/sendMessage`

**Facebook/Instagram Notifications:**
- Send DM via Facebook Graph API - Booking confirmations
- Send message reply via Instagram Graph API - Booking confirmations

**Google Calendar:**
- Create events for confirmed bookings
- Query availability via Google Calendar API
- OAuth flow: `apps/cheshire/src/services/calendar-oauth.ts`

**Payment Processing:**
- Stripe webhook listener (endpoint TBD)
- Notification schema: `@looking-glass/shared` types

## Rate Limiting & Throttling

**Not detected** - No explicit rate limiting middleware found

## API Security

**CORS:**
- Configured in Cheshire API: `apps/cheshire/src/index.ts`
- Allowed origins:
  - `https://www.lookingglassgroomery.com`
  - `https://lookingglassgroomery.com`
  - `http://localhost:3000` (development)

**Request Validation:**
- Zod schema validation via `@hono/zod-validator` middleware
- Applied to chat endpoints in `apps/cheshire/src/routes/chat.ts`

**HTML Sanitization:**
- DOMPurify for client-side content security (`apps/web`)

## Third-Party Service Dependencies

| Service | Purpose | Criticality | Fallback |
|---------|---------|-------------|----------|
| PostgreSQL | Data persistence | Critical | None |
| Claude (Anthropic) | AI responses | High | OpenAI (fallback) |
| FAL.ai | Pet style previews | Medium | Disable feature |
| Telegram | Kimmie notifications | High | Email (not implemented) |
| Facebook/Instagram | Customer acquisition | High | Website form only |
| Google Calendar | Availability checking | Medium | Working hours only |
| Stripe | Payment processing | Medium | Not yet implemented |

---

*Integration audit: 2026-01-25*
