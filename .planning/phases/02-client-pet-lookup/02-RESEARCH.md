# Phase 2: Client/Pet Lookup - Research

**Researched:** 2026-01-26
**Domain:** Telegram bot development with Grammy framework, client/pet database search
**Confidence:** HIGH

## Summary

Phase 2 implements client and pet lookup functionality for Kimmie's Telegram bot. The bot already exists using Grammy 1.30.0 framework with TypeScript, PostgreSQL via Prisma ORM, and session management. The research identifies three core technical challenges:

1. **Search Pattern Handling**: Implementing fuzzy search for client names, nicknames, and partial matches while normalizing phone numbers in various formats
2. **Natural Language Query Processing**: Detecting search intent from conversational messages like "who's the lady with the corgi" rather than just commands
3. **Telegram UI Design**: Formatting complex client/pet profiles cleanly with buttons for navigation and actions

The standard approach uses PostgreSQL's pg_trgm extension for fuzzy text search, libphonenumber-js for phone number normalization, and Grammy's callback_query pattern for interactive buttons. The existing bot architecture already has session management, database access, and callback query handlers in place.

**Primary recommendation:** Use Prisma raw queries with PostgreSQL pg_trgm GIN indexes for fuzzy name search, libphonenumber-js for phone number normalization, and structured callback_data patterns for multi-level navigation (client list → client detail → pet detail → visit history).

## Standard Stack

The established libraries/tools for Telegram bot lookup features with Grammy:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| grammy | 1.30.0 | Telegram Bot framework | Already in use, official Grammy framework with TypeScript support, active community |
| @prisma/client | latest | Database ORM | Already in use, type-safe queries, excellent PostgreSQL support |
| PostgreSQL pg_trgm | built-in | Fuzzy text search extension | Industry standard for LIKE/ILIKE query optimization, 45 seconds → 0.047ms improvement |
| libphonenumber-js | 1.11+ | Phone number parsing | Smaller (145 kB) than Google's libphonenumber (550 kB), handles international formats |
| date-fns | 4.1.0 | Date formatting | Already in use, simpler than moment.js, tree-shakeable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fuse.js | 7.x | Client-side fuzzy search | Small datasets (<100 records), nickname matching, fallback when pg_trgm insufficient |
| zod | latest | Schema validation | Already in @looking-glass/shared, validate search input |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pg_trgm + Prisma raw | Fuse.js only | Fuse.js requires loading all data into memory, doesn't scale beyond ~1000 clients, but simpler for nicknames |
| libphonenumber-js | Manual regex | Regex can't handle international formats, edge cases (extensions, vanity numbers), validation |
| Callback queries | Inline queries | Inline queries for public search (not private admin tool), different UX pattern |

**Installation:**
```bash
# Already installed: grammy, @prisma/client, date-fns

# Add for phone number handling
npm install libphonenumber-js

# Optional: only if nickname matching needs more than pg_trgm
npm install fuse.js

# Enable PostgreSQL extension (run once)
# In PostgreSQL: CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## Architecture Patterns

### Recommended Project Structure
```
apps/telegram-bot/src/
├── handlers/
│   ├── lookup.ts              # New: /lookup command, search handlers
│   └── bookings.ts            # Existing: reference for callback patterns
├── services/
│   ├── search.ts              # New: search logic (fuzzy, phone)
│   └── formatting.ts          # New: Telegram message formatting
└── bot.ts                     # Existing: register lookup handler
```

### Pattern 1: Multi-Level Callback Navigation
**What:** Use structured callback_data with state encoded in the button
**When to use:** Navigating from client list → client details → pet profile → visit history
**Example:**
```typescript
// Source: Grammy docs + existing bookings.ts pattern
// Callback data format: "action:id:subaction"
const buttons = [
  [{ text: "🐕 Max (Corgi)", callback_data: "view_pet:clxxx_id:pet_yyy_id" }],
  [{ text: "📅 Visit History", callback_data: "history:clxxx_id:5" }], // last 5
  [{ text: "⬅️ Back to Search", callback_data: "search:back" }]
]

