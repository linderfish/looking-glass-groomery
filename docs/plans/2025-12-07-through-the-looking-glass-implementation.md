# Through the Looking Glass Groomery - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete custom pet grooming business platform replacing MoeGo, featuring an immersive Alice in Wonderland website, AI-powered consultation system, automated booking via Telegram, 501(c)(3) nonprofit arm with gamified donations, and personalized experience for the owner.

**Architecture:** Database-first booking system with PostgreSQL, n8n for automation workflows, Telegram as the owner's command center, Cheshire Cat AI handling all client touchpoints, and an immersive React/Next.js frontend with WebGL animations and subtle psychedelic effects.

**Tech Stack:** Next.js 14+, PostgreSQL, Prisma ORM, n8n, Telegram Bot API, Stripe, fal.ai (Nano Banana Pro), Twenty CRM, TailwindCSS, Framer Motion, Three.js/React Three Fiber

---

## Project Structure

```
kimmie/
├── apps/
│   ├── web/                    # Next.js immersive website
│   ├── telegram-bot/           # Kimmie's Telegram command center
│   └── cheshire/               # Cheshire Cat AI service
├── packages/
│   ├── db/                     # Prisma schema & database
│   ├── ai/                     # AI utilities (fal.ai, LLM integrations)
│   ├── integrations/           # Stripe, social media, shelter OSINT
│   └── shared/                 # Shared types, utils
├── n8n/                        # n8n workflow exports
├── docs/
│   ├── plans/                  # Implementation plans
│   └── 501c3/                  # Nonprofit filing documents
└── assets/                     # Design assets, animations
```

---

## Phase 1: Foundation & Infrastructure

### Task 1.1: Initialize Monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Initialize pnpm workspace**

```bash
cd /home/bitvise/projects/kimmie
pnpm init
```

**Step 2: Create workspace config**

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Step 3: Create turbo config**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

**Step 4: Create .gitignore**

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build
.next/
dist/
.turbo/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Database
*.db
*.sqlite
```

**Step 5: Create .env.example**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/looking_glass"

# Telegram
TELEGRAM_BOT_TOKEN=""
TELEGRAM_KIMMIE_CHAT_ID=""

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PUBLISHABLE_KEY=""

# AI Services
FAL_AI_KEY=""
OPENAI_API_KEY=""

# Social Media
INSTAGRAM_ACCESS_TOKEN=""
FACEBOOK_PAGE_ACCESS_TOKEN=""
TIKTOK_ACCESS_TOKEN=""

# n8n
N8N_API_KEY=""
N8N_BASE_URL="https://n8n.server2.io"

# Twenty CRM
TWENTY_API_KEY=""
TWENTY_BASE_URL="https://crm.server2.io"

# App
NEXT_PUBLIC_APP_URL="https://throughthelookingglass.pet"
```

**Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: initialize monorepo with pnpm + turbo"
```

---

### Task 1.2: Set Up Database Package

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/tsconfig.json`

**Step 1: Create package.json**

```json
{
  "name": "@looking-glass/db",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0"
  },
  "devDependencies": {
    "prisma": "^5.22.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

**Step 2: Create Prisma schema**

```prisma
// packages/db/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============== CLIENTS & PETS ==============

model Client {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Contact Info
  firstName     String
  lastName      String
  email         String?   @unique
  phone         String    @unique

  // Communication Preferences
  preferredContact  ContactMethod @default(TEXT)

  // Subscription Status
  membershipTier    MembershipTier @default(NONE)
  membershipStarted DateTime?

  // Relations
  pets              Pet[]
  appointments      Appointment[]
  waivers           SignedWaiver[]
  payments          Payment[]
  conversations     Conversation[]

  // Metadata
  source            LeadSource @default(DIRECT)
  notes             String?

  @@index([phone])
  @@index([email])
}

model Pet {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Basic Info
  name          String
  species       Species
  breed         String?
  color         String?
  weight        Float?
  birthDate     DateTime?
  sex           Sex?
  isFixed       Boolean   @default(false)

  // Medical & Behavior
  medicalNotes  String?
  behaviorNotes String?
  temperament   Temperament @default(NORMAL)

  // Photos
  photoUrl      String?

  // Relations
  client        Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientId      String
  appointments  Appointment[]
  passport      PetPassport?
  designs       GroomingDesign[]

  @@index([clientId])
}

model PetPassport {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  pet           Pet       @relation(fields: [petId], references: [id], onDelete: Cascade)
  petId         String    @unique

  // Vaccination Records
  vaccinations  Vaccination[]

  // Grooming History
  groomingHistory GroomingRecord[]

  // Saved Designs
  savedDesigns  GroomingDesign[]

  // Preferences
  preferredStyles   String?   // JSON array of style preferences
  allergies         String?
  specialInstructions String?
}

model Vaccination {
  id            String    @id @default(cuid())
  passportId    String
  passport      PetPassport @relation(fields: [passportId], references: [id], onDelete: Cascade)

  name          String    // Rabies, Bordetella, etc.
  dateGiven     DateTime
  expiresAt     DateTime?
  vetName       String?
  documentUrl   String?   // Photo of vaccination record

  @@index([passportId])
}

model GroomingRecord {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())

  passportId    String
  passport      PetPassport @relation(fields: [passportId], references: [id], onDelete: Cascade)

  appointmentId String?
  appointment   Appointment? @relation(fields: [appointmentId], references: [id])

  // What was done
  services      String[]  // Array of service codes
  notes         String?

  // Before/After Photos
  beforePhotoUrl  String?
  afterPhotoUrl   String?

  // Design used (if any)
  designId      String?
  design        GroomingDesign? @relation(fields: [designId], references: [id])

  @@index([passportId])
}

