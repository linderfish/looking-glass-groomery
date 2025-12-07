# Phase 6: 501(c)(3) Shelter Angels & Donation Game

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the nonprofit arm "Shelter Angels" with OSINT-powered shelter pet feed, "Paint the Roses Red" arcade donation game, donation tracking for tax purposes, and all required 501(c)(3) documentation.

**Architecture:** OSINT scraper for Riverside County shelter, Stripe integration for donations, gamified React canvas game, PostgreSQL tracking for tax reporting.

**Tech Stack:** Puppeteer/Playwright for scraping, Stripe, React with canvas/game engine, PostgreSQL, n8n for scheduled scraping

---

## Project Structure

```
packages/integrations/
├── src/
│   ├── shelter/
│   │   ├── scraper.ts           # OSINT shelter scraper
│   │   ├── types.ts
│   │   └── sync.ts              # Sync to database
│   └── stripe/
│       ├── donations.ts
│       └── webhooks.ts

apps/web/src/
├── app/wonderland/shelter-angels/
│   ├── page.tsx                  # Main shelter page
│   ├── game/
│   │   └── page.tsx              # Paint the Roses Red game
│   ├── sponsor/
│   │   └── [petId]/page.tsx      # Sponsor a specific pet
│   └── impact/
│       └── page.tsx              # Impact stories

├── components/shelter/
│   ├── ShelterPetCard.tsx
│   ├── DonationGame.tsx
│   ├── Leaderboard.tsx
│   ├── SponsorModal.tsx
│   └── ImpactCounter.tsx

docs/501c3/
├── articles-of-incorporation.md
├── bylaws-template.md
├── irs-form-1023ez-guide.md
├── state-registration.md
└── donation-receipt-template.md
```

---

## Task 6.1: Build Shelter Pet Scraper

**Files:**
- Create: `packages/integrations/package.json`
- Create: `packages/integrations/src/shelter/types.ts`
- Create: `packages/integrations/src/shelter/scraper.ts`
- Create: `packages/integrations/src/shelter/sync.ts`

**Step 1: Create packages/integrations/package.json**

```json
{
  "name": "@looking-glass/integrations",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "scrape:shelter": "tsx src/shelter/scraper.ts"
  },
  "dependencies": {
    "@looking-glass/db": "workspace:*",
    "@looking-glass/shared": "workspace:*",
    "playwright": "^1.48.0",
    "stripe": "^17.2.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0"
  }
}
```

**Step 2: Create src/shelter/types.ts**

```typescript
// packages/integrations/src/shelter/types.ts

export interface ScrapedShelterPet {
  shelterId: string
  shelterName: string
  name: string
  species: 'DOG' | 'CAT' | 'OTHER'
  breed?: string
  age?: string
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN'
  weight?: number
  photoUrl?: string
  intakeDate?: Date
  status: 'AVAILABLE' | 'ADOPTED' | 'PENDING' | 'UNAVAILABLE'
  profileUrl: string
  description?: string
}

export interface ShelterScraperConfig {
  shelterUrl: string
  shelterName: string
  maxPets?: number
}

// Riverside County Animal Services
export const RIVERSIDE_SHELTER_CONFIG: ShelterScraperConfig = {
  shelterUrl: 'https://www.rfrm.io/shelter_pet_search/pet_search_results/',
  shelterName: 'Riverside County Animal Services',
  maxPets: 50,
}
```

**Step 3: Create src/shelter/scraper.ts**