// Handler with regex extraction
lookupHandler.callbackQuery(/^view_pet:(.+):(.+)$/, async (ctx) => {
  const [clientId, petId] = [ctx.match[1], ctx.match[2]]
  // Load pet details, format message, show buttons
  await ctx.answerCallbackQuery() // CRITICAL: answer within 10 seconds
  await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  await ctx.reply(formatPetProfile(pet), { reply_markup: newButtons })
})
```

### Pattern 2: Fuzzy Name Search with pg_trgm
**What:** PostgreSQL trigram index on LOWER(firstName), LOWER(lastName) for case-insensitive fuzzy matching
**When to use:** User types partial names, misspellings, or variations
**Example:**
```typescript
// Source: Prisma GitHub issue #7986, Medium guide on pg_trgm
// 1. Enable extension and create indexes (migration)
// CREATE EXTENSION IF NOT EXISTS pg_trgm;
// CREATE INDEX idx_clients_fname_trgm ON "Client" USING GIN (LOWER("firstName") gin_trgm_ops);
// CREATE INDEX idx_clients_lname_trgm ON "Client" USING GIN (LOWER("lastName") gin_trgm_ops);

// 2. Use raw query for fuzzy search (Prisma doesn't support pg_trgm natively)
const results = await prisma.$queryRaw<Client[]>`
  SELECT *,
    similarity(LOWER("firstName"), LOWER(${searchTerm})) +
    similarity(LOWER("lastName"), LOWER(${searchTerm})) as score
  FROM "Client"
  WHERE LOWER("firstName") % LOWER(${searchTerm})
     OR LOWER("lastName") % LOWER(${searchTerm})
  ORDER BY score DESC
  LIMIT 10
`

// Alternative: ILIKE for simple prefix match (existing index compatible)
const clients = await prisma.client.findMany({
  where: {
    OR: [
      { firstName: { contains: searchTerm, mode: 'insensitive' } },
      { lastName: { contains: searchTerm, mode: 'insensitive' } }
    ]
  },
  take: 10
})
```

### Pattern 3: Phone Number Normalization
**What:** Parse and normalize phone numbers to E.164 format for consistent matching
**When to use:** User searches by phone in any format (555-1234, (555) 123-4567, +1-555-123-4567)
**Example:**
```typescript
// Source: libphonenumber-js docs
import { parsePhoneNumberFromString } from 'libphonenumber-js'

function normalizePhone(input: string): string | null {
  // Try parsing with US default country
  const parsed = parsePhoneNumberFromString(input, 'US')

  if (parsed && parsed.isValid()) {
    return parsed.format('E.164') // Returns +15551234567
  }

  // Fallback: strip non-digits for local matching
  const digits = input.replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : null
}

// Search query
const normalizedPhone = normalizePhone(userInput)
const client = await prisma.client.findUnique({
  where: { phone: normalizedPhone },
  include: { pets: true }
})
```

### Pattern 4: Telegram HTML Formatting
**What:** Use HTML parse mode with limited tag set for readable profiles
**When to use:** Displaying client/pet details, visit history
**Example:**
```typescript
// Source: Telegram Bot API docs, MisterChatter HTML guide
function formatClientProfile(client: Client, pets: Pet[]): string {
  return `
<b>👤 ${client.firstName} ${client.lastName}</b>

📱 <code>${client.phone}</code>
${client.email ? `📧 ${client.email}` : ''}
🎟️ Membership: ${client.membershipTier}

<b>🐾 Pets (${pets.length}):</b>
${pets.map(pet => `  • ${pet.name} (${pet.species})`).join('\n')}
`.trim()
}

// Send with HTML parse mode
await ctx.reply(formatClientProfile(client, pets), {
  parse_mode: 'HTML',
  reply_markup: { inline_keyboard: buttons }
})

