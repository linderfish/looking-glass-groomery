# Coding Conventions

**Analysis Date:** 2026-01-25

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `BreathingBackground.tsx`, `Footer.tsx`)
- Services: camelCase with `.ts` extension (e.g., `booking.ts`, `conversation.ts`, `intent.ts`)
- Routes: camelCase with `.ts` extension (e.g., `chat.ts`, `webhook.ts`, `oauth.ts`)
- Utilities/helpers: camelCase with `.ts` extension
- Schema/types: camelCase with `.ts` extension (e.g., `types.ts`, `constants.ts`)

**Functions:**
- Regular functions: camelCase (e.g., `getOrCreateConversation`, `detectIntent`, `handleBookingFlow`)
- Async functions: camelCase, no special prefix (e.g., `handleBookingFlow`, `generateResponse`)
- Private helpers: prefix with underscore for module-level privacy (e.g., `_anthropic`, `_openai` in `llm.ts`)
- React components: PascalCase and exported as default or named export

**Variables:**
- Constants: UPPER_SNAKE_CASE for truly constant values (e.g., `CHESHIRE_SYSTEM_PROMPT`, `FALLBACK_RESPONSES`)
- Local variables: camelCase (e.g., `petName`, `preferredDate`, `bookingContext`)
- Interface/type instances: camelCase (e.g., `extracted`, `personality`, `state`)

**Types/Interfaces:**
- PascalCase for all types and interfaces (e.g., `DetectedIntent`, `BookingFlowState`, `ResponseContext`)
- Zod schemas: PascalCase with `Schema` suffix (e.g., `BookingRequestSchema`, `DesignBlueprintSchema`)
- Enums: PascalCase with exported const (e.g., `Species`, `BookingSource`)

## Code Style

**Formatting:**
- No explicit linting configuration found; style is enforced through TypeScript strict mode
- Indentation: 2 spaces (observed consistently across all files)
- Line length: appears to favor ~100-120 character lines before wrapping
- Semicolons: present on all statements

**Linting:**
- TypeScript strict mode enabled (`"strict": true` in `apps/web/tsconfig.json`)
- No ESLint configuration detected in root or app directories
- No Prettier configuration detected
- Relying on TypeScript compiler for type safety and basic code quality

## Import Organization

**Order:**
1. External dependencies (React, Next, third-party libraries like `date-fns`, `zod`)
2. Relative imports from monorepo packages (`@looking-glass/ai`, `@looking-glass/db`, `@looking-glass/shared`)
3. Local relative imports (`./(./services, ./routes, ./components`)

**Examples from codebase:**
```typescript
// apps/cheshire/src/routes/chat.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '@looking-glass/db'
import { getOrCreateConversation, addMessage } from '../services/conversation'
import { detectIntent } from '../services/intent'
```

**Path Aliases:**
- Web app: `@/*` → `./src/*` (configured in `apps/web/tsconfig.json`)
- Monorepo packages imported with scope: `@looking-glass/ai`, `@looking-glass/db`, `@looking-glass/shared`
- No TypeScript path aliases for services or routes (direct relative imports used)

## Error Handling

**Patterns:**
- Try/catch with console.error logging for unexpected errors
- JSON error responses with error flag or HTTP status codes
- Fallback responses for service failures (e.g., `FALLBACK_RESPONSES` in `apps/web/src/app/api/chat/route.ts`)
- Error messages returned to user in JSON response or as user-friendly string
- No custom Error classes observed; using standard Error objects

**Examples:**
```typescript
// From apps/cheshire/src/routes/chat.ts (line 120-126)
catch (error) {
  console.error('Chat error:', error)
  return c.json({
    response: "Curiouser and curiouser... something went wrong! 🙀 Try again?",
    error: true,
  }, 500)
}

// From apps/web/src/app/api/chat/route.ts (line 79-87)
catch (error) {
  console.error('Chat API error:', error)
  const body = await request.clone().json().catch(() => ({ message: '' }))
  return NextResponse.json({
    response: getFallbackResponse(body.message || ''),
    sessionId: 'fallback',
    error: false,
  })
}
```

