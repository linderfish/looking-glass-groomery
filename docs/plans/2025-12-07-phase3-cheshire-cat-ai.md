# Phase 3: Cheshire Cat AI Concierge

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Cheshire Cat AI service that handles all client touchpoints (website chat, Instagram DMs, Facebook Messenger) with an adaptive personality that autonomously books appointments, answers FAQs, runs consultations, and escalates when needed.

**Architecture:** Standalone service that receives messages from multiple channels via webhooks, processes with LLM, maintains conversation state, and routes actions to booking system or Telegram for Kimmie.

**Tech Stack:** Bun runtime, Hono framework, Anthropic Claude API, PostgreSQL (via Prisma), webhook integrations

---

## Project Structure

```
apps/cheshire/
├── src/
│   ├── index.ts              # Hono server entry
│   ├── routes/
│   │   ├── webhook.ts        # Incoming message webhooks
│   │   ├── chat.ts           # Website chat API
│   │   └── health.ts         # Health check
│   ├── services/
│   │   ├── conversation.ts   # Conversation state management
│   │   ├── intent.ts         # Intent detection & routing
│   │   ├── booking.ts        # Booking flow handler
│   │   ├── consultation.ts   # Looking Glass consultation flow
│   │   ├── faq.ts            # FAQ responses
│   │   └── escalation.ts     # Escalate to Kimmie
│   ├── channels/
│   │   ├── instagram.ts      # Instagram DM handler
│   │   ├── facebook.ts       # Facebook Messenger handler
│   │   └── website.ts        # Website chat handler
│   ├── personality/
│   │   ├── adaptive.ts       # Tone adaptation logic
│   │   └── responses.ts      # Response templates
│   └── utils/
│       └── prompts.ts        # System prompts
├── package.json
└── tsconfig.json
```

---

## Task 3.1: Create Cheshire Service App

**Files:**
- Create: `apps/cheshire/package.json`
- Create: `apps/cheshire/tsconfig.json`
- Create: `apps/cheshire/src/index.ts`
- Create: `apps/cheshire/src/routes/health.ts`

**Step 1: Create package.json**

```json
{
  "name": "@looking-glass/cheshire",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "start": "bun run src/index.ts",
    "build": "bun build src/index.ts --outdir=dist --target=bun"
  },
  "dependencies": {
    "@looking-glass/ai": "workspace:*",
    "@looking-glass/db": "workspace:*",
    "@looking-glass/shared": "workspace:*",
    "hono": "^4.6.0",
    "@hono/node-server": "^1.13.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.6.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create src/index.ts**

```typescript
// apps/cheshire/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { healthRoutes } from './routes/health'
import { chatRoutes } from './routes/chat'
import { webhookRoutes } from './routes/webhook'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: [
    'https://throughthelookingglass.pet',
    'http://localhost:3000',
  ],
  credentials: true,
}))

// Routes
app.route('/health', healthRoutes)
app.route('/chat', chatRoutes)
app.route('/webhook', webhookRoutes)

// Root
app.get('/', (c) => c.json({
  name: 'Cheshire Cat AI',
  status: 'grinning',
  message: "We're all mad here~ 😼",
}))

const port = process.env.PORT || 3001

console.log(`😼 Cheshire Cat is awakening on port ${port}...`)

export default {
  port,
  fetch: app.fetch,
}
```

**Step 4: Create src/routes/health.ts**

```typescript
// apps/cheshire/src/routes/health.ts
import { Hono } from 'hono'
import { prisma } from '@looking-glass/db'

export const healthRoutes = new Hono()

healthRoutes.get('/', async (c) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        ai: 'ready',
      },
      cheshire: 'grinning 😼',
    })
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})
```

**Step 5: Install dependencies and commit**

```bash
cd apps/cheshire
pnpm install
cd ../..
git add .
git commit -m "feat(cheshire): initialize Cheshire Cat AI service"
```

---

## Task 3.2: Build Conversation Management

**Files:**
- Create: `apps/cheshire/src/services/conversation.ts`
- Create: `apps/cheshire/src/services/intent.ts`

**Step 1: Create conversation.ts**

```typescript
// apps/cheshire/src/services/conversation.ts
import { prisma, ConversationChannel, ConversationStatus, MessageRole } from '@looking-glass/db'
import { ConversationContext, ConversationContextSchema } from '@looking-glass/shared'

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/**
 * Get or create a conversation for a channel/user
 */
