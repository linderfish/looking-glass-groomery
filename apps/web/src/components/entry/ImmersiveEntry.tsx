// apps/web/src/components/entry/ImmersiveEntry.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface ImmersiveEntryProps {
  onEnter: () => void
}

// Pre-generated static background images - user's favorites (randomly selected on load)
const ENTRY_BACKGROUNDS = [
  '/backgrounds/3mr_B6g8YqBNq1lSGdoy2.png',
  '/backgrounds/fULA8zSRF1yodRXjfcVxX.png',
  '/backgrounds/Jpa18jGCOqbqhB84DPQp4.png',
  '/backgrounds/qeyZQVAGTyS7CQmvF1ddK.png',
]

export function ImmersiveEntry({ onEnter }: ImmersiveEntryProps) {
  // Pick a random background on mount (only once)
  const [backgroundSrc] = useState(() =>
    ENTRY_BACKGROUNDS[Math.floor(Math.random() * ENTRY_BACKGROUNDS.length)]
  )
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [cookieEaten, setCookieEaten] = useState(false)
  const [shrinkPhase, setShrinkPhase] = useState(0)


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
      {/* Single Static Background - Randomly Selected */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <Image
            src={backgroundSrc}
            alt="Wonderland"
            fill
            className="object-cover"
            priority
            onLoad={() => setImageLoaded(true)}
          />
        </motion.div>

        {/* Fallback gradient while loading */}
        {!imageLoaded && (
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

      {/* Swirling particles - CSS animation for true circular orbit */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <style jsx>{`
          @keyframes orbit-slow {
            from { transform: rotate(0deg) translateX(min(40vw, 40vh)) rotate(0deg); }
            to { transform: rotate(360deg) translateX(min(40vw, 40vh)) rotate(-360deg); }
          }
          @keyframes orbit-medium {
            from { transform: rotate(0deg) translateX(min(28vw, 28vh)) rotate(0deg); }
            to { transform: rotate(360deg) translateX(min(28vw, 28vh)) rotate(-360deg); }
          }
          @keyframes orbit-fast {
            from { transform: rotate(0deg) translateX(min(16vw, 16vh)) rotate(0deg); }
            to { transform: rotate(360deg) translateX(min(16vw, 16vh)) rotate(-360deg); }
          }
          .orbit-slow { animation: orbit-slow var(--duration, 30s) linear infinite; }
          .orbit-medium { animation: orbit-medium var(--duration, 20s) linear infinite; }
          .orbit-fast { animation: orbit-fast var(--duration, 12s) linear infinite; }
        `}</style>

        {/* Outer ring - slow orbit */}
        {['✨', '🌟', '🦋', '🍄', '🃏', '🫖', '🔮', '💫'].map((icon, i) => (
          <div
            key={`outer-${i}`}
            className="absolute left-1/2 top-1/2 orbit-slow"
            style={{
              animationDelay: `${-(i / 8) * 30}s`,
              ['--duration' as string]: `${28 + (i % 3) * 4}s`,
            }}
          >
            <span className="text-2xl opacity-40">{icon}</span>
          </div>
        ))}

        {/* Middle ring - medium orbit */}
        {['🦋', '💫', '✨', '🍄', '🌟', '🔮'].map((icon, i) => (
          <div
            key={`middle-${i}`}
            className="absolute left-1/2 top-1/2 orbit-medium"
            style={{
              animationDelay: `${-(i / 6) * 20}s`,
              ['--duration' as string]: `${18 + (i % 3) * 3}s`,
            }}
          >
            <span className="text-xl opacity-50">{icon}</span>
          </div>
        ))}

        {/* Inner ring - fast orbit */}
        {['⭐', '✨', '💫', '🌸'].map((icon, i) => (
          <div
            key={`inner-${i}`}
            className="absolute left-1/2 top-1/2 orbit-fast"
            style={{
              animationDelay: `${-(i / 4) * 12}s`,
              ['--duration' as string]: `${10 + (i % 2) * 3}s`,
            }}
          >
            <span className="text-lg opacity-60">{icon}</span>
          </div>
        ))}
      </div>

      {/* Main Content - Shrinks when cookie eaten */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen"
        animate={
          shrinkPhase >= 1
            ? {
                scale: shrinkPhase >= 3 ? 0.05 : shrinkPhase >= 2 ? 0.2 : 0.5,
                opacity: shrinkPhase >= 3 ? 0 : 1,
                y: shrinkPhase >= 2 ? 400 : 0,
                rotate: shrinkPhase >= 3 ? 180 : shrinkPhase >= 2 ? 90 : shrinkPhase >= 1 ? 15 : 0,
              }
            : {}
        }
        transition={{
          duration: shrinkPhase >= 2 ? 1.5 : 0.8,
          ease: 'easeIn',
        }}
      >
        {/* Title */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-center mb-12 px-4"
        >
          {/* Title container with subtle backdrop for readability */}
          <div className="relative inline-block">
            {/* Soft glow behind text */}
            <div className="absolute inset-0 blur-2xl bg-wonderland-bg/60 scale-110 rounded-full" />

            <h1 className="relative font-display text-5xl md:text-6xl lg:text-7xl mb-6 leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              <motion.span
                className="block text-transparent bg-clip-text bg-gradient-to-r from-alice-purple via-psyche-pink to-alice-gold pb-2"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{
                  backgroundSize: '200% 200%',
                  WebkitTextStroke: '1px rgba(0,0,0,0.3)',
                }}
              >
                Through the
              </motion.span>
              <motion.span
                className="block text-transparent bg-clip-text bg-gradient-to-r from-psyche-pink via-alice-purple to-psyche-blue pb-2"
                animate={{
                  backgroundPosition: ['100% 50%', '0% 50%', '100% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{
                  backgroundSize: '200% 200%',
                  WebkitTextStroke: '1px rgba(0,0,0,0.3)',
                }}
              >
                Looking Glass
              </motion.span>
            </h1>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="font-whimsy text-xl md:text-2xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          >
            Where every pet becomes a work of art
          </motion.p>
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

      {/* Smooth fade to dark during transition */}
      <AnimatePresence>
        {shrinkPhase >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-20 bg-wonderland-bg pointer-events-none"
          />
        )}
      </AnimatePresence>

    </div>
  )
}