## Logging

**Framework:** console.log, console.error (no external logging library)

**Patterns:**
- Debug logging for booking flow: `console.log(`[Booking] message`)` prefix for context
- Intent detection: `console.log('[Intent] message')` prefix
- Error logging: `console.error('context:', error)` with context description
- Structured logging with emoji indicators (✅, ❌, 🐱) for visual distinction
- Log at key decision points: intent detection, state transitions, database operations

**Examples from booking.ts:**
```typescript
console.log(`[Booking] ========== NEW MESSAGE ==========`)
console.log(`[Booking] Channel: ${context.channel}`)
console.log(`[Booking] User message: "${message}"`)
console.log(`[Booking] ✅ Time is available!`)
console.log(`[Booking] ❌ Time not available: ${availabilityCheck.conflictReason}`)
```

## Comments

**When to Comment:**
- Major section breaks and logical groupings (e.g., `// ============== BOOKING ==============`)
- Complex algorithm explanations (e.g., regex patterns in `extractBookingData`)
- Critical business logic with side effects (e.g., transaction isolation levels)
- Important assumptions or caveats (e.g., "CRITICAL:" prefix for critical notes)

**JSDoc/TSDoc:**
- Functions have single-line or multi-line JSDoc comments with purpose description
- No @param or @return tags observed; instead purpose is stated in opening comment
- Example from `booking.ts`:
```typescript
/**
 * Look up services from the database by matching service names
 * Uses fuzzy matching to handle variations in how users describe services
 */
async function lookupServices(serviceNames: string[], petSpecies: Species): Promise<ServiceLookupResult>
```

**Critical Notes:**
- Use "CRITICAL:" prefix to flag important sections affecting functionality
- Examples: "CRITICAL: Load dotenv FIRST", "CRITICAL: Check availability IMMEDIATELY"
- Use "IMPORTANT:" prefix for assumptions that could change behavior

## Function Design

**Size:**
- Functions range from 5-20 lines for simple operations to 100+ lines for complex flows
- Complex functions like `handleBookingFlow` (200+ lines) are vertically organized with clear sections
- Prefer splitting complex logic into smaller helper functions

**Parameters:**
- Use object parameters for multiple related arguments (e.g., `context: BookingContext`)
- Destructure parameters when only a few primitive values needed
- Keep parameter lists under 4 items; use objects for more

**Return Values:**
- Explicit return types via TypeScript (no implicit returns)
- Return objects for multiple values (e.g., `{ success: boolean; appointmentId?: string; error?: string }`)
- Return null or undefined for optional values, not empty strings
- Promise return types for async operations

**Example structure:**
```typescript
export async function handleBookingFlow(
  message: string,
  conversation: { id: string; messages: Array<...>; client?: ... | null },
  intent: DetectedIntent,
  context: BookingContext
): Promise<string>
```

## Module Design

**Exports:**
- Named exports for most functions and types
- Default exports rare (only seen in `oauth.ts`)
- Barrel files (`index.ts`) re-export from subdirectories for package-level public API
- Example from `packages/ai/src/index.ts`:
```typescript
export * from './fal'
export * from './llm'
export { CHESHIRE_SYSTEM_PROMPT, KIMMIE_TELEGRAM_PERSONA } from './prompts/cheshire'
export * from './looking-glass'
```

**File Organization:**
- Service functions grouped by domain: `booking.ts`, `conversation.ts`, `intent.ts`, `response.ts`
- Route handlers in `routes/` directory, one per file
- Personality/adaptive behavior in `personality/` subdirectory
- Types and schemas in `types.ts` and `constants.ts` at package level

**No Barrel Files for Routes:**
- Each route file (`chat.ts`, `webhook.ts`) exports a single Hono router
- Imported individually in main app file: `import { chatRoutes } from './routes/chat'`

---

*Convention analysis: 2026-01-25*