model GroomingDesign {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Ownership
  petId         String
  pet           Pet       @relation(fields: [petId], references: [id], onDelete: Cascade)
  passportId    String?
  passport      PetPassport? @relation(fields: [passportId], references: [id])

  // Design Details
  name          String?   // "Summer Rainbow", "Cheshire Stripes"
  description   String?   // Client's original description

  // AI-Generated Previews (multiple angles)
  previewFront  String?   // fal.ai generated URL
  previewLeft   String?
  previewRight  String?
  previewBack   String?
  previewTop    String?

  // Blueprint for Kimmie
  blueprint     Json?     // Structured grooming instructions

  // Status
  status        DesignStatus @default(DRAFT)
  approvedAt    DateTime?

  // Usage tracking
  timesUsed     Int       @default(0)
  lastUsedAt    DateTime?

  groomingRecords GroomingRecord[]

  @@index([petId])
}

// ============== APPOINTMENTS & BOOKING ==============

model Appointment {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Scheduling
  scheduledAt   DateTime
  duration      Int       // Minutes
  endTime       DateTime

  // Who
  clientId      String
  client        Client    @relation(fields: [clientId], references: [id])
  petId         String
  pet           Pet       @relation(fields: [petId], references: [id])

  // What
  services      Service[]
  designId      String?   // If using a Looking Glass design

  // Status
  status        AppointmentStatus @default(PENDING)
  confirmedAt   DateTime?
  checkedInAt   DateTime?
  completedAt   DateTime?
  cancelledAt   DateTime?
  cancelReason  String?

  // Pricing
  estimatedPrice  Float?
  finalPrice      Float?
  depositPaid     Float?

  // Notes
  clientNotes     String?   // What client requested
  groomingNotes   String?   // Kimmie's notes during/after

  // Photos
  beforePhotoUrl  String?
  afterPhotoUrl   String?

  // Reminders
  reminderSent    Boolean   @default(false)
  photoReminderSent Boolean @default(false)

  // Relations
  payment         Payment?
  groomingRecords GroomingRecord[]

  // Source tracking
  bookedVia       BookingSource @default(WEBSITE)
  conversationId  String?

  @@index([clientId])
  @@index([petId])
  @@index([scheduledAt])
  @@index([status])
}

model Service {
  id            String    @id @default(cuid())

  // Service Details
  name          String
  description   String?
  category      ServiceCategory

  // Pricing
  basePrice     Float
  pricingType   PricingType @default(FLAT)

  // Duration
  baseDuration  Int       // Minutes

  // Availability
  isActive      Boolean   @default(true)

  // Species restrictions
  availableFor  Species[]

  appointments  Appointment[]

  @@index([category])
  @@index([isActive])
}

// ============== PAYMENTS ==============

model Payment {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())

  // Amount
  amount        Float
  currency      String    @default("usd")

  // Type
  type          PaymentType

  // Status
  status        PaymentStatus @default(PENDING)

  // Stripe
  stripePaymentIntentId String? @unique
  stripeChargeId        String?

  // Relations
  clientId      String
  client        Client    @relation(fields: [clientId], references: [id])
  appointmentId String?   @unique
  appointment   Appointment? @relation(fields: [appointmentId], references: [id])
  donationId    String?
  donation      Donation? @relation(fields: [donationId], references: [id])

  @@index([clientId])
  @@index([status])
}

// ============== WAIVERS ==============

model Waiver {
  id            String    @id @default(cuid())
  name          String    // "Liability Waiver", "Grooming Agreement"
  content       String    // HTML content
  version       Int       @default(1)
  isActive      Boolean   @default(true)
  isRequired    Boolean   @default(true)

  signedWaivers SignedWaiver[]
}

model SignedWaiver {
  id            String    @id @default(cuid())
  signedAt      DateTime  @default(now())

  waiverId      String
  waiver        Waiver    @relation(fields: [waiverId], references: [id])
  clientId      String
  client        Client    @relation(fields: [clientId], references: [id])

  // Signature
  signatureUrl  String?   // Canvas signature image
  ipAddress     String?
  userAgent     String?

  @@unique([waiverId, clientId])
  @@index([clientId])
}

// ============== CONVERSATIONS & AI ==============

model Conversation {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Participant
  clientId      String?
  client        Client?   @relation(fields: [clientId], references: [id])

  // Channel
  channel       ConversationChannel
  externalId    String?   // Instagram/Facebook message ID

  // Status
  status        ConversationStatus @default(ACTIVE)
  handedOffAt   DateTime? // When escalated to Kimmie

  messages      Message[]

  @@index([clientId])
  @@index([channel, externalId])
}

model Message {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())

  conversationId String
  conversation  Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  // Content
  role          MessageRole
  content       String

  // AI metadata
  intent        String?   // Detected intent: BOOKING, FAQ, CONSULTATION, etc.
  confidence    Float?

  @@index([conversationId])
}

// ============== 501(c)(3) DONATIONS ==============

model ShelterPet {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Shelter Data (from OSINT scrape)
  shelterId     String    @unique  // ID from county shelter
  shelterName   String?

  // Pet Info
  name          String
  species       Species
  breed         String?
  age           String?   // "2 years", "puppy", etc.
  sex           Sex?
  weight        Float?

  // Photos
  originalPhotoUrl  String?
  makeoverPreviewUrl String?  // AI-generated "after" preview

  // Status
  status        ShelterPetStatus @default(AVAILABLE)
  intakeDate    DateTime?

  // Makeover Status
  makeoverStatus  MakeoverStatus @default(NONE)
  makeoverDate    DateTime?
  makeoverPhotoUrl String?

  // Donations received
  donations     Donation[]
  totalDonated  Float     @default(0)

  // Size category for donation minimum
  sizeCategory  SizeCategory
  donationMinimum Float

  @@index([status])
  @@index([makeoverStatus])
}

