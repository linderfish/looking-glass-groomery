// apps/web/src/components/entry/RabbitHole.tsx
'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function RabbitHole() {
  const [showCheshire, setShowCheshire] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowCheshire(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Falling animation background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Swirling tunnel effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-alice-purple/30 via-wonderland-bg to-wonderland-bg"
          animate={{
            scale: [1, 20],
            rotate: [0, 360],
          }}
          transition={{
            duration: 3,
            ease: 'easeIn',
          }}
        />

        {/* Floating objects */}
        {['🍄', '🃏', '⏰', '🫖', '🔑', '🎩', '🐇', '♠️', '♥️', '♣️', '♦️'].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            initial={{
              x: `${Math.random() * 100}vw`,
              y: '-10vh',
              rotate: 0,
            }}
            animate={{
              y: '110vh',
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: Math.random() * 0.5,
              ease: 'linear',
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      {/* Central shrinking effect */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 1 }}
        animate={{ scale: 0.1, opacity: 0 }}
        transition={{ duration: 2, delay: 0.5, ease: 'easeIn' }}
      >
        <div className="w-64 h-64 rounded-full border-4 border-alice-gold flex items-center justify-center">
          <span className="font-display text-3xl text-alice-gold">
            Shrinking...
          </span>
        </div>
      </motion.div>

      {/* Cheshire grin appears */}
      {showCheshire && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }}
          transition={{ duration: 1.5, times: [0, 0.3, 0.7, 1] }}
          className="absolute z-20"
        >
          <div className="text-8xl">😼</div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center font-whimsy text-xl text-cheshire-grin mt-4"
          >
            We&apos;re all mad here~
          </motion.p>
        </motion.div>
      )}

      {/* Loading indicator */}
      <motion.div
        className="absolute bottom-20 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="w-16 h-1 bg-gradient-to-r from-alice-purple to-psyche-pink rounded-full mx-auto mb-4"
          animate={{
            scaleX: [0, 1, 0],
            x: ['-50%', '0%', '50%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
        <span className="text-sm text-wonderland-muted">
          Falling down the rabbit hole...
        </span>
      </motion.div>
    </motion.div>
  )
}