export async function getOrCreateConversation(
  channel: ConversationChannel,
  externalId: string,
  clientId?: string
) {
  // Try to find existing active conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      channel,
      externalId,
      status: 'ACTIVE',
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 20, // Last 20 messages for context
      },
      client: true,
    },
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        channel,
        externalId,
        clientId,
        status: 'ACTIVE',
      },
      include: {
        messages: true,
        client: true,
      },
    })
  }

  return conversation
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  metadata?: { intent?: string; confidence?: number }
) {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      intent: metadata?.intent,
      confidence: metadata?.confidence,
    },
  })
}

/**
 * Get conversation history formatted for LLM
 */
export function formatHistoryForLLM(
  messages: Array<{ role: MessageRole; content: string }>
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter(m => m.role !== 'SYSTEM')
    .map(m => ({
      role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }))
}

/**
 * Mark conversation as handed off to Kimmie
 */
export async function escalateConversation(conversationId: string) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: 'HANDED_OFF',
      handedOffAt: new Date(),
    },
  })
}

/**
 * Resolve/archive a conversation
 */
export async function resolveConversation(conversationId: string) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { status: 'RESOLVED' },
  })
}

/**
 * Link a conversation to a client (after identification)
 */
export async function linkConversationToClient(
  conversationId: string,
  clientId: string
) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { clientId },
  })
}
```

**Step 2: Create intent.ts**

```typescript
// apps/cheshire/src/services/intent.ts
import { cheshireChat, parseBookingIntent } from '@looking-glass/ai'
import { ChatIntent, ChatIntentSchema } from '@looking-glass/shared'

export interface DetectedIntent {
  intent: ChatIntent
  confidence: number
  extractedData?: Record<string, unknown>
}

const INTENT_PATTERNS: Record<ChatIntent, RegExp[]> = {
  BOOKING: [
    /\b(book|schedule|appointment|groom|available|opening)\b/i,
    /\b(next|this)\s+(week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  ],
  RESCHEDULE: [
    /\b(reschedule|change|move|different\s+time)\b/i,
  ],
  CANCEL: [
    /\b(cancel|can't\s+make|won't\s+be\s+able)\b/i,
  ],
  PRICING: [
    /\b(price|cost|how\s+much|rate|fee|charge)\b/i,
  ],
  SERVICES: [
    /\b(service|offer|do\s+you|what.*do)\b/i,
    /\b(color|creative|dye|groom|bath|nails)\b/i,
  ],
  HOURS: [
    /\b(hour|open|close|when|time|available)\b/i,
  ],
  LOCATION: [
    /\b(where|location|address|directions|find\s+you)\b/i,
  ],
  CONSULTATION: [
    /\b(looking\s+glass|consultation|design|preview|style)\b/i,
    /\b(what.*look\s+like|show\s+me|picture)\b/i,
  ],
  FAQ: [
    /\b(question|wondering|curious|how\s+does)\b/i,
  ],
  DONATION: [
    /\b(donat|shelter|rescue|help|contribute|501|nonprofit)\b/i,
  ],
  SHELTER: [
    /\b(shelter|adopt|rescue|foster)\b/i,
  ],
  UNKNOWN: [],
  ESCALATE: [
    /\b(speak|talk|human|person|owner|kimmie|manager)\b/i,
    /\b(complaint|problem|issue|upset|angry)\b/i,
  ],
}

/**
 * Detect intent from a message using pattern matching + LLM
 */
export async function detectIntent(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<DetectedIntent> {
  // First, try quick pattern matching
  const patternIntent = detectIntentByPattern(message)

  if (patternIntent.confidence > 0.8) {
    return patternIntent
  }

  // For lower confidence, use LLM
  const llmIntent = await detectIntentByLLM(message, conversationHistory)

  // Combine results - prefer LLM if pattern confidence is low
  if (patternIntent.confidence > llmIntent.confidence) {
    return patternIntent
  }

  return llmIntent
}

/**
 * Quick pattern-based intent detection
 */
function detectIntentByPattern(message: string): DetectedIntent {
  let bestMatch: ChatIntent = 'UNKNOWN'
  let bestScore = 0

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let matchCount = 0
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        matchCount++
      }
    }

    const score = patterns.length > 0 ? matchCount / patterns.length : 0
    if (score > bestScore) {
      bestScore = score
      bestMatch = intent as ChatIntent
    }
  }

  return {
    intent: bestMatch,
    confidence: bestScore,
  }
}