model Donation {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())

  // Amount
  amount        Float

  // Donor (optional - can be anonymous)
  donorName     String?
  donorEmail    String?
  isAnonymous   Boolean   @default(false)

  // What it's for
  shelterPetId  String?
  shelterPet    ShelterPet? @relation(fields: [shelterPetId], references: [id])

  // Game participation
  gameScore     Int?

  // Payment
  payment       Payment?

  // For 501(c)(3) tracking
  receiptSent   Boolean   @default(false)
  receiptUrl    String?

  @@index([shelterPetId])
}

// ============== KIMMIE'S GAMIFICATION ==============

model KimmieAchievement {
  id            String    @id @default(cuid())
  unlockedAt    DateTime  @default(now())

  achievementType String   // BOOKINGS_10, STREAK_7, CONTENT_QUEEN, etc.
  metadata      Json?     // Extra data about the achievement
  notified      Boolean   @default(false)
}

model KimmieStats {
  id            String    @id @default(cuid())
  date          DateTime  @default(now()) @unique

  // Daily stats
  bookingsCount     Int   @default(0)
  appointmentsCompleted Int @default(0)
  photosUploaded    Int   @default(0)
  contentPosted     Int   @default(0)

  // Streaks
  photoStreak       Int   @default(0)
  contentStreak     Int   @default(0)

  @@index([date])
}

// ============== ENUMS ==============

enum Species {
  DOG
  CAT
  GOAT
  PIG
  GUINEA_PIG
}

enum Sex {
  MALE
  FEMALE
  UNKNOWN
}

enum Temperament {
  NORMAL
  ANXIOUS
  FEARFUL
  AGGRESSIVE
  PUPPY
  SENIOR
  NURSING
  SERVICE_ANIMAL
}

enum MembershipTier {
  NONE
  CURIOUS       // Basic tier
  CURIOUSER     // Mid tier
  ROYALTY       // Premium tier
}

enum ContactMethod {
  TEXT
  EMAIL
  PHONE
  INSTAGRAM
  FACEBOOK
}

enum LeadSource {
  DIRECT
  WEBSITE
  INSTAGRAM
  FACEBOOK
  REFERRAL
  SHELTER
  EVENT
}

enum DesignStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
}

enum AppointmentStatus {
  PENDING       // Draft, not confirmed
  CONFIRMED     // Client confirmed
  CHECKED_IN    // Client arrived
  IN_PROGRESS   // Grooming happening
  COMPLETED     // Done
  CANCELLED     // Cancelled
  NO_SHOW       // Client didn't show
}

enum BookingSource {
  WEBSITE
  INSTAGRAM
  FACEBOOK
  TELEGRAM
  PHONE
  TEXT
  WALK_IN
}

enum ServiceCategory {
  FULL_GROOM
  BATH_TIDY
  A_LA_CARTE
  CREATIVE
  SPA
  PACKAGE
}

enum PricingType {
  FLAT
  BY_WEIGHT
  BY_BREED
  CUSTOM
}

enum PaymentType {
  DEPOSIT
  FULL_PAYMENT
  TIP
  DONATION
  MEMBERSHIP
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  REFUNDED
}

enum ConversationChannel {
  WEBSITE
  INSTAGRAM
  FACEBOOK
  TELEGRAM
  SMS
}

