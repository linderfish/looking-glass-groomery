// packages/ai/src/llm.ts
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { CHESHIRE_SYSTEM_PROMPT } from './prompts/cheshire'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type LLMProvider = 'anthropic' | 'openai'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  content: string
  intent?: string
  extractedData?: Record<string, unknown>
}

/**
 * Chat with Cheshire Cat AI
 */
export async function cheshireChat(
  messages: ChatMessage[],
  provider: LLMProvider = 'anthropic'
): Promise<ChatResponse> {
  if (provider === 'anthropic') {
    return cheshireChatAnthropic(messages)
  }
  return cheshireChatOpenAI(messages)
}

async function cheshireChatAnthropic(messages: ChatMessage[]): Promise<ChatResponse> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: CHESHIRE_SYSTEM_PROMPT,
    messages: messages.map(m => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content,
    })),
  })

  const content = response.content[0].type === 'text'
    ? response.content[0].text
    : ''

  return parseCheshireResponse(content)
}

async function cheshireChatOpenAI(messages: ChatMessage[]): Promise<ChatResponse> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: CHESHIRE_SYSTEM_PROMPT },
      ...messages,
    ],
    max_tokens: 1024,
  })

  const content = response.choices[0].message.content || ''
  return parseCheshireResponse(content)
}

/**
 * Parse booking intent from a message
 */
export async function parseBookingIntent(message: string): Promise<{
  isBookingRequest: boolean
  clientName?: string
  petName?: string
  requestedDate?: string
  requestedTime?: string
  services?: string[]
  notes?: string
}> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: `You are a booking intent parser. Extract booking information from messages.
Return JSON only with these fields:
- isBookingRequest: boolean
- clientName: string or null
- petName: string or null
- requestedDate: string (ISO date) or null
- requestedTime: string or null
- services: string[] or null
- notes: string or null

Be smart about parsing natural language dates like "next Thursday" or "tomorrow".
Today is ${new Date().toISOString().split('T')[0]}.`,
    messages: [{ role: 'user', content: message }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    return JSON.parse(content)
  } catch {
    return { isBookingRequest: false }
  }
}

/**
 * Generate grooming blueprint from style description
 */
export async function generateGroomingBlueprint(
  styleDescription: string,
  petInfo: { species: string; breed?: string; size?: string }
): Promise<Record<string, unknown>> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are a professional pet grooming expert. Generate detailed grooming blueprints.
Given a style description, output a JSON blueprint with:
- head: { clipperGuard, style, notes }
- ears: { clipperGuard, style, notes }
- body: { clipperGuard, style, notes }
- legs: { clipperGuard, style, tapered, notes }
- tail: { style, notes }
- colors: [{ color, brand, placement, pattern }]
- extras: string[]
- notes: string

Use professional grooming terminology. Be specific about clipper guards (e.g., "#4", "#7F").
For colors, suggest specific brands when possible (e.g., "OPAWZ", "Crazy Liberty").
Pattern options: SOLID, SPOTS, RINGS, GRADIENT, STRIPES, CUSTOM`,
    messages: [{
      role: 'user',
      content: `Pet: ${petInfo.species}, ${petInfo.breed || 'mixed'}, ${petInfo.size || 'medium'} size.
Style requested: ${styleDescription}`,
    }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    // Extract JSON from response (may be wrapped in markdown)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || [null, content]
    return JSON.parse(jsonMatch[1] || content)
  } catch {
    return { error: 'Failed to generate blueprint', raw: content }
  }
}

/**
 * Generate social media caption
 */
export async function generateCaption(
  petName: string,
  services: string[],
  style?: string
): Promise<{ caption: string; hashtags: string[] }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: `You are a social media manager for "Through the Looking Glass Groomery" - an Alice in Wonderland themed pet grooming salon.

Generate engaging, whimsical captions for before/after transformation posts.
Tone: playful, magical, feminine, celebratory
Include subtle Alice in Wonderland references when natural.
Keep captions punchy (under 200 characters ideally).
Generate 5-10 relevant hashtags mixing local (#NuevoCa #RiversideCounty), niche (#PetGrooming #DogTransformation), and branded (#ThroughTheLookingGlass #QueensSpa) tags.

Return JSON: { caption: string, hashtags: string[] }`,
    messages: [{
      role: 'user',
      content: `Pet name: ${petName}
Services: ${services.join(', ')}
Style: ${style || 'standard groom'}
Generate a caption for this transformation!`,
    }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || [null, content]
    return JSON.parse(jsonMatch[1] || content)
  } catch {
    return {
      caption: `✨ ${petName}'s magical transformation is complete! Another queen leaves the spa~ 👑`,
      hashtags: ['#ThroughTheLookingGlass', '#PetGrooming', '#DogTransformation', '#NuevoCa'],
    }
  }
}

function parseCheshireResponse(content: string): ChatResponse {
  // Try to extract structured data if present
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/)

  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1])
      return {
        content: content.replace(/```json[\s\S]*?```/, '').trim(),
        intent: data.intent,
        extractedData: data,
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return { content }
}
