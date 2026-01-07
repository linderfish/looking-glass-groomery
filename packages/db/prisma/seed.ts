// packages/db/prisma/seed.ts
// Service catalog for Through the Looking Glass Groomery
// VERIFIED PRICES from MoeGo: https://booking.moego.pet/ol/landing?name=ThroughTheLookingGlassGroomery
// Last verified: 2026-01-07

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding services with verified MoeGo pricing...')

  // Clear existing services
  await prisma.service.deleteMany({})

  // ============================================
  // FULL GROOM SERVICES - "Magic Mirror Makeover"
  // ============================================
  const fullGroomServices = [
    {
      name: 'Magic Mirror Makeover - Small Dog',
      description: 'Complete grooming transformation for small dogs (under 15 lbs): bath, dry, haircut, nails, ears, and sanitary trim. See your pup reflected beautifully!',
      category: 'FULL_GROOM' as const,
      basePrice: 75, // MoeGo verified
      baseDuration: 90,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'Magic Mirror Makeover - Medium Dog',
      description: 'Complete grooming transformation for medium dogs (15-40 lbs): bath, dry, haircut, nails, ears, and sanitary trim',
      category: 'FULL_GROOM' as const,
      basePrice: 85, // MoeGo verified
      baseDuration: 120,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'Magic Mirror Makeover - Large Dog',
      description: 'Complete grooming transformation for large dogs (40-70 lbs): bath, dry, haircut, nails, ears, and sanitary trim',
      category: 'FULL_GROOM' as const,
      basePrice: 95, // MoeGo verified
      baseDuration: 150,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'Magic Mirror Makeover - XL Dog',
      description: 'Complete grooming transformation for extra large dogs (over 70 lbs): bath, dry, haircut, nails, ears, and sanitary trim',
      category: 'FULL_GROOM' as const,
      basePrice: 130, // MoeGo verified
      baseDuration: 180,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: "Cheshire Cat's Glow Up",
      description: 'Complete grooming for cats: bath, dry, haircut/lion cut, nails, and ear cleaning. Transform your kitty into Wonderland royalty!',
      category: 'FULL_GROOM' as const,
      basePrice: 120, // MoeGo verified
      baseDuration: 90,
      pricingType: 'FLAT' as const,
      availableFor: ['CAT'] as const[],
      isActive: true,
    },
  ]

  // ============================================
  // BATH SERVICES - "Whimsical Wash & Tidy"
  // ============================================
  const bathTidyServices = [
    {
      name: 'Whimsical Wash & Tidy - Small Dog',
      description: 'Bath, dry, nail trim, ear cleaning, and light trim around face, feet, and sanitary areas for small dogs',
      category: 'BATH_TIDY' as const,
      basePrice: 55, // MoeGo verified
      baseDuration: 45,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'Whimsical Wash & Tidy - Medium Dog',
      description: 'Bath, dry, nail trim, ear cleaning, and light trim around face, feet, and sanitary areas for medium dogs',
      category: 'BATH_TIDY' as const,
      basePrice: 65, // MoeGo verified
      baseDuration: 60,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'Whimsical Wash & Tidy - Large Dog',
      description: 'Bath, dry, nail trim, ear cleaning, and light trim around face, feet, and sanitary areas for large dogs',
      category: 'BATH_TIDY' as const,
      basePrice: 85, // MoeGo verified
      baseDuration: 75,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'Whimsical Wash & Tidy - XL Dog',
      description: 'Bath, dry, nail trim, ear cleaning, and light trim around face, feet, and sanitary areas for extra large dogs',
      category: 'BATH_TIDY' as const,
      basePrice: 115, // MoeGo verified
      baseDuration: 90,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: "Cheshire Cat's Bath",
      description: 'Gentle bath, dry, nail trim, and ear cleaning for cats. A spa day fit for the most curious of cats!',
      category: 'BATH_TIDY' as const,
      basePrice: 80, // MoeGo verified
      baseDuration: 60,
      pricingType: 'FLAT' as const,
      availableFor: ['CAT'] as const[],
      isActive: true,
    },
  ]

  // ============================================
  // A LA CARTE SERVICES
  // ============================================
  const aLaCarteServices = [
    {
      name: 'Nail Trim',
      description: 'Nail trimming and filing',
      category: 'A_LA_CARTE' as const,
      basePrice: 15,
      baseDuration: 15,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG', 'CAT'] as const[],
      isActive: true,
    },
    {
      name: 'Nail Grinding',
      description: 'Smooth nail grinding with Dremel for a polished finish',
      category: 'A_LA_CARTE' as const,
      basePrice: 20,
      baseDuration: 20,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG', 'CAT'] as const[],
      isActive: true,
    },
    {
      name: 'Ear Cleaning',
      description: 'Deep ear cleaning and hair removal',
      category: 'A_LA_CARTE' as const,
      basePrice: 10,
      baseDuration: 10,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG', 'CAT'] as const[],
      isActive: true,
    },
    {
      name: 'Teeth Brushing',
      description: 'Dental hygiene with pet-safe toothpaste',
      category: 'A_LA_CARTE' as const,
      basePrice: 10,
      baseDuration: 10,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG', 'CAT'] as const[],
      isActive: true,
    },
    {
      name: 'Sanitary Trim',
      description: 'Trimming around private areas for hygiene',
      category: 'A_LA_CARTE' as const,
      basePrice: 15,
      baseDuration: 15,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG', 'CAT'] as const[],
      isActive: true,
    },
    {
      name: 'Face Trim',
      description: 'Face and muzzle shaping',
      category: 'A_LA_CARTE' as const,
      basePrice: 15,
      baseDuration: 15,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'Feet Trim',
      description: 'Paw pad and feet hair trimming',
      category: 'A_LA_CARTE' as const,
      basePrice: 15,
      baseDuration: 15,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'De-shedding Treatment',
      description: 'Specialized de-shedding shampoo and blowout to remove loose undercoat',
      category: 'A_LA_CARTE' as const,
      basePrice: 25,
      baseDuration: 30,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG', 'CAT'] as const[],
      isActive: true,
    },
    {
      name: 'Customer Pickup Service',
      description: 'We pick up your pet from your home for their grooming appointment',
      category: 'A_LA_CARTE' as const,
      basePrice: 15, // MoeGo verified
      baseDuration: 30,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG', 'CAT'] as const[],
      isActive: true,
    },
    {
      name: 'Extra Care (Spicy Pet)',
      description: 'Additional handling care for pets who need extra patience and Fear-Free techniques',
      category: 'A_LA_CARTE' as const,
      basePrice: 10, // MoeGo verified
      baseDuration: 15,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG', 'CAT'] as const[],
      isActive: true,
    },
  ]

  // ============================================
  // CREATIVE SERVICES - Wonderland Magic
  // ============================================
  const creativeServices = [
    {
      name: 'Cheshire Pop of Color',
      description: 'Pet-safe temporary color pop on ears, tail, or small area. A touch of Wonderland magic!',
      category: 'CREATIVE' as const,
      basePrice: 15, // MoeGo verified (base price)
      baseDuration: 30,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'MadHatter Highlights',
      description: 'Pet-safe temporary color highlights - multiple small color accents',
      category: 'CREATIVE' as const,
      basePrice: 25, // MoeGo verified
      baseDuration: 45,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'Curiouser & Curiouser',
      description: 'Full body creative grooming with custom colors, patterns, and artistic designs. The ultimate Wonderland transformation!',
      category: 'CREATIVE' as const,
      basePrice: 100, // MoeGo verified
      baseDuration: 120,
      pricingType: 'CUSTOM' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'Glitter & Accessories',
      description: 'Pet-safe glitter, bows, bandanas, and Wonderland accessories',
      category: 'CREATIVE' as const,
      basePrice: 15,
      baseDuration: 15,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG', 'CAT'] as const[],
      isActive: true,
    },
  ]

  // ============================================
  // SPA SERVICES
  // ============================================
  const spaServices = [
    {
      name: 'Blueberry Facial',
      description: 'Soothing blueberry facial treatment to brighten and refresh',
      category: 'SPA' as const,
      basePrice: 15,
      baseDuration: 15,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
    {
      name: 'Oatmeal & Aloe Bath',
      description: 'Moisturizing bath for sensitive or dry skin',
      category: 'SPA' as const,
      basePrice: 20,
      baseDuration: 15,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG', 'CAT'] as const[],
      isActive: true,
    },
    {
      name: 'Flea & Tick Treatment',
      description: 'Medicated flea and tick bath treatment',
      category: 'SPA' as const,
      basePrice: 25,
      baseDuration: 20,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG', 'CAT'] as const[],
      isActive: true,
    },
    {
      name: 'Pawdicure',
      description: 'Nail trim, grinding, paw pad moisturizer, and optional nail polish',
      category: 'SPA' as const,
      basePrice: 25,
      baseDuration: 25,
      pricingType: 'FLAT' as const,
      availableFor: ['DOG'] as const[],
      isActive: true,
    },
  ]

  // Create all services
  const allServices = [
    ...fullGroomServices,
    ...bathTidyServices,
    ...aLaCarteServices,
    ...creativeServices,
    ...spaServices,
  ]

  for (const service of allServices) {
    await prisma.service.create({
      data: service,
    })
    console.log(`  Created: ${service.name} - $${service.basePrice}`)
  }

  console.log(`\nSeeded ${allServices.length} services successfully!`)
  console.log('\nPricing verified from MoeGo: https://booking.moego.pet/ol/landing?name=ThroughTheLookingGlassGroomery')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
