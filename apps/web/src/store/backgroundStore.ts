// apps/web/src/store/backgroundStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WonderlandScene = 'entry' | 'garden' | 'teaParty' | 'cheshire' | 'lookingGlass' | 'shelter'

interface BackgroundImage {
  url: string
  timestamp: number
}

interface BackgroundState {
  // Cached AI-generated backgrounds
  backgrounds: Partial<Record<WonderlandScene, BackgroundImage>>

  // Actions
  setBackground: (scene: WonderlandScene, url: string) => void
  getBackground: (scene: WonderlandScene) => string | null
  preloadScene: (scene: WonderlandScene) => Promise<string | null>
  clearCache: () => void
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      backgrounds: {},

      setBackground: (scene, url) => {
        set(state => ({
          backgrounds: {
            ...state.backgrounds,
            [scene]: {
              url,
              timestamp: Date.now(),
            },
          },
        }))
      },

      getBackground: scene => {
        const cached = get().backgrounds[scene]
        if (!cached) return null

        // Check if cache is still valid
        if (Date.now() - cached.timestamp > CACHE_DURATION) {
          // Remove expired cache
          set(state => {
            const newBackgrounds = { ...state.backgrounds }
            delete newBackgrounds[scene]
            return { backgrounds: newBackgrounds }
          })
          return null
        }

        return cached.url
      },

      preloadScene: async scene => {
        // Check cache first
        const cached = get().getBackground(scene)
        if (cached) return cached

        try {
          const response = await fetch('/api/generate-background', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scene }),
          })

          const data = await response.json()

          if (data.imageUrl) {
            get().setBackground(scene, data.imageUrl)
            return data.imageUrl
          }

          return null
        } catch (err) {
          console.error('Failed to preload background:', err)
          return null
        }
      },

      clearCache: () => {
        set({ backgrounds: {} })
      },
    }),
    {
      name: 'wonderland-backgrounds',
      partialize: state => ({ backgrounds: state.backgrounds }),
    }
  )
)

// Utility to preload multiple scenes
export async function preloadAllScenes() {
  const scenes: WonderlandScene[] = ['entry', 'garden', 'teaParty', 'cheshire', 'lookingGlass', 'shelter']
  const store = useBackgroundStore.getState()

  // Preload in parallel with some delay to avoid hammering the API
  const results = await Promise.allSettled(
    scenes.map((scene, i) =>
      new Promise<string | null>(resolve => {
        setTimeout(async () => {
          const result = await store.preloadScene(scene)
          resolve(result)
        }, i * 2000) // 2 second delay between requests
      })
    )
  )

  return results
}