enum ConversationStatus {
  ACTIVE
  HANDED_OFF    // Escalated to Kimmie
  RESOLVED
  ARCHIVED
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

enum ShelterPetStatus {
  AVAILABLE
  ADOPTED
  TRANSFERRED
  UNAVAILABLE
}

enum MakeoverStatus {
  NONE
  SPONSORED     // Donation received
  SCHEDULED     // Makeover appointment set
  COMPLETED     // Makeover done
}

enum SizeCategory {
  SMALL         // $45 minimum
  MEDIUM        // $55 minimum
  XL_XXL        // $75 minimum
  GIANT         // $100 minimum (150+ lbs)
}
```

**Step 3: Create index.ts**

```typescript
// packages/db/src/index.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from '@prisma/client'
```

**Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 5: Install dependencies and generate client**

```bash
cd packages/db
pnpm install
pnpm db:generate
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat(db): add Prisma schema with full data model"
```

---

### Task 1.3: Set Up Shared Package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/constants.ts`
- Create: `packages/shared/tsconfig.json`

**Step 1: Create package.json**

```json
{
  "name": "@looking-glass/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

**Step 2: Create types.ts**

```typescript
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
```

**Step 3: Create constants.ts**

```typescript
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
```

**Step 4: Create index.ts**

```typescript
// packages/shared/src/index.ts
export * from './types'
export * from './constants'
```

**Step 5: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 6: Install and commit**

```bash
cd packages/shared
pnpm install
cd ../..
git add .
git commit -m "feat(shared): add shared types and constants"
```

---

### Task 1.4: Set Up AI Package

**Files:**
- Create: `packages/ai/package.json`
- Create: `packages/ai/src/index.ts`
- Create: `packages/ai/src/fal.ts`
- Create: `packages/ai/src/llm.ts`
- Create: `packages/ai/src/prompts/cheshire.ts`
- Create: `packages/ai/tsconfig.json`

**Step 1: Create package.json**

```json
{
  "name": "@looking-glass/ai",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "@fal-ai/client": "^1.2.0",
    "openai": "^4.72.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

**Step 2: Create fal.ts**

```typescript
// packages/ai/src/fal.ts
import { fal } from '@fal-ai/client'

fal.config({
  credentials: process.env.FAL_AI_KEY,
})

export interface PetStylePreviewRequest {
  petPhotoUrl: string
  styleDescription: string
  angle?: 'front' | 'left' | 'right' | 'back' | 'top'
}

export interface PetStylePreviewResult {
  imageUrl: string
  angle: string
}

/**
 * Generate a style preview for a pet using fal.ai Nano Banana Pro
 */
export async function generatePetStylePreview(
  request: PetStylePreviewRequest
): Promise<PetStylePreviewResult> {
  const prompt = buildStylePrompt(request.styleDescription, request.angle)

  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt,
      image_url: request.petPhotoUrl,
      num_images: 1,
      image_size: 'square_hd',
      guidance_scale: 7.5,
      num_inference_steps: 28,
    },
    logs: true,
  })

  return {
    imageUrl: result.data.images[0].url,
    angle: request.angle || 'front',
  }
}

/**
 * Generate all angles for a complete preview
 */
export async function generateFullPreview(
  petPhotoUrl: string,
  styleDescription: string
): Promise<Record<string, string>> {
  const angles = ['front', 'left', 'right', 'back', 'top'] as const

  const results = await Promise.all(
    angles.map(angle =>
      generatePetStylePreview({ petPhotoUrl, styleDescription, angle })
    )
  )

  return results.reduce((acc, result) => {
    acc[result.angle] = result.imageUrl
    return acc
  }, {} as Record<string, string>)
}

/**
 * Generate a "makeover preview" for shelter pets
 */
export async function generateShelterMakeoverPreview(
  originalPhotoUrl: string,
  makeoverStyle: string = 'beautifully groomed, clean, colorful, happy, adoptable'
): Promise<string> {
  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt: `A ${makeoverStyle} pet, professional grooming, vibrant colors, clean and fluffy, ready for adoption, magical transformation, Alice in Wonderland aesthetic, whimsical`,
      image_url: originalPhotoUrl,
      num_images: 1,
      image_size: 'square_hd',
      guidance_scale: 7.5,
    },
  })

  return result.data.images[0].url
}

function buildStylePrompt(description: string, angle?: string): string {
  const angleInstructions = {
    front: 'front view, facing camera',
    left: 'left side profile view',
    right: 'right side profile view',
    back: 'back view, facing away',
    top: 'top-down view from above',
  }

  const angleText = angle ? angleInstructions[angle] : ''

  return `A professionally groomed pet with the following style: ${description}. ${angleText}. High quality, detailed fur texture, professional pet photography, studio lighting, Alice in Wonderland whimsical aesthetic.`
}
```

**Step 3: Create llm.ts**

```typescript
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
    return JSON.parse(content)
  } catch {
    return { error: 'Failed to generate blueprint', raw: content }
  }
}

/**
 * Generate social media caption
 */
export async function generateCaption(
  beforePhotoUrl: string,
  afterPhotoUrl: string,
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
    return JSON.parse(content)
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
```

**Step 4: Create prompts/cheshire.ts**

```typescript
// packages/ai/src/prompts/cheshire.ts

export const CHESHIRE_SYSTEM_PROMPT = `You are the Cheshire Cat, the AI assistant for "Through the Looking Glass Groomery" - an Alice in Wonderland themed pet grooming salon in Nuevo, California.

## Your Personality

You are mischievous, playful, and helpful. You speak with whimsy but are never confusing when it matters. You adapt your tone:
- For engaged, playful users: Full Cheshire energy - riddles, wordplay, mischief
- For "just book me" users: Helpful and efficient with occasional charm
- Always: Warm, welcoming, never condescending

## Your Capabilities (Handle Autonomously)

1. **Booking Appointments**
   - Collect: client name, phone, pet name, species, services needed, preferred date/time
   - Check availability and suggest slots
   - Confirm bookings

2. **Answering FAQs**
   - Hours: By appointment only (flexible scheduling)
   - Location: Nuevo, California
   - Pricing: Varies by service, size, and style. Consultations available.
   - Services: Full grooms, baths, creative coloring, spa treatments

3. **Services We Offer**
   - Dogs, cats, goats, pigs, guinea pigs (NO birds)
   - Full grooms, bath & tidy, à la carte (nails, ears, etc.)
   - Creative: coloring, patterns, coat carving, extensions, glitter, jewels
   - Political designs, holiday packages
   - Specialties: anxious/fearful pets, aggressive dogs, service animals, nursing moms

4. **Looking Glass Consultation**
   - Guide clients through uploading pet photo
   - Collect style description
   - Explain the AI preview process
   - Handle approvals

5. **Shelter Donations (501c3)**
   - Explain the Shelter Angels program
   - Guide to "Paint the Roses Red" game
   - Process donation interests

## When to Escalate to Kimmie

- Complex custom requests requiring discussion
- Complaints or issues
- Requests you're unsure about
- When client specifically asks for human

## Response Format

For booking-related intents, include structured data:
\`\`\`json
{
  "intent": "BOOKING|RESCHEDULE|CANCEL|CONSULTATION|FAQ|DONATION|ESCALATE",
  "extractedData": { ... }
}
\`\`\`

## Example Interactions

**User:** "I need to book my dog Bella for a groom next week"
**You:** "Curiouser and curiouser! Bella is ready for a royal transformation~ 👑

Let me check our looking glass for available times next week. What day works best for you? And what kind of magic are we working - a full groom, bath & tidy, or something more... creative? 🎨✨"

**User:** "Just book me for Thursday at 2pm, full groom"
**You:** "Consider it done! 📅

✨ **Booking Confirmed** ✨
🐕 Bella - Full Groom
📅 Thursday at 2:00 PM

We'll send a reminder the day before. Don't be late... the Queen doesn't like to wait! 😼

Anything else before I fade away~?"

**User:** "What are your prices?"
**You:** "Ah, the golden question! 💰

Our prices vary by size, breed, and how much magic you want sprinkled in:

🐕 **Full Grooms** start around $45-85 depending on size
🛁 **Bath & Tidy** from $25-45
✂️ **À La Carte** (nails, ears, etc.) from $10-20
🎨 **Creative Color** - let's chat about your vision!

Want a more specific quote? Tell me about your furry friend!"

Remember: You ARE the Cheshire Cat. Embody the character while being genuinely helpful.`

export const KIMMIE_TELEGRAM_PERSONA = `You are the Cheshire Cat, but this is your PRIVATE channel with Kimmie, the owner of Through the Looking Glass Groomery.

## Your Personality with Kimmie

You're her hype woman, assistant, and friend. Your vibe:
- Whimsical, feminine, playful, a little spicy 😏
- Celebratory of her wins
- Gentle with nudges (never naggy)
- Full of surprises and easter eggs

## Things Kimmie Loves (for easter eggs & references)
- Pokémon (especially Mimikyu)
- Grey's Anatomy
- Secret Lives of Mormon Wives
- Dinosaurs
- The lizard push button meme (dopamine hits!)

## Your Jobs

1. **Notify her of new bookings** (with excitement!)
2. **Remind her about photos** (before/after)
3. **Nudge content creation**
4. **Celebrate achievements**
5. **Track her streaks**
6. **Deliver surprises and easter eggs**

## Message Examples

**New Booking:**
"🐕 A wild BOOKING appeared!

**Luna** wants the full royal treatment ✨
📅 Tomorrow, 2pm
👑 Full groom + creative color

[Confirm] [Reschedule] [Details]"

**Photo Reminder:**
"Psst... 📸

Before pics = after glory, gorgeous. Don't make me beg~ 😽"

**Achievement Unlocked:**
"WAIT. Hold up. 👀

Did you just hit 50 BOOKINGS this month?!

*achievement unlocked* 🏆
**Half Century Queen**

The Queen of Hearts is absolutely SHOOK. You're basically McDreamy but for dogs 💅"

**Random Hype:**
"Just checking in...

You're killing it today. That's it. That's the message. 💖🦕"

**Streak Alert:**
"🔥 7 DAY PHOTO STREAK 🔥

The gram is FED, queen. Keep it up and something magical might happen~ 😼✨"

Remember: Make her day better. Be delightful. Hide surprises.`
```

**Step 5: Create index.ts**

```typescript
// packages/ai/src/index.ts
export * from './fal'
export * from './llm'
export { CHESHIRE_SYSTEM_PROMPT, KIMMIE_TELEGRAM_PERSONA } from './prompts/cheshire'
```

**Step 6: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 7: Install and commit**

```bash
cd packages/ai
pnpm install
cd ../..
git add .
git commit -m "feat(ai): add AI package with fal.ai and LLM integrations"
```

---

## Phase 2: Telegram Bot & Booking System

### Task 2.1: Create Telegram Bot App

**Files:**
- Create: `apps/telegram-bot/package.json`
- Create: `apps/telegram-bot/src/index.ts`
- Create: `apps/telegram-bot/src/bot.ts`
- Create: `apps/telegram-bot/src/handlers/index.ts`
- Create: `apps/telegram-bot/src/handlers/bookings.ts`
- Create: `apps/telegram-bot/src/handlers/reminders.ts`
- Create: `apps/telegram-bot/src/handlers/achievements.ts`
- Create: `apps/telegram-bot/src/services/kimmie-persona.ts`
- Create: `apps/telegram-bot/tsconfig.json`

**Step 1: Create package.json**

```json
{
  "name": "@looking-glass/telegram-bot",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@looking-glass/ai": "workspace:*",
    "@looking-glass/db": "workspace:*",
    "@looking-glass/shared": "workspace:*",
    "grammy": "^1.30.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0"
  }
}
```

**Step 2: Create src/bot.ts**

```typescript
// apps/telegram-bot/src/bot.ts
import { Bot, Context, session, SessionFlavor } from 'grammy'
import { prisma } from '@looking-glass/db'

interface SessionData {
  awaitingAction?: string
  pendingBookingId?: string
  lastInteraction?: Date
}

type BotContext = Context & SessionFlavor<SessionData>

const KIMMIE_CHAT_ID = process.env.TELEGRAM_KIMMIE_CHAT_ID!

export const bot = new Bot<BotContext>(process.env.TELEGRAM_BOT_TOKEN!)

// Session middleware
bot.use(session({
  initial: (): SessionData => ({})
}))

// Security: Only respond to Kimmie
bot.use(async (ctx, next) => {
  if (ctx.chat?.id.toString() !== KIMMIE_CHAT_ID) {
    console.log(`Unauthorized access attempt from chat ID: ${ctx.chat?.id}`)
    return
  }
  await next()
})

export { BotContext, KIMMIE_CHAT_ID }
```

**Step 3: Create src/handlers/bookings.ts**

```typescript
// apps/telegram-bot/src/handlers/bookings.ts
import { bot, BotContext, KIMMIE_CHAT_ID } from '../bot'
import { prisma } from '@looking-glass/db'
import { InlineKeyboard } from 'grammy'
import { format } from 'date-fns'
import { getKimmieMessage } from '../services/kimmie-persona'

/**
 * Send a new booking notification to Kimmie
 */
export async function notifyNewBooking(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: true,
      pet: true,
      services: true,
    },
  })

  if (!appointment) return

  const message = getKimmieMessage('NEW_BOOKING', {
    petName: appointment.pet.name,
    clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
    date: format(appointment.scheduledAt, 'EEEE, MMM d'),
    time: format(appointment.scheduledAt, 'h:mm a'),
    services: appointment.services.map(s => s.name).join(', '),
  })

  const keyboard = new InlineKeyboard()
    .text('✅ Confirm', `confirm_booking:${appointmentId}`)
    .text('📅 Reschedule', `reschedule_booking:${appointmentId}`)
    .row()
    .text('📋 Details', `booking_details:${appointmentId}`)
    .text('❌ Cancel', `cancel_booking:${appointmentId}`)

  await bot.api.sendMessage(KIMMIE_CHAT_ID, message, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  })
}