/**
 * LLM-based intent detection for complex cases
 */
async function detectIntentByLLM(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<DetectedIntent> {
  const systemPrompt = `You are an intent classifier for a pet grooming business.
Classify the user's message into ONE of these intents:
- BOOKING: Wants to book an appointment
- RESCHEDULE: Wants to change existing appointment
- CANCEL: Wants to cancel appointment
- PRICING: Asking about prices/costs
- SERVICES: Asking what services are offered
- HOURS: Asking about business hours
- LOCATION: Asking where the business is
- CONSULTATION: Interested in Looking Glass AI consultation
- FAQ: General question
- DONATION: Interested in shelter pet donations
- SHELTER: Asking about shelter/rescue work
- ESCALATE: Wants to talk to a human or has a complaint
- UNKNOWN: Can't determine intent

Return JSON only: { "intent": "INTENT_NAME", "confidence": 0.0-1.0, "reasoning": "brief explanation" }`

  try {
    const response = await cheshireChat([
      { role: 'system', content: systemPrompt },
      ...history.slice(-5), // Last 5 messages for context
      { role: 'user', content: message },
    ])

    if (response.extractedData) {
      const data = response.extractedData as { intent?: string; confidence?: number }
      const validatedIntent = ChatIntentSchema.safeParse(data.intent)

      return {
        intent: validatedIntent.success ? validatedIntent.data : 'UNKNOWN',
        confidence: data.confidence || 0.7,
        extractedData: response.extractedData,
      }
    }

    return { intent: 'UNKNOWN', confidence: 0.5 }
  } catch (error) {
    console.error('LLM intent detection error:', error)
    return { intent: 'UNKNOWN', confidence: 0 }
  }
}

/**
 * Extract booking data from a message
 */
export async function extractBookingData(message: string) {
  return parseBookingIntent(message)
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat(cheshire): add conversation and intent services"
```

---

## Task 3.3: Build Chat Routes & Response Handler

**Files:**
- Create: `apps/cheshire/src/routes/chat.ts`
- Create: `apps/cheshire/src/services/response.ts`
- Create: `apps/cheshire/src/personality/adaptive.ts`

**Step 1: Create personality/adaptive.ts**

```typescript
// apps/cheshire/src/personality/adaptive.ts

export type PersonalityMode = 'PLAYFUL' | 'EFFICIENT' | 'WARM'

interface UserSignals {
  messageLength: number
  usesEmoji: boolean
  isReturningClient: boolean
  messageCount: number
  hasUrgentKeywords: boolean
}

/**
 * Detect user's communication style and adapt personality
 */
export function detectUserStyle(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): PersonalityMode {
  const userMessages = messages.filter(m => m.role === 'user')

  if (userMessages.length === 0) return 'PLAYFUL' // Default for new conversations

  const signals = analyzeUserSignals(userMessages)

  // Short, no-nonsense messages = EFFICIENT mode
  if (signals.messageLength < 30 && !signals.usesEmoji && signals.hasUrgentKeywords) {
    return 'EFFICIENT'
  }

  // Uses emoji, longer messages = PLAYFUL mode
  if (signals.usesEmoji || signals.messageLength > 50) {
    return 'PLAYFUL'
  }

  // Default to warm and helpful
  return 'WARM'
}

function analyzeUserSignals(
  userMessages: Array<{ content: string }>
): UserSignals {
  const allText = userMessages.map(m => m.content).join(' ')
  const avgLength = allText.length / userMessages.length

  return {
    messageLength: avgLength,
    usesEmoji: /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u.test(allText),
    isReturningClient: false, // TODO: Check from client data
    messageCount: userMessages.length,
    hasUrgentKeywords: /\b(asap|urgent|quickly|hurry|soon)\b/i.test(allText),
  }
}

/**
 * Get personality-adjusted system prompt modifier
 */
export function getPersonalityModifier(mode: PersonalityMode): string {
  switch (mode) {
    case 'PLAYFUL':
      return `
Be your full Cheshire Cat self! Use riddles, wordplay, and whimsy.
Sprinkle in Alice in Wonderland references.
Use emojis freely. Be mischievous but helpful.
Make the conversation feel like an adventure~`

    case 'EFFICIENT':
      return `
This user prefers efficiency. Be helpful and direct.
Skip the elaborate flourishes - get to the point quickly.
Still be warm, but prioritize clarity over whimsy.
One light Cheshire touch is fine, but don't overdo it.`

    case 'WARM':
      return `
Balance helpfulness with personality.
Be warm and welcoming, with occasional Cheshire charm.
Use some whimsy but keep responses focused.
Make them feel cared for without overwhelming.`
  }
}

/**
 * Adjust response based on personality mode
 */
export function adjustResponse(
  response: string,
  mode: PersonalityMode
): string {
  if (mode === 'EFFICIENT') {
    // Strip excessive emojis for efficient mode
    return response
      .replace(/[😼😸✨🐾💫🎉🌟]{2,}/g, '') // Remove emoji clusters
      .replace(/~+/g, '') // Remove trailing tildes
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive newlines
  }

  return response
}
```

**Step 2: Create services/response.ts**

```typescript
// apps/cheshire/src/services/response.ts
import { cheshireChat } from '@looking-glass/ai'
import { CHESHIRE_SYSTEM_PROMPT } from '@looking-glass/ai'
import { detectUserStyle, getPersonalityModifier, adjustResponse } from '../personality/adaptive'
import { DetectedIntent } from './intent'

export interface ResponseContext {
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  intent: DetectedIntent
  clientName?: string
  petName?: string
}

/**
 * Generate a Cheshire Cat response
 */
export async function generateResponse(
  userMessage: string,
  context: ResponseContext
): Promise<string> {
  const personalityMode = detectUserStyle(context.conversationHistory)
  const personalityModifier = getPersonalityModifier(personalityMode)

  const systemPrompt = `${CHESHIRE_SYSTEM_PROMPT}

## Current Conversation Context
${context.clientName ? `Client Name: ${context.clientName}` : 'New visitor'}
${context.petName ? `Pet Name: ${context.petName}` : ''}
Detected Intent: ${context.intent.intent} (${Math.round(context.intent.confidence * 100)}% confidence)

## Personality Adjustment
${personalityModifier}`

  const messages = [
    ...context.conversationHistory,
    { role: 'user' as const, content: userMessage },
  ]

  const response = await cheshireChat(
    messages.map(m => ({ ...m, role: m.role as 'user' | 'assistant' | 'system' })),
    'anthropic'
  )

  return adjustResponse(response.content, personalityMode)
}

/**
 * Generate FAQ response for common questions
 */
export function getFAQResponse(topic: string): string | null {
  const faqs: Record<string, string> = {
    hours: `We're available by appointment only - which means we can often find a time that works perfectly for YOUR schedule! 📅

Want to see what's available? Just tell me when works best for you~`,

    location: `We're located in Nuevo, California! 🗺️

Right in the heart of Riverside County, serving all the lovely pets in the area. Need directions? Let me know where you're coming from!`,

    pricing: `Great question! Our prices vary by:
• Size of your furry friend 🐕
• Services requested ✂️
• How creative we're getting 🎨

**Starting points:**
• Full Grooms: $45-85+
• Bath & Tidy: $25-45
• Creative Color: Let's chat about your vision!

Tell me about your pet and what you're looking for - I'll give you a more specific quote! 💰`,

    services: `Oh, the things we do here! ✨

🐕 **Dogs** - Full grooms, baths, everything!
🐱 **Cats** - Yes, really! Creative color too
🐐 **Goats & Pigs** - Creative color specialists
🐹 **Guinea Pigs** - Little fluffs welcome

**Specialties:**
• Creative coloring & patterns
• Coat carving & designs
• Anxious/fearful pet experts
• Service animal quick-service

What kind of magic are you thinking?`,

    consultation: `Ahh, the Looking Glass! 🪞✨

Our AI-powered consultation lets you:
1. Upload a photo of your pet
2. Describe your dream style
3. See a PREVIEW on your actual pet
4. Approve the design before your appointment

No more "that's not what I wanted" - you'll know EXACTLY what to expect!

Want to try it? (Note: Requires account + deposit for non-members)`,
  }

  return faqs[topic.toLowerCase()] || null
}
```

**Step 3: Create routes/chat.ts**

```typescript
// apps/cheshire/src/routes/chat.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import {
  getOrCreateConversation,
  addMessage,
  formatHistoryForLLM,
  escalateConversation,
} from '../services/conversation'
import { detectIntent, extractBookingData } from '../services/intent'
import { generateResponse, getFAQResponse } from '../services/response'
import { handleBookingFlow } from '../services/booking'
import { notifyKimmieEscalation } from '../services/escalation'

export const chatRoutes = new Hono()

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

    try {
      // Get or create conversation
      const conversation = await getOrCreateConversation(
        'WEBSITE',
        sessionId || crypto.randomUUID(),
        clientId
      )

      // Add user message
      await addMessage(conversation.id, 'USER', message)

      // Get conversation history
      const history = formatHistoryForLLM(conversation.messages)

      // Detect intent
      const intent = await detectIntent(message, history)

      // Add intent to message metadata
      await addMessage(conversation.id, 'USER', message, {
        intent: intent.intent,
        confidence: intent.confidence,
      })

      let response: string

      // Route based on intent
      switch (intent.intent) {
        case 'BOOKING':
          response = await handleBookingFlow(message, conversation, intent)
          break

        case 'PRICING':
          response = getFAQResponse('pricing') || await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
          break

        case 'SERVICES':
          response = getFAQResponse('services') || await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
          break

        case 'HOURS':
          response = getFAQResponse('hours') || await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
          break

        case 'LOCATION':
          response = getFAQResponse('location') || await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
          break

        case 'CONSULTATION':
          response = getFAQResponse('consultation') || await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
          break

        case 'ESCALATE':
          await escalateConversation(conversation.id)
          await notifyKimmieEscalation(conversation.id, message)
          response = `I'm getting Kimmie for you right now! 🐱

She'll reach out shortly. In the meantime, is there anything quick I can help with?`
          break

        default:
          response = await generateResponse(message, {
            conversationHistory: history,
            intent,
          })
      }

      // Save assistant response
      await addMessage(conversation.id, 'ASSISTANT', response)

      return c.json({
        response,
        sessionId: conversation.externalId,
        intent: intent.intent,
      })
    } catch (error) {
      console.error('Chat error:', error)
      return c.json({
        response: "Curiouser and curiouser... something went wrong! 🙀 Try again?",
        error: true,
      }, 500)
    }
  }
)