// IMPORTANT: No <br> tag support - use \n for line breaks
// Supported tags: <b>, <i>, <u>, <s>, <code>, <pre>, <a href="">
```

### Pattern 5: Natural Language Intent Detection
**What:** Detect search intent from conversational messages using keyword patterns
**When to use:** User asks "who's the lady with the corgi" instead of "/lookup corgi"
**Example:**
```typescript
// Source: Existing help.ts pattern, Telegram bot NLP patterns
lookupHandler.on('message:text', async (ctx, next) => {
  const text = ctx.message.text.toLowerCase()

  // Phone number pattern (10 digits, various formats)
  const phoneMatch = text.match(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/)
  if (phoneMatch) {
    return handlePhoneSearch(ctx, phoneMatch[0])
  }

  // Natural language search patterns
  const patterns = [
    /who(?:'s|\s+is)\s+(.+?)(?:\s+with\s+(.+))?$/i,  // "who's Sarah" or "who's the lady with the corgi"
    /find\s+(.+)/i,                                     // "find Sarah"
    /show\s+(?:me\s+)?(.+)/i,                          // "show me Sarah"
    /lookup\s+(.+)/i                                    // "lookup Sarah"
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return handleNameSearch(ctx, match[1].trim())
    }
  }

  // Not a lookup query - pass to next handler
  await next()
})
```

### Anti-Patterns to Avoid
- **Loading all clients into memory**: Use database queries with LIMIT, not `findMany()` without pagination
- **Forgetting answerCallbackQuery()**: Buttons stay highlighted for 30+ seconds, poor UX - always answer within 10 seconds
- **Callback data over 64 bytes**: Telegram enforces strict limit - use short IDs, not full JSON
- **Sequential database calls**: Load client with `include: { pets: true }` instead of separate queries
- **Hard-coding phone formats**: US-only assumptions break for international clients - use libphonenumber-js

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phone number parsing | Regex for (555) 123-4567 | libphonenumber-js | 200+ country formats, extensions, vanity numbers, validation |
| Fuzzy string matching | Levenshtein distance in JS | PostgreSQL pg_trgm | Performance (45s → 0.047ms), handles 10k+ records, tested at scale |
| Nickname matching | Manual nickname dictionary | Fuse.js with nickname list OR AI | "Bob" → "Robert", "Katie" → "Kathryn" - 100+ common nicknames |
| Date formatting | String concatenation | date-fns (already installed) | Timezones, locales, relative time ("2 days ago") |
| Message pagination | Manual button state tracking | Callback data encoding | State in button prevents session bugs, survives bot restart |

**Key insight:** Phone numbers and fuzzy search have massive edge case complexity. Google's libphonenumber is 10+ years of production fixes. pg_trgm is battle-tested for PostgreSQL full-text search at massive scale. Don't reimplement - integrate.

## Common Pitfalls

### Pitfall 1: Callback Query Not Answered
**What goes wrong:** User taps a button, button stays highlighted/loading for 30+ seconds, then times out
**Why it happens:** Forgot to call `ctx.answerCallbackQuery()` or took longer than 10 seconds to respond
**How to avoid:**
- Call `ctx.answerCallbackQuery()` FIRST before any database queries
- Use `ctx.answerCallbackQuery({ text: 'Loading...' })` for instant feedback
- If operation takes >5 seconds, answer immediately then send separate message
**Warning signs:** Users report "buttons not working" or "stuck loading"

### Pitfall 2: Case-Sensitive Search Without Index
**What goes wrong:** ILIKE query on firstName/lastName takes 5-10 seconds with 1000+ clients
**Why it happens:** PostgreSQL ILIKE can't use B-tree indexes, does full table scan
**How to avoid:**
- Create GIN indexes with pg_trgm: `CREATE INDEX idx_fname_trgm ON "Client" USING GIN (LOWER("firstName") gin_trgm_ops)`
- Use LOWER() in both index and query for consistency
- Test with EXPLAIN ANALYZE to verify index usage
**Warning signs:** `EXPLAIN` shows "Seq Scan" instead of "Index Scan", query time >100ms

### Pitfall 3: Callback Data Over 64 Bytes
**What goes wrong:** Telegram API returns 400 BUTTON_DATA_INVALID error, buttons don't render
**Why it happens:** Embedded full client name or multiple fields in callback_data
**How to avoid:**
- Use database IDs only: `view_pet:clxxx123:petyyy456` (short cuid)
- Remove emojis from callback_data (use in button text only)
- Consider base62 encoding for very long IDs
- Measure: `Buffer.byteLength('view_pet:...', 'utf8')` must be ≤64
**Warning signs:** Buttons missing, API error logs mentioning "BUTTON_DATA_INVALID"

### Pitfall 4: Phone Number Format Assumptions
**What goes wrong:** Search for "(555) 123-4567" doesn't match database record "+15551234567"
**Why it happens:** Stored phone in one format, searching in another, no normalization
**How to avoid:**
- Normalize ALL phone numbers to E.164 (+15551234567) at write time
- Add database migration to normalize existing records
- Use libphonenumber-js.formatNational() for display only
- Search always on normalized field
**Warning signs:** Users say "I typed their number but it didn't find them"

### Pitfall 5: Natural Language Query Stealing Commands
**What goes wrong:** User types "/help" but natural language handler processes it first
**Why it happens:** `on('message:text')` handler doesn't check for commands or call `next()`
**How to avoid:**
- Check `ctx.message.text.startsWith('/')` and call `next()` to pass through
- Register command handlers BEFORE natural language handlers
- Use specific patterns (regex) instead of catching all text
- See existing help.ts for reference pattern
**Warning signs:** Commands stop working, slash commands treated as search queries

### Pitfall 6: Session State Corruption
**What goes wrong:** Search results from User A shown to User B, or stale results after new search
**Why it happens:** Grammy session is per-chat but storing search results in session
**How to avoid:**
- Don't store search results in session (too large, stale quickly)
- Store only search query string and pagination offset
- Fetch fresh results on each button press using callback_data IDs
- Or use lazy session pattern to defer writes
**Warning signs:** Wrong data shown after bot restart or multiple rapid searches

## Code Examples

Verified patterns from official sources:

### Complete Lookup Command Handler
```typescript
// Source: Grammy docs + existing bookings.ts pattern
import { Composer } from 'grammy'
import { prisma } from '@looking-glass/db'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