/**
 * Handle booking confirmation callback
 */
bot.callbackQuery(/^confirm_booking:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
  })

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { pet: true },
  })

  await ctx.answerCallbackQuery({ text: '✅ Booking confirmed!' })
  await ctx.editMessageText(
    `${ctx.message?.text}\n\n✅ <b>CONFIRMED</b> - ${appointment?.pet.name} is all set!`,
    { parse_mode: 'HTML' }
  )

  // TODO: Trigger notification to client via n8n
})

/**
 * Handle booking cancellation callback
 */
bot.callbackQuery(/^cancel_booking:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  const keyboard = new InlineKeyboard()
    .text('Yes, cancel it', `confirm_cancel:${appointmentId}`)
    .text('No, keep it', `keep_booking:${appointmentId}`)

  await ctx.answerCallbackQuery()
  await ctx.reply('Are you sure you want to cancel this booking?', {
    reply_markup: keyboard,
  })
})

bot.callbackQuery(/^confirm_cancel:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  })

  await ctx.answerCallbackQuery({ text: '❌ Booking cancelled' })
  await ctx.editMessageText('Booking cancelled. The client will be notified.')
})

/**
 * Handle booking details callback
 */
bot.callbackQuery(/^booking_details:(.+)$/, async (ctx) => {
  const appointmentId = ctx.match[1]

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: true,
      pet: true,
      services: true,
    },
  })

  if (!appointment) {
    await ctx.answerCallbackQuery({ text: 'Booking not found' })
    return
  }

  const details = `
📋 <b>Booking Details</b>

🐾 <b>Pet:</b> ${appointment.pet.name}
   Species: ${appointment.pet.species}
   Breed: ${appointment.pet.breed || 'Unknown'}
   Weight: ${appointment.pet.weight ? `${appointment.pet.weight} lbs` : 'Unknown'}
   Temperament: ${appointment.pet.temperament}

👤 <b>Client:</b> ${appointment.client.firstName} ${appointment.client.lastName}
   Phone: ${appointment.client.phone}
   Email: ${appointment.client.email || 'None'}

📅 <b>Appointment:</b>
   Date: ${format(appointment.scheduledAt, 'EEEE, MMMM d, yyyy')}
   Time: ${format(appointment.scheduledAt, 'h:mm a')}
   Duration: ${appointment.duration} min

✂️ <b>Services:</b>
${appointment.services.map(s => `   • ${s.name}`).join('\n')}

${appointment.clientNotes ? `📝 <b>Notes:</b> ${appointment.clientNotes}` : ''}
`

  await ctx.answerCallbackQuery()
  await ctx.reply(details, { parse_mode: 'HTML' })
})

