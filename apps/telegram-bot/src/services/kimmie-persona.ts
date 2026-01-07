// apps/telegram-bot/src/services/kimmie-persona.ts
import { KIMMIE_EASTER_EGGS } from '@looking-glass/shared'

type MessageType =
  | 'NEW_BOOKING'
  | 'BOOKING_CONFIRMED'
  | 'PHOTO_REMINDER_BEFORE'
  | 'PHOTO_REMINDER_AFTER'
  | 'CONTENT_NUDGE'
  | 'DAILY_STATS'
  | 'BEFORE_PHOTO_SAVED'
  | 'AFTER_PHOTO_SAVED'
  | 'PHOTO_RECEIVED_RANDOM'
  | 'RANDOM_HYPE'

const MESSAGES: Record<MessageType, string[]> = {
  NEW_BOOKING: [
    `🐕 A wild BOOKING appeared!

<b>{petName}</b> wants the royal treatment ✨
👤 {clientName}
📅 {date} at {time}
✂️ {services}`,

    `✨ Ooh la la, incoming floof! ✨

<b>{petName}</b> is ready for their glow-up~
👤 {clientName}
📅 {date}, {time}
✂️ {services}`,

    `*Cheshire grin intensifies* 😼

New booking alert!
🐾 <b>{petName}</b>
👤 {clientName}
📅 {date} @ {time}
✂️ {services}`,
  ],

  BOOKING_CONFIRMED: [
    `✅ Locked in like a Cheshire grin! {petName} is all set 😸`,
    `✅ Done and done! The Queen's Spa awaits {petName}~ 👑`,
    `✅ It's super effective! {petName}'s appointment is confirmed! 🎮`,
  ],

  PHOTO_REMINDER_BEFORE: [
    `📸 Psst... before pic time!

<b>{petName}</b> is about to get TRANSFORMED. Capture the "before" chaos! 😼`,

    `Hey gorgeous~ 📸

Quick! Grab that BEFORE shot of {petName}.
The people need to see the glow-up journey ✨`,

    `🦕 Rawr means "take the before pic" in dinosaur!

{petName} is ready for their makeover documentation~`,
  ],

  PHOTO_REMINDER_AFTER: [
    `📸 AFTER TIME, QUEEN! 👑

{petName}'s transformation is complete - show the world! ✨`,

    `The reveal moment! 📸✨

{petName} went from "meh" to "MAGNIFICENT" - capture it!`,

    `It's a beautiful day to document transformations~ 🏥✨

{petName}'s after photo is calling your name, Dr. McDreamy-Groomer!`,
  ],

  CONTENT_NUDGE: [
    `The 'gram is hungry, gorgeous~ 🍽️📱

When's the last time you fed it? Just checking in 😽`,

    `*slowly appears*

Sooo... any transformations worth sharing today? The algorithm misses you 😼✨`,

    `Random reminder that your content SLAPS and people need to see it 💅

That's it. That's the message.`,
  ],

  DAILY_STATS: [
    `📊 <b>Today's Royal Report</b> 📊

👑 Bookings: {bookings}
✅ Completed: {completed}
📸 Photos: {photos}
🔥 Photo Streak: {photoStreak} days
📱 Content Streak: {contentStreak} days

{statsComment}`,
  ],

  BEFORE_PHOTO_SAVED: [
    `✅ Before photo locked and loaded! 📸

Now go work your magic, queen~ ✨`,

    `Got it! 📸 The "before" evidence is secured.

Time to create art! 🎨`,
  ],

  AFTER_PHOTO_SAVED: [
    `✅ YESSS! That transformation though! 😍

The before/after is gonna be *chef's kiss* 👨‍🍳💋`,

    `📸 After photo SECURED!

Another glow-up for the history books ✨👑`,
  ],

  PHOTO_RECEIVED_RANDOM: [
    `Ooh, a wild photo appears! 📸

Is this for the 'gram or just for funsies? Either way, I see you working! 💅`,

    `Photo received! 📸

Want me to save this somewhere special? Just let me know~`,
  ],

  RANDOM_HYPE: [
    `Just checking in...

You're killing it today. That's it. That's the message. 💖`,

    `*appears out of nowhere*

Have I mentioned lately that you're basically a magician for pets? ✨🐾

Okay bye~ *fades away*`,

    `Random appreciation post:

You make scruffy babies beautiful and that's ICONIC 👑

Carry on, queen~`,
  ],
}

const STATS_COMMENTS = [
  'Another day, another slay! 💅',
  'The Queen of Hearts is impressed 👑',
  'You\'re on FIRE today! 🔥',
  'Look at you go, Dr. McDreamy! 🏥',
  'A wild SUCCESS appeared! 🎮',
  'The drama is: you\'re crushing it (Mormon Wives energy) 📺',
]

