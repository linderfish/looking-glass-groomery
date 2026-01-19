// apps/cheshire/src/services/booking.ts
import { prisma } from '@looking-glass/db'
import { detectUserStyle, getPersonalityModifier, PersonalityContext } from '../personality/adaptive'
import { DetectedIntent, extractBookingData } from './intent'
import { formatHistoryForLLM, isReturningClient } from './conversation'
import { cheshireChat, CHESHIRE_SYSTEM_PROMPT } from '@looking-glass/ai'
import { notifyKimmieNewBooking } from './notifications'
import { createCalendarEvent } from './calendar-oauth'
import { canBookSlot, getAvailableSlots as getAvailabilitySlots } from './availability'
import { addDays, format, startOfDay, setHours, setMinutes } from 'date-fns'

// Type definitions for Prisma enums (using string literals for compatibility)
type Species = 'DOG' | 'CAT' | 'GOAT' | 'PIG' | 'GUINEA_PIG'
type BookingSource = 'WEBSITE' | 'INSTAGRAM' | 'FACEBOOK' | 'TELEGRAM' | 'PHONE' | 'TEXT' | 'WALK_IN'
type LeadSource = 'DIRECT' | 'WEBSITE' | 'INSTAGRAM' | 'FACEBOOK' | 'REFERRAL' | 'SHELTER' | 'EVENT'

interface ServiceLookupResult {
  services: Array<{ id: string; name: string; baseDuration: number; basePrice: number }>
  totalDuration: number
  totalPrice: number
}

/**
 * Look up services from the database by matching service names
 * Uses fuzzy matching to handle variations in how users describe services
 */
async function lookupServices(serviceNames: string[], petSpecies: Species): Promise<ServiceLookupResult> {
  // Get all active services available for this species
  const allServices = await prisma.service.findMany({
    where: {
      isActive: true,
      availableFor: { has: petSpecies },
    },
  })

  const matchedServices: ServiceLookupResult['services'] = []

  for (const requestedName of serviceNames) {
    const normalized = requestedName.toLowerCase().trim()

    // Try exact match first
    let match = allServices.find((s) =>
      s.name.toLowerCase() === normalized
    )

    // Try partial/fuzzy matching
    if (!match) {
      match = allServices.find((s) => {
        const serviceLower = s.name.toLowerCase()
        return (
          serviceLower.includes(normalized) ||
          normalized.includes(serviceLower) ||
          // Common variations
          (normalized.includes('groom') && serviceLower.includes('groom')) ||
          (normalized.includes('bath') && serviceLower.includes('bath')) ||
          (normalized.includes('nail') && serviceLower.includes('nail')) ||
          (normalized.includes('color') && serviceLower.includes('color')) ||
          (normalized.includes('creative') && serviceLower.includes('creative'))
        )
      })
    }

    if (match && !matchedServices.some((m) => m.id === match.id)) {
      matchedServices.push({
        id: match.id,
        name: match.name,
        baseDuration: match.baseDuration,
        basePrice: match.basePrice,
      })
    }
  }

  // If no matches found, try to find a default full groom
  if (matchedServices.length === 0) {
    const defaultGroom = allServices.find((s) =>
      s.category === 'FULL_GROOM' && s.name.toLowerCase().includes('medium')
    ) || allServices.find((s) => s.category === 'FULL_GROOM')

    if (defaultGroom) {
      matchedServices.push({
        id: defaultGroom.id,
        name: defaultGroom.name,
        baseDuration: defaultGroom.baseDuration,
        basePrice: defaultGroom.basePrice,
      })
    }
  }

  const totalDuration = matchedServices.reduce((sum, s) => sum + s.baseDuration, 0)
  const totalPrice = matchedServices.reduce((sum, s) => sum + s.basePrice, 0)

  return {
    services: matchedServices,
    totalDuration: totalDuration || 60, // Fallback to 60 min if nothing matched
    totalPrice,
  }
}