// Get conversation history
chatRoutes.get('/history/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId')

  const conversation = await getOrCreateConversation('WEBSITE', sessionId)
  const history = formatHistoryForLLM(conversation.messages)

  return c.json({
    sessionId,
    messages: history,
  })
})
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat(cheshire): add chat routes with adaptive personality"
```

---

## Task 3.4: Build Booking Flow Handler

**Files:**
- Create: `apps/cheshire/src/services/booking.ts`
- Create: `apps/cheshire/src/services/escalation.ts`

**Step 1: Create services/booking.ts**

```typescript
// apps/cheshire/src/services/booking.ts
import { prisma } from '@looking-glass/db'
import { parseBookingIntent, cheshireChat } from '@looking-glass/ai'
import { addMessage, linkConversationToClient } from './conversation'
import { DetectedIntent } from './intent'
import { notifyNewBooking } from './escalation'
import { addDays, format, parse, setHours, setMinutes } from 'date-fns'

interface BookingState {
  step: 'COLLECT_INFO' | 'SUGGEST_TIMES' | 'CONFIRM' | 'COMPLETE'
  clientName?: string
  clientPhone?: string
  petName?: string
  petSpecies?: string
  services?: string[]
  requestedDate?: Date
  selectedSlot?: { start: Date; end: Date }
}

