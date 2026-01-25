# Codebase Concerns

**Analysis Date:** 2026-01-25

## Tech Debt

**Placeholder Waiver Content:**
- Issue: Default liability waiver in `apps/cheshire/src/services/waivers.ts` (line 140-150) is generic placeholder text, not Kimmie's actual waiver
- Files: `apps/cheshire/src/services/waivers.ts`
- Impact: Legal liability exposure - placeholder waiver is not enforceable and doesn't protect business. Clients may face inconsistent legal standing.
- Fix approach: Replace DEFAULT_WAIVER_CONTENT with actual legal waiver reviewed by attorney. Consider moving to database seed or external document storage (e.g., S3).

**Placeholder Phone Numbers for Uncontacted Clients:**
- Issue: When creating bookings without phone number, system generates placeholder `pending-${externalId}` phone values (line 536 in booking.ts)
- Files: `apps/cheshire/src/services/booking.ts`
- Impact: Blocks actual communication with clients - no way to send confirmations or reschedule notifications. Breaks SMS/phone workflows downstream.
- Fix approach: Require phone collection in booking flow before confirmation, or implement callback mechanism for clients to provide missing info.

**Signature Storage as Base64:**
- Issue: Waiver signatures stored as raw Base64 strings in database field (line 106 in waivers.ts) instead of proper file storage
- Files: `apps/cheshire/src/services/waivers.ts`
- Impact: Database bloat; signatures not backed up separately; compliance/audit trail concerns; can't retrieve original image quality
- Fix approach: Upload signatures to S3/R2, store URL in database. Add signature verification and audit logging.

**Content Tracking Not Implemented:**
- Issue: Content creation tracking stubbed out with TODO (line 100 in stats.ts) - `totalContent` always returns 0
- Files: `apps/telegram-bot/src/services/stats.ts`
- Impact: Gamification system incomplete - content streaks and XP calculations don't account for real work. Kimmie's level progression artificially suppressed.
- Fix approach: Add Content/Post model to Prisma schema, implement tracking in photo workflow and social media handlers.

**Calendly Username Verification Not Implemented:**
- Issue: TODO comment in contact page (line 8 in web/src/app/wonderland/contact/page.tsx) - username not verified
- Files: `apps/web/src/app/wonderland/contact/page.tsx`
- Impact: Calendly link may be incorrect or missing, breaking external scheduling link
- Fix approach: Add environment variable validation at startup, test Calendly API connectivity.

**AI Caption Generation Not Implemented:**
- Issue: TODO for caption generation in reminders handler (line 310 in reminders.ts) - marked for future implementation
- Files: `apps/telegram-bot/src/handlers/reminders.ts`
- Impact: Photos are uploaded but no AI-generated descriptions/captions - reduces content value for social media posting
- Fix approach: Integrate with Claude/GPT to generate captions after photo upload, store in database, include in daily digest.

**Returning Client Detection Incomplete:**
- Issue: TODO at line 60 in adaptive.ts - returning client status doesn't check actual customer data
- Files: `apps/cheshire/src/personality/adaptive.ts`
- Impact: Personality adjustments may not account for repeat customers - same greeting for new vs. established clients
- Fix approach: Query database for previous appointments for this client in conversation service, pass to personality detector.

---

## Known Bugs

**Booking State Machine Complexity:**
- Symptoms: Booking flow can enter confirmation loop multiple times, or skip steps if history parsing fails
- Files: `apps/cheshire/src/services/booking.ts` (lines 299-359)
- Trigger: Happens when conversation history format changes mid-flow or assistant message patterns don't match expected strings
- Workaround: Manually restart conversation or use different channel
- Root cause: State determination relies on fragile string matching of last assistant message rather than explicit state tracking in database

**Google Calendar JWT Signing Simplified:**
- Symptoms: JWT signing implementation uses `atob()`/`btoa()` instead of proper crypto library
- Files: `apps/cheshire/src/services/calendar.ts` (lines 194-233)
- Trigger: Browser APIs won't work in Bun runtime; fallback behavior unclear
- Workaround: None - service silently fails and calendar queries return empty
- Root cause: Missing proper JWT library for Bun runtime

**Race Condition in Concurrent Photo Uploads:**
- Symptoms: Photo streak can increment multiple times for single appointment if both before/after uploaded simultaneously
- Files: `apps/telegram-bot/src/handlers/reminders.ts` (lines 23-62)
- Trigger: Two concurrent uploads of before/after photos triggers updatePhotoStreak twice
- Workaround: Photos are deduplicated, but streak count inflated
- Root cause: No atomic increment or transaction wrapping photo streak updates

