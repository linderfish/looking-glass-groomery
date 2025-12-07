// packages/shared/src/types.ts
import { z } from 'zod'

// ============== BOOKING ==============

export const BookingRequestSchema = z.object({
  clientPhone: z.string(),
  clientName: z.string().optional(),
  petName: z.string(),
  petSpecies: z.enum(['DOG', 'CAT', 'GOAT', 'PIG', 'GUINEA_PIG']).default('DOG'),
  services: z.array(z.string()),
  preferredDate: z.string(), // ISO date string
  preferredTime: z.string().optional(),
  notes: z.string().optional(),
  designId: z.string().optional(),
})

export type BookingRequest = z.infer<typeof BookingRequestSchema>

export const BookingDraftSchema = z.object({
  id: z.string(),
  clientId: z.string().optional(),
  clientPhone: z.string(),
  clientName: z.string().optional(),
  petName: z.string(),
  services: z.array(z.string()),
  requestedDate: z.string(),
  suggestedSlots: z.array(z.object({
    start: z.string(),
    end: z.string(),
    available: z.boolean(),
  })),
  status: z.enum(['PENDING_REVIEW', 'CONFIRMED', 'REJECTED']),
  source: z.string(),
  rawMessage: z.string().optional(),
})

export type BookingDraft = z.infer<typeof BookingDraftSchema>

// ============== LOOKING GLASS DESIGN ==============

export const DesignRequestSchema = z.object({
  petId: z.string(),
  petPhotoUrl: z.string().optional(),
  breed: z.string().optional(),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'XL']).optional(),
  description: z.string(),
})

export type DesignRequest = z.infer<typeof DesignRequestSchema>

export const DesignBlueprintSchema = z.object({
  // Body regions with instructions
  head: z.object({
    clipperGuard: z.string().optional(),
    style: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  ears: z.object({
    clipperGuard: z.string().optional(),
    style: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  body: z.object({
    clipperGuard: z.string().optional(),
    style: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  legs: z.object({
    clipperGuard: z.string().optional(),
    style: z.string().optional(),
    tapiered: z.boolean().optional(),
    notes: z.string().optional(),
  }).optional(),
  tail: z.object({
    style: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),

  // Creative elements
  colors: z.array(z.object({
    color: z.string(),
    brand: z.string().optional(),
    placement: z.string(),
    pattern: z.enum(['SOLID', 'SPOTS', 'RINGS', 'GRADIENT', 'STRIPES', 'CUSTOM']).optional(),
  })).optional(),

  // Extras
  extras: z.array(z.string()).optional(), // glitter, jewels, feathers, etc.

  // Overall notes
  notes: z.string().optional(),
})

export type DesignBlueprint = z.infer<typeof DesignBlueprintSchema>

// ============== TELEGRAM ==============

export const TelegramMessageSchema = z.object({
  type: z.enum([
    'BOOKING_DRAFT',
    'BOOKING_CONFIRMED',
    'APPOINTMENT_REMINDER',
    'PHOTO_REMINDER',
    'CONTENT_NUDGE',
    'ACHIEVEMENT',
    'STATS',
    'ESCALATION',
    'GENERAL',
  ]),
  title: z.string(),
  body: z.string(),
  actions: z.array(z.object({
    label: z.string(),
    callback: z.string(),
  })).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type TelegramMessage = z.infer<typeof TelegramMessageSchema>

// ============== CHESHIRE CAT ==============

export const ChatIntentSchema = z.enum([
  'BOOKING',
  'RESCHEDULE',
  'CANCEL',
  'PRICING',
  'SERVICES',
  'HOURS',
  'LOCATION',
  'CONSULTATION',
  'FAQ',
  'DONATION',
  'SHELTER',
  'UNKNOWN',
  'ESCALATE',
])

export type ChatIntent = z.infer<typeof ChatIntentSchema>

export const ConversationContextSchema = z.object({
  clientId: z.string().optional(),
  petId: z.string().optional(),
  currentIntent: ChatIntentSchema.optional(),
  collectedInfo: z.record(z.unknown()),
  consultationState: z.object({
    step: z.enum(['UPLOAD_PHOTO', 'DESCRIBE_STYLE', 'REVIEW_PREVIEW', 'APPROVE', 'COMPLETE']).optional(),
    designId: z.string().optional(),
  }).optional(),
})

export type ConversationContext = z.infer<typeof ConversationContextSchema>