interface BookingFlowState {
  step: 'INITIAL' | 'COLLECTING_PET' | 'COLLECTING_DATE' | 'COLLECTING_SERVICE' | 'CONFIRMING' | 'COLLECTING_PHONE'
  petName?: string
  petType?: string
  preferredDate?: Date
  preferredTime?: string
  services?: string[]
  clientPhone?: string
  clientName?: string
}

interface BookingContext {
  conversationId: string
  channel: 'INSTAGRAM' | 'FACEBOOK' | 'WEBSITE'
  externalId: string
}

/**
 * Handle the booking conversation flow
 */
export async function handleBookingFlow(
  message: string,
  conversation: {
    id: string
    messages: Array<{ role: 'USER' | 'ASSISTANT' | 'SYSTEM'; content: string }>
    client?: { id: string; firstName: string; lastName: string; phone?: string } | null
  },
  intent: DetectedIntent,
  context: BookingContext
): Promise<string> {
  console.log(`[Booking] ========== NEW MESSAGE ==========`)
  console.log(`[Booking] Channel: ${context.channel}`)
  console.log(`[Booking] User message: "${message}"`)
  console.log(`[Booking] Conversation has ${conversation.messages.length} messages`)

  const history = formatHistoryForLLM(conversation.messages)
  const extracted = extractBookingData(message)

  console.log(`[Booking] Extracted data:`, JSON.stringify(extracted))

  // Check if this is a returning client for personalized greetings
  const returning = await isReturningClient(conversation.client?.id)
  const personality = detectUserStyle(history, returning)

  // Try to determine current flow state from conversation history
  const state = determineBookingState(history, extracted)
  console.log(`[Booking] Entering switch with step: ${state.step}`)

  switch (state.step) {
    case 'INITIAL':
    case 'COLLECTING_PET':
      if (extracted.petName || extracted.petType) {
        state.petName = extracted.petName
        state.petType = extracted.petType
        state.step = 'COLLECTING_DATE'

        return personality.mode === 'EFFICIENT'
          ? `Got it${extracted.petName ? `, ${extracted.petName}` : ''}! When works best for you? I have openings this week.`
          : `Wonderful! I can already tell ${extracted.petName || 'your fur baby'} is going to look AMAZING! ✨

When would you like to come in? I have some lovely spots available this week~ 📅`
      }

      return personality.mode === 'EFFICIENT'
        ? `I'd love to help you book! What's your pet's name and what kind of pet are they?`
        : `*Cheshire grin appears* ✨

I would LOVE to help you book an appointment!

First, tell me about your precious pet - what's their name and what kind of magical creature are they? 🐾`

    case 'COLLECTING_DATE':
      if (extracted.preferredDate || extracted.preferredTime) {
        // Parse the requested time
        const requestedTime = parsePreferredTime(extracted.preferredTime || extracted.preferredDate)
        const estimatedDuration = 60 // Default 60 min, will be refined when services are selected

        // CRITICAL: Check availability IMMEDIATELY when user requests a time
        console.log(`[Booking] Checking availability for: ${requestedTime.toISOString()}`)
        const availabilityCheck = await canBookSlot(requestedTime, estimatedDuration)

        if (!availabilityCheck.available) {
          // Time is NOT available - show alternatives
          console.log(`[Booking] ❌ Time not available: ${availabilityCheck.conflictReason}`)
          const alternatives = await getAvailableSlots()

          return personality.mode === 'EFFICIENT'
            ? `Sorry, that time isn't available - ${availabilityCheck.conflictReason || 'already booked'}.\n\nHere's what's open:\n${alternatives.map(s => `• ${s}`).join('\n')}\n\nWhich works for you?`
            : `Oh no! ${availabilityCheck.conflictReason || 'That time is already booked'} 😿

Let me show you what IS available:
${alternatives.map(s => `✨ ${s}`).join('\n')}

Which of these works better for you?`
        }

        // Time IS available - proceed
        console.log(`[Booking] ✅ Time is available!`)
        state.preferredTime = extracted.preferredTime || extracted.preferredDate
        state.step = 'COLLECTING_SERVICE'

        return personality.mode === 'EFFICIENT'
          ? `Great, ${format(requestedTime, "EEEE 'at' h:mm a")} works! What services do you need?`
          : `Perfect! ${format(requestedTime, "EEEE 'at' h:mm a")} is available! ✨

Now, what magic shall we work on ${state.petName || 'your pet'}?

🛁 **Bath & Tidy** - Fresh and fluffy
✂️ **Full Groom** - The whole spa experience
🎨 **Creative Color** - Let's get WILD
💅 **Nails Only** - Quick pampering`
      }

      return `When would you like to bring ${state.petName || 'your pet'} in?

I have openings most days - just let me know what works for your schedule! 📅`

    case 'COLLECTING_SERVICE':
      if (extracted.services && extracted.services.length > 0) {
        state.services = extracted.services
        state.step = 'CONFIRMING'

        return generateConfirmationMessage(state, personality.mode)
      }

      return personality.mode === 'EFFICIENT'
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
        // Get client name from conversation if available
        if (conversation.client) {
          state.clientName = `${conversation.client.firstName} ${conversation.client.lastName}`.trim()
          state.clientPhone = conversation.client.phone
        }

        // Create the booking in database and notify Kimmie
        const result = await createBookingInDatabase(state, context)

        if (!result.success) {
          // Check if it's an availability conflict vs other error
          if (result.error?.includes('booked') || result.error?.includes('closed') || result.error?.includes('open') || result.error?.includes('conflict') || result.error?.includes('not available')) {
            // Get alternative slots to suggest
            const alternatives = await getAvailableSlots()
            const altSuggestion = alternatives.length > 0
              ? `\n\nHere are some times that ARE available:\n${alternatives.slice(0, 3).map(s => `✨ ${s}`).join('\n')}`
              : ''

            return `Oh no! ${result.error} 😿${altSuggestion}

Would you like one of these times instead?`
          }

          return `I'm so sorry, something went wrong while saving your booking! 😿

Don't worry though - just DM us or call and we'll get you sorted right away!
Phone: (951) 696-9299`
        }

        return personality.mode === 'EFFICIENT'
          ? `✅ Booked! Kimmie will confirm your appointment shortly. See you soon!`
          : `🎉 FANTASTIC! Your booking request is in! ✨

Kimmie will review and confirm your appointment shortly - you'll get a notification!

${state.petName || 'Your pet'} is going to look absolutely MAGNIFICENT!
See you soon, gorgeous~ 😸👑`
      }

      if (/\b(no|change|different|actually)\b/i.test(message)) {
        return `No problem at all! What would you like to change?

• Different date/time?
• Different services?
• Something else?`
      }

      return generateConfirmationMessage(state, personality.mode)
  }

  // Fallback response (should not reach here)
  return `I'd love to help you book an appointment! Just let me know what you're looking for~ ✨`
}

