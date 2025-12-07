// apps/web/src/components/entry/ImmersiveEntry.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface ImmersiveEntryProps {
  onEnter: () => void
}

// Pre-generated static background images (no API calls needed)
const ENTRY_BACKGROUNDS = [
  '/backgrounds/entry-1.png',
  '/backgrounds/entry-2.png',
  '/backgrounds/entry-3.png',
]

export function ImmersiveEntry({ onEnter }: ImmersiveEntryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([false, false, false])
  const [isHovering, setIsHovering] = useState(false)
  const [cookieEaten, setCookieEaten] = useState(false)
  const [shrinkPhase, setShrinkPhase] = useState(0)

  // Mark image as loaded
  const handleImageLoad = (index: number) => {
    setImagesLoaded(prev => {
      const newLoaded = [...prev]
      newLoaded[index] = true
      return newLoaded
    })
  }

  // Cycle through images
  useEffect(() => {
    if (cookieEaten) return

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % ENTRY_BACKGROUNDS.length)
    }, 8000) // Change every 8 seconds

    return () => clearInterval(interval)
  }, [cookieEaten])

  const handleCookieClick = () => {
    setCookieEaten(true)

    // Phase 1: Cookie shrinks you
    setTimeout(() => setShrinkPhase(1), 100)
    // Phase 2: World grows/you shrink more
    setTimeout(() => setShrinkPhase(2), 1000)
    // Phase 3: Fall into the rabbit hole
    setTimeout(() => setShrinkPhase(3), 2000)
    // Navigate away
    setTimeout(() => onEnter(), 3500)
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Static Pre-generated Backgrounds - Crossfading */}
      <div className="absolute inset-0">
        {ENTRY_BACKGROUNDS.map((src, index) => (
          <AnimatePresence key={index}>
            {index === currentImageIndex && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                className="absolute inset-0"
              >
                <Image
                  src={src}
                  alt="Wonderland"
                  fill
                  className="object-cover"
                  priority={index === 0}
                  onLoad={() => handleImageLoad(index)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        ))}

        {/* Fallback gradient while loading */}
        {!imagesLoaded.some(loaded => loaded) && (
          <div className="absolute inset-0 bg-gradient-to-br from-wonderland-bg via-alice-purple/20 to-psyche-pink/20">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-alice-purple/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
        )}

        {/* Dreamy overlay - darker for better text readability */}
        <div className="absolute inset-0 bg-gradient-radial from-wonderland-bg/40 via-wonderland-bg/50 to-wonderland-bg/90" />

        {/* Animated color wash */}
        <motion.div
          className="absolute inset-0 mix-blend-overlay"
          animate={{
            background: [
              'radial-gradient(circle at 30% 40%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 70% 60%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 40%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <span className="text-xl opacity-60">
              {['✨', '🌟', '💫', '⭐', '🦋', '🍄', '🃏', '🫖', '🔮'][Math.floor(Math.random() * 9)]}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Main Content - Shrinks when cookie eaten */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen"
        animate={
          shrinkPhase >= 1
            ? {
                scale: shrinkPhase >= 2 ? 0.1 : 0.5,
                opacity: shrinkPhase >= 3 ? 0 : 1,
                y: shrinkPhase >= 2 ? 500 : 0,
                rotate: shrinkPhase >= 3 ? 360 : 0,
              }
            : {}
        }
        transition={{
          duration: shrinkPhase >= 2 ? 1.5 : 0.8,
          ease: 'easeIn',
        }}
      >
        {/* Title with dark backdrop for readability */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-center mb-12 px-4"
        >
          {/* Title background for better contrast */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-wonderland-bg/60 backdrop-blur-sm rounded-3xl -m-6" />
            <h1 className="relative font-display text-5xl md:text-7xl lg:text-8xl mb-4 p-4" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)' }}>
              <motion.span
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-alice-purple via-psyche-pink to-alice-gold"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}
              >
                Through the
              </motion.span>
              <br />
              <motion.span
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-psyche-pink via-alice-purple to-psyche-blue"
                animate={{
                  backgroundPosition: ['100% 50%', '0% 50%', '100% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}
              >
                Looking Glass
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="relative font-whimsy text-xl md:text-2xl text-white pb-2"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)' }}
            >
              Where every pet becomes a work of art
            </motion.p>
          </div>
        </motion.div>

        {/* Enhanced Eat Me Cookie */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, type: 'spring', bounce: 0.5 }}
          className="relative"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <motion.button
            onClick={handleCookieClick}
            disabled={cookieEaten}
            className="relative group cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={
              isHovering && !cookieEaten
                ? {
                    y: [0, -5, 0],
                  }
                : {}
            }
            transition={{
              y: { duration: 0.5, repeat: Infinity },
            }}
          >
            {/* Magical aura */}
            <motion.div
              className="absolute -inset-8 rounded-full"
              animate={{
                background: [
                  'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                  'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
                  'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)',
                  'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                ],
                scale: isHovering ? [1, 1.3, 1] : 1,
              }}
              transition={{
                background: { duration: 3, repeat: Infinity },
                scale: { duration: 1, repeat: Infinity },
              }}
            />

            {/* Cookie */}
            <div className="relative w-36 h-36 md:w-44 md:h-44">
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-alice-gold via-amber-300 to-alice-gold"
                animate={{
                  rotate: 360,
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 2, repeat: Infinity },
                }}
                style={{ padding: '3px' }}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400" />
              </motion.div>

              {/* Cookie face */}
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 shadow-2xl flex items-center justify-center overflow-hidden">
                {/* Cookie texture */}
                <div className="absolute inset-0">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-3 h-3 bg-amber-600/30 rounded-full"
                      style={{
                        top: `${15 + Math.random() * 70}%`,
                        left: `${15 + Math.random() * 70}%`,
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>

                {/* Icing text */}
                <div className="relative z-10 text-center">
                  <motion.span
                    className="font-whimsy text-3xl md:text-4xl text-amber-900 drop-shadow-md"
                    animate={{
                      textShadow: [
                        '0 0 10px rgba(251, 191, 36, 0.5)',
                        '0 0 20px rgba(251, 191, 36, 0.8)',
                        '0 0 10px rgba(251, 191, 36, 0.5)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Eat Me
                  </motion.span>
                </div>

                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                />
              </div>
            </div>

            {/* Sparkle burst on hover */}
            <AnimatePresence>
              {isHovering && !cookieEaten && (
                <>
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-2 h-2 bg-alice-gold rounded-full"
                      initial={{ scale: 0, x: 0, y: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        x: Math.cos((i / 12) * Math.PI * 2) * 80,
                        y: Math.sin((i / 12) * Math.PI * 2) * 80,
                      }}
                      exit={{ scale: 0 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Instruction text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 1.5 }}
            className="text-center mt-6 text-white/70 font-whimsy text-lg"
          >
            {isHovering ? '✨ Go on, take a bite! ✨' : 'Click to enter Wonderland'}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Rabbit hole vortex when falling */}
      <AnimatePresence>
        {shrinkPhase >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 2 }}
            className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              className="w-[200vmax] h-[200vmax] rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #8B5CF6, #EC4899, #3B82F6, #8B5CF6)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
            />
            <div className="absolute inset-0 bg-gradient-radial from-wonderland-bg via-transparent to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cheshire grin flash */}
      <AnimatePresence>
        {shrinkPhase >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: 1 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-30 flex items-center justify-center"
          >
            <div className="text-center">
              <span className="text-9xl">😼</span>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-whimsy text-2xl text-cheshire-grin mt-4"
              >
                We&apos;re all mad here~
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
