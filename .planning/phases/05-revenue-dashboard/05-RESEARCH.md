# Phase 5: Revenue Dashboard - Research

**Researched:** 2026-01-26
**Domain:** Stripe API integration, revenue calculation, natural language query processing
**Confidence:** HIGH

## Summary

Phase 5 adds revenue visibility to Kimmie's Telegram bot, allowing her to ask "how much did I make today?" and get immediate answers without logging into Stripe. The core technical challenge is retrieving payment data from Stripe API, calculating revenue totals for different time periods, and presenting them through natural language handlers (text and voice).

**Technical Foundation:**
- Stripe Node.js SDK provides native TypeScript support and comprehensive API access
- Payment data retrieved via `stripe.charges.list()` with date filtering using `created[gte]` and `created[lte]`
- Natural language processing pattern already established in voice handler (`processNaturalLanguageQuery`)
- date-fns already in use for date manipulation and timezone handling
- Web dashboard already exists with basic auth - can extend with revenue routes

**Critical API Change:**
Stripe recommends Payment Intents API over legacy Charges API for new integrations. However, for revenue reporting, we need to query **successful charges/payments regardless of creation method**. The Charges API with `status: succeeded` filter is appropriate for historical revenue calculation.

**Primary recommendation:** Build Stripe service layer that wraps charge listing with date filters, create revenue calculation functions for each time period (today/week/month/YTD), extend natural language service to detect revenue queries, format results with currency symbols and goal progress.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | Latest (^20.1.0) | Stripe API access | Official Node.js SDK, TypeScript native, comprehensive API coverage |
| date-fns | ^4.1.0 | Date calculation | Already in use, timezone-aware, startOfDay/endOfDay utilities |
| @looking-glass/db | * | Database access | Existing Payment model with Stripe IDs for cross-reference |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Intl.NumberFormat | Node.js built-in | Currency formatting | Format revenue as "$1,234.56" with proper locale |
| natural-language service | Existing | Query intent detection | Pattern matching for revenue queries |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| stripe.charges.list() | stripe.paymentIntents.list() | PaymentIntents are newer but require different status filtering; charges are more direct for revenue |
| Stripe API | Stripe Reports API | Reports API is for scheduled exports, not real-time queries |
| date-fns | Day.js | Both work, date-fns already in use throughout codebase |
| Custom currency formatter | accounting.js | Built-in Intl.NumberFormat is sufficient, no extra dependency |

**Installation:**
```bash
# Stripe SDK needs to be added to telegram-bot workspace
npm install stripe --workspace=@looking-glass/telegram-bot
```

## Architecture Patterns

### Recommended Project Structure
```
apps/telegram-bot/src/
├── services/
│   ├── stripe.ts               # New: Stripe API wrapper
│   ├── revenue.ts              # New: Revenue calculation logic
│   ├── natural-language.ts     # Enhance: Add revenue query patterns
│   └── formatting.ts           # Enhance: Add revenue formatting
├── routes/
│   └── dashboard.ts            # Enhance: Add /dashboard/revenue route
```

### Pattern 1: Stripe Charges List with Date Filtering
**What:** Retrieve all successful charges within a date range using Unix timestamps
**When to use:** Revenue calculation for any time period
**Example:**
```typescript
// Source: https://docs.stripe.com/api/charges/list
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15',
});

async function getChargesInRange(startDate: Date, endDate: Date) {
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  const charges = await stripe.charges.list({
    created: {
      gte: startTimestamp,
      lte: endTimestamp,
    },
    limit: 100, // Pagination if needed
  });

  // Filter for successful charges only
  return charges.data.filter(charge => charge.status === 'succeeded');
}
```