/**
 * Determine current booking flow state from conversation
 * CRITICAL: Look at what the assistant LAST ASKED to know what step we're in
 */
function determineBookingState(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  extracted: ReturnType<typeof extractBookingData>
): BookingFlowState {
  const state: BookingFlowState = { step: 'INITIAL' }

  // First, extract all data from user messages
  for (const msg of history) {
    if (msg.role === 'user') {
      const data = extractBookingData(msg.content)
      if (data.petName) state.petName = data.petName
      if (data.petType) state.petType = data.petType
      if (data.preferredDate) state.preferredTime = data.preferredDate
      if (data.preferredTime) state.preferredTime = data.preferredTime
      // FIX: Only overwrite services if we actually found some (not empty array)
      if (data.services && data.services.length > 0) {
        state.services = data.services
      }
    }
  }

  // Also check the current message's extracted data
  if (extracted.petName) state.petName = extracted.petName
  if (extracted.petType) state.petType = extracted.petType
  if (extracted.preferredTime) state.preferredTime = extracted.preferredTime
  if (extracted.preferredDate && !state.preferredTime) state.preferredTime = extracted.preferredDate
  if (extracted.services && extracted.services.length > 0) {
    state.services = extracted.services
  }

  // CRITICAL: Look at the LAST assistant message to determine what step we're in
  // This prevents the flow from jumping around randomly
  const lastAssistantMsg = history
    .filter(m => m.role === 'assistant')
    .pop()?.content?.toLowerCase() || ''

  // Determine step based on what assistant last asked
  if (lastAssistantMsg.includes('confirm') || lastAssistantMsg.includes('purr-fect') || lastAssistantMsg.includes('lock it in')) {
    state.step = 'CONFIRMING'
  } else if (lastAssistantMsg.includes('what magic') || lastAssistantMsg.includes('what service') || lastAssistantMsg.includes('bath & tidy') || lastAssistantMsg.includes('full groom')) {
    state.step = 'COLLECTING_SERVICE'
  } else if (lastAssistantMsg.includes('when would you') || lastAssistantMsg.includes('what time') || lastAssistantMsg.includes('available') || lastAssistantMsg.includes('schedule')) {
    state.step = 'COLLECTING_DATE'
  } else if (lastAssistantMsg.includes('pet') || lastAssistantMsg.includes('name') || lastAssistantMsg.includes('creature')) {
    state.step = 'COLLECTING_PET'
  } else {
    // Fallback: determine from collected data
    if (state.services && state.services.length > 0) {
      state.step = 'CONFIRMING'
    } else if (state.preferredTime) {
      state.step = 'COLLECTING_SERVICE'
    } else if (state.petName || state.petType) {
      state.step = 'COLLECTING_DATE'
    } else {
      state.step = 'COLLECTING_PET'
    }
  }

  console.log(`[Booking] State determined: step=${state.step}, petName=${state.petName}, petType=${state.petType}, time=${state.preferredTime}, services=${state.services?.join(',')}`)

  return state
}