type BotContext = import('../bot').BotContext

export const lookupHandler = new Composer<BotContext>()

// Command: /lookup [query]
lookupHandler.command('lookup', async (ctx) => {
  const query = ctx.match.trim()

  if (!query) {
    await ctx.reply(
      '🔍 <b>Lookup a Client</b>\n\n' +
      'Type a name or phone number:\n' +
      '• /lookup Sarah\n' +
      '• /lookup 555-1234\n' +
      'Or just type naturally: "who\'s the lady with the corgi"',
      { parse_mode: 'HTML' }
    )
    return
  }

  await handleSearch(ctx, query)
})

// Natural language search
lookupHandler.on('message:text', async (ctx, next) => {
  const text = ctx.message.text.toLowerCase()

  // Skip commands
  if (text.startsWith('/')) {
    return next()
  }

  // Detect search intent patterns
  const searchPatterns = [
    /who(?:'s|\s+is)\s+(.+)/i,
    /find\s+(.+)/i,
    /lookup\s+(.+)/i
  ]

  for (const pattern of searchPatterns) {
    const match = text.match(pattern)
    if (match) {
      return handleSearch(ctx, match[1].trim())
    }
  }

  await next()
})

async function handleSearch(ctx: BotContext, query: string) {
  // Try phone number first
  const phone = parsePhoneNumberFromString(query, 'US')
  if (phone?.isValid()) {
    const client = await prisma.client.findFirst({
      where: { phone: phone.format('E.164') },
      include: { pets: true }
    })

    if (client) {
      return showClientProfile(ctx, client)
    }
  }

  // Fuzzy name search
  const clients = await searchClientsByName(query)

  if (clients.length === 0) {
    await ctx.reply(`No clients found matching "${query}" 🔍`)
    return
  }

  if (clients.length === 1) {
    return showClientProfile(ctx, clients[0])
  }

  // Multiple matches - show list
  await showClientList(ctx, clients)
}
```

### Fuzzy Name Search with pg_trgm
```typescript
// Source: Prisma GitHub discussions, pg_trgm guide
async function searchClientsByName(query: string) {
  // Method 1: Prisma ILIKE (simpler, needs GIN index)
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: { pets: true },
    take: 10
  })

  // Method 2: Raw SQL with similarity scoring (better fuzzy matching)
  // Requires: CREATE EXTENSION pg_trgm; CREATE INDEX ... USING GIN
  /*
  const clients = await prisma.$queryRaw`
    SELECT c.*,
      (similarity(LOWER(c."firstName"), LOWER(${query})) +
       similarity(LOWER(c."lastName"), LOWER(${query}))) as score
    FROM "Client" c
    WHERE LOWER(c."firstName") % LOWER(${query})
       OR LOWER(c."lastName") % LOWER(${query})
    ORDER BY score DESC
    LIMIT 10
  `
  */

  return clients
}
```

### Telegram Formatting with Buttons
```typescript
// Source: Telegram Bot API, Grammy docs
function formatClientProfile(client: Client & { pets: Pet[] }): string {
  const petsSection = client.pets.map(pet =>
    `  🐾 ${pet.name} - ${pet.species}${pet.breed ? ` (${pet.breed})` : ''}`
  ).join('\n')

  return `
<b>👤 ${client.firstName} ${client.lastName}</b>

📱 <code>${client.phone}</code>
${client.email ? `📧 ${client.email}\n` : ''}
🎟️ Membership: <b>${client.membershipTier.replace('_', ' ')}</b>

<b>Pets:</b>
${petsSection || '  <i>No pets registered</i>'}
`.trim()
}

