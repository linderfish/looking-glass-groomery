// apps/cheshire/src/services/response.ts
import { cheshireChat, CHESHIRE_SYSTEM_PROMPT } from '@looking-glass/ai'
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
    [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ ...m, role: m.role as 'user' | 'assistant' | 'system' })),
    ],
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
