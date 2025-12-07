// apps/web/src/components/effects/AIBackground.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AIBackgroundProps {
  scene?: 'entry' | 'garden' | 'teaParty' | 'cheshire' | 'lookingGlass' | 'shelter'
  customPrompt?: string
  priority?: boolean
  className?: string
}

interface BackgroundState {
  url: string | null
  loading: boolean
  error: boolean
}

export function AIBackground({
  scene = 'entry',
  customPrompt,
  priority = false,
  className = '',
}: AIBackgroundProps) {
  const [background, setBackground] = useState<BackgroundState>({
    url: null,
    loading: true,
    error: false,
  })
  const [nextBackground, setNextBackground] = useState<string | null>(null)

  const fetchBackground = useCallback(async (forceRegenerate = false) => {
    try {
      setBackground(prev => ({ ...prev, loading: true }))

      const response = await fetch('/api/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene,
          customPrompt,
          forceRegenerate,
        }),
      })

      const data = await response.json()

      if (data.fallback || !data.imageUrl) {
        // Use CSS fallback
        setBackground({
          url: null,
          loading: false,
          error: false,
        })
        return
      }

      // Preload the image before displaying
      const img = new Image()
      img.onload = () => {
        setBackground({
          url: data.imageUrl,
          loading: false,
          error: false,
        })
      }
      img.onerror = () => {
        setBackground({
          url: null,
          loading: false,
          error: true,
        })
      }
      img.src = data.imageUrl
    } catch (err) {
      console.error('Failed to fetch AI background:', err)
      setBackground({
        url: null,
        loading: false,
        error: true,
      })
    }
  }, [scene, customPrompt])

  useEffect(() => {
    // Check for cached version first
    fetch(`/api/generate-background?scene=${scene}`)
      .then(res => res.json())
      .then(data => {
        if (data.imageUrl) {
          setBackground({
            url: data.imageUrl,
            loading: false,
            error: false,
          })
        } else if (priority) {
          // Generate if not cached and priority
          fetchBackground()
        } else {
          setBackground({
            url: null,
            loading: false,
            error: false,
          })
        }
      })
      .catch(() => {
        setBackground({
          url: null,
          loading: false,
          error: false,
        })
      })
  }, [scene, priority, fetchBackground])

  return (
    <div className={`fixed inset-0 z-0 overflow-hidden ${className}`}>
      {/* AI Generated Background */}
      <AnimatePresence mode="wait">
        {background.url && (
          <motion.div
            key={background.url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${background.url})` }}
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
        )}
      </AnimatePresence>

      {/* CSS Fallback when no AI image */}
      {!background.url && !background.loading && (
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

          <motion.div
            className="absolute top-1/2 right-1/4 w-[350px] h-[350px] rounded-full bg-cheshire-purple/10 blur-3xl"
            animate={{
              x: [0, -60, 30, 0],
              y: [0, 80, -40, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 checkerboard opacity-5" />
        </div>
      )}

      {/* Loading state with shimmer */}
      {background.loading && (
        <div className="absolute inset-0 bg-wonderland-bg">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-alice-purple/10 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      )}

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-wonderland-bg/90 pointer-events-none" />
    </div>
  )
}
