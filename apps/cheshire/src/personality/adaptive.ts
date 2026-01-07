// apps/cheshire/src/personality/adaptive.ts

export type PersonalityMode = 'PLAYFUL' | 'EFFICIENT' | 'WARM'

interface UserMessageStyle {
  messageLength: number
  usesEmoji: boolean
  isReturningClient: boolean
  messageCount: number
  hasUrgentKeywords: boolean
}

export interface PersonalityContext {
  mode: PersonalityMode
  isReturningClient: boolean
}

/**
 * Detect user communication style to adapt Cheshire's personality
 * Optionally accepts returning client status from database lookup
 */
export function detectUserStyle(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  isReturningClient: boolean = false
): PersonalityContext {
  const userMessages = messages.filter(m => m.role === 'user')

  if (userMessages.length === 0) {
    return { mode: 'WARM', isReturningClient } // Default for new conversations
  }

  const style = analyzeMessageStyle(userMessages)

  // Short, to-the-point messages = efficient mode
  if (style.messageLength < 30 && !style.usesEmoji && style.hasUrgentKeywords) {
    return { mode: 'EFFICIENT', isReturningClient }
  }

  // Uses emojis, longer messages = playful mode
  if (style.usesEmoji || style.messageLength > 100) {
    return { mode: 'PLAYFUL', isReturningClient }
  }

  // Medium engagement = warm mode
  return { mode: 'WARM', isReturningClient }
}

/**
 * Analyze characteristics of user messages
 */
function analyzeMessageStyle(
  userMessages: Array<{ content: string }>
): UserMessageStyle {
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
export function getPersonalityModifier(context: PersonalityContext): string {
  const returningPrefix = context.isReturningClient
    ? `This is a RETURNING client! Welcome them back warmly. Reference that you remember them.
Say things like "Welcome back!" or "So lovely to see you again!" to show recognition.

`
    : ''

  switch (context.mode) {
    case 'PLAYFUL':
      return `${returningPrefix}Be your full Cheshire Cat self! Use riddles, wordplay, and whimsy.
Sprinkle in Alice in Wonderland references.
Use emojis freely. Be mischievous but helpful.
Make the conversation feel like an adventure~`

    case 'EFFICIENT':
      return `${returningPrefix}This user prefers efficiency. Be helpful and direct.
Skip the elaborate flourishes - get to the point quickly.
Still be warm, but prioritize clarity over whimsy.
One light Cheshire touch is fine, but don't overdo it.`

    case 'WARM':
      return `${returningPrefix}Balance helpfulness with personality.
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
  context: PersonalityContext | PersonalityMode
): string {
  // Handle both old (PersonalityMode) and new (PersonalityContext) signatures
  const mode = typeof context === 'string' ? context : context.mode

  if (mode === 'EFFICIENT') {
    // Strip excessive emojis for efficient mode
    return response
      .replace(/[😼😸✨🐾💫🎉🌟]{2,}/g, '') // Remove emoji clusters
      .replace(/~+/g, '') // Remove trailing tildes
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive newlines
  }

  return response
}
