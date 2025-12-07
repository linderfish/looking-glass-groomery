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
  garden: [
    '/backgrounds/garden-1.png',
    '/backgrounds/garden-2.png',
    '/backgrounds/garden-3.png',
  ],
  // All other scenes use garden backgrounds for now
  teaParty: [
    '/backgrounds/garden-1.png',
    '/backgrounds/garden-2.png',
    '/backgrounds/garden-3.png',
  ],
  cheshire: [
    '/backgrounds/garden-1.png',
    '/backgrounds/garden-2.png',
    '/backgrounds/garden-3.png',
  ],
  lookingGlass: [
    '/backgrounds/garden-1.png',
    '/backgrounds/garden-2.png',
    '/backgrounds/garden-3.png',
  ],
  shelter: [
    '/backgrounds/garden-1.png',
    '/backgrounds/garden-2.png',
    '/backgrounds/garden-3.png',
  ],
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