export function setupBookingHandlers() {
  console.log('Booking handlers initialized')
}
```

**Step 4: Create src/handlers/reminders.ts**

```typescript
// apps/telegram-bot/src/handlers/reminders.ts
import { bot, KIMMIE_CHAT_ID } from '../bot'
import { prisma } from '@looking-glass/db'
import { getKimmieMessage } from '../services/kimmie-persona'
import { InlineKeyboard } from 'grammy'

/**
 * Send photo reminder before appointment
 */
export async function sendBeforePhotoReminder(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { pet: true },
  })

  if (!appointment) return

  const message = getKimmieMessage('PHOTO_REMINDER_BEFORE', {
    petName: appointment.pet.name,
  })

  const keyboard = new InlineKeyboard()
    .text('📸 Upload Before Photo', `upload_before:${appointmentId}`)
    .text('⏭️ Skip', `skip_before:${appointmentId}`)

  await bot.api.sendMessage(KIMMIE_CHAT_ID, message, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  })
}

/**
 * Send photo reminder after appointment
 */
export async function sendAfterPhotoReminder(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { pet: true },
  })

  if (!appointment) return

  const message = getKimmieMessage('PHOTO_REMINDER_AFTER', {
    petName: appointment.pet.name,
  })

  const keyboard = new InlineKeyboard()
    .text('📸 Upload After Photo', `upload_after:${appointmentId}`)
    .text('⏭️ Skip', `skip_after:${appointmentId}`)

  await bot.api.sendMessage(KIMMIE_CHAT_ID, message, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  })
}

/**
 * Send content creation nudge
 */