/**
 * Get available appointment slots using the availability engine
 * Now checks both database appointments and Google Calendar
 */
async function getAvailableSlots(preferredDay?: string): Promise<string[]> {
  try {
    // Use availability engine (checks DB appointments + Google Calendar + buffer time)
    const slots = await getAvailabilitySlots(new Date(), 7, 60) // 7 days ahead, 60 min slots

    // If a preferred day is specified, filter to that day
    if (preferredDay) {
      const lowerPref = preferredDay.toLowerCase()
      const filtered = slots.filter(slot =>
        slot.formatted.toLowerCase().includes(lowerPref)
      )
      if (filtered.length > 0) {
        return filtered.slice(0, 4).map(s => s.formatted)
      }
    }

    // Return first 4 available slots
    return slots.slice(0, 4).map(s => s.formatted)
  } catch (error) {
    console.error('Failed to get availability slots:', error)

    // Fallback to hardcoded slots if availability check fails
    const today = startOfDay(new Date())
    return [
      format(setHours(setMinutes(addDays(today, 1), 0), 10), "EEEE 'at' h:mm a"),
      format(setHours(setMinutes(addDays(today, 1), 0), 14), "EEEE 'at' h:mm a"),
      format(setHours(setMinutes(addDays(today, 2), 30), 11), "EEEE 'at' h:mm a"),
      format(setHours(setMinutes(addDays(today, 3), 0), 9), "EEEE 'at' h:mm a"),
    ]
  }
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

/**
 * Map pet type string to Species enum
 */
function mapPetTypeToSpecies(petType?: string): Species {
  if (!petType) return 'DOG'
  const type = petType.toLowerCase()
  if (type.includes('cat')) return 'CAT'
  if (type.includes('dog')) return 'DOG'
  if (type.includes('goat')) return 'GOAT'
  if (type.includes('pig')) return 'PIG'
  if (type.includes('guinea')) return 'GUINEA_PIG'
  return 'DOG' // Default
}

/**
 * Parse time string to Date object
 */
function parsePreferredTime(timeStr?: string): Date {
  if (!timeStr) {
    // Default to tomorrow at 10am
    return setHours(setMinutes(addDays(new Date(), 1), 0), 10)
  }

  // Try to parse common time formats
  // "Tuesday at 2:00 PM" or "tomorrow at 10am"
  try {
    // Extract time portion
    const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const meridian = timeMatch[3]?.toLowerCase()

      if (meridian === 'pm' && hours < 12) hours += 12
      if (meridian === 'am' && hours === 12) hours = 0

      // Check for day keywords
      const lowerStr = timeStr.toLowerCase()
      let targetDate = new Date()

      if (lowerStr.includes('tomorrow')) {
        targetDate = addDays(targetDate, 1)
      } else if (lowerStr.includes('monday')) {
        targetDate = getNextWeekday(targetDate, 1)
      } else if (lowerStr.includes('tuesday')) {
        targetDate = getNextWeekday(targetDate, 2)
      } else if (lowerStr.includes('wednesday')) {
        targetDate = getNextWeekday(targetDate, 3)
      } else if (lowerStr.includes('thursday')) {
        targetDate = getNextWeekday(targetDate, 4)
      } else if (lowerStr.includes('friday')) {
        targetDate = getNextWeekday(targetDate, 5)
      } else if (lowerStr.includes('saturday')) {
        targetDate = getNextWeekday(targetDate, 6)
      } else {
        // Default to tomorrow if no day specified
        targetDate = addDays(targetDate, 1)
      }

      return setHours(setMinutes(startOfDay(targetDate), minutes), hours)
    }
  } catch (e) {
    console.error('Failed to parse time:', timeStr, e)
  }

  // Fallback
  return setHours(setMinutes(addDays(new Date(), 1), 0), 10)
}