/**
 * Handle the booking conversation flow
 */
export async function handleBookingFlow(
  message: string,
  conversation: any,
  intent: DetectedIntent
): Promise<string> {
  // Parse booking intent from message
  const bookingData = await parseBookingIntent(message)

  // Determine what info we still need
  const missingInfo = getMissingBookingInfo(bookingData, conversation)

  if (missingInfo.length > 0) {
    return askForMissingInfo(missingInfo, bookingData)
  }

  // We have all info - find available slots
  const slots = await findAvailableSlots(bookingData.requestedDate!)

  if (slots.length === 0) {
    return `Oh no! That day is fully booked 😿

How about one of these instead?
${await suggestAlternativeDays(bookingData.requestedDate!)}

Just let me know what works!`
  }

  // Offer available slots
  return formatSlotOptions(slots, bookingData)
}

function getMissingBookingInfo(
  data: any,
  conversation: any
): string[] {
  const missing: string[] = []

  if (!data.petName && !conversation.client) {
    missing.push('petName')
  }
  if (!data.requestedDate) {
    missing.push('date')
  }
  if (!data.services || data.services.length === 0) {
    missing.push('services')
  }
  if (!conversation.client && !data.clientName) {
    missing.push('contact')
  }

  return missing
}

function askForMissingInfo(missing: string[], partialData: any): string {
  const questions: Record<string, string> = {
    petName: "What's your furry friend's name? 🐾",
    date: "When were you thinking? This week? Next week? A specific day?",
    services: `What kind of magic are we doing? ✨

• Full Groom (the works!)
• Bath & Tidy (freshen up)
• Creative Color (let's get WILD 🎨)
• Something specific?`,
    contact: "I'll need your name and phone number to save the booking! 📱",
  }

  // Ask for the first missing piece naturally
  const firstMissing = missing[0]
  let response = questions[firstMissing]

  // Add context if we have partial info
  if (partialData.petName) {
    response = `Got it - ${partialData.petName} is coming for a royal spa day! 👑\n\n${response}`
  }
  if (partialData.requestedDate) {
    response = `${format(new Date(partialData.requestedDate), 'EEEE, MMMM d')} - great choice!\n\n${response}`
  }

  return response
}

