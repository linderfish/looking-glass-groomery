---
phase: 05-revenue-dashboard
plan: 01
subsystem: api
tags: [stripe, revenue, typescript, date-fns, currency-formatting]

# Dependency graph
requires:
  - phase: 04-photo-dashboard
    provides: Service pattern for telegram-bot services
provides:
  - Stripe API wrapper with date-filtered charge retrieval and pagination
  - Revenue calculation functions for today/week/month/year periods
  - Currency formatting with locale support (Intl.NumberFormat)
  - Goal progress visualization with Unicode progress bars
affects: [05-02-telegram-revenue, 05-03-dashboard-revenue]

# Tech tracking
tech-stack:
  added:
    - stripe ^20.2.0 (Stripe Node.js SDK)
  patterns:
    - Stripe charges.list() with pagination handling (has_more loop)
    - date-fns date boundaries for timezone-safe period calculation
    - Intl.NumberFormat for currency formatting without external libraries

key-files:
  created:
    - apps/telegram-bot/src/services/stripe.ts
    - apps/telegram-bot/src/services/revenue.ts
  modified:
    - apps/telegram-bot/package.json

key-decisions:
  - "Filter charges for status=succeeded, refunded=false, livemode=true to ensure accurate revenue"
  - "Use Stripe Charges API (not Payment Intents) for revenue reporting - lists all charges regardless of creation method"
  - "Handle pagination with while loop and starting_after cursor for months with >100 charges"
  - "Return revenue in dollars (not cents) from all calculation functions"
  - "Use Intl.NumberFormat built-in instead of external currency library"
  - "Progress bar uses Unicode blocks (█░) for Telegram text compatibility"

patterns-established:
  - "Stripe service layer pattern: single client instance, filtered charge retrieval, revenue calculation helpers"
  - "Revenue formatting pattern: period-specific emojis, labels, optional goal progress for monthly"
  - "Date boundary pattern: date-fns startOf/endOf functions for timezone-safe ranges"

# Metrics
duration: 4min
completed: 2026-01-27
---

# Phase 5 Plan 01: Stripe Integration & Revenue Formatting

**Stripe SDK integrated with pagination-aware charge retrieval, revenue calculation for all time periods, and currency formatting with visual goal progress**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-27T02:15:06Z
- **Completed:** 2026-01-27T02:18:41Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Stripe Node.js SDK installed and configured with API version 2025-12-15.clover
- Complete revenue calculation infrastructure for today/week/month/year with automatic cents-to-dollars conversion
- Currency formatting with Intl.NumberFormat supporting locale-aware display
- Monthly goal progress with visual indicator (10-character Unicode progress bar)
- Pagination handling for high-volume months (>100 charges)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Stripe SDK** - `5a5fb44` (chore)
2. **Task 2: Create Stripe service with date-filtered charge retrieval** - `fc54b2c` (feat)
3. **Task 3: Create revenue formatting service with goal progress** - `09dddd6` (feat)

## Files Created/Modified
- `apps/telegram-bot/package.json` - Added stripe ^20.2.0 dependency
- `apps/telegram-bot/src/services/stripe.ts` - Stripe API wrapper with getSuccessfulCharges (pagination support), getTodayRevenue, getWeekRevenue, getMonthRevenue, getYearRevenue
- `apps/telegram-bot/src/services/revenue.ts` - formatCurrency and formatRevenueResponse with period-specific emojis, labels, and monthly goal progress bars

## Decisions Made

1. **Stripe Charges API over Payment Intents**: For revenue reporting, Charges API is appropriate - it lists all successful charges regardless of how they were created. Payment Intents API is for creating new payments.

2. **Filter criteria**: Only count charges with status=succeeded, refunded=false, livemode=true. This ensures test charges and refunded payments don't inflate revenue numbers.

3. **Pagination strategy**: Use while loop with has_more check and starting_after cursor. Critical for months with >100 charges (Stripe's max per request).

4. **Return format**: All revenue calculation functions return dollars (not cents) as Promise<number>. This keeps the API clean - cents conversion happens internally.

5. **Currency formatting**: Use Node.js built-in Intl.NumberFormat instead of external library. Handles locale, thousands separators, and decimal places without dependencies.

6. **Progress bar**: Unicode blocks (█░) work in Telegram text messages without rendering. 10 characters total (each represents 10% of goal).

7. **Week start day**: Sunday (weekStartsOn: 0) matches US business convention and Kimmie's calendar.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**API version compatibility**: Initial code used API version '2025-01-27.acacia' which caused TypeScript error. Fixed by using current supported version '2025-12-15.clover' from Stripe SDK type definitions.

**Pre-existing TypeScript errors**: Codebase has unrelated TypeScript errors in help.ts and settings.ts. These are outside the scope of this plan and don't affect the new services (verified by compiling stripe.ts and revenue.ts individually).

## User Setup Required

**Environment variable needed:**
- `STRIPE_SECRET_KEY` - Stripe secret API key (sk_live_xxx for production, sk_test_xxx for development)
- `MONTHLY_REVENUE_GOAL` - Optional monthly goal in dollars (defaults to 9000 if not set, used by plan 05-02)

The Stripe service will throw an error on initialization if STRIPE_SECRET_KEY is missing.

## Next Phase Readiness

**Ready for next plan (05-02 - Telegram Revenue Commands):**
- stripe.ts provides all revenue calculation functions
- revenue.ts provides formatting with goal progress
- Natural language service can be extended to detect revenue queries
- Voice handler can be extended to handle revenue queries

**Note for 05-02:** The natural language handler should place revenue patterns AFTER client/pet lookup patterns to avoid query collisions (e.g., "how much did Sarah make" should not trigger revenue if Sarah is a client name).

**Ready for plan 05-03 (Dashboard Revenue Routes):**
- Same service layer can be used for web dashboard routes
- formatCurrency already handles HTML-safe output
- Progress percentage calculation available for visual progress bars

**No blockers or concerns.**

---
*Phase: 05-revenue-dashboard*
*Completed: 2026-01-27*