```typescript
// packages/integrations/src/shelter/scraper.ts
import { chromium, Browser, Page } from 'playwright'
import { ScrapedShelterPet, ShelterScraperConfig, RIVERSIDE_SHELTER_CONFIG } from './types'

export class ShelterScraper {
  private browser: Browser | null = null
  private page: Page | null = null
  private config: ShelterScraperConfig

  constructor(config: ShelterScraperConfig = RIVERSIDE_SHELTER_CONFIG) {
    this.config = config
  }

  async init() {
    this.browser = await chromium.launch({
      headless: true,
    })
    this.page = await this.browser.newPage()
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async scrapeAvailablePets(): Promise<ScrapedShelterPet[]> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call init() first.')
    }

    const pets: ScrapedShelterPet[] = []

    try {
      // Navigate to shelter search page
      await this.page.goto(this.config.shelterUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      })

      // Wait for pet listings to load
      await this.page.waitForSelector('.pet-card, .animal-card, [data-pet-id]', {
        timeout: 10000,
      }).catch(() => {
        console.log('No pet cards found with standard selectors, trying alternatives...')
      })

      // Scrape pet listings
      // Note: Selectors will need to be adjusted based on actual shelter website structure
      const petElements = await this.page.$$('.pet-card, .animal-card, [data-pet-id]')

      for (const element of petElements.slice(0, this.config.maxPets)) {
        try {
          const pet = await this.extractPetData(element)
          if (pet) {
            pets.push(pet)
          }
        } catch (error) {
          console.error('Error extracting pet data:', error)
        }
      }

      console.log(`Scraped ${pets.length} pets from ${this.config.shelterName}`)

    } catch (error) {
      console.error('Scraping error:', error)
    }

    return pets
  }

  private async extractPetData(element: any): Promise<ScrapedShelterPet | null> {
    try {
      // Extract data from pet card
      // These selectors need to be customized for the actual shelter website
      const name = await element.$eval(
        '.pet-name, .animal-name, h3, h4',
        (el: HTMLElement) => el.textContent?.trim() || 'Unknown'
      ).catch(() => 'Unknown')

      const photoUrl = await element.$eval(
        'img',
        (el: HTMLImageElement) => el.src
      ).catch(() => undefined)

      const breed = await element.$eval(
        '.breed, .animal-breed',
        (el: HTMLElement) => el.textContent?.trim()
      ).catch(() => undefined)

      const age = await element.$eval(
        '.age, .animal-age',
        (el: HTMLElement) => el.textContent?.trim()
      ).catch(() => undefined)

      const profileUrl = await element.$eval(
        'a',
        (el: HTMLAnchorElement) => el.href
      ).catch(() => this.config.shelterUrl)

      // Determine species from text content
      const text = await element.textContent()
      let species: 'DOG' | 'CAT' | 'OTHER' = 'DOG'
      if (text?.toLowerCase().includes('cat')) {
        species = 'CAT'
      } else if (!text?.toLowerCase().includes('dog')) {
        species = 'OTHER'
      }

      // Generate shelter ID from URL or element
      const shelterId = await element.getAttribute('data-pet-id') ||
        profileUrl.split('/').pop() ||
        `${this.config.shelterName}-${name}-${Date.now()}`

      return {
        shelterId,
        shelterName: this.config.shelterName,
        name,
        species,
        breed,
        age,
        photoUrl,
        profileUrl,
        status: 'AVAILABLE',
      }
    } catch (error) {
      console.error('Error extracting pet data:', error)
      return null
    }
  }

  /**
   * Determine size category for donation minimums
   */
  static determineSizeCategory(
    weight?: number,
    breed?: string,
    age?: string
  ): 'SMALL' | 'MEDIUM' | 'XL_XXL' | 'GIANT' {
    if (weight) {
      if (weight >= 150) return 'GIANT'
      if (weight >= 70) return 'XL_XXL'
      if (weight >= 25) return 'MEDIUM'
      return 'SMALL'
    }

    // Guess from breed if weight not available
    const largeBreeds = ['great dane', 'mastiff', 'saint bernard', 'newfoundland']
    const xlBreeds = ['german shepherd', 'labrador', 'golden retriever', 'husky', 'pitbull']
    const smallBreeds = ['chihuahua', 'yorkie', 'pomeranian', 'maltese', 'shih tzu']

    const breedLower = breed?.toLowerCase() || ''

    if (largeBreeds.some(b => breedLower.includes(b))) return 'GIANT'
    if (xlBreeds.some(b => breedLower.includes(b))) return 'XL_XXL'
    if (smallBreeds.some(b => breedLower.includes(b))) return 'SMALL'

    // Default to medium
    return 'MEDIUM'
  }
}

// CLI runner
if (require.main === module) {
  const scraper = new ShelterScraper()

  scraper.init()
    .then(() => scraper.scrapeAvailablePets())
    .then((pets) => {
      console.log(JSON.stringify(pets, null, 2))
      return scraper.close()
    })
    .catch(console.error)
}
```

**Step 4: Create src/shelter/sync.ts**