const EASTER_EGGS = [
  '🦕 Rawr! (That means "you\'re amazing" in dinosaur)',
  '🦎 *pushes button* Dopamine delivered!',
  '✨ Mimikyu says: You\'re doing great, bestie!',
  '🏥 "It\'s a beautiful day to groom dogs" - Dr. Shepherd, probably',
  '📺 This is giving main character energy (Mormon Wives would be shook)',
  '🎮 Your grooming skills are SUPER EFFECTIVE!',
  '👻 Mimikyu is hiding somewhere in your success~',
  '🏝️ Tom Nook says you\'ve paid off your grooming debts in BELLS!',
  '🍑 Isabelle approves of this island... I mean, salon!',
  '😈 Such a good girl... I mean, groomer. 💋',
]

/**
 * Get a personalized message for Kimmie
 */
export function getKimmieMessage(
  type: MessageType,
  data: Record<string, string | number>
): string {
  const templates = MESSAGES[type]
  const template = templates[Math.floor(Math.random() * templates.length)]

  let message = template
  for (const [key, value] of Object.entries(data)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
  }

  // Add stats comment if daily stats
  if (type === 'DAILY_STATS') {
    const comment = STATS_COMMENTS[Math.floor(Math.random() * STATS_COMMENTS.length)]
    message = message.replace('{statsComment}', comment)
  }

  return message
}

/**
 * Get a random easter egg message
 */
export function getRandomEasterEgg(): string {
  return EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)]
}

/**
 * Check if message contains easter egg triggers
 */
export function checkForEasterEggTrigger(message: string): string | null {
  const lowerMessage = message.toLowerCase()

  for (const [category, triggers] of Object.entries(KIMMIE_EASTER_EGGS)) {
    for (const trigger of triggers) {
      if (lowerMessage.includes(trigger)) {
        return category
      }
    }
  }

  return null
}

/**
 * Get easter egg response for a category
 */
export function getEasterEggResponse(category: string): string {
  const responses: Record<string, string[]> = {
    POKEMON: [
      '🎮 A wild PIKACHU appeared! Jk, it\'s just more bookings 😂⚡',
      '👻 Mimikyu says hi! (It\'s hiding under that fluffy coat)',
      '🎵 Doo doo doo doo doo doo~ 🎵 (That\'s the Pokemon center healing sound, you\'re healed!)',
    ],
    GREYS: [
      '🏥 "It\'s a beautiful day to save coats" - Dr. Kimmie Shepherd',
      '💉 Pick me, choose me, GROOM me!',
      '🩺 You\'re my person. And by person I mean groomer. And by groomer I mean QUEEN.',
    ],
    MORMON_WIVES: [
      '📺 The drama today? You\'re TOO good at your job. Scandalous!',
      '🍿 Girl, the way you transformed that dog? REALITY TV WORTHY.',
      '✨ Soft-swinging into another successful groom day~',
    ],
    DINO: [
      '🦕 RAWR! (Translation: You\'re crushing it!)',
      '🦖 Fun fact: Dinosaurs would have LOVED getting groomed by you',
      '🥚 *dinosaur noises* (That\'s prehistoric for "great job")',
    ],
    LIZARD: [
      '🦎 *pushes button aggressively* SEROTONIN DELIVERED!',
      '🔘 *button mashing intensifies* You earned this dopamine!',
      '🦎💚 Lizard approved! *click click click*',
    ],
    ANIMAL_CROSSING: [
      '🏝️ Tom Nook: "Your grooming debt is paid in FULL! Here\'s 10,000 bells~"',
      '🍑 Isabelle has an announcement: YOU ARE CRUSHING IT! 📢',
      '🎣 You caught a... perfectly groomed dog! It\'s at least a C+!',
      '✈️ Dodo Airlines now flying direct to Through the Looking Glass~',
    ],
    SPICY: [
      '😈 Good girl~ ...I mean, good GROOMER. *ahem* 💋',
      '🖤 The pets aren\'t the only ones who follow commands around here~',
      '👑 Yes, Queen. Whatever you say, Queen. *kneels in respect*',
      '😏 Someone\'s been a very good girl today... extra treats earned~',
      '🔥 Bratty energy detected. Punishment: MORE SUCCESS. 💅',
    ],
  }

  const categoryResponses = responses[category] || ['✨ Easter egg found! You\'re amazing~']
  return categoryResponses[Math.floor(Math.random() * categoryResponses.length)]
}