**Availability Check Timing Gap:**
- Symptoms: Appointment can be double-booked if two users confirm simultaneously after passing availability check
- Files: `apps/cheshire/src/services/booking.ts` (lines 586-642)
- Trigger: High concurrency during popular time slots
- Current mitigation: Prisma transaction with Serializable isolation on database check, but Google Calendar check happens outside transaction
- Risk: If Google Calendar is slow, window widens for race condition
- Fix approach: Move Google Calendar check inside transaction or use optimistic locking with version numbers

---

## Security Considerations

**Client Phone Number Placeholder Bypasses Validation:**
- Risk: Invalid phone numbers in database could trigger downstream SMS/contact errors
- Files: `apps/cheshire/src/services/booking.ts` (line 536)
- Current mitigation: Placeholder format is recognizable (`pending-*`)
- Recommendations: Add validation that actual phone numbers are numeric; require phone collection before appointment creation

**Waiver Token Entropy:**
- Risk: Tokens generated with `randomBytes(32)` are cryptographically strong, but no rate limiting on waiver signing endpoint
- Files: `apps/cheshire/src/services/waivers.ts` (lines 8-10)
- Current mitigation: Requires valid clientId and waiverId
- Recommendations: Add rate limiting to waiver signing endpoint; log all waiver signature attempts; add CAPTCHA for public-facing waiver links

**Signature Data in Database Field:**
- Risk: Base64-encoded signatures stored in text field without encryption at rest
- Files: `apps/cheshire/src/services/waivers.ts` (line 106)
- Current mitigation: Database-level access control
- Recommendations: Enable database encryption; store signatures in secure S3 with encryption; add digital signature verification

**File-Based Debug Logging Writable by Process:**
- Risk: `/tmp/cheshire-debug.log` can be read by other users on system; contains webhook payloads with user IDs
- Files: `apps/cheshire/src/routes/webhook.ts` (lines 16-20)
- Current mitigation: Try-catch swallows errors
- Recommendations: Use structured logging with appropriate permissions; rotate logs; never log sensitive IDs in production

**Environment Variable Exposure in Error Messages:**
- Risk: Console errors may leak `GOOGLE_SERVICE_ACCOUNT_EMAIL` or other env vars through error stack traces
- Files: Multiple files call `process.env.*` directly without null checks
- Current mitigation: None - process will crash if env vars missing
- Recommendations: Validate all required env vars at startup, fail explicitly with clear message

**No API Authentication Between Services:**
- Risk: Telegram webhook can POST to `/telegram` endpoint on Cheshire with no authentication
- Files: `apps/cheshire/src/routes/webhook.ts` (lines 25-49)
- Current mitigation: Token verification for Instagram/Facebook, but NOT for Telegram forwarding
- Recommendations: Add API token verification for internal service calls; use mutual TLS for service-to-service communication

---

## Performance Bottlenecks

**N+1 Query in Booking Creation:**
- Problem: `lookupServices()` function queries all services, then does fuzzy matching in application code
- Files: `apps/cheshire/src/services/booking.ts` (lines 27-97)
- Cause: No database-level full-text search; falls back to application-level string matching
- Impact: Scales poorly as service catalog grows; 100+ services will cause noticeable delay
- Improvement path: Add PostgreSQL full-text search index on service names; move matching logic to SQL `ts_rank()` query

**Concurrent Availability Checks Against Google Calendar:**
- Problem: Every booking attempt fetches Google Calendar data; no caching or rate limiting
- Files: `apps/cheshire/src/services/availability.ts` (lines 83-100) and `apps/cheshire/src/services/calendar-oauth.ts` (lines 279-298)
- Cause: No in-memory cache or background sync of calendar
- Impact: Under load, Google Calendar API quota could be exceeded; bookings fail silently with fallback slots
- Improvement path: Implement cache with 5-minute TTL; background sync every 10 minutes; add circuit breaker for API failures

**History Formatting on Every Request:**
- Problem: `formatHistoryForLLM()` re-processes entire conversation history on each message
- Files: `apps/cheshire/src/services/conversation.ts` (lines 75-86)
- Cause: No caching of formatted history
- Impact: Longer conversations get exponentially slower (O(n) processing per message)
- Improvement path: Cache formatted history in Redis; invalidate on new message

