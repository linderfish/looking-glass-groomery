// apps/web/src/components/effects/DynamicBackground.tsx
'use client'

import { usePathname } from 'next/navigation'
import { useState, useMemo } from 'react'
import Image from 'next/image'

// Pre-generated static backgrounds for each route
// All backgrounds use consistent style: deep purple/teal/magenta palette,
// bioluminescent mushrooms, playing cards, pocket watches, swirling vortexes
const ROUTE_BACKGROUNDS: Record<string, string[]> = {
  // Homepage/Services - Enchanted grooming salon with floating scissors
  '/wonderland': [
    '/backgrounds/services-new.png',
  ],
  '/wonderland/services': [
    '/backgrounds/services-new.png',
  ],
  // Looking Glass page - Ornate mirror portal with swirling energy
  '/wonderland/looking-glass': [
    '/backgrounds/looking-glass-new.png',
  ],
  // Gallery page - Floating pet portrait frames with Alice
  '/wonderland/gallery': [
    '/backgrounds/gallery-new.png',
  ],
  // Shelter Angels page - Cozy mushroom homes sanctuary
  '/wonderland/shelter-angels': [
    '/backgrounds/shelter-new.png',
  ],
  // Contact page - Mad Hatter tea party scene
  '/wonderland/contact': [
    '/backgrounds/contact-new.png',
  ],
  // Why Kimmie page - Uses services background
  '/wonderland/why-kimmie': [
    '/backgrounds/services-new.png',
  ],
}

// Default fallback - services/homepage background
const DEFAULT_BACKGROUNDS = [
  '/backgrounds/services-new.png',
]

export function DynamicBackground() {
  const pathname = usePathname()
  const [imageLoaded, setImageLoaded] = useState(false)

  // Select background based on current route (memoized to prevent re-randomization)
  const backgroundSrc = useMemo(() => {
    const backgrounds = ROUTE_BACKGROUNDS[pathname] || DEFAULT_BACKGROUNDS
    return backgrounds[Math.floor(Math.random() * backgrounds.length)]
  }, [pathname])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Static background image */}
      <div className="absolute inset-0">
        <Image
          src={backgroundSrc}
          alt="Wonderland background"
          fill
          className="object-cover"
          priority
          onLoad={() => setImageLoaded(true)}
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-wonderland-bg/80 via-wonderland-bg/30 to-wonderland-bg/40" />
      </div>

      {/* Simple CSS fallback while image loads */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-wonderland-bg" />
      )}

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-wonderland-bg/90 pointer-events-none" />
    </div>
  )
}
