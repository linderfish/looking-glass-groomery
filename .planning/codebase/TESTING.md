# Testing Patterns

**Analysis Date:** 2026-01-25

## Test Framework

**Runner:**
- Not detected - no Jest, Vitest, or other test runner configured
- No test files found in `apps/` or `packages/` directories
- TypeScript strict mode provides compile-time type checking

**Assertion Library:**
- Not detected - no testing framework installed

**Run Commands:**
```bash
# No testing commands found in package.json scripts
# Only available commands:
npm run build              # Build all apps
npm run dev                # Start all apps
npm run lint               # Lint all apps
npm run db:generate        # Regenerate Prisma client
npm run db:push            # Push schema changes
```

## Test File Organization

**Location:**
- No test files currently exist in the codebase
- If implemented, pattern would likely be co-located alongside source files based on Next.js and Bun conventions

**Naming:**
- Not applicable - no tests exist

**Structure:**
- Not applicable - no tests exist

## Current State: No Tests

The codebase has **zero test coverage**. The project relies entirely on:

1. **TypeScript strict mode** - Type safety at compile time
2. **Manual testing** - Browser/API manual verification
3. **Zod validation** - Runtime schema validation on API boundaries

### Key areas without tests:

**API Layer** (`apps/cheshire/src/routes/`):
- Chat endpoint request/response handling
- Webhook validation and processing
- OAuth flow
- Waiver management

**Business Logic** (`apps/cheshire/src/services/`):
- `booking.ts` - Complex booking state machine, 685 lines with critical business logic
- `intent.ts` - Intent detection with pattern matching and LLM fallback
- `conversation.ts` - Conversation lifecycle management
- `response.ts` - Response generation with personality adaptation
- `calendar.ts` - Google Calendar integration
- `availability.ts` - Slot availability checking

**Web Frontend** (`apps/web/src/`):
- Next.js pages and components
- Client-side state management (Zustand)
- Animations and visual effects

**Shared Packages** (`packages/`):
- `@looking-glass/ai` - LLM integrations, image generation
- `@looking-glass/shared` - Zod schemas validation logic
- `@looking-glass/db` - Prisma client (no unit tests)

## Runtime Validation Instead of Tests

The codebase uses **Zod schemas** as a primary validation mechanism:

**Example from apps/cheshire/src/routes/chat.ts:**
```typescript
const chatRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
  clientId: z.string().optional(),
})

chatRoutes.post(
  '/',
  zValidator('json', chatRequestSchema),
  async (c) => {
    const { message, sessionId, clientId } = c.req.valid('json')
    // Guaranteed to be validated by Zod at this point
  }
)
```

**Zod schemas in packages/shared/src/types.ts:**
- `BookingRequestSchema` - Validates booking input
- `BookingDraftSchema` - Validates booking state
- `DesignRequestSchema` - Validates design requests
- `DesignBlueprintSchema` - Validates grooming instructions
- `TelegramMessageSchema` - Validates bot notifications
- `ChatIntentSchema` - Validates intent types
- `ConversationContextSchema` - Validates conversation state

## Error Handling (Implicit Testing)

The absence of tests means error handling is critical for catching issues:

**Pattern 1: Try/Catch with Fallback**
```typescript
// From apps/cheshire/src/services/booking.ts (line 383-394)
catch (error) {
  console.error('Failed to get availability slots:', error)

  // Fallback to hardcoded slots if availability check fails
  const today = startOfDay(new Date())
  return [
    format(setHours(setMinutes(addDays(today, 1), 0), 10), "EEEE 'at' h:mm a"),
    format(setHours(setMinutes(addDays(today, 1), 0), 14), "EEEE 'at' h:mm a"),
    // ...
  ]
}
```

**Pattern 2: Transaction with Rollback**
```typescript
// From apps/cheshire/src/services/booking.ts (line 586-642)
const appointment = await prisma.$transaction(async (tx) => {
  // Check for conflicting appointments WITHIN the transaction
  const conflicting = await tx.appointment.findFirst({ /* ... */ })

  if (conflicting) {
    throw new Error(`This time slot conflicts with an existing appointment...`)
  }

  // Create appointment atomically
  return tx.appointment.create({ /* ... */ })
}, {
  isolationLevel: 'Serializable', // Prevents phantom reads
  timeout: 10000,
})
```

## Patterns NOT Found

**No mocking framework** - Jest, Vitest, or Sinon not installed
**No fixtures** - No test data factories
**No test doubles** - No mock services or stubs
**No integration tests** - No end-to-end test flows
**No CI test runs** - No automated test verification in pipeline

## Recommended Testing Approach

For future test implementation, consider:

**Unit Tests for Pure Functions:**
- `extractBookingData()` in `intent.ts` - Pattern matching logic
- `mapPetTypeToSpecies()` in `booking.ts` - Type mapping
- `parsePreferredTime()` in `booking.ts` - Date parsing
- Intent detection patterns in `intent.ts`

**Integration Tests for Service Workflows:**
- Complete booking flow from chat input → database creation
- Conversation state management with multi-turn dialogues
- Intent detection with mixed pattern/LLM fallback
- Google Calendar integration for availability

**API Tests for Endpoints:**
- Chat endpoint with various message intents
- Webhook payload validation
- OAuth callback handling
- Error response formatting

**Recommended Stack:**
- Framework: Vitest (faster, ESM-native, better for monorepo)
- HTTP testing: `@testing-library/node` or similar
- Database: Use test database or Prisma's `@prisma/instrumentation` for mocking
- Mocking: `vitest.mock()` or `msw` for HTTP mocks

## Critical Code Paths Without Tests

**Booking State Machine** (`booking.ts`):
- 6 state transitions (INITIAL → COLLECTING_PET → COLLECTING_DATE → COLLECTING_SERVICE → CONFIRMING → create)
- Complex availability checking with Google Calendar + DB + buffer time
- Race condition prevention via Serializable transactions
- No test coverage for edge cases: double-booking, availability conflicts, missing data

**Intent Detection** (`intent.ts`):
- Pattern-based detection with regex fallback
- LLM-based classification for ambiguous cases
- Confidence scoring and threshold logic
- No test coverage for pattern false positives or ambiguous messages

**Conversation State Management** (`conversation.ts`):
- Conversation lifecycle: ACTIVE → HANDED_OFF or RESOLVED
- Message history retrieval limited to last 20 messages
- Client linkage after identification
- No test coverage for concurrent message handling

---

*Testing analysis: 2026-01-25*