async function findAvailableSlots(date: Date): Promise<Array<{ start: Date; end: Date }>> {
  // Get existing appointments for that day
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: {
        in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
      },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  // Generate available slots (9am - 5pm, 1 hour slots for now)
  const slots: Array<{ start: Date; end: Date }> = []
  const businessStart = 9
  const businessEnd = 17

  for (let hour = businessStart; hour < businessEnd; hour++) {
    const slotStart = setMinutes(setHours(new Date(date), hour), 0)
    const slotEnd = setMinutes(setHours(new Date(date), hour + 1), 0)

    // Check if slot conflicts with existing appointments
    const hasConflict = existingAppointments.some(apt => {
      const aptStart = new Date(apt.scheduledAt)
      const aptEnd = new Date(apt.endTime)
      return (slotStart < aptEnd && slotEnd > aptStart)
    })

    if (!hasConflict) {
      slots.push({ start: slotStart, end: slotEnd })
    }
  }

  return slots
}

async function suggestAlternativeDays(originalDate: Date): Promise<string> {
  const alternatives: string[] = []

  for (let i = 1; i <= 5; i++) {
    const altDate = addDays(originalDate, i)
    const slots = await findAvailableSlots(altDate)
    if (slots.length > 0) {
      alternatives.push(`• ${format(altDate, 'EEEE, MMM d')} (${slots.length} slots open)`)
    }
    if (alternatives.length >= 3) break
  }

  return alternatives.join('\n')
}

function formatSlotOptions(
  slots: Array<{ start: Date; end: Date }>,
  bookingData: any
): string {
  const dateStr = format(slots[0].start, 'EEEE, MMMM d')
  const slotList = slots
    .slice(0, 5) // Show max 5 options
    .map((slot, i) => `${i + 1}. ${format(slot.start, 'h:mm a')}`)
    .join('\n')

  return `Perfect! Here's what's open on ${dateStr}:

${slotList}

Which time works for ${bookingData.petName || 'your pet'}? Just tell me the number or time! 🕐`
}

/**
 * Create the actual appointment
 */
