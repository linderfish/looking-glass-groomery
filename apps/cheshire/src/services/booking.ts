// apps/cheshire/src/services/booking.ts
import { prisma } from '@looking-glass/db'
import { detectUserStyle, getPersonalityModifier } from '../personality/adaptive'
import { DetectedIntent, extractBookingData } from './intent'
import { formatHistoryForLLM } from './conversation'
import { cheshireChat, CHESHIRE_SYSTEM_PROMPT } from '@looking-glass/ai'
import { addDays, format, startOfDay, setHours, setMinutes } from 'date-fns'

interface BookingFlowState {
  step: 'INITIAL' | 'COLLECTING_PET' | 'COLLECTING_DATE' | 'COLLECTING_SERVICE' | 'CONFIRMING'
  petName?: string
  petType?: string
  preferredDate?: Date
  preferredTime?: string
  services?: string[]
  clientPhone?: string
}

/**
 * Handle the booking conversation flow
 */
export async function handleBookingFlow(
  message: string,
  conversation: {
    id: string
    messages: Array<{ role: 'USER' | 'ASSISTANT' | 'SYSTEM'; content: string }>
    client?: { firstName: string; lastName: string } | null
  },
  intent: DetectedIntent
): Promise<string> {
  const history = formatHistoryForLLM(conversation.messages)
  const extracted = extractBookingData(message)
  const personalityMode = detectUserStyle(history)

  // Try to determine current flow state from conversation history
  const state = determineBookingState(history, extracted)

  switch (state.step) {
    case 'INITIAL':
    case 'COLLECTING_PET':
      if (extracted.petName || extracted.petType) {
        state.petName = extracted.petName
        state.petType = extracted.petType
        state.step = 'COLLECTING_DATE'

        return personalityMode === 'EFFICIENT'
          ? `Got it${extracted.petName ? `, ${extracted.petName}` : ''}! When works best for you? I have openings this week.`
          : `Wonderful! I can already tell ${extracted.petName || 'your fur baby'} is going to look AMAZING! ✨

When would you like to come in? I have some lovely spots available this week~ 📅`
      }

      return personalityMode === 'EFFICIENT'
        ? `I'd love to help you book! What's your pet's name and what kind of pet are they?`
        : `*Cheshire grin appears* ✨

I would LOVE to help you book an appointment!

First, tell me about your precious pet - what's their name and what kind of magical creature are they? 🐾`

    case 'COLLECTING_DATE':
      if (extracted.preferredDate || extracted.preferredTime) {
        state.preferredTime = extracted.preferredTime
        state.step = 'COLLECTING_SERVICE'

        // Generate available slots based on preference
        const slots = await getAvailableSlots(extracted.preferredDate)

        return personalityMode === 'EFFICIENT'
          ? `Here's what's available:\n${slots.map(s => `• ${s}`).join('\n')}\n\nWhich works for you?`
          : `Let me peek through the Looking Glass at our schedule... 🪞

Here's what I see available:
${slots.map(s => `✨ ${s}`).join('\n')}

Which slot calls to you?`
      }

      return `When would you like to bring ${state.petName || 'your pet'} in?

I have openings most days - just let me know what works for your schedule! 📅`

    case 'COLLECTING_SERVICE':
      if (extracted.services && extracted.services.length > 0) {
        state.services = extracted.services
        state.step = 'CONFIRMING'

        return generateConfirmationMessage(state, personalityMode)
      }

      return personalityMode === 'EFFICIENT'
        ? `What services do you need?\n• Full Groom\n• Bath & Tidy\n• Creative Color\n• Nails Only`
        : `Excellent choice! Now for the fun part~ ✨

What magic shall we work on ${state.petName || 'your pet'}?

🛁 **Bath & Tidy** - Fresh and fluffy
✂️ **Full Groom** - The whole spa experience
🎨 **Creative Color** - Let's get WILD
💅 **Nails Only** - Quick pampering

Or tell me your vision and I'll make it happen!`

    case 'CONFIRMING':
      // Handle confirmation or changes
      if (/\b(yes|confirm|perfect|sounds good|book it)\b/i.test(message)) {
        // TODO: Actually create the booking in database
        return personalityMode === 'EFFICIENT'
          ? `✅ Booked! You'll receive a confirmation text shortly. See you soon!`
          : `🎉 FANTASTIC! Your appointment is CONFIRMED! ✨

You'll receive a confirmation text shortly with all the details.

${state.petName || 'Your pet'} is going to look absolutely MAGNIFICENT!
See you soon, gorgeous~ 😸👑`
      }

      if (/\b(no|change|different|actually)\b/i.test(message)) {
        return `No problem at all! What would you like to change?

• Different date/time?
• Different services?
• Something else?`
      }

      return generateConfirmationMessage(state, personalityMode)
  }
}

/**
 * Determine current booking flow state from conversation
 */
function determineBookingState(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  extracted: ReturnType<typeof extractBookingData>
): BookingFlowState {
  const state: BookingFlowState = { step: 'INITIAL' }

  // Look through history to determine state
  for (const msg of history) {
    if (msg.role === 'user') {
      const data = extractBookingData(msg.content)
      if (data.petName) state.petName = data.petName
      if (data.petType) state.petType = data.petType
      if (data.preferredDate) state.preferredTime = data.preferredDate
      if (data.preferredTime) state.preferredTime = data.preferredTime
      if (data.services) state.services = data.services
    }
  }

  // Determine step based on what we have
  if (state.services && state.services.length > 0) {
    state.step = 'CONFIRMING'
  } else if (state.preferredTime) {
    state.step = 'COLLECTING_SERVICE'
  } else if (state.petName || state.petType) {
    state.step = 'COLLECTING_DATE'
  } else {
    state.step = 'COLLECTING_PET'
  }

  return state
}

/**
 * Get available appointment slots
 */
async function getAvailableSlots(preferredDay?: string): Promise<string[]> {
  // TODO: Check actual availability from database
  // For now, return sample slots
  const today = startOfDay(new Date())

  const slots = [
    format(setHours(setMinutes(addDays(today, 1), 0), 10), "EEEE 'at' h:mm a"),
    format(setHours(setMinutes(addDays(today, 1), 0), 14), "EEEE 'at' h:mm a"),
    format(setHours(setMinutes(addDays(today, 2), 30), 11), "EEEE 'at' h:mm a"),
    format(setHours(setMinutes(addDays(today, 3), 0), 9), "EEEE 'at' h:mm a"),
  ]

  return slots
}

/**
 * Generate confirmation message
 */
function generateConfirmationMessage(
  state: BookingFlowState,
  mode: 'PLAYFUL' | 'EFFICIENT' | 'WARM'
): string {
  const details = `
📅 **Date/Time:** ${state.preferredTime || 'TBD'}
🐾 **Pet:** ${state.petName || 'Your pet'}${state.petType ? ` (${state.petType})` : ''}
✂️ **Services:** ${state.services?.join(', ') || 'Full Groom'}
`

  if (mode === 'EFFICIENT') {
    return `Please confirm your booking:
${details}
Reply "yes" to confirm or let me know what to change.`
  }

  return `*drumroll* 🥁

Here's what I have for you:
${details}

Does everything look purr-fect? 😸

Say "yes" to confirm and we'll lock it in!
Or let me know if anything needs adjusting~`
}