### Pattern 2: Revenue Calculation by Time Period
**What:** Calculate total revenue for today/week/month/year with timezone awareness
**When to use:** Processing revenue queries from natural language
**Example:**
```typescript
// Source: date-fns documentation + Stripe best practices
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

async function calculateTodayRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getChargesInRange(startOfDay(now), endOfDay(now));

  return charges.reduce((total, charge) => {
    return total + (charge.amount / 100); // Stripe amounts are in cents
  }, 0);
}

async function calculateWeekRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getChargesInRange(
    startOfWeek(now, { weekStartsOn: 0 }), // Sunday = 0
    endOfWeek(now, { weekStartsOn: 0 })
  );

  return charges.reduce((total, charge) => total + (charge.amount / 100), 0);
}

async function calculateMonthRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getChargesInRange(startOfMonth(now), endOfMonth(now));

  return charges.reduce((total, charge) => total + (charge.amount / 100), 0);
}

async function calculateYearRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getChargesInRange(startOfYear(now), endOfYear(now));

  return charges.reduce((total, charge) => total + (charge.amount / 100), 0);
}
```

### Pattern 3: Natural Language Revenue Query Detection
**What:** Extend existing natural-language.ts to detect revenue queries
**When to use:** Voice messages or text messages asking about revenue
**Example:**
```typescript
// Extend processNaturalLanguageQuery in natural-language.ts
export type NLQueryResult =
  | { type: 'client'; data: ClientWithPets; message: string }
  | { type: 'clients'; data: ClientWithPets[]; message: string }
  | { type: 'revenue'; data: { amount: number; period: string; goal?: number }; message: string }
  | { type: 'not_found'; data: null; message: string };

// Revenue query patterns
const revenuePatterns = [
  /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) today/i,
  /(?:what's|whats) (?:my|our|the) revenue (?:for )?today/i,
  /today'?s revenue/i,
  /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) this week/i,
  /weekly revenue/i,
  /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) this month/i,
  /monthly revenue/i,
  /(?:year to date|ytd) revenue/i,
  /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) (?:this|the) year/i,
];

// In processNaturalLanguageQuery function
for (const pattern of revenuePatterns) {
  if (pattern.test(text)) {
    const revenue = await calculateRevenueForQuery(text);
    return {
      type: 'revenue',
      data: revenue,
      message: 'Revenue calculated',
    };
  }
}
```

### Pattern 4: Currency Formatting
**What:** Format revenue numbers as currency with proper locale
**When to use:** Displaying revenue in Telegram messages or dashboard
**Example:**
```typescript
// Using Node.js built-in Intl.NumberFormat
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Usage
const todayRevenue = 1234.56;
console.log(formatCurrency(todayRevenue)); // "$1,234.56"
```

### Pattern 5: Goal Progress Visualization
**What:** Show progress toward monthly revenue goal ($8-10K) with visual indicator
**When to use:** Monthly revenue responses
**Example:**
```typescript
function formatRevenueWithGoal(revenue: number, goal: number): string {
  const percentage = Math.min((revenue / goal) * 100, 100);
  const filled = Math.floor(percentage / 10);
  const empty = 10 - filled;

  const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
  const formattedRevenue = formatCurrency(revenue);
  const formattedGoal = formatCurrency(goal);

  return `
💰 Monthly Revenue: ${formattedRevenue}
🎯 Goal: ${formattedGoal} (${percentage.toFixed(1)}%)
${progressBar}
${revenue >= goal ? '🎉 Goal reached!' : `💪 $${(goal - revenue).toFixed(2)} to go!`}
  `.trim();
}
```

