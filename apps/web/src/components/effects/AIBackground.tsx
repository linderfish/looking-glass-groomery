// apps/web/src/components/effects/AIBackground.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([])

  const backgrounds = SCENE_BACKGROUNDS[scene] || SCENE_BACKGROUNDS.garden

  // Initialize loaded state based on number of backgrounds
  useEffect(() => {
    setImagesLoaded(new Array(backgrounds.length).fill(false))
  }, [backgrounds.length])

  // Cycle through backgrounds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % backgrounds.length)
    }, 12000) // Change every 12 seconds

    return () => clearInterval(interval)
  }, [backgrounds.length])

  const handleImageLoad = (index: number) => {
    setImagesLoaded(prev => {
      const newLoaded = [...prev]
      newLoaded[index] = true
      return newLoaded
    })
  }

  return (
    <div className={`fixed inset-0 z-0 overflow-hidden ${className}`}>
      {/* Static Pre-generated Backgrounds - Crossfading */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <Image
            src={backgrounds[currentIndex]}
            alt="Wonderland background"
            fill
            className="object-cover"
            priority={currentIndex === 0}
            onLoad={() => handleImageLoad(currentIndex)}
          />
          {/* Subtle animation overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-wonderland-bg/80 via-transparent to-wonderland-bg/40"
            animate={{
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* CSS Fallback while images load */}
      {!imagesLoaded.some(loaded => loaded) && (
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-wonderland-bg" />

          {/* Animated gradient blobs */}
          <motion.div
            className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-alice-purple/15 blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <motion.div
            className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-psyche-pink/15 blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, 100, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <motion.div
            className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-psyche-blue/10 blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -100, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 checkerboard opacity-5" />
        </div>
      )}

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-wonderland-bg/90 pointer-events-none" />
    </div>
  )
}
