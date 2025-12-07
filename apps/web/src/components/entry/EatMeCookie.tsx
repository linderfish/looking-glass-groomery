// apps/web/src/components/entry/EatMeCookie.tsx
'use client'

import { motion } from 'framer-motion'

interface EatMeCookieProps {
  onClick: () => void
}

export function EatMeCookie({ onClick }: EatMeCookieProps) {
  return (
    <motion.button
      onClick={onClick}
      className="relative group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Cookie shape */}
      <div className="relative">
        {/* Main cookie */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-2xl flex items-center justify-center">
          {/* Cookie texture spots */}
          <div className="absolute w-3 h-3 bg-amber-600/30 rounded-full top-6 left-8" />
          <div className="absolute w-2 h-2 bg-amber-600/30 rounded-full top-12 right-10" />
          <div className="absolute w-4 h-4 bg-amber-600/30 rounded-full bottom-8 left-12" />
          <div className="absolute w-2 h-2 bg-amber-600/30 rounded-full bottom-10 right-8" />

          {/* "Eat Me" text */}
          <div className="relative z-10 text-center">
            <span className="font-whimsy text-2xl md:text-3xl text-amber-900 drop-shadow-md">
              Eat Me
            </span>
          </div>
        </div>

        {/* Magical glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-alice-purple/20 to-psyche-pink/20 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-alice-gold rounded-full"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Hover instruction */}
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.7, y: 0 }}
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-wonderland-muted whitespace-nowrap"
      >
        Click to enter
      </motion.span>
    </motion.button>
  )
}
