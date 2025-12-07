// apps/web/src/components/effects/BreathingBackground.tsx
'use client'

import { motion } from 'framer-motion'

export function BreathingBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-wonderland-bg" />

      {/* Animated gradient blobs */}
      <motion.div
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-alice-purple/10 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-psyche-pink/10 blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-psyche-blue/5 blur-3xl"
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

      {/* Subtle checkerboard overlay */}
      <div className="absolute inset-0 checkerboard opacity-5" />

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-wonderland-bg/80" />
    </div>
  )
}