### Pattern 6: Revenue Dashboard Route
**What:** Web dashboard view showing revenue metrics with charts
**When to use:** Kimmie wants visual overview of revenue trends
**Example:**
```typescript
// Add to apps/telegram-bot/src/routes/dashboard.ts
dashboardRouter.get('/revenue', async (req, res) => {
  const today = await calculateTodayRevenue();
  const week = await calculateWeekRevenue();
  const month = await calculateMonthRevenue();
  const year = await calculateYearRevenue();

  const MONTHLY_GOAL_MIN = 8000;
  const MONTHLY_GOAL_MAX = 10000;
  const monthGoal = (MONTHLY_GOAL_MIN + MONTHLY_GOAL_MAX) / 2; // $9,000 midpoint

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Revenue Dashboard - Looking Glass</title>
      <style>
        body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .metric { background: white; border-radius: 12px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .amount { font-size: 2em; font-weight: bold; color: #10b981; }
        .label { color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.05em; }
        .progress { width: 100%; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; margin-top: 10px; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); transition: width 0.3s ease; }
        .goal-text { margin-top: 8px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <h1>💰 Revenue Dashboard</h1>

      <div class="metric">
        <div class="label">Today</div>
        <div class="amount">${formatCurrency(today)}</div>
      </div>

      <div class="metric">
        <div class="label">This Week</div>
        <div class="amount">${formatCurrency(week)}</div>
      </div>

      <div class="metric">
        <div class="label">This Month</div>
        <div class="amount">${formatCurrency(month)}</div>
        <div class="progress">
          <div class="progress-fill" style="width: ${Math.min((month / monthGoal) * 100, 100)}%"></div>
        </div>
        <div class="goal-text">
          Goal: ${formatCurrency(monthGoal)}
          (${((month / monthGoal) * 100).toFixed(1)}%)
        </div>
      </div>

      <div class="metric">
        <div class="label">Year to Date</div>
        <div class="amount">${formatCurrency(year)}</div>
      </div>
    </body>
    </html>
  `;

  res.send(html);
});
```

### Anti-Patterns to Avoid
- **Hardcoding currency:** Always use environment variable or setting for currency (future: multi-currency support)
- **Ignoring pagination:** Stripe charges.list() returns max 100 items - handle `has_more` for high-volume months
- **Not filtering by status:** Include only `succeeded` charges, exclude `pending`, `failed`, `refunded`
- **Mixing timezones:** Always use Kimmie's timezone for date boundaries (not server UTC)
- **Storing revenue totals:** Calculate from Stripe charges on-demand (single source of truth)
- **Exposing Stripe keys:** Never log or display STRIPE_SECRET_KEY in responses

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | String concatenation with $ | Intl.NumberFormat | Handles thousands separators, decimal places, locale-specific symbols |
| Date range boundaries | Manual timestamp math | date-fns startOf/endOf functions | Handles DST, leap years, timezone offsets correctly |
| Stripe API retry logic | Manual setTimeout retry | Stripe SDK built-in retries | Exponential backoff, idempotency keys, error classification |
| Revenue caching | Custom TTL cache | Calculate on-demand from Stripe | Stripe is source of truth, caching adds staleness and complexity |
| Progress bar generation | HTML canvas or SVG | Unicode block characters (█░) | Works in Telegram text messages, no rendering needed |

**Key insight:** Stripe SDK and date-fns handle the complexity (pagination, retries, timezone math). Focus on query detection and formatting, not infrastructure.

## Common Pitfalls

### Pitfall 1: Stripe Amount Currency Confusion
**What goes wrong:** Display revenue as $123456 instead of $1,234.56
**Why it happens:** Stripe amounts are in smallest currency unit (cents for USD) - need to divide by 100
**How to avoid:** Always divide by 100 for USD (or use `charge.amount / 100`)
**Warning signs:** Revenue numbers are 100x too large

### Pitfall 2: Pagination Limits
**What goes wrong:** Revenue calculation only includes first 100 charges, underreports actual revenue
**Why it happens:** Stripe charges.list() defaults to 10, max 100 per request - busy month exceeds limit
**How to avoid:** Check `has_more` field, iterate with `starting_after` cursor if true
**Warning signs:** Monthly revenue stops growing even with more bookings

### Pitfall 3: Timezone Boundary Errors
**What goes wrong:** "Today's revenue" includes/excludes wrong hours because server is UTC but Kimmie is PST
**Why it happens:** Using `new Date()` without timezone conversion for date boundaries
**How to avoid:** Use date-fns with Kimmie's timezone setting, or convert boundaries to UTC for Stripe API
**Warning signs:** "Today" revenue doesn't match Stripe dashboard (which shows in account timezone)

### Pitfall 4: Including Refunded/Failed Charges
**What goes wrong:** Revenue includes failed payments or refunded charges, inflates actual income
**Why it happens:** Not filtering charges by status, assuming all charges are successful
**How to avoid:** Filter for `status: 'succeeded'` and check `refunded: false`
**Warning signs:** Revenue doesn't match bank deposits, includes cancelled transactions

### Pitfall 5: Query Pattern Collisions
**What goes wrong:** "Show me Sarah" matches revenue pattern instead of client lookup
**Why it happens:** Revenue patterns placed before client lookup patterns in natural language service
**How to avoid:** Order patterns by specificity - revenue patterns AFTER client/pet patterns
**Warning signs:** Revenue response when asking about clients

### Pitfall 6: Goal Hardcoding
**What goes wrong:** Monthly goal is hardcoded as $9K, Kimmie changes goal and code needs update
**Why it happens:** No settings/configuration for revenue goals
**How to avoid:** Add `monthlyRevenueGoal` to settings or environment variable
**Warning signs:** Kimmie says "that's not my goal anymore" after goal changes

### Pitfall 7: Missing Test Mode Detection
**What goes wrong:** Development/test charges mixed with production charges in revenue calculation
**Why it happens:** Not checking if charge is from test mode API key
**How to avoid:** Use separate Stripe keys for test/production, or filter by `livemode: true` field
**Warning signs:** Revenue includes test charges like "$0.50" or "test card" descriptions

## Code Examples

Verified patterns from official sources:

### Complete Stripe Service Layer
```typescript
// apps/telegram-bot/src/services/stripe.ts
import Stripe from 'stripe';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15', // Current API version
});

