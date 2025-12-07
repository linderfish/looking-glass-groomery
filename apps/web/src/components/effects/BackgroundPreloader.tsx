// apps/web/src/components/effects/BackgroundPreloader.tsx
'use client'

import { useEffect } from 'react'
import { useBackgroundStore, WonderlandScene } from '@/store/backgroundStore'

interface BackgroundPreloaderProps {
  scenes?: WonderlandScene[]
  priority?: boolean
}

/**
 * Preloads AI-generated backgrounds in the background.
 * Place this in your root layout to start preloading as soon as possible.
 */
export function BackgroundPreloader({
  scenes = ['entry', 'garden', 'teaParty'],
  priority = false,
}: BackgroundPreloaderProps) {
  const preloadScene = useBackgroundStore(state => state.preloadScene)
  const getBackground = useBackgroundStore(state => state.getBackground)

  useEffect(() => {
    // Don't preload on slow connections
    if (!priority && 'connection' in navigator) {
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
      if (conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') {
        return
      }
    }

    // Preload scenes that aren't already cached
    const scenesToPreload = scenes.filter(scene => !getBackground(scene))

    if (scenesToPreload.length === 0) return

    // Preload with staggered timing
    scenesToPreload.forEach((scene, index) => {
      const delay = priority ? index * 500 : index * 3000 + 2000 // Wait 2s before starting non-priority

      setTimeout(() => {
        preloadScene(scene)
      }, delay)
    })
  }, [scenes, priority, preloadScene, getBackground])

  // This component doesn't render anything
  return null
}