```typescript
// packages/integrations/src/shelter/sync.ts
import { prisma, SizeCategory, ShelterPetStatus } from '@looking-glass/db'
import { DONATION_MINIMUMS } from '@looking-glass/shared'
import { ShelterScraper } from './scraper'
import { ScrapedShelterPet } from './types'
import { generateShelterMakeoverPreview } from '@looking-glass/ai'

/**
 * Sync shelter pets from scraper to database
 */
export async function syncShelterPets() {
  const scraper = new ShelterScraper()

  try {
    await scraper.init()
    const scrapedPets = await scraper.scrapeAvailablePets()

    console.log(`Syncing ${scrapedPets.length} pets to database...`)

    for (const pet of scrapedPets) {
      await upsertShelterPet(pet)
    }

    // Mark pets not in scrape as potentially unavailable
    await markMissingPetsUnavailable(scrapedPets.map(p => p.shelterId))

    console.log('Shelter sync complete!')

  } finally {
    await scraper.close()
  }
}

/**
 * Upsert a scraped pet into the database
 */
async function upsertShelterPet(pet: ScrapedShelterPet) {
  const sizeCategory = ShelterScraper.determineSizeCategory(
    pet.weight,
    pet.breed,
    pet.age
  )

  const donationMinimum = DONATION_MINIMUMS[sizeCategory]

  // Check if pet exists
  const existing = await prisma.shelterPet.findUnique({
    where: { shelterId: pet.shelterId },
  })

  if (existing) {
    // Update existing pet
    await prisma.shelterPet.update({
      where: { shelterId: pet.shelterId },
      data: {
        name: pet.name,
        breed: pet.breed,
        age: pet.age,
        originalPhotoUrl: pet.photoUrl,
        status: 'AVAILABLE',
        updatedAt: new Date(),
      },
    })
  } else {
    // Create new pet
    await prisma.shelterPet.create({
      data: {
        shelterId: pet.shelterId,
        shelterName: pet.shelterName,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        age: pet.age,
        sex: pet.sex,
        weight: pet.weight,
        originalPhotoUrl: pet.photoUrl,
        status: 'AVAILABLE',
        intakeDate: pet.intakeDate,
        sizeCategory: sizeCategory as SizeCategory,
        donationMinimum,
      },
    })

    // Generate AI makeover preview for new pets
    if (pet.photoUrl) {
      try {
        const previewUrl = await generateShelterMakeoverPreview(pet.photoUrl)
        await prisma.shelterPet.update({
          where: { shelterId: pet.shelterId },
          data: { makeoverPreviewUrl: previewUrl },
        })
      } catch (error) {
        console.error(`Failed to generate preview for ${pet.name}:`, error)
      }
    }
  }
}

/**
 * Mark pets not in latest scrape as potentially unavailable
 */
async function markMissingPetsUnavailable(currentIds: string[]) {
  // Only mark as unavailable if they've been missing for > 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

  await prisma.shelterPet.updateMany({
    where: {
      shelterId: { notIn: currentIds },
      status: 'AVAILABLE',
      updatedAt: { lt: yesterday },
    },
    data: {
      status: 'UNAVAILABLE',
    },
  })
}

// CLI runner
if (require.main === module) {
  syncShelterPets().catch(console.error)
}
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat(integrations): add shelter pet OSINT scraper"
```

---

## Task 6.2: Build Donation System with Stripe

**Files:**
- Create: `packages/integrations/src/stripe/donations.ts`
- Create: `apps/web/src/app/api/donations/route.ts`
- Create: `apps/web/src/app/api/webhooks/stripe/route.ts`

**Step 1: Create src/stripe/donations.ts**