async function showClientProfile(ctx: BotContext, client: Client & { pets: Pet[] }) {
  const message = formatClientProfile(client)

  // Build buttons for each pet + visit history
  const buttons = client.pets.map(pet => ([
    { text: `🐕 View ${pet.name}`, callback_data: `pet:${pet.id}` }
  ]))

  buttons.push([
    { text: '📅 Visit History', callback_data: `history:${client.id}` }
  ])

  await ctx.reply(message, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: buttons }
  })
}

// Callback handler for pet profile
lookupHandler.callbackQuery(/^pet:(.+)$/, async (ctx) => {
  const petId = ctx.match[1]

  await ctx.answerCallbackQuery() // CRITICAL: answer immediately

  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    include: {
      client: true,
      passport: {
        include: { vaccinations: true }
      }
    }
  })

  if (!pet) {
    await ctx.answerCallbackQuery({ text: 'Pet not found' })
    return
  }

  const message = `
<b>🐕 ${pet.name}</b>

Species: ${pet.species}
Breed: ${pet.breed || 'Mixed'}
Age: ${calculateAge(pet.birthDate)}
Fixed: ${pet.isFixed ? 'Yes ✅' : 'No'}
Temperament: ${formatTemperament(pet.temperament)}

${pet.passport?.allergies ? `⚠️ Allergies: ${pet.passport.allergies}\n` : ''}
${pet.behaviorNotes ? `📝 Behavior: ${pet.behaviorNotes}\n` : ''}
${pet.passport?.specialInstructions ? `⭐ Special: ${pet.passport.specialInstructions}` : ''}
`.trim()

  await ctx.editMessageText(message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '⬅️ Back to Client', callback_data: `client:${pet.clientId}` }]
      ]
    }
  })
})
```

### Visit History Display
```typescript
// Source: Existing bookings.ts + Prisma patterns
async function showVisitHistory(ctx: BotContext, clientId: string, limit = 5) {
  const appointments = await prisma.appointment.findMany({
    where: {
      clientId,
      status: 'COMPLETED'
    },
    include: {
      pet: true,
      services: true
    },
    orderBy: { completedAt: 'desc' },
    take: limit
  })

  if (appointments.length === 0) {
    await ctx.reply('No visit history found')
    return
  }

  const history = appointments.map((apt, i) => {
    const date = format(apt.completedAt!, 'MMM d, yyyy')
    const services = apt.services.map(s => s.name).join(', ')
    return `${i + 1}. <b>${date}</b> - ${apt.pet.name}\n   ${services}`
  }).join('\n\n')

  await ctx.reply(
    `<b>📅 Visit History (Last ${limit})</b>\n\n${history}`,
    { parse_mode: 'HTML' }
  )
}

