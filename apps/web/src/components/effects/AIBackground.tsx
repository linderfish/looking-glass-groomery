// apps/web/src/components/effects/AIBackground.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'

interface AIBackgroundProps {
  scene?: 'entry' | 'garden' | 'teaParty' | 'cheshire' | 'lookingGlass' | 'shelter'
  className?: string
}

// Pre-generated static backgrounds for each scene
const SCENE_BACKGROUNDS: Record<string, string[]> = {
  // Homepage/Services - Royal pet spa throne room
  garden: [
    '/backgrounds/services-1.png',
    '/backgrounds/garden-1.png',
    '/backgrounds/garden-2.png',
    '/backgrounds/garden-3.png',
  ],
  // Looking Glass page - Mirror portal to another dimension
  lookingGlass: [
    '/backgrounds/looking-glass-1.png',
  ],
  // Gallery page - Wonderland art exhibition hall
  gallery: [
    '/backgrounds/gallery-1.png',
  ],
  // Shelter Angels page - Welcoming rescue sanctuary cottage
  shelter: [
    '/backgrounds/shelter-2.png',
  ],
  // Contact page - Cozy tea party setting
  teaParty: [
    '/backgrounds/contact-1.png',
  ],
  contact: [
    '/backgrounds/contact-1.png',
  ],
  // Cheshire cat themed areas
  cheshire: [
    '/backgrounds/garden-1.png',
    '/backgrounds/garden-2.png',
    '/backgrounds/garden-3.png',
  ],
  // Entry/Intro page - User's favorites
  entry: [
    '/backgrounds/3mr_B6g8YqBNq1lSGdoy2.png',
    '/backgrounds/fULA8zSRF1yodRXjfcVxX.png',
    '/backgrounds/Jpa18jGCOqbqhB84DPQp4.png',
    '/backgrounds/qeyZQVAGTyS7CQmvF1ddK.png',
  ],
}

export function AIBackground({
  scene = 'garden',
  className = '',
}: AIBackgroundProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const backgrounds = SCENE_BACKGROUNDS[scene] || SCENE_BACKGROUNDS.garden
  // Pick a random background on mount (single static image, no cycling)
  const [backgroundSrc] = useState(() =>
    backgrounds[Math.floor(Math.random() * backgrounds.length)]
  )

  return (
    <div className={`fixed inset-0 z-0 overflow-hidden ${className}`}>
      {/* Single static background */}
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