/**
 * Get all successful charges within a date range
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns Array of successful charges
 */
export async function getSuccessfulCharges(
  startDate: Date,
  endDate: Date
): Promise<Stripe.Charge[]> {
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  const allCharges: Stripe.Charge[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  // Handle pagination - Stripe returns max 100 per request
  while (hasMore) {
    const response = await stripe.charges.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 100,
      starting_after: startingAfter,
    });

    // Filter for successful, non-refunded charges
    const successfulCharges = response.data.filter(
      (charge) => charge.status === 'succeeded' && !charge.refunded && charge.livemode
    );

    allCharges.push(...successfulCharges);

    hasMore = response.has_more;
    if (hasMore && response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return allCharges;
}

/**
 * Calculate total revenue from charges (converts cents to dollars)
 */
function calculateRevenue(charges: Stripe.Charge[]): number {
  return charges.reduce((total, charge) => {
    // Stripe amounts are in cents
    return total + charge.amount / 100;
  }, 0);
}

/**
 * Get today's revenue
 */
export async function getTodayRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getSuccessfulCharges(startOfDay(now), endOfDay(now));
  return calculateRevenue(charges);
}

/**
 * Get this week's revenue (Sunday - Saturday)
 */
export async function getWeekRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getSuccessfulCharges(
    startOfWeek(now, { weekStartsOn: 0 }), // Sunday = 0
    endOfWeek(now, { weekStartsOn: 0 })
  );
  return calculateRevenue(charges);
}

/**
 * Get this month's revenue
 */
export async function getMonthRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getSuccessfulCharges(startOfMonth(now), endOfMonth(now));
  return calculateRevenue(charges);
}

/**
 * Get year-to-date revenue
 */
export async function getYearRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getSuccessfulCharges(startOfYear(now), endOfYear(now));
  return calculateRevenue(charges);
}
```

### Revenue Formatting Service
```typescript
// apps/telegram-bot/src/services/revenue.ts
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatRevenueResponse(
  period: 'today' | 'week' | 'month' | 'year',
  revenue: number,
  goal?: number
): string {
  const emoji = {
    today: '📅',
    week: '📊',
    month: '💰',
    year: '🎯',
  }[period];

  const label = {
    today: "Today's Revenue",
    week: "This Week's Revenue",
    month: "This Month's Revenue",
    year: 'Year-to-Date Revenue',
  }[period];

  let message = `${emoji} ${label}: ${formatCurrency(revenue)}`;

  // Add goal progress for monthly revenue
  if (period === 'month' && goal) {
    const percentage = Math.min((revenue / goal) * 100, 100);
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    const progressBar = '█'.repeat(filled) + '░'.repeat(empty);

    message += `\n\n🎯 Goal: ${formatCurrency(goal)} (${percentage.toFixed(1)}%)`;
    message += `\n${progressBar}`;

    if (revenue >= goal) {
      message += '\n\n🎉 Goal reached! Amazing work! 👑';
    } else {
      const remaining = goal - revenue;
      message += `\n\n💪 ${formatCurrency(remaining)} to go!`;
    }
  }

  return message;
}
```

### Natural Language Revenue Query Handler
```typescript
// Extend apps/telegram-bot/src/services/natural-language.ts