lookupHandler.callbackQuery(/^history:(.+):?(\d+)?$/, async (ctx) => {
  await ctx.answerCallbackQuery()

  const clientId = ctx.match[1]
  const limit = parseInt(ctx.match[2] || '5')

  await showVisitHistory(ctx, clientId, limit)
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma LIKE queries | pg_trgm GIN indexes | 2024-2025 | 100x-1000x performance improvement for fuzzy search |
| Manual phone parsing | libphonenumber-js | Ongoing | Handles 200+ countries vs US-only regex |
| Grammy Scenes plugin | Grammy Conversations | Grammy v1.27+ (2024) | Built-in conversation flow without external plugin |
| Markdown parse mode | HTML parse mode | Ongoing | Better link formatting, more control |
| In-memory session | Lazy session with DB | Grammy v1.20+ (2023) | Survives bot restarts, handles concurrent updates |

**Deprecated/outdated:**
- **Grammy Scenes**: Replaced by built-in Conversations plugin - more flexible, better error handling
- **Moment.js**: Replaced by date-fns - smaller bundle size, tree-shakeable, better TypeScript support
- **Markdown parse mode**: MarkdownV2 is complex with excessive escaping - HTML is cleaner for bot messages

## Open Questions

Things that couldn't be fully resolved:

1. **Nickname Matching Quality**
   - What we know: Fuse.js can fuzzy match, pg_trgm handles typos
   - What's unclear: Whether "Katie" → "Katherine" mapping needs manual dictionary or AI
   - Recommendation: Start with pg_trgm only, add Fuse.js with nickname list if users report misses

2. **Pet Temperament Display ("Spicy Meter")**
   - What we know: Prisma enum has NORMAL, ANXIOUS, FEARFUL, AGGRESSIVE, etc.
   - What's unclear: How to map to 1-3 pepper emoji system mentioned in prior decisions
   - Recommendation: Create mapping function in formatting.ts: AGGRESSIVE=🌶️🌶️🌶️, ANXIOUS=🌶️🌶️, etc.

3. **Search Performance at Scale**
   - What we know: pg_trgm works well up to 10k-100k records
   - What's unclear: Current client count, growth rate
   - Recommendation: Start with pg_trgm, add pagination if search returns >10 results regularly

4. **International Phone Numbers**
   - What we know: libphonenumber-js supports 200+ countries
   - What's unclear: Whether business has international clients
   - Recommendation: Use libphonenumber-js with 'US' default, supports international if needed later

## Sources

### Primary (HIGH confidence)
- [Grammy Framework](https://grammy.dev/) - Official Grammy documentation
- [Grammy Sessions Plugin](https://grammy.dev/plugins/session) - Session management patterns
- [Grammy Commands Guide](https://grammy.dev/guide/commands) - Command and message handling
- [Prisma Full-Text Search](https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search) - PostgreSQL full-text search with Prisma
- [PostgreSQL pg_trgm Documentation](https://www.postgresql.org/docs/current/pgtrgm.html) - Trigram extension reference
- [libphonenumber-js GitHub](https://github.com/catamphetamine/libphonenumber-js) - Phone parsing library
- [Telegram Bot API](https://core.telegram.org/bots/api) - Official Telegram Bot API
- [Telegram HTML Formatting Guide](https://www.misterchatter.com/docs/telegram-html-formatting-guide-supported-tags/) - Supported HTML tags

### Secondary (MEDIUM confidence)
- [Building Telegram Bot with Grammy (LogRocket 2026)](https://blog.logrocket.com/building-telegram-bot-grammy/) - Modern Grammy patterns
- [PostgreSQL ILIKE Performance (Medium)](https://medium.com/codex/case-insensitive-text-search-in-postgresql-whats-fast-and-what-fails-f836024c4590) - Case-insensitive search optimization
- [pg_trgm Indexing Guide (Medium)](https://medium.com/@valentim.dba/the-essential-guide-to-indexing-like-ilike-searches-in-postgresql-using-pg-trgm-c72318ecce08) - Practical pg_trgm setup
- [Grammy Conversations Issue #136](https://github.com/grammyjs/grammY/issues/136) - Why Scenes are deprecated
- [Telegram Inline Keyboard UX Design](https://wyu-telegram.com/blogs/444/) - Callback query optimization

### Tertiary (LOW confidence)
- [Telegram Search Bots 2026](https://nicegram.app/blog/telegram-search-bots-the-best-options) - Natural language search patterns
- [Fuse.js Documentation](https://www.fusejs.io/) - Fuzzy search library reference
- [Name Matching Library](https://github.com/craj/name-match) - Node.js name matching with nicknames
- [Phone Number Lookup Tools 2026](https://www.saleshandy.com/blog/phone-number-lookup-tools/) - Phone validation approaches

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Grammy and Prisma already in use, pg_trgm and libphonenumber-js are industry standards
- Architecture: HIGH - Patterns verified in existing bookings.ts, official Grammy docs, multiple production references
- Pitfalls: HIGH - Documented in Grammy issues, Telegram API limits, PostgreSQL performance guides

**Research date:** 2026-01-26
**Valid until:** 2026-02-25 (30 days - stable technologies, but Grammy updates frequently)
