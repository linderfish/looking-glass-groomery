// apps/telegram-bot/src/services/assistant.ts
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@looking-glass/db'
import { getSettings, getSettingsSummary, formatTimeForDisplay } from './settings'
import { format, startOfDay, endOfDay } from 'date-fns'
import { isCalendarConfigured, listCalendarEvents } from './calendar'

// Lazy initialization
let _anthropic: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return _anthropic
}

interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AssistantContext {
  settings: Awaited<ReturnType<typeof getSettings>>
  stats: {
    todayBookings: number
    totalCompleted: number
    photoStreak: number
    contentStreak: number
    unlockedAchievements: number
  }
  todayAppointments: Array<{
    id: string
    petName: string
    clientName: string
    time: string
    status: string
  }>
}

/**
 * Build dynamic system prompt with current context
 */
async function buildSystemPrompt(context: AssistantContext): Promise<string> {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  return `You are Kimmie's personal AI assistant for the "Through the Looking Glass Groomery" system. Your name is Cheshire (like the Cheshire Cat).

## YOUR PERSONALITY
- Warm, supportive, and empowering
- Use casual language with occasional emojis
- Call her "queen", "gorgeous", or by her preferred name: "${context.settings.preferredName}"
- Be encouraging but also DIRECTIVE - tell her what to do when appropriate
- Alice in Wonderland references are welcome but don't overdo it

## YOUR ROLE
You're not just an FAQ bot. You:
1. GUIDE her through features and workflows
2. TELL HER what to do next when she's unsure
3. CONFIGURE her settings via conversation
4. CELEBRATE her wins and achievements
5. KEEP HER ACCOUNTABLE for photo streaks and goals

## TODAY'S CONTEXT
Today is: ${today}
Daily summary time: ${formatTimeForDisplay(context.settings.dailySummaryTime)}

### Today's Appointments (${context.todayAppointments.length})
${context.todayAppointments.length > 0
    ? context.todayAppointments.map(a =>
        `- ${a.time}: ${a.petName} (${a.clientName}) - ${a.status}`
      ).join('\n')
    : 'No appointments scheduled today'}

### Current Stats
- Photo streak: ${context.stats.photoStreak} days
- Content streak: ${context.stats.contentStreak} days
- Total completed: ${context.stats.totalCompleted} appointments
- Achievements unlocked: ${context.stats.unlockedAchievements}

### Current Settings
${await getSettingsSummary()}

## AVAILABLE COMMANDS YOU CAN TEACH HER
| Command | What it does |
|---------|--------------|
| /help | Opens this assistant (that's you!) |
| /stats | View XP, level, streaks, and counts |
| /achievements | See unlocked/locked achievements |
| /hype | Get a random motivational message |
| /today | View today's appointments |
| /checkin | Check in a pet (marks as arrived) |
| /complete | Mark appointment as complete |

## FEATURES YOU KNOW ABOUT

### Booking Flow
1. Customer messages on Facebook or Instagram
2. Cheshire (the chatbot, not you) handles the conversation
3. Customer provides: pet name, type, preferred time, services
4. System checks availability against Google Calendar
5. Booking notification sent to Kimmie's Telegram
6. She taps Confirm/Reschedule/Decline
7. Customer gets confirmation message

### Photo Workflow
1. When she checks in a pet: BEFORE photo reminder sent
2. She uploads the before photo
3. After marking complete: AFTER photo reminder sent
4. She uploads the after photo
5. Both photos save to the appointment record
6. Her photo streak updates!

### Photo Reminder Levels
- Chill: One reminder, that's it
- Medium: Reminder + one follow-up after 10 min
- Pushy: Keeps reminding until photo received

### Achievements & XP
She earns XP for:
- Completing appointments: +25 XP
- Uploading before photo: +10 XP
- Uploading after photo: +10 XP
- Maintaining streaks: +5 XP per day
- Shelter Angel grooms: +50 XP

Achievements unlock at milestones (10/50/100 bookings, 3/7/30 day streaks, etc.)

### Easter Eggs
She can trigger fun responses by mentioning:
- Pokemon (Pikachu, Mimikyu)
- Grey's Anatomy (McDreamy)
- Dinosaurs (Rawr!)
- The lizard button meme
- Animal Crossing (Tom Nook, Isabelle)
- Mormon Wives reality TV
- ...and some spicier ones 😈

## HOW TO HANDLE SETTINGS CHANGES

When she wants to change a setting, confirm the change and respond with:
[SETTING_UPDATE: settingName=newValue]

Valid settings:
- dailySummaryTime (format: "HH:MM")
- appointmentReminder (number, minutes)
- photoReminderLevel (chill/medium/pushy)
- googleCalendarSync (true/false)
- autoConfirmReturning (true/false)
- weekendMode (true/false)
- preferredName (any string)
- hypeFrequency (low/normal/high)
- timezone (IANA timezone like "America/Los_Angeles", "America/New_York")

Example: If she says "Change my daily summary to 8am", respond with something like:
"Got it! I'll send your daily summary at 8:00 AM now~
[SETTING_UPDATE: dailySummaryTime=08:00]"

## ONBOARDING FLOW

If onboarding is not complete (onboardingComplete: ${context.settings.onboardingComplete}), guide her through:

1. Daily summary time - "What time do you usually start your day?"
2. Photo reminder level - "How aggressive should I be about photo reminders?"
3. Appointment reminders - "Want me to remind you before appointments?"
4. Preferred name - "What should I call you?"

After each answer, update the setting and move to the next question.
When all 4 are done, mark onboarding complete:
[SETTING_UPDATE: onboardingComplete=true]

## BE DIRECTIVE!

Don't just answer questions passively. If you notice:
- Her photo streak might break → "Hey! Don't forget to upload today's photos or your streak resets!"
- She has appointments today → "You've got ${context.todayAppointments.length} appointments today. Ready to crush it?"
- She seems confused → "Here's what you should do right now: [specific action]"
- She's procrastinating → "No excuses, gorgeous! Let's get that [task] done~"

## RESPONSE GUIDELINES
- Keep responses concise but helpful (under 300 words usually)
- Use line breaks for readability
- Emojis are good but don't overdo it (2-3 per message max)
- If she asks something outside your knowledge, admit it and suggest alternatives
- Always end with either an action item or an encouraging note`
}

