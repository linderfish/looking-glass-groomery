// apps/cheshire/src/services/intent.ts
import { cheshireChat } from '@looking-glass/ai'
import { ChatIntent } from '@looking-glass/shared'

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
- SHELTER: About shelter/rescue pets
- ESCALATE: Wants to talk to a human
- UNKNOWN: Can't determine intent

Respond with JSON only: {"intent": "INTENT_NAME", "confidence": 0.0-1.0}
Consider conversation context when classifying.`

  try {
    const messages = [
      ...history.slice(-5), // Last 5 messages for context
      { role: 'user' as const, content: message },
    ]

    const response = await cheshireChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Classify this message: "${message}"` },
      ],
      'anthropic'
    )

    const parsed = JSON.parse(response.content)
    return {
      intent: parsed.intent as ChatIntent,
      confidence: parsed.confidence || 0.7,
    }
  } catch {
    return {
      intent: 'UNKNOWN',
      confidence: 0.3,
    }
  }
}

/**
 * Extract booking-related data from a message
 */
export function extractBookingData(message: string): {
  petName?: string
  petType?: string
  preferredDate?: string
  preferredTime?: string
  services?: string[]
} {
  const extracted: ReturnType<typeof extractBookingData> = {}

  // Extract pet name (common patterns)
  const petNameMatch = message.match(/\b(my\s+)?(dog|cat|pet)\s+(?:named?\s+)?([A-Z][a-z]+)\b/i)
  if (petNameMatch) {
    extracted.petName = petNameMatch[3]
  }

  // Extract pet type
  if (/\bdog\b/i.test(message)) extracted.petType = 'DOG'
  if (/\bcat\b/i.test(message)) extracted.petType = 'CAT'
  if (/\bgoat\b/i.test(message)) extracted.petType = 'GOAT'
  if (/\bpig\b/i.test(message)) extracted.petType = 'PIG'
  if (/\bguinea\s*pig\b/i.test(message)) extracted.petType = 'GUINEA_PIG'

  // Extract date preferences
  const dateMatch = message.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next\s+week)\b/i)
  if (dateMatch) {
    extracted.preferredDate = dateMatch[1].toLowerCase()
  }

  // Extract time preferences
  const timeMatch = message.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i)
  if (timeMatch) {
    extracted.preferredTime = timeMatch[1]
  }

  // Extract services mentioned
  const serviceKeywords = ['groom', 'bath', 'nail', 'color', 'trim', 'cut', 'style']
  extracted.services = serviceKeywords.filter(s =>
    message.toLowerCase().includes(s)
  )

  return extracted
}