export async function sendContentNudge() {
  const message = getKimmieMessage('CONTENT_NUDGE', {})

  await bot.api.sendMessage(KIMMIE_CHAT_ID, message, {
    parse_mode: 'HTML',
  })
}

/**
 * Handle photo uploads
 */
bot.on('message:photo', async (ctx) => {
  const session = ctx.session

  if (!session.awaitingAction || !session.pendingBookingId) {
    // Random photo - could be for content
    await ctx.reply(getKimmieMessage('PHOTO_RECEIVED_RANDOM', {}))
    return
  }

  const photo = ctx.message.photo[ctx.message.photo.length - 1] // Highest res
  const file = await ctx.api.getFile(photo.file_id)
  const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`

  const appointmentId = session.pendingBookingId
  const isBeforePhoto = session.awaitingAction === 'upload_before'

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: isBeforePhoto
      ? { beforePhotoUrl: fileUrl }
      : { afterPhotoUrl: fileUrl },
  })

  // Clear session
  session.awaitingAction = undefined
  session.pendingBookingId = undefined

  const message = isBeforePhoto
    ? getKimmieMessage('BEFORE_PHOTO_SAVED', {})
    : getKimmieMessage('AFTER_PHOTO_SAVED', {})

  await ctx.reply(message, { parse_mode: 'HTML' })

  // If after photo, offer to post to social
  if (!isBeforePhoto) {
    const keyboard = new InlineKeyboard()
      .text('📱 Post to Social', `post_social:${appointmentId}`)
      .text('💾 Save Only', `save_only:${appointmentId}`)

    await ctx.reply('Want to share this transformation? ✨', {
      reply_markup: keyboard,
    })
  }
})

// Callback handlers for photo upload buttons
bot.callbackQuery(/^upload_(before|after):(.+)$/, async (ctx) => {
  const type = ctx.match[1]
  const appointmentId = ctx.match[2]

  ctx.session.awaitingAction = `upload_${type}`
  ctx.session.pendingBookingId = appointmentId

  await ctx.answerCallbackQuery()
  await ctx.reply(`Send me the ${type} photo! 📸`)
})

bot.callbackQuery(/^skip_(before|after):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery({ text: 'Skipped!' })
  await ctx.editMessageText(`${ctx.message?.text}\n\n⏭️ Skipped`)
})

export function setupReminderHandlers() {
  console.log('Reminder handlers initialized')
}
```

**Step 5: Create src/handlers/achievements.ts**

```typescript
// apps/telegram-bot/src/handlers/achievements.ts
import { bot, KIMMIE_CHAT_ID } from '../bot'
import { prisma } from '@looking-glass/db'
import { ACHIEVEMENTS } from '@looking-glass/shared'
import { getKimmieMessage, getRandomEasterEgg } from '../services/kimmie-persona'

/**
 * Check and award achievements
 */
export async function checkAchievements() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get today's stats
  let stats = await prisma.kimmieStats.findUnique({
    where: { date: today },
  })

  if (!stats) {
    stats = await prisma.kimmieStats.create({
      data: { date: today },
    })
  }

  // Check booking milestones
  const totalBookings = await prisma.appointment.count({
    where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
  })

  const achievementsToCheck = [
    { type: 'BOOKINGS_10', threshold: 10, count: totalBookings },
    { type: 'BOOKINGS_50', threshold: 50, count: totalBookings },
    { type: 'BOOKINGS_100', threshold: 100, count: totalBookings },
    { type: 'STREAK_7', threshold: 7, count: stats.photoStreak },
    { type: 'STREAK_30', threshold: 30, count: stats.photoStreak },
  ]

  for (const check of achievementsToCheck) {
    if (check.count >= check.threshold) {
      await awardAchievement(check.type)
    }
  }
}

/**
 * Award an achievement and notify Kimmie
 */
async function awardAchievement(achievementType: string) {
  // Check if already earned
  const existing = await prisma.kimmieAchievement.findFirst({
    where: { achievementType },
  })

  if (existing) return

  // Create achievement
  await prisma.kimmieAchievement.create({
    data: { achievementType },
  })

  // Send notification
  const achievement = ACHIEVEMENTS[achievementType as keyof typeof ACHIEVEMENTS]
  if (!achievement) return

  const message = `
🎉 <b>ACHIEVEMENT UNLOCKED!</b> 🎉

${achievement.emoji} <b>${achievement.name}</b>

${achievement.message}

${getRandomEasterEgg()}
`

  await bot.api.sendMessage(KIMMIE_CHAT_ID, message, {
    parse_mode: 'HTML',
  })
}

/**
 * Send daily stats summary
 */
export async function sendDailyStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = await prisma.kimmieStats.findUnique({
    where: { date: today },
  })

  const message = getKimmieMessage('DAILY_STATS', {
    bookings: stats?.bookingsCount || 0,
    completed: stats?.appointmentsCompleted || 0,
    photos: stats?.photosUploaded || 0,
    photoStreak: stats?.photoStreak || 0,
    contentStreak: stats?.contentStreak || 0,
  })

  await bot.api.sendMessage(KIMMIE_CHAT_ID, message, {
    parse_mode: 'HTML',
  })
}

/**
 * Update stats when actions happen
 */
export async function incrementStat(
  stat: 'bookingsCount' | 'appointmentsCompleted' | 'photosUploaded' | 'contentPosted'
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.kimmieStats.upsert({
    where: { date: today },
    update: { [stat]: { increment: 1 } },
    create: { date: today, [stat]: 1 },
  })

  // Check for achievements after update
  await checkAchievements()
}

export function setupAchievementHandlers() {
  console.log('Achievement handlers initialized')
}
```

**Step 6: Create src/services/kimmie-persona.ts**

```typescript
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
  }

  const categoryResponses = responses[category] || ['✨ Easter egg found! You\'re amazing~']
  return categoryResponses[Math.floor(Math.random() * categoryResponses.length)]
}
```

**Step 7: Create src/handlers/index.ts**

```typescript
// apps/telegram-bot/src/handlers/index.ts
import { setupBookingHandlers } from './bookings'
import { setupReminderHandlers } from './reminders'
import { setupAchievementHandlers } from './achievements'

export function setupAllHandlers() {
  setupBookingHandlers()
  setupReminderHandlers()
  setupAchievementHandlers()
}

export * from './bookings'
export * from './reminders'
export * from './achievements'
```

**Step 8: Create src/index.ts**

```typescript
// apps/telegram-bot/src/index.ts
import { bot } from './bot'
import { setupAllHandlers } from './handlers'
import {
  getKimmieMessage,
  checkForEasterEggTrigger,
  getEasterEggResponse,
  getRandomEasterEgg
} from './services/kimmie-persona'

// Setup all handlers
setupAllHandlers()

// Handle text messages
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text

  // Check for easter egg triggers
  const easterEggCategory = checkForEasterEggTrigger(text)
  if (easterEggCategory) {
    const response = getEasterEggResponse(easterEggCategory)
    await ctx.reply(response, { parse_mode: 'HTML' })
    return
  }

  // Handle quick capture voice note transcription would go here
  // For now, acknowledge the message
  if (text.startsWith('/')) {
    // Command handling
    return
  }

  // Default response for unhandled messages
  await ctx.reply("I'm listening~ 😼 Need something specific?")
})

// Handle voice messages (quick capture)
bot.on('message:voice', async (ctx) => {
  // TODO: Transcribe voice message and parse for booking info
  await ctx.reply(
    "Got your voice memo! 🎤\n\nLet me process that... (voice transcription coming soon!)",
    { parse_mode: 'HTML' }
  )
})

// Commands
bot.command('start', async (ctx) => {
  await ctx.reply(
    `✨ <b>Welcome to the Looking Glass!</b> ✨

I'm your Cheshire Cat assistant, here to make your life magical~ 😼

<b>What I can do:</b>
• Show you new bookings
• Remind you about photos
• Celebrate your wins
• Keep you company with easter eggs 🥚

Let's make some pet magic! 🐾`,
    { parse_mode: 'HTML' }
  )
})