/**
 * Get next occurrence of a weekday
 */
function getNextWeekday(from: Date, targetDay: number): Date {
  const current = from.getDay()
  let daysUntil = targetDay - current
  if (daysUntil <= 0) daysUntil += 7
  return addDays(from, daysUntil)
}

/**
 * Map booking channel to BookingSource enum
 */
function mapChannelToSource(channel: string): BookingSource {
  switch (channel) {
    case 'INSTAGRAM': return 'INSTAGRAM'
    case 'FACEBOOK': return 'FACEBOOK'
    case 'WEBSITE': return 'WEBSITE'
    default: return 'WEBSITE'
  }
}

/**
 * Create the booking in the database and notify Kimmie
 */
export async function createBookingInDatabase(
  state: BookingFlowState,
  context: BookingContext
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  try {
    // Find or create client
    let client = await prisma.client.findFirst({
      where: state.clientPhone
        ? { phone: state.clientPhone }
        : undefined,
    })

    if (!client) {
      // Create new client with minimal info
      // Phone is required by schema, use a placeholder if not provided
      const phone = state.clientPhone || `pending-${context.externalId}`
      const [firstName, ...lastNameParts] = (state.clientName || 'New Client').split(' ')

      // Map channel to LeadSource
      const leadSource = context.channel === 'INSTAGRAM' ? 'INSTAGRAM'
        : context.channel === 'FACEBOOK' ? 'FACEBOOK'
        : 'WEBSITE'

      client = await prisma.client.create({
        data: {
          firstName: firstName || 'New',
          lastName: lastNameParts.join(' ') || 'Client',
          phone,
          source: leadSource,
        },
      })
    }

    // Find or create pet
    let pet = await prisma.pet.findFirst({
      where: {
        clientId: client.id,
        name: state.petName || 'Pet',
      },
    })

    if (!pet) {
      pet = await prisma.pet.create({
        data: {
          name: state.petName || 'Pet',
          species: mapPetTypeToSpecies(state.petType),
          clientId: client.id,
        },
      })
    }

    // Parse the scheduled time
    const scheduledAt = parsePreferredTime(state.preferredTime)

    // Look up services from database and calculate real duration
    const petSpecies = mapPetTypeToSpecies(state.petType)
    const serviceResult = await lookupServices(
      state.services || ['Full Groom'],
      petSpecies
    )
    const duration = serviceResult.totalDuration
    const endTime = new Date(scheduledAt.getTime() + duration * 60000)

    // Use transaction with Serializable isolation to prevent double-booking race condition
    // This ensures the availability check and create happen atomically
    const appointment = await prisma.$transaction(async (tx) => {
      // Check for conflicting appointments WITHIN the transaction
      const conflicting = await tx.appointment.findFirst({
        where: {
          status: { notIn: ['CANCELLED'] },
          OR: [
            // New appointment overlaps with start of existing
            {
              scheduledAt: { lte: scheduledAt },
              endTime: { gt: scheduledAt },
            },
            // New appointment overlaps with end of existing
            {
              scheduledAt: { lt: endTime },
              endTime: { gte: endTime },
            },
            // Existing appointment is fully contained within new
            {
              scheduledAt: { gte: scheduledAt },
              endTime: { lte: endTime },
            },
          ],
        },
      })

      if (conflicting) {
        throw new Error(`This time slot conflicts with an existing appointment at ${format(conflicting.scheduledAt, 'h:mm a')}`)
      }

      // Also check Google Calendar availability (outside transaction since it's external)
      const availability = await canBookSlot(scheduledAt, duration)
      if (!availability.available) {
        throw new Error(availability.conflictReason || 'This time slot is not available')
      }

      // Create the appointment WITHIN the transaction
      return tx.appointment.create({
        data: {
          scheduledAt,
          duration,
          endTime,
          clientId: client.id,
          petId: pet.id,
          status: 'PENDING',
          bookedVia: mapChannelToSource(context.channel),
          clientNotes: state.services?.join(', ') || 'Full Groom',
          estimatedPrice: serviceResult.totalPrice,
          // Connect actual Service records
          services: serviceResult.services.length > 0
            ? { connect: serviceResult.services.map((s) => ({ id: s.id })) }
            : undefined,
        },
      })
    }, {
      isolationLevel: 'Serializable', // Prevents phantom reads - strongest isolation
      timeout: 10000, // 10 second timeout
    })

    // Link conversation to client if not already linked
    await prisma.conversation.update({
      where: { id: context.conversationId },
      data: { clientId: client.id },
    })

    // Notify Kimmie via Telegram
    await notifyKimmieNewBooking({
      id: appointment.id,
      petName: pet.name,
      clientName: `${client.firstName} ${client.lastName}`.trim(),
      date: scheduledAt,
      time: format(scheduledAt, 'h:mm a'),
      services: state.services || ['Full Groom'],
      source: context.channel,
    })

    // Create Google Calendar event
    try {
      const clientName = `${client.firstName} ${client.lastName}`.trim()
      const serviceList = state.services || ['Full Groom']
      const calendarEventId = await createCalendarEvent({
        summary: `🐾 ${pet.name} - ${serviceList.join(', ')}`,
        description: `Client: ${clientName}\nPet: ${pet.name} (${state.petType || 'Dog'})\nServices: ${serviceList.join(', ')}\nBooked via: ${context.channel}\nAppointment ID: ${appointment.id}`,
        start: scheduledAt,
        end: endTime,
      })
      console.log(`[Booking] ✅ Created calendar event: ${calendarEventId}`)
    } catch (err) {
      console.error('[Booking] ❌ Failed to create calendar event:', err)
      // Don't fail the booking if calendar creation fails - appointment is in DB
    }

    return { success: true, appointmentId: appointment.id }
  } catch (error) {
    console.error('Failed to create booking:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