export async function createAppointment(
  clientId: string,
  petId: string,
  scheduledAt: Date,
  services: string[],
  source: string
): Promise<string> {
  const duration = 60 // Default 1 hour, should calculate based on services

  const appointment = await prisma.appointment.create({
    data: {
      clientId,
      petId,
      scheduledAt,
      duration,
      endTime: new Date(scheduledAt.getTime() + duration * 60000),
      status: 'PENDING',
      bookedVia: source as any,
    },
    include: {
      client: true,
      pet: true,
    },
  })

  // Notify Kimmie via Telegram
  await notifyNewBooking(appointment.id)

  return appointment.id
}
```

**Step 2: Create services/escalation.ts**

```typescript
// apps/cheshire/src/services/escalation.ts
import { prisma } from '@looking-glass/db'

const TELEGRAM_BOT_URL = process.env.TELEGRAM_BOT_URL || 'http://localhost:3002'

/**
 * Notify Kimmie about a new booking via Telegram bot
 */
export async function notifyNewBooking(appointmentId: string) {
  try {
    await fetch(`${TELEGRAM_BOT_URL}/internal/notify-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId }),
    })
  } catch (error) {
    console.error('Failed to notify Telegram bot:', error)
  }
}

/**
 * Notify Kimmie about an escalation
 */
export async function notifyKimmieEscalation(
  conversationId: string,
  lastMessage: string
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      client: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!conversation) return

  const context = conversation.messages
    .reverse()
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  try {
    await fetch(`${TELEGRAM_BOT_URL}/internal/escalation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        channel: conversation.channel,
        clientName: conversation.client
          ? `${conversation.client.firstName} ${conversation.client.lastName}`
          : 'Unknown',
        lastMessage,
        context,
      }),
    })
  } catch (error) {
    console.error('Failed to notify escalation:', error)
  }
}

/**
 * Notify about photo reminder
 */
