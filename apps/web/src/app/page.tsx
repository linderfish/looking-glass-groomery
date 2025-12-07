// apps/web/src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { EatMeCookie } from '@/components/entry/EatMeCookie'
import { RabbitHole } from '@/components/entry/RabbitHole'

export default function EntryPage() {
  const [hasEntered, setHasEntered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const router = useRouter()

  // Check if user has entered before (skip animation)
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('wonderland-entered')
    if (hasVisited) {
      router.push('/wonderland')
    }
  }, [router])

  const handleEnter = () => {
    setIsAnimating(true)
    sessionStorage.setItem('wonderland-entered', 'true')

    // Wait for animation then navigate
    setTimeout(() => {
      setHasEntered(true)
      router.push('/wonderland')
    }, 3000)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-wonderland-bg">
      {/* Starfield background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Checkerboard floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 checkerboard opacity-20 transform perspective-1000 rotateX-60" />

      <AnimatePresence mode="wait">
        {!isAnimating ? (
          <motion.div
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4"
          >
            {/* Title */}
            <motion.h1
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="font-display text-4xl md:text-6xl lg:text-7xl text-center mb-8"
            >
              <span className="text-gradient">Through the</span>
              <br />
              <span className="text-psychedelic">Looking Glass</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="font-whimsy text-xl md:text-2xl text-wonderland-muted text-center mb-12"
            >
              Where every pet becomes a work of art
            </motion.p>

            {/* Eat Me Cookie */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: 'spring', bounce: 0.5 }}
            >
              <EatMeCookie onClick={handleEnter} />
            </motion.div>

            {/* Skip link for accessibility */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              onClick={handleEnter}
              className="mt-12 text-sm text-wonderland-muted hover:text-alice-gold transition-colors"
            >
              or simply enter the wonderland →
            </motion.button>
          </motion.div>
        ) : (
          <RabbitHole />
        )}
      </AnimatePresence>
    </main>
  )
}
