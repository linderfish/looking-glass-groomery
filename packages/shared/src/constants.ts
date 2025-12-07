// packages/shared/src/constants.ts

// Donation minimums for shelter makeovers
export const DONATION_MINIMUMS = {
  SMALL: 45,
  MEDIUM: 55,
  XL_XXL: 75,
  GIANT: 100,
} as const

// Deposit amount for Looking Glass consultation (non-members)
export const CONSULTATION_DEPOSIT = 35

// Membership tiers (for future implementation)
export const MEMBERSHIP_TIERS = {
  CURIOUS: {
    name: 'Curious',
    price: 0, // TBD
    features: ['looking_glass_access', 'priority_booking'],
  },
  CURIOUSER: {
    name: 'Curiouser',
    price: 0, // TBD
    features: ['looking_glass_access', 'priority_booking', 'monthly_discount'],
  },
  ROYALTY: {
    name: 'Royalty',
    price: 0, // TBD
    features: ['looking_glass_access', 'priority_booking', 'monthly_discount', 'vip_perks'],
  },
} as const

// Kimmie's achievements
export const ACHIEVEMENTS = {
  BOOKINGS_10: { name: 'Double Digits!', emoji: '🔟', message: 'A wild 10 BOOKINGS appeared! You caught them all!' },
  BOOKINGS_50: { name: 'Half Century', emoji: '🏆', message: '50 bookings! You\'re basically McDreamy but for dogs' },
  BOOKINGS_100: { name: 'Triple Digits Queen', emoji: '👑', message: '100 BOOKINGS?! The Queen of Hearts is SHOOK' },
  STREAK_7: { name: 'Week Warrior', emoji: '🔥', message: '7 day photo streak! The gram is FED' },
  STREAK_30: { name: 'Monthly Maven', emoji: '💅', message: '30 days of content?! Main character energy' },
  CONTENT_QUEEN: { name: 'Content Queen', emoji: '📸', message: 'Posted 100 transformations! Absolutely iconic' },
  SHELTER_ANGEL: { name: 'Shelter Angel', emoji: '😇', message: '10 shelter makeovers! The shelters LOVE you' },
  CREATIVE_GENIUS: { name: 'Creative Genius', emoji: '🎨', message: '25 creative grooms! Picasso could never' },
} as const

// Cheshire Cat personality responses
export const CHESHIRE_RESPONSES = {
  GREETING: [
    "Well, well, well... who's tumbled down our rabbit hole? 😼",
    "Curiouser and curiouser! A new friend appears~",
    "We're all a bit mad here... especially for fluffy makeovers! 🐾",
  ],
  BOOKING_SUCCESS: [
    "Splendid! Your appointment is locked in like a Cheshire grin 😸",
    "Consider it done! The Queen's Spa awaits your royal floof~",
    "Purrfect! We'll make your baby absolutely magical ✨",
  ],
  FAREWELL: [
    "Until we meet again... *slowly fades except for grin* 😼",
    "Ta-ta for now! We're all a bit mad here~ 🐾",
    "Remember: we're all mad here. Some of us just have better haircuts! ✨",
  ],
} as const

// Service categories
export const SERVICE_CATEGORIES = {
  FULL_GROOM: 'Full Groom',
  BATH_TIDY: 'Bath & Tidy',
  A_LA_CARTE: 'À La Carte',
  CREATIVE: 'Creative & Color',
  SPA: 'Spa & Wellness',
  PACKAGE: 'Holiday Packages',
} as const

// Kimmie's personal easter egg triggers
export const KIMMIE_EASTER_EGGS = {
  POKEMON: ['pikachu', 'mimikyu', 'pokemon', 'gotta catch'],
  GREYS: ['mcdreamy', 'grey\'s', 'beautiful day to save'],
  MORMON_WIVES: ['mormon wives', 'swt', 'drama'],
  DINO: ['rawr', 'dinosaur', 'dino', 't-rex'],
  LIZARD: ['lizard', 'button', 'boop'],
} as const