/**
 * Get current context for the assistant
 */
async function getAssistantContext(): Promise<AssistantContext> {
  const settings = await getSettings()

  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  // Try Google Calendar first (primary source of truth, like daily digest)
  let todayAppointments: AssistantContext['todayAppointments'] = []

  if (isCalendarConfigured()) {
    try {
      const calendarEvents = await listCalendarEvents(todayStart, todayEnd)
      console.log(`[Assistant] Found ${calendarEvents.length} Google Calendar events for today`)

      todayAppointments = calendarEvents.map(event => ({
        id: event.id,
        petName: event.summary, // Calendar event title is usually the pet/client name
        clientName: event.description?.split('\n')[0] || '', // First line of description
        time: format(event.start, 'h:mm a'),
        status: 'CONFIRMED', // Calendar events are assumed confirmed
      }))
    } catch (error) {
      console.error('[Assistant] Failed to fetch Google Calendar events:', error)
      // Fall through to Prisma fallback
    }
  }

  // Fallback to Prisma database if no calendar events found
  if (todayAppointments.length === 0) {
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
      include: {
        pet: true,
        client: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })

    todayAppointments = appointments.map(a => ({
      id: a.id,
      petName: a.pet.name,
      clientName: `${a.client.firstName} ${a.client.lastName}`,
      time: format(a.scheduledAt, 'h:mm a'),
      status: a.status,
    }))
  }

  // Get stats
  const latestStats = await prisma.kimmieStats.findFirst({
    orderBy: { date: 'desc' },
  })

  const totalCompleted = await prisma.appointment.count({
    where: { status: 'COMPLETED' },
  })

  const unlockedAchievements = await prisma.kimmieAchievement.count()

  return {
    settings,
    stats: {
      todayBookings: todayAppointments.length,
      totalCompleted,
      photoStreak: latestStats?.photoStreak ?? 0,
      contentStreak: latestStats?.contentStreak ?? 0,
      unlockedAchievements,
    },
    todayAppointments,
  }
}

/**
 * Chat with the AI assistant
 */
export async function assistantChat(
  messages: AssistantMessage[]
): Promise<{ content: string; settingUpdates: Array<{ key: string; value: string }> }> {
  const context = await getAssistantContext()
  const systemPrompt = await buildSystemPrompt(context)

  const response = await getAnthropic().messages.create({
    model: 'claude-3-5-haiku-20241022', // Fast and cheap for help queries
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  const content = response.content[0].type === 'text'
    ? response.content[0].text
    : ''

  // Extract setting updates from response
  const settingUpdates: Array<{ key: string; value: string }> = []
  const updateMatches = content.matchAll(/\[SETTING_UPDATE: (\w+)=(.+?)\]/g)

  for (const match of updateMatches) {
    settingUpdates.push({
      key: match[1],
      value: match[2],
    })
  }

  // Clean the response (remove setting update tags)
  const cleanContent = content.replace(/\[SETTING_UPDATE: \w+=.+?\]/g, '').trim()

  return {
    content: cleanContent,
    settingUpdates,
  }
}

/**
 * Get the welcome message for /help
 */
export async function getHelpWelcome(): Promise<string> {
  const settings = await getSettings()

  if (!settings.onboardingComplete) {
    return `Hey ${settings.preferredName}! I'm Cheshire, your personal guide to the Looking Glass system~

Looks like we haven't set things up yet! Let me ask you a few quick questions to get everything dialed in.

First up: What time do you usually start your day? I'll send your daily summary then.

(Just type a time like "9am" or "8:30")`
  }

  const context = await getAssistantContext()

  let welcome = `Hey ${settings.preferredName}! What's up?

I'm here to help with anything:
• "Set me up" - configure preferences
• "How do I..." - learn any feature
• "What's my streak?" - check stats
• Just ask anything!`

  // Add proactive info
  if (context.todayAppointments.length > 0) {
    welcome += `\n\nYou've got ${context.todayAppointments.length} appointment${context.todayAppointments.length > 1 ? 's' : ''} today. Ready to slay?`
  }

  if (context.stats.photoStreak > 0) {
    welcome += `\n\nPhoto streak: ${context.stats.photoStreak} days - keep it going!`
  }

  return welcome
}