```typescript
// packages/integrations/src/stripe/donations.ts
import Stripe from 'stripe'
import { prisma } from '@looking-glass/db'
import { DONATION_MINIMUMS } from '@looking-glass/shared'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export interface CreateDonationParams {
  amount: number
  shelterPetId?: string
  donorName?: string
  donorEmail?: string
  isAnonymous?: boolean
  gameScore?: number
  successUrl: string
  cancelUrl: string
}

/**
 * Create a Stripe checkout session for a donation
 */
export async function createDonationCheckout(params: CreateDonationParams) {
  const {
    amount,
    shelterPetId,
    donorName,
    donorEmail,
    isAnonymous,
    gameScore,
    successUrl,
    cancelUrl,
  } = params

  // Validate minimum if sponsoring a specific pet
  if (shelterPetId) {
    const pet = await prisma.shelterPet.findUnique({
      where: { id: shelterPetId },
    })

    if (pet && amount < pet.donationMinimum) {
      throw new Error(
        `Minimum donation for ${pet.name} is $${pet.donationMinimum}`
      )
    }
  }

  // Create donation record
  const donation = await prisma.donation.create({
    data: {
      amount,
      shelterPetId,
      donorName: isAnonymous ? null : donorName,
      donorEmail,
      isAnonymous: isAnonymous || false,
      gameScore,
    },
  })

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: shelterPetId
              ? `Shelter Makeover Sponsorship`
              : 'Shelter Angels Donation',
            description: shelterPetId
              ? `Help a shelter pet get a royal makeover!`
              : 'Support shelter pet makeovers',
            images: ['https://throughthelookingglass.pet/assets/shelter-angels-logo.png'],
          },
          unit_amount: Math.round(amount * 100), // Stripe uses cents
        },
        quantity: 1,
      },
    ],
    customer_email: donorEmail,
    success_url: `${successUrl}?donation=${donation.id}`,
    cancel_url: cancelUrl,
    metadata: {
      donationId: donation.id,
      shelterPetId: shelterPetId || '',
      gameScore: gameScore?.toString() || '',
    },
  })

  return {
    checkoutUrl: session.url,
    donationId: donation.id,
  }
}

/**
 * Handle successful payment webhook
 */
export async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  const donationId = session.metadata?.donationId

  if (!donationId) {
    console.error('No donation ID in session metadata')
    return
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      amount: session.amount_total! / 100,
      currency: session.currency!,
      type: 'DONATION',
      status: 'SUCCEEDED',
      stripePaymentIntentId: session.payment_intent as string,
      donationId,
      clientId: session.customer as string | undefined,
    },
  })

  // Update donation with payment link
  const donation = await prisma.donation.update({
    where: { id: donationId },
    data: {
      // payment relation is handled by the payment creation
    },
    include: { shelterPet: true },
  })

  // Update shelter pet donation total if applicable
  if (donation.shelterPetId && donation.shelterPet) {
    const newTotal = donation.shelterPet.totalDonated + donation.amount

    await prisma.shelterPet.update({
      where: { id: donation.shelterPetId },
      data: {
        totalDonated: newTotal,
        // If total meets minimum, mark as sponsored
        makeoverStatus: newTotal >= donation.shelterPet.donationMinimum
          ? 'SPONSORED'
          : donation.shelterPet.makeoverStatus,
      },
    })
  }

  return payment
}

/**
 * Generate donation receipt for tax purposes
 */
export async function generateDonationReceipt(donationId: string) {
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    include: {
      shelterPet: true,
      payment: true,
    },
  })

  if (!donation || !donation.payment || donation.payment.status !== 'SUCCEEDED') {
    throw new Error('Donation not found or not completed')
  }

  const receipt = {
    receiptNumber: `TLG-${donation.id.slice(0, 8).toUpperCase()}`,
    date: donation.createdAt.toISOString(),
    amount: donation.amount,
    donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName,
    donorEmail: donation.donorEmail,
    organization: 'Through the Looking Glass Rescue',
    ein: 'XX-XXXXXXX', // Fill in once 501(c)(3) is approved
    purpose: donation.shelterPetId
      ? `Shelter pet makeover sponsorship for ${donation.shelterPet?.name}`
      : 'General support for shelter pet makeovers',
    taxDeductible: true,
    noGoodsOrServices: true,
  }

  // Mark receipt as sent
  await prisma.donation.update({
    where: { id: donationId },
    data: {
      receiptSent: true,
      receiptUrl: `https://throughthelookingglass.pet/receipts/${donation.id}`,
    },
  })

  return receipt
}
```

**Step 2: Create apps/web/src/app/api/donations/route.ts**

```typescript
// apps/web/src/app/api/donations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createDonationCheckout } from '@looking-glass/integrations/stripe/donations'
import { z } from 'zod'