**Full Conversation Load for 20-Message Context:**
- Problem: Every webhook request loads last 20 messages from database
- Files: `apps/cheshire/src/services/conversation.ts` (line 28)
- Cause: No pagination or lazy loading
- Impact: Early messages never contribute to context; database query grows with conversation length
- Improvement path: Use sliding window query; implement message summarization for older messages

**Database Transaction Timeout at 10 Seconds:**
- Problem: Booking creation transaction times out if Google Calendar is slow
- Files: `apps/cheshire/src/services/booking.ts` (line 641)
- Cause: Google Calendar check happens inside transaction before write
- Impact: Under slow network, transactions fail and bookings are lost
- Improvement path: Move Google Calendar check outside transaction; use optimistic locking

---

## Fragile Areas

**Booking State Determination Logic:**
- Files: `apps/cheshire/src/services/booking.ts` (lines 298-359)
- Why fragile: Relies on regex pattern matching of free-form assistant text to determine state. If assistant response format changes (emoji updates, punctuation changes), state detection breaks.
- Safe modification: Extract state hints into structured metadata attached to messages rather than parsing text. Store explicit `bookingState` field in conversation or message records.
- Test coverage: No unit tests for state determination; integration tests only verify happy path booking flow.

**Intent Detection Pattern Matching:**
- Files: `apps/cheshire/src/services/intent.ts` (lines 11-53)
- Why fragile: Long list of hardcoded regex patterns with no priority or weighting system. New intents require code change and rebuild.
- Safe modification: Move patterns to database or YAML config; implement intent confidence scoring and fallback chain
- Test coverage: Minimal - only basic intent detection tested

**Google Calendar OAuth Token Management:**
- Files: `apps/cheshire/src/services/calendar-oauth.ts`
- Why fragile: Token refresh logic not visible in code; relies on external OAuth library. No fallback if refresh fails.
- Safe modification: Implement token refresh retry logic with exponential backoff; add health check endpoint that verifies token validity
- Test coverage: No tests for token refresh or expiry scenarios

**Waiver Signing Process:**
- Files: `apps/cheshire/src/services/waivers.ts` (lines 81-111)
- Why fragile: No idempotency key - calling sign twice with same data creates duplicate or errors. No transaction wrapping.
- Safe modification: Add unique constraint on (waiverId, clientId); use upsert instead of create; add idempotency token to API
- Test coverage: No tests for duplicate sign attempts or concurrent requests

**Conversation Message History Ordering:**
- Files: `apps/cheshire/src/services/conversation.ts` (line 27)
- Why fragile: Takes only last 20 messages sorted by `createdAt`. If timestamps are identical for multiple messages, ordering is undefined and could affect intent detection.
- Safe modification: Add sequence number or explicit sort order field; enforce consistent message timestamps
- Test coverage: No tests for edge cases with multiple messages at same timestamp

---

## Scaling Limits

**Single Google Calendar for All Appointments:**
- Current capacity: Google Calendar API rate limit is 1000 calls/day for service account
- Limit: At current traffic, still has headroom. Under viral growth (10x users), would exceed quota.
- Scaling path: Implement calendar caching (Redis); batch availability checks; consider dedicated Google Calendar service account per team member

**File-Based Debug Logging Without Rotation:**
- Current capacity: No file size limit on `/tmp/cheshire-debug.log`
- Limit: At 1KB per webhook event, ~500MB/month at production volume. Will fill /tmp partition in 1-2 months.
- Scaling path: Implement log rotation (logrotate or winston); switch to centralized logging (Datadog, LogRocket); remove debug logging in production

**Conversation History in Memory for All Active Conversations:**
- Current capacity: Loads last 20 messages per conversation; storing in application memory
- Limit: With thousands of concurrent conversations, could exceed Node/Bun memory limits
- Scaling path: Lazy-load conversation history only when needed; implement conversation caching with LRU eviction

**Single Telegram Bot Token for All Users:**
- Current capacity: Telegram allows 30+ messages/second per bot
- Limit: Under spike load, could hit rate limits; no queuing mechanism
- Scaling path: Implement message queue (Bull/RabbitMQ); separate bot instances for high-traffic periods

---

## Scaling Limits

**Database Connection Pool:**
- Current capacity: Default Prisma connection pool is small (2-10 connections)
- Limit: Under concurrent booking requests, could exhaust pool and timeout
- Scaling path: Increase pool size; implement connection pooling proxy (PgBouncer); monitor connection utilization