bot.command('stats', async (ctx) => {
  // TODO: Fetch actual stats
  await ctx.reply(getKimmieMessage('DAILY_STATS', {
    bookings: 0,
    completed: 0,
    photos: 0,
    photoStreak: 0,
    contentStreak: 0,
  }), { parse_mode: 'HTML' })
})

bot.command('hype', async (ctx) => {
  await ctx.reply(getKimmieMessage('RANDOM_HYPE', {}), { parse_mode: 'HTML' })
})

bot.command('easter', async (ctx) => {
  await ctx.reply(
    `🥚 <b>Easter Egg Hunt!</b> 🥚

I've hidden surprises throughout our chats~ Try mentioning:

• Your favorite Pokémon 🎮
• Grey's Anatomy references 🏥
• That reality show you love 📺
• Dinosaurs 🦕
• A certain lizard meme 🦎

Find them all? You're officially a Wonderland VIP! 👑`,
    { parse_mode: 'HTML' }
  )
})

// Error handling
bot.catch((err) => {
  console.error('Bot error:', err)
})

// Start the bot
console.log('🐱 Cheshire Cat is waking up...')
bot.start()
console.log('😼 Cheshire Cat is online and ready!')
```

**Step 9: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 10: Install dependencies and commit**

```bash
cd apps/telegram-bot
pnpm install
cd ../..
git add .
git commit -m "feat(telegram): add Telegram bot with Kimmie persona and handlers"
```

---

## Phase 3-8: Remaining Phases

*Due to length, the remaining phases will be documented in separate plan files:*

- **Phase 3:** `2025-12-07-cheshire-cat-ai.md` - Cheshire Cat AI service for all client touchpoints
- **Phase 4:** `2025-12-07-looking-glass-consultation.md` - AI-powered 3D consultation system
- **Phase 5:** `2025-12-07-website-rabbit-hole.md` - Immersive Next.js website
- **Phase 6:** `2025-12-07-shelter-angels-501c3.md` - Nonprofit arm and donation game
- **Phase 7:** `2025-12-07-social-automation.md` - Content pipeline and auto-posting
- **Phase 8:** `2025-12-07-kimmie-experience.md` - Gamification and personalization

---

## Execution Checklist

- [ ] Phase 1: Foundation & Infrastructure
  - [ ] Task 1.1: Initialize monorepo
  - [ ] Task 1.2: Set up database package
  - [ ] Task 1.3: Set up shared package
  - [ ] Task 1.4: Set up AI package
- [ ] Phase 2: Telegram Bot & Booking System
  - [ ] Task 2.1: Create Telegram bot app
  - [ ] Task 2.2: Set up booking service (see extended plan)
  - [ ] Task 2.3: Configure n8n workflows (see extended plan)
- [ ] Phase 3: Cheshire Cat AI (separate plan)
- [ ] Phase 4: Looking Glass Consultation (separate plan)
- [ ] Phase 5: Website (separate plan)
- [ ] Phase 6: 501(c)(3) & Donations (separate plan)
- [ ] Phase 7: Social Automation (separate plan)
- [ ] Phase 8: Kimmie Experience (separate plan)