const donationSchema = z.object({
  amount: z.number().min(1),
  shelterPetId: z.string().optional(),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional(),
  isAnonymous: z.boolean().optional(),
  gameScore: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = donationSchema.parse(body)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const result = await createDonationCheckout({
      ...data,
      successUrl: `${baseUrl}/wonderland/shelter-angels/thank-you`,
      cancelUrl: `${baseUrl}/wonderland/shelter-angels`,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Donation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create donation' },
      { status: 500 }
    )
  }
}
```

**Step 3: Create apps/web/src/app/api/webhooks/stripe/route.ts**

```typescript
// apps/web/src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { handlePaymentSuccess } from '@looking-glass/integrations/stripe/donations'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      await handlePaymentSuccess(session)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat(integrations): add Stripe donation system with receipts"
```

---

## Task 6.3: Build "Paint the Roses Red" Donation Game

**Files:**
- Create: `apps/web/src/components/shelter/DonationGame.tsx`
- Create: `apps/web/src/components/shelter/GameCanvas.tsx`
- Create: `apps/web/src/app/wonderland/shelter-angels/game/page.tsx`

**Step 1: Create components/shelter/GameCanvas.tsx**

```tsx
// apps/web/src/components/shelter/GameCanvas.tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ShelterPet {
  id: string
  name: string
  photoUrl: string
  x: number
  y: number
  painted: boolean
  color?: string
}

interface GameCanvasProps {
  pets: Array<{ id: string; name: string; photoUrl: string }>
  onGameEnd: (score: number) => void
  duration?: number // seconds
}

const PAINT_COLORS = [
  '#FF69B4', // Hot pink
  '#9B59B6', // Purple
  '#3498DB', // Blue
  '#2ECC71', // Green
  '#F39C12', // Orange
  '#E74C3C', // Red
  '#1ABC9C', // Teal
]