---

## Dependencies at Risk

**Bun Runtime for Cheshire API:**
- Risk: Bun is still pre-1.0; breaking changes possible. Limited production adoption compared to Node.js.
- Impact: API crashes on Bun update; JWT signing uses browser APIs not available in Bun
- Migration plan: Migrate Cheshire to Node.js with Hono if Bun causes instability. Most code is portable (Hono framework-agnostic).

**FAL.ai for Image Generation:**
- Risk: FAL.ai pricing could increase; API availability depends on third party
- Impact: Looking Glass preview generation fails if FAL.ai is down or quota exceeded
- Migration plan: Support multiple image generation backends (OpenAI DALL-E, Replicate); add fallback to static templates

**Google Calendar API Reliance:**
- Risk: Google Calendar API could have breaking changes; service account keys rotate
- Impact: Availability checking fails; appointments can be double-booked
- Migration plan: Add calendar abstraction layer; support multiple calendar providers (Outlook, iCal feeds)

**Telegram Bot Token Single Points of Failure:**
- Risk: Bot token leaked or revoked; no backup bot configured
- Impact: All Telegram notifications and commands fail; no way to contact Kimmie
- Migration plan: Implement bot token rotation; add backup bot instance; use Telegram Bot API webhook with database persistence

---

## Missing Critical Features

**No Admin Dashboard for Appointment Management:**
- Problem: Kimmie manually approves bookings via Telegram messages. No centralized booking management UI.
- Blocks: Can't bulk-edit appointments; no calendar visualization; no client communication tools
- Workaround: Use Telegram bot for all management (inefficient for large volumes)
- Priority: High - needed for scaling

**No Automatic Client Confirmation/Reminders:**
- Problem: After Kimmie approves booking, no automatic SMS/email sent to client
- Blocks: Clients don't know appointment is confirmed; no day-before reminders
- Workaround: Kimmie sends manual messages
- Priority: High - impacts no-show rate

**No Payment Processing Integration:**
- Problem: Stripe imported but no integration endpoints implemented
- Blocks: Deposits can't be collected; no online payment option
- Workaround: Cash/Venmo only (limits bookings from out-of-area clients)
- Priority: Medium - impacts revenue

**No Automatic Cancellation/Rescheduling:**
- Problem: Users can request changes in chat but no workflow to update appointments
- Blocks: Keeps manual overhead high for Kimmie
- Workaround: Manual database updates
- Priority: Medium - labor intensive

---

## Test Coverage Gaps

**Booking Flow State Transitions:**
- What's not tested: Skipping steps, providing data out of order, returning to previous steps
- Files: `apps/cheshire/src/services/booking.ts`
- Risk: State machine could enter invalid states undetected
- Priority: High - core business logic

**Race Condition Scenarios:**
- What's not tested: Concurrent appointment creation at same time slot; concurrent photo uploads; concurrent waiver signatures
- Files: `apps/cheshire/src/services/booking.ts`, `apps/telegram-bot/src/handlers/reminders.ts`, `apps/cheshire/src/services/waivers.ts`
- Risk: Double-bookings, duplicate stats, invalid waivers
- Priority: High - customer-facing impact

**Google Calendar Integration Failures:**
- What's not tested: Token expiry, API timeouts, malformed responses, calendar deletion
- Files: `apps/cheshire/src/services/calendar-oauth.ts`, `apps/cheshire/src/services/availability.ts`
- Risk: Availability checks silently fail; bookings created on unavailable times
- Priority: High - breaks core feature

**Webhook Retry Logic:**
- What's not tested: Webhook handlers with network errors, malformed payloads, rate limiting
- Files: `apps/cheshire/src/routes/webhook.ts`
- Risk: Webhooks silently lost; events not processed; no error visibility
- Priority: Medium - affects data consistency

**Intent Detection Edge Cases:**
- What's not tested: Ambiguous messages, mixed intents, low-confidence scenarios
- Files: `apps/cheshire/src/services/intent.ts`
- Risk: Wrong flow triggered; booking confused with pricing question
- Priority: Medium - user experience issue

**Database Constraint Violations:**
- What's not tested: Creating duplicate clients, pets, or appointments
- Files: Database constraints not enforced in tests
- Risk: Data duplication; referential integrity issues
- Priority: Low - database constraints prevent most issues

---

*Concerns audit: 2026-01-25*