import { getTodayRevenue, getWeekRevenue, getMonthRevenue, getYearRevenue } from './stripe';
import { formatRevenueResponse } from './revenue';

// Add to NLQueryResult type
export type NLQueryResult =
  | { type: 'client'; data: ClientWithPets; message: string }
  | { type: 'clients'; data: ClientWithPets[]; message: string }
  | { type: 'revenue'; data: string; message: string } // Formatted revenue message
  | { type: 'not_found'; data: null; message: string };

// Add revenue patterns (AFTER client lookup patterns to avoid collisions)
const revenuePatterns = [
  { regex: /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) today/i, period: 'today' as const },
  { regex: /(?:what's|whats) (?:my|our|the) revenue (?:for )?today/i, period: 'today' as const },
  { regex: /today'?s revenue/i, period: 'today' as const },
  { regex: /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) this week/i, period: 'week' as const },
  { regex: /(?:what's|whats) (?:my|our|the) (?:weekly|week'?s) revenue/i, period: 'week' as const },
  { regex: /this week'?s revenue/i, period: 'week' as const },
  { regex: /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) this month/i, period: 'month' as const },
  { regex: /(?:what's|whats) (?:my|our|the) (?:monthly|month'?s) revenue/i, period: 'month' as const },
  { regex: /this month'?s revenue/i, period: 'month' as const },
  { regex: /(?:year to date|ytd|yearly) revenue/i, period: 'year' as const },
  { regex: /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) (?:this|the) year/i, period: 'year' as const },
];

// Add to processNaturalLanguageQuery function (after client patterns, before fallback)
for (const pattern of revenuePatterns) {
  if (pattern.regex.test(text)) {
    try {
      let revenue: number;
      let goal: number | undefined;

      switch (pattern.period) {
        case 'today':
          revenue = await getTodayRevenue();
          break;
        case 'week':
          revenue = await getWeekRevenue();
          break;
        case 'month':
          revenue = await getMonthRevenue();
          goal = parseFloat(process.env.MONTHLY_REVENUE_GOAL || '9000');
          break;
        case 'year':
          revenue = await getYearRevenue();
          break;
      }

      const message = formatRevenueResponse(pattern.period, revenue, goal);

      return {
        type: 'revenue',
        data: message,
        message: 'Revenue calculated',
      };
    } catch (error) {
      console.error('Revenue calculation error:', error);
      return {
        type: 'not_found',
        data: null,
        message: "Couldn't calculate revenue - check Stripe connection",
      };
    }
  }
}
```

### Voice Handler Integration
```typescript
// Update apps/telegram-bot/src/handlers/voice.ts to handle revenue queries

// In the switch statement after transcription
switch (result.type) {
  case 'client':
    await ctx.reply(formatClientProfile(result.data), { parse_mode: 'HTML' });
    break;
  case 'clients':
    await ctx.reply(formatClientList(result.data), { parse_mode: 'HTML' });
    break;
  case 'revenue':
    // Revenue formatted message
    await ctx.reply(result.data); // Already formatted with emojis and progress
    break;
  case 'not_found':
    await ctx.reply(result.message);
    break;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Charges API | Payment Intents API | Stripe v2020-08-27 | For revenue reporting, Charges API still valid - lists all charges regardless of creation method |
| Manual currency formatting | Intl.NumberFormat | Node.js v12+ (2019) | Built-in localization support, no library needed |
| Custom retry logic | Stripe SDK automatic retries | Always in Stripe SDK | Exponential backoff and idempotency handling |
| Storing revenue aggregates | Calculate on-demand | Best practice | Stripe is source of truth, no data staleness |
| Manual date math | date-fns utilities | date-fns v2+ (2018) | Immutable operations, timezone-safe |

**Deprecated/outdated:**
- **Charges API for creating payments**: Use Payment Intents API instead (but Charges API still valid for listing historical charges)
- **Moment.js**: Deprecated in favor of date-fns, Day.js, or Luxon (we use date-fns)
- **Manual Stripe webhook signature verification**: Use stripe.webhooks.constructEvent() (future: webhook for real-time revenue updates)

## Open Questions

Things that couldn't be fully resolved:

1. **Multi-Currency Support**
   - What we know: Stripe charges can be in different currencies (USD, EUR, etc.)
   - What's unclear: Should revenue calculation convert all to USD or show per-currency?
   - Recommendation: Start with USD-only (US-based business), add currency conversion later if international clients appear. Filter charges where `currency === 'usd'` initially.

2. **Refund Handling**
   - What we know: Stripe `charge.refunded` boolean indicates full refund, `refunds` array has partial refunds
   - What's unclear: Should revenue queries show gross (before refunds) or net (after refunds)?
   - Recommendation: Show NET revenue (filter `refunded: false` and subtract partial refunds). Add separate "refunds this month" metric if Kimmie needs it.

3. **Test vs Live Mode**
   - What we know: Stripe has separate test/live mode API keys, charges have `livemode` field
   - What's unclear: Should development environment use test mode for revenue queries?
   - Recommendation: Always filter `livemode: true` in production. In development, use test mode key and accept test charges for testing query logic.

4. **Revenue Goal Configuration**
   - What we know: Requirement says "$8-10K goal" but needs to be configurable
   - What's unclear: Store goal in database (KimmieSettings) or environment variable?
   - Recommendation: Start with environment variable `MONTHLY_REVENUE_GOAL=9000` (midpoint), can move to database if goals change frequently or need historical tracking.

5. **Caching Strategy**
   - What we know: Stripe API has rate limits, calculating same period repeatedly is wasteful
   - What's unclear: Should we cache revenue totals with TTL?
   - Recommendation: Start without caching (Stripe rate limits are generous), add if Kimmie queries very frequently (>10x/day). Simple TTL cache with 5-minute expiration would work.

6. **Dashboard vs Telegram Priority**
   - What we know: Requirements mention both Telegram queries and dashboard visibility
   - What's unclear: Which to implement first?
   - Recommendation: Telegram natural language first (primary requirement: "Kimmie asks..."), dashboard second (nice-to-have visualization). Both use same Stripe service layer.

## Sources

### Primary (HIGH confidence)
- [Stripe Charges API](https://docs.stripe.com/api/charges/list) - Official API reference for listing charges with date filters
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node) - Official Node.js library with TypeScript support
- [date-fns startOf/endOf](https://date-fns.org/docs/Getting-Started) - Date range utilities documentation
- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) - MDN docs for currency formatting

### Secondary (MEDIUM confidence)
- [Stripe Revenue Recognition](https://docs.stripe.com/revenue-recognition/reports) - Official revenue reporting documentation
- [Stripe Analytics](https://docs.stripe.com/billing/subscriptions/analytics) - Stripe's built-in analytics features
- [Telegram Bot Revenue Features](https://core.telegram.org/bots/features) - Telegram bot monetization and reporting capabilities
- [Calculate Revenue from Stripe Node.js](https://blog.risingstack.com/stripe-payments-integration-tutorial-javascript/) - Third-party tutorial on Stripe integration patterns

### Tertiary (LOW confidence)
- [metrics-stripe-charges npm](https://www.npmjs.com/package/metrics-stripe-charges) - Community package for Stripe metrics (not used, reference only)
- [Stripe MRR Calculator](https://github.com/thdaraujo/stripe-mrr) - Open-source MRR calculation example

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Stripe SDK is official, date-fns already in use, patterns verified
- Architecture: HIGH - Service layer pattern matches existing codebase (calendar.ts, search.ts)
- Pitfalls: HIGH - Common Stripe API gotchas documented in official docs (cents conversion, pagination, timezones)
- Natural language: HIGH - Pattern matches existing voice handler implementation
- Dashboard: MEDIUM - Express routes exist but revenue-specific visualization is custom

**Research date:** 2026-01-26
**Valid until:** 60 days (stable stack - Stripe API, date-fns, Node.js Intl all mature)