export function GameCanvas({ pets, onGameEnd, duration = 30 }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready')
  const [gamePets, setGamePets] = useState<ShelterPet[]>([])
  const [selectedColor, setSelectedColor] = useState(PAINT_COLORS[0])
  const [combo, setCombo] = useState(0)

  // Initialize game pets with positions
  useEffect(() => {
    if (gameState === 'playing') {
      const initialPets = pets.slice(0, 8).map((pet, i) => ({
        ...pet,
        x: 50 + (i % 4) * 150,
        y: 100 + Math.floor(i / 4) * 200,
        painted: false,
      }))
      setGamePets(initialPets)
    }
  }, [gameState, pets])

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('ended')
          onGameEnd(score)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, score, onGameEnd])

  // Handle pet click (paint)
  const handlePetClick = useCallback((petId: string) => {
    if (gameState !== 'playing') return

    setGamePets((prev) =>
      prev.map((pet) => {
        if (pet.id === petId && !pet.painted) {
          // Calculate score with combo
          const points = 10 + combo * 5
          setScore((s) => s + points)
          setCombo((c) => c + 1)

          return { ...pet, painted: true, color: selectedColor }
        }
        return pet
      })
    )

    // Reset combo after 2 seconds of no clicks
    setTimeout(() => setCombo(0), 2000)
  }, [gameState, selectedColor, combo])

  const startGame = () => {
    setScore(0)
    setTimeLeft(duration)
    setCombo(0)
    setGameState('playing')
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-4 p-4 glass rounded-xl">
        <div className="text-2xl font-display">
          Score: <span className="text-gradient">{score}</span>
          {combo > 1 && (
            <span className="ml-2 text-sm text-psyche-pink animate-pulse">
              x{combo} COMBO!
            </span>
          )}
        </div>
        <div className="text-2xl font-display">
          Time: <span className={timeLeft <= 10 ? 'text-red-500' : ''}>{timeLeft}s</span>
        </div>
      </div>

      {/* Color Palette */}
      {gameState === 'playing' && (
        <div className="flex gap-2 justify-center mb-4">
          {PAINT_COLORS.map((color) => (
            <button
              key={color}
              className={`w-10 h-10 rounded-full transition-transform ${
                selectedColor === color ? 'scale-125 ring-2 ring-white' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      )}

      {/* Game Area */}
      <div className="relative aspect-[4/3] bg-wonderland-card rounded-2xl overflow-hidden">
        {/* Ready State */}
        <AnimatePresence>
          {gameState === 'ready' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-wonderland-bg/90 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-4xl font-display mb-4 text-gradient">
                Paint the Roses Red! 🌹
              </h2>
              <p className="text-wonderland-muted mb-8 text-center max-w-md">
                Tap the shelter pets to give them colorful makeovers!
                The more you paint, the more you donate!
              </p>
              <motion.button
                className="px-8 py-4 rounded-full bg-gradient-to-r from-psyche-pink to-psyche-purple text-white text-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
              >
                Start Game - $5 to Play
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Ended State */}
        <AnimatePresence>
          {gameState === 'ended' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-wonderland-bg/90 z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2 className="text-4xl font-display mb-4">
                🎨 Amazing! 🎨
              </h2>
              <p className="text-6xl font-display text-gradient mb-4">
                {score} points!
              </p>
              <p className="text-wonderland-muted mb-8">
                Your ${5} donation will help {Math.floor(score / 50)} shelter pets get makeovers!
              </p>
              <div className="flex gap-4">
                <motion.button
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-psyche-pink to-psyche-purple text-white"
                  whileHover={{ scale: 1.05 }}
                  onClick={startGame}
                >
                  Play Again
                </motion.button>
                <motion.button
                  className="px-6 py-3 rounded-full glass text-white"
                  whileHover={{ scale: 1.05 }}
                >
                  Share Score 📤
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pet Grid */}
        {gameState === 'playing' && (
          <div className="absolute inset-0 p-4 grid grid-cols-4 gap-4">
            {gamePets.map((pet) => (
              <motion.button
                key={pet.id}
                className={`relative rounded-xl overflow-hidden transition-all ${
                  pet.painted ? 'ring-4' : 'hover:scale-105'
                }`}
                style={{
                  ringColor: pet.color,
                  filter: pet.painted ? `drop-shadow(0 0 10px ${pet.color})` : undefined,
                }}
                onClick={() => handlePetClick(pet.id)}
                whileTap={{ scale: 0.9 }}
                disabled={pet.painted}
              >
                <img
                  src={pet.photoUrl}
                  alt={pet.name}
                  className={`w-full h-full object-cover ${
                    pet.painted ? 'saturate-150' : 'grayscale'
                  }`}
                />

                {/* Paint splatter effect */}
                {pet.painted && (
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ backgroundColor: pet.color }}
                  />
                )}

                {/* Name tag */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-center">
                  <span className="text-sm font-whimsy">{pet.name}</span>
                </div>

                {/* Points popup */}
                {pet.painted && (
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-white"
                    initial={{ scale: 0, y: 0 }}
                    animate={{ scale: [1, 1.5, 0], y: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    +{10 + combo * 5}
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard teaser */}
      <div className="mt-4 text-center text-wonderland-muted text-sm">
        Top scorer this week: <span className="text-psyche-pink">@petlover2024</span> with 2,450 points! 🏆
      </div>
    </div>
  )
}
```

**Step 2: Create app/wonderland/shelter-angels/game/page.tsx**

```tsx
// apps/web/src/app/wonderland/shelter-angels/game/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { GameCanvas } from '@/components/shelter/GameCanvas'
import { useRouter } from 'next/navigation'

export default function DonationGamePage() {
  const router = useRouter()
  const [pets, setPets] = useState<Array<{ id: string; name: string; photoUrl: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch available shelter pets for the game
    fetch('/api/shelter-pets?limit=8&status=AVAILABLE')
      .then((res) => res.json())
      .then((data) => {
        setPets(data.pets || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleGameEnd = async (score: number) => {
    // Create donation checkout
    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5, // $5 per game
          gameScore: score,
        }),
      })

      const { checkoutUrl } = await response.json()

      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error('Failed to create donation:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-whimsy animate-pulse">
          Loading shelter pets... 🐾
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-display text-center mb-4 text-gradient">
          Paint the Roses Red 🌹
        </h1>
        <p className="text-center text-wonderland-muted mb-8 max-w-2xl mx-auto">
          $5 to play • 100% goes to shelter pet makeovers • Top scorers featured on leaderboard!
        </p>

        <GameCanvas
          pets={pets}
          onGameEnd={handleGameEnd}
          duration={30}
        />

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/wonderland/shelter-angels')}
            className="text-wonderland-muted hover:text-white transition-colors"
          >
            ← Back to Shelter Angels
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat(web): add Paint the Roses Red donation game"
```

---

## Task 6.4: Create 501(c)(3) Documentation

**Files:**
- Create: `docs/501c3/README.md`
- Create: `docs/501c3/articles-of-incorporation.md`
- Create: `docs/501c3/bylaws-template.md`
- Create: `docs/501c3/irs-form-1023ez-guide.md`

**Step 1: Create docs/501c3/README.md**

```markdown
# 501(c)(3) Documentation - Through the Looking Glass Rescue

This folder contains all documentation needed to establish "Through the Looking Glass Rescue" as a 501(c)(3) nonprofit organization.

## Filing Checklist

### California State Registration
- [ ] Choose exact legal name: "Through the Looking Glass Rescue"
- [ ] File Articles of Incorporation with CA Secretary of State ($30 fee)
- [ ] Obtain CA Entity Number
- [ ] Register with CA Attorney General's Registry of Charitable Trusts

### IRS 501(c)(3) Application
- [ ] Obtain EIN (Employer Identification Number) from IRS
- [ ] Complete Form 1023-EZ (if eligible) or Form 1023
- [ ] Pay filing fee ($275 for 1023-EZ, $600 for full 1023)
- [ ] Wait for determination letter (3-6 months typically)

### Post-Approval
- [ ] Update all materials with EIN
- [ ] Register for CA state tax exemption (Form 3500A)
- [ ] Set up donation tracking system
- [ ] Create receipt templates
- [ ] Establish record-keeping procedures

## Key Documents in This Folder

1. `articles-of-incorporation.md` - Template for CA filing
2. `bylaws-template.md` - Organization governance document
3. `irs-form-1023ez-guide.md` - Step-by-step IRS application guide
4. `donation-receipt-template.md` - Tax receipt template

## Important Notes

- **EIN Required First**: Must obtain EIN before filing 1023-EZ
- **State Before Federal**: File CA incorporation before IRS application
- **Keep Records**: Maintain all donation records for 7 years minimum
- **Annual Filing**: Form 990-N (e-Postcard) required annually if gross receipts ≤ $50,000
```

**Step 2: Create docs/501c3/articles-of-incorporation.md**

```markdown
# Articles of Incorporation
## Through the Looking Glass Rescue
### A California Nonprofit Public Benefit Corporation

---

**ARTICLE I - NAME**

The name of this corporation is: **Through the Looking Glass Rescue**

---

**ARTICLE II - PURPOSE**

This corporation is a nonprofit public benefit corporation and is not organized for the private gain of any person. It is organized under the Nonprofit Public Benefit Corporation Law for charitable purposes.

The specific purpose of this corporation is to:

1. Provide grooming, rehabilitation, and makeover services to shelter animals to increase their adoptability
2. Support animal shelters in Riverside County, California and surrounding areas
3. Educate the community about pet care, grooming needs, and responsible pet ownership
4. Reduce euthanasia rates by improving the presentation and appeal of shelter animals
5. Connect shelter animals with loving forever homes

---

**ARTICLE III - INITIAL AGENT FOR SERVICE OF PROCESS**

The name and address in California of this corporation's initial agent for service of process is:

Name: [KIMMIE'S LEGAL NAME]
Address: [REGISTERED ADDRESS]
City, State, ZIP: Nuevo, CA [ZIP]

---

**ARTICLE IV - LIMITATIONS**

A. This corporation is organized and operated exclusively for charitable purposes within the meaning of Section 501(c)(3) of the Internal Revenue Code.

B. No substantial part of the activities of this corporation shall consist of carrying on propaganda, or otherwise attempting to influence legislation, and the corporation shall not participate or intervene in any political campaign on behalf of or in opposition to any candidate for public office.

C. Notwithstanding any other provision of these articles, the corporation shall not carry on any other activities not permitted to be carried on:
   1. By a corporation exempt from federal income tax under Section 501(c)(3) of the Internal Revenue Code; or
   2. By a corporation, contributions to which are deductible under Section 170(c)(2) of the Internal Revenue Code.

---

**ARTICLE V - DEDICATION OF ASSETS**

The property of this corporation is irrevocably dedicated to charitable purposes and no part of the net income or assets of this corporation shall ever inure to the benefit of any director, officer, or member thereof, or to the benefit of any private person.

Upon the dissolution or winding up of the corporation, its assets remaining after payment, or provision for payment, of all debts and liabilities of this corporation shall be distributed to a nonprofit fund, foundation, or corporation which is organized and operated exclusively for charitable purposes and which has established its tax-exempt status under Section 501(c)(3) of the Internal Revenue Code.

---

**ARTICLE VI - INCORPORATOR**

The name and address of the incorporator is:

Name: [KIMMIE'S LEGAL NAME]
Address: [ADDRESS]
City, State, ZIP: Nuevo, CA [ZIP]

---

*Date: _______________*

*Signature of Incorporator: _______________*

---

## Filing Instructions

1. Complete all bracketed fields with actual information
2. Print on plain white paper
3. Mail to:
   Secretary of State
   Document Filing Support Unit
   P.O. Box 944228
   Sacramento, CA 94244-2280
4. Include $30 filing fee (check payable to "Secretary of State")
5. Include self-addressed stamped envelope for certified copy
```

**Step 3: Create docs/501c3/bylaws-template.md**

```markdown
# Bylaws of Through the Looking Glass Rescue
## A California Nonprofit Public Benefit Corporation

---

### ARTICLE I - OFFICES

**Section 1. Principal Office**
The principal office for the transaction of the activities and affairs of this Corporation is located at [ADDRESS], Nuevo, California. The Board of Directors may change the location of the principal office.

**Section 2. Other Offices**
The Board of Directors may establish branch or subordinate offices at any place or places where this Corporation is qualified to conduct its activities.

---

### ARTICLE II - PURPOSE

This Corporation is organized and operated exclusively for charitable purposes. Specifically, this Corporation shall:

1. Provide professional grooming and makeover services to shelter animals
2. Improve adoption rates through enhanced animal presentation
3. Educate the public on pet care and grooming
4. Partner with animal shelters and rescue organizations
5. Accept donations to fund shelter animal makeovers

---

### ARTICLE III - DIRECTORS

**Section 1. Number**
The Corporation shall have not less than three (3) and no more than seven (7) directors. The exact number shall be fixed by Board resolution.

**Section 2. Qualifications**
Directors shall be natural persons who support the purposes of the Corporation.

**Section 3. Term of Office**
Each director shall hold office for a term of two (2) years.

**Section 4. Compensation**
Directors shall serve without compensation for their services as directors. However, directors may be reimbursed for reasonable expenses incurred in performing their duties.

---

### ARTICLE IV - OFFICERS

**Section 1. Officers**
The officers of the Corporation shall be a President, Secretary, and Treasurer. The Corporation may also have a Vice President and such other officers as the Board deems necessary.

**Section 2. Duties**
- **President**: Presides at Board meetings, executes contracts, and provides general supervision
- **Secretary**: Keeps minutes, maintains records, and provides notices
- **Treasurer**: Has custody of funds, maintains financial records, and provides reports

---

### ARTICLE V - MEETINGS

**Section 1. Annual Meeting**
The Board shall hold an annual meeting in January of each year.

**Section 2. Regular Meetings**
The Board shall meet at least quarterly.

**Section 3. Special Meetings**
Special meetings may be called by the President or any two directors.

---

### ARTICLE VI - CONFLICTS OF INTEREST

No director or officer shall participate in any decision in which they have a financial interest. All potential conflicts must be disclosed to the Board.

---

### ARTICLE VII - AMENDMENTS

These Bylaws may be amended by a two-thirds (2/3) vote of the directors then in office at any meeting of the Board.

---

*Adopted by the Board of Directors on: _______________*

*Secretary: _______________*
```

**Step 4: Commit**

```bash
git add .
git commit -m "docs: add 501(c)(3) incorporation and bylaws templates"
```

---

## Execution Checklist - Phase 6

- [ ] Task 6.1: Build shelter pet OSINT scraper
- [ ] Task 6.2: Build donation system with Stripe
- [ ] Task 6.3: Build "Paint the Roses Red" donation game
- [ ] Task 6.4: Create 501(c)(3) documentation
- [ ] Task 6.5: Build shelter angels page (see extended tasks)
- [ ] Task 6.6: Build donation leaderboard (see extended tasks)
- [ ] Task 6.7: Set up n8n shelter sync workflow (see extended tasks)