export async function triggerPhotoReminder(
  appointmentId: string,
  type: 'before' | 'after'
) {
  try {
    await fetch(`${TELEGRAM_BOT_URL}/internal/photo-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, type }),
    })
  } catch (error) {
    console.error('Failed to trigger photo reminder:', error)
  }
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat(cheshire): add booking flow and escalation handlers"
```

---

## Task 3.5: Build Webhook Routes for Social Channels

**Files:**
- Create: `apps/cheshire/src/routes/webhook.ts`
- Create: `apps/cheshire/src/channels/instagram.ts`
- Create: `apps/cheshire/src/channels/facebook.ts`

**Step 1: Create routes/webhook.ts**

```typescript
// apps/cheshire/src/routes/webhook.ts
import { Hono } from 'hono'
import { handleInstagramMessage, verifyInstagramWebhook } from '../channels/instagram'
import { handleFacebookMessage, verifyFacebookWebhook } from '../channels/facebook'

export const webhookRoutes = new Hono()

// Instagram webhook verification
webhookRoutes.get('/instagram', async (c) => {
  const mode = c.req.query('hub.mode')
  const token = c.req.query('hub.verify_token')
  const challenge = c.req.query('hub.challenge')

  if (verifyInstagramWebhook(mode, token)) {
    return c.text(challenge || '')
  }

  return c.text('Forbidden', 403)
})

// Instagram webhook messages
webhookRoutes.post('/instagram', async (c) => {
  const body = await c.req.json()

  try {
    await handleInstagramMessage(body)
    return c.json({ status: 'ok' })
  } catch (error) {
    console.error('Instagram webhook error:', error)
    return c.json({ status: 'error' }, 500)
  }
})

// Facebook webhook verification
webhookRoutes.get('/facebook', async (c) => {
  const mode = c.req.query('hub.mode')
  const token = c.req.query('hub.verify_token')
  const challenge = c.req.query('hub.challenge')

  if (verifyFacebookWebhook(mode, token)) {
    return c.text(challenge || '')
  }

  return c.text('Forbidden', 403)
})

// Facebook webhook messages
webhookRoutes.post('/facebook', async (c) => {
  const body = await c.req.json()

  try {
    await handleFacebookMessage(body)
    return c.json({ status: 'ok' })
  } catch (error) {
    console.error('Facebook webhook error:', error)
    return c.json({ status: 'error' }, 500)
  }
})
```

**Step 2: Create channels/instagram.ts**

```typescript
// apps/cheshire/src/channels/instagram.ts
import { getOrCreateConversation, addMessage, formatHistoryForLLM } from '../services/conversation'
import { detectIntent } from '../services/intent'
import { generateResponse } from '../services/response'
import { handleBookingFlow } from '../services/booking'

const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'cheshire_cat_verify'
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

export function verifyInstagramWebhook(mode?: string, token?: string): boolean {
  return mode === 'subscribe' && token === VERIFY_TOKEN
}

export async function handleInstagramMessage(payload: any) {
  const entries = payload.entry || []

  for (const entry of entries) {
    const messaging = entry.messaging || []

    for (const event of messaging) {
      if (event.message && event.message.text) {
        await processInstagramMessage(
          event.sender.id,
          event.message.text,
          event.message.mid
        )
      }
    }
  }
}

async function processInstagramMessage(
  senderId: string,
  messageText: string,
  messageId: string
) {
  // Get or create conversation
  const conversation = await getOrCreateConversation('INSTAGRAM', senderId)

  // Add user message
  await addMessage(conversation.id, 'USER', messageText)

  // Get history and detect intent
  const history = formatHistoryForLLM(conversation.messages)
  const intent = await detectIntent(messageText, history)

  // Generate response
  let response: string

  if (intent.intent === 'BOOKING') {
    response = await handleBookingFlow(messageText, conversation, intent)
  } else {
    response = await generateResponse(messageText, {
      conversationHistory: history,
      intent,
    })
  }

  // Save response
  await addMessage(conversation.id, 'ASSISTANT', response)

  // Send response via Instagram API
  await sendInstagramMessage(senderId, response)
}

async function sendInstagramMessage(recipientId: string, message: string) {
  if (!ACCESS_TOKEN) {
    console.error('Instagram access token not configured')
    return
  }

  try {
    await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
        }),
      }
    )
  } catch (error) {
    console.error('Failed to send Instagram message:', error)
  }
}
```

**Step 3: Create channels/facebook.ts**

```typescript
// apps/cheshire/src/channels/facebook.ts
import { getOrCreateConversation, addMessage, formatHistoryForLLM } from '../services/conversation'
import { detectIntent } from '../services/intent'
import { generateResponse } from '../services/response'
import { handleBookingFlow } from '../services/booking'

const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'cheshire_cat_verify'
const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

export function verifyFacebookWebhook(mode?: string, token?: string): boolean {
  return mode === 'subscribe' && token === VERIFY_TOKEN
}

export async function handleFacebookMessage(payload: any) {
  const entries = payload.entry || []

  for (const entry of entries) {
    const messaging = entry.messaging || []

    for (const event of messaging) {
      if (event.message && event.message.text) {
        await processFacebookMessage(
          event.sender.id,
          event.message.text,
          event.message.mid
        )
      }
    }
  }
}

async function processFacebookMessage(
  senderId: string,
  messageText: string,
  messageId: string
) {
  // Get or create conversation
  const conversation = await getOrCreateConversation('FACEBOOK', senderId)

  // Add user message
  await addMessage(conversation.id, 'USER', messageText)

  // Get history and detect intent
  const history = formatHistoryForLLM(conversation.messages)
  const intent = await detectIntent(messageText, history)

  // Generate response
  let response: string

  if (intent.intent === 'BOOKING') {
    response = await handleBookingFlow(messageText, conversation, intent)
  } else {
    response = await generateResponse(messageText, {
      conversationHistory: history,
      intent,
    })
  }

  // Save response
  await addMessage(conversation.id, 'ASSISTANT', response)

  // Send response via Facebook API
  await sendFacebookMessage(senderId, response)
}

async function sendFacebookMessage(recipientId: string, message: string) {
  if (!ACCESS_TOKEN) {
    console.error('Facebook access token not configured')
    return
  }

  try {
    await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
        }),
      }
    )
  } catch (error) {
    console.error('Failed to send Facebook message:', error)
  }
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat(cheshire): add Instagram and Facebook webhook handlers"
```

---

## Execution Checklist - Phase 3

- [ ] Task 3.1: Create Cheshire service app
- [ ] Task 3.2: Build conversation management
- [ ] Task 3.3: Build chat routes & response handler
- [ ] Task 3.4: Build booking flow handler
- [ ] Task 3.5: Build webhook routes for social channels
