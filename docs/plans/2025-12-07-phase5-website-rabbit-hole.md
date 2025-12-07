# Phase 5: Website - "Down the Rabbit Hole"

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an immersive, whimsical Alice in Wonderland themed website with psychedelic undertones, featuring the "Eat Me" shrink animation entry, playing card transformation gallery, time-shifting ambiance, and seamless social media integration.

**Architecture:** Next.js 14+ with App Router, React Three Fiber for 3D effects, Framer Motion for animations, auto-populating Instagram/Facebook gallery, Tailwind CSS with custom psychedelic design system.

**Tech Stack:** Next.js 14, React 18, React Three Fiber, Framer Motion, TailwindCSS, GSAP, Lenis (smooth scroll), Instagram Basic Display API, Facebook Graph API

---

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing/Entry experience
│   │   ├── wonderland/
│   │   │   ├── layout.tsx              # Main site layout (post-entry)
│   │   │   ├── page.tsx                # Homepage
│   │   │   ├── services/
│   │   │   │   └── page.tsx            # Queen's Spa Services
│   │   │   ├── looking-glass/
│   │   │   │   └── page.tsx            # Consultation tool
│   │   │   ├── why-kimmie/
│   │   │   │   └── page.tsx            # About + certifications
│   │   │   ├── passport/
│   │   │   │   └── page.tsx            # Client pet portal
│   │   │   ├── shelter-angels/
│   │   │   │   └── page.tsx            # 501c3 + donation game
│   │   │   └── education/
│   │   │       └── page.tsx            # Breed care guides
│   │   └── api/
│   │       └── ...
│   ├── components/
│   │   ├── entry/
│   │   │   ├── RabbitHole.tsx          # Entry animation
│   │   │   ├── EatMeCookie.tsx         # Cookie interaction
│   │   │   ├── ShrinkAnimation.tsx     # Shrink effect
│   │   │   └── DoorMouth.tsx           # Keyhole/door entry
│   │   ├── layout/
│   │   │   ├── WonderlandNav.tsx
│   │   │   ├── CheshireChat.tsx        # Chat widget
│   │   │   └── Footer.tsx
│   │   ├── gallery/
│   │   │   ├── PlayingCardGrid.tsx     # Transformation gallery
│   │   │   ├── TransformationCard.tsx
│   │   │   └── SocialFeed.tsx          # Auto-populated feed
│   │   ├── effects/
│   │   │   ├── BreathingBackground.tsx
│   │   │   ├── ColorShift.tsx
│   │   │   ├── ParallaxLayer.tsx
│   │   │   ├── LiquidTransition.tsx
│   │   │   └── TimeAmbiance.tsx        # Day/night shifting
│   │   ├── looking-glass/
│   │   │   └── ...
│   │   └── ui/
│   │       └── ...
│   ├── styles/
│   │   ├── globals.css
│   │   └── psychedelic.css             # Custom effects
│   ├── hooks/
│   │   ├── useTimeOfDay.ts
│   │   ├── useSmoothScroll.ts
│   │   └── useEntryAnimation.ts
│   └── lib/
│       ├── social/
│       │   ├── instagram.ts
│       │   └── facebook.ts
│       └── animations/
│           └── variants.ts
├── public/
│   └── assets/
│       ├── alice/                      # Wonderland assets
│       ├── sounds/                     # Ambient sounds
│       └── textures/                   # Psychedelic textures
├── package.json
└── tailwind.config.ts
```

---

## Task 5.1: Initialize Next.js Web App

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.js`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/src/app/layout.tsx`

**Step 1: Create package.json**

```json
{
  "name": "@looking-glass/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@looking-glass/db": "workspace:*",
    "@looking-glass/shared": "workspace:*",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.114.0",
    "three": "^0.169.0",
    "framer-motion": "^11.11.0",
    "gsap": "^3.12.0",
    "@studio-freight/lenis": "^1.0.42",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "date-fns": "^4.1.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.169.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.0"
  }
}
```

**Step 2: Create tailwind.config.ts**

```typescript
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Alice in Wonderland palette
        alice: {
          blue: '#7EC8E3',
          gold: '#D4AF37',
          pink: '#FFB6C1',
          purple: '#9B59B6',
          teal: '#008080',
        },
        // Psychedelic accents
        psyche: {
          pink: '#FF6B9D',
          purple: '#C471ED',
          blue: '#12C2E9',
          green: '#A8E6CF',
          orange: '#F38181',
        },
        // Cheshire colors
        cheshire: {
          pink: '#FF69B4',
          purple: '#8B008B',
          grin: '#FFD700',
        },
        wonderland: {
          bg: '#0D0D1A',
          card: '#1A1A2E',
          text: '#E8E8F0',
          muted: '#8888AA',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        whimsy: ['var(--font-whimsy)', 'cursive'],
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'color-shift': 'colorShift 10s ease infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'shrink': 'shrink 1.5s ease-in-out forwards',
        'fall': 'fall 2s ease-in forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px var(--glow-color), 0 0 10px var(--glow-color)' },
          '100%': { boxShadow: '0 0 10px var(--glow-color), 0 0 20px var(--glow-color), 0 0 30px var(--glow-color)' },
        },
        colorShift: {
          '0%': { filter: 'hue-rotate(0deg)' },
          '50%': { filter: 'hue-rotate(30deg)' },
          '100%': { filter: 'hue-rotate(0deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shrink: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.1)' },
        },
        fall: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'psychedelic': 'linear-gradient(45deg, var(--psyche-pink), var(--psyche-purple), var(--psyche-blue))',
        'iridescent': 'linear-gradient(135deg, #ff6b9d 0%, #c471ed 25%, #12c2e9 50%, #a8e6cf 75%, #f38181 100%)',
      },
    },
  },
  plugins: [],
}

export default config
```

**Step 3: Create next.config.js**

```javascript
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@looking-glass/db', '@looking-glass/shared', '@looking-glass/ai'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'scontent.cdninstagram.com' },
      { protocol: 'https', hostname: '*.fbcdn.net' },
      { protocol: 'https', hostname: 'fal.media' },
      { protocol: 'https', hostname: '*.fal.ai' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
```

**Step 4: Create src/app/layout.tsx**

```tsx
// apps/web/src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter, Caveat } from 'next/font/google'
import './globals.css'

const displayFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
})

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const whimsyFont = Caveat({
  subsets: ['latin'],
  variable: '--font-whimsy',
})

export const metadata: Metadata = {
  title: 'Through the Looking Glass Groomery | Magical Pet Transformations',
  description: 'An Alice in Wonderland themed pet grooming salon in Nuevo, California. Creative coloring, professional grooming, and magical transformations for dogs, cats, and more.',
  keywords: ['pet grooming', 'Nuevo CA', 'creative pet coloring', 'dog grooming', 'cat grooming', 'Riverside County'],
  openGraph: {
    title: 'Through the Looking Glass Groomery',
    description: 'Where pets become royalty ✨',
    type: 'website',
    locale: 'en_US',
  },
}

export const viewport: Viewport = {
  themeColor: '#0D0D1A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${whimsyFont.variable}`}
    >
      <body className="bg-wonderland-bg text-wonderland-text antialiased">
        {children}
      </body>
    </html>
  )
}
```

**Step 5: Create globals.css**

```css
/* apps/web/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --glow-color: rgba(199, 113, 237, 0.5);
  --psyche-pink: #FF6B9D;
  --psyche-purple: #C471ED;
  --psyche-blue: #12C2E9;
}

@layer base {
  * {
    @apply border-wonderland-muted/20;
  }

  body {
    @apply overflow-x-hidden;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-wonderland-bg;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-cheshire-purple/50 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-cheshire-purple;
  }
}

@layer components {
  /* Iridescent/holographic effect */
  .iridescent {
    background: linear-gradient(
      135deg,
      #ff6b9d 0%,
      #c471ed 25%,
      #12c2e9 50%,
      #a8e6cf 75%,
      #f38181 100%
    );
    background-size: 400% 400%;
    animation: iridescent 5s ease infinite;
  }

  @keyframes iridescent {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  /* Chromatic aberration on hover */
  .chromatic-hover {
    position: relative;
  }

  .chromatic-hover::before,
  .chromatic-hover::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    transition: opacity 0.3s, transform 0.3s;
  }

  .chromatic-hover::before {
    color: #ff0000;
    z-index: -1;
  }

  .chromatic-hover::after {
    color: #00ffff;
    z-index: -2;
  }

  .chromatic-hover:hover::before {
    opacity: 0.5;
    transform: translate(-2px, -1px);
  }

  .chromatic-hover:hover::after {
    opacity: 0.5;
    transform: translate(2px, 1px);
  }

  /* Breathing effect */
  .breathing {
    animation: breathe 4s ease-in-out infinite;
  }

  /* Soft glow */
  .soft-glow {
    box-shadow:
      0 0 20px rgba(199, 113, 237, 0.2),
      0 0 40px rgba(199, 113, 237, 0.1);
  }

  /* Glass effect */
  .glass {
    @apply bg-white/5 backdrop-blur-md border border-white/10;
  }

  /* Liquid button */
  .liquid-btn {
    @apply relative overflow-hidden;
  }

  .liquid-btn::before {
    content: '';
    @apply absolute inset-0 bg-gradient-to-r from-psyche-pink via-psyche-purple to-psyche-blue opacity-0 transition-opacity duration-300;
  }

  .liquid-btn:hover::before {
    @apply opacity-100;
  }
}

@layer utilities {
  /* Text gradient */
  .text-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-psyche-pink via-psyche-purple to-psyche-blue;
  }

  /* Warp effect */
  .warp {
    animation: warp 8s ease-in-out infinite;
  }

  @keyframes warp {
    0%, 100% { transform: skewX(0deg) skewY(0deg); }
    25% { transform: skewX(1deg) skewY(0.5deg); }
    75% { transform: skewX(-1deg) skewY(-0.5deg); }
  }
}
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat(web): initialize Next.js app with psychedelic design system"
```

---

## Task 5.2: Build Entry Experience ("Down the Rabbit Hole")

**Files:**
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/components/entry/RabbitHole.tsx`
- Create: `apps/web/src/components/entry/EatMeCookie.tsx`
- Create: `apps/web/src/components/entry/ShrinkAnimation.tsx`
- Create: `apps/web/src/hooks/useEntryAnimation.ts`

**Step 1: Create hooks/useEntryAnimation.ts**

```typescript
// apps/web/src/hooks/useEntryAnimation.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EntryState {
  hasEnteredWonderland: boolean
  entryStep: 'landing' | 'cookie' | 'shrinking' | 'falling' | 'entered'
  setEntryStep: (step: EntryState['entryStep']) => void
  completeEntry: () => void
  resetEntry: () => void
}

export const useEntryStore = create<EntryState>()(
  persist(
    (set) => ({
      hasEnteredWonderland: false,
      entryStep: 'landing',
      setEntryStep: (step) => set({ entryStep: step }),
      completeEntry: () => set({ hasEnteredWonderland: true, entryStep: 'entered' }),
      resetEntry: () => set({ hasEnteredWonderland: false, entryStep: 'landing' }),
    }),
    {
      name: 'wonderland-entry',
    }
  )
)
```

**Step 2: Create components/entry/EatMeCookie.tsx**

```tsx
// apps/web/src/components/entry/EatMeCookie.tsx
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface EatMeCookieProps {
  onEat: () => void
}

export function EatMeCookie({ onEat }: EatMeCookieProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [biteCount, setBiteCount] = useState(0)

  const handleClick = () => {
    if (biteCount < 2) {
      setBiteCount(prev => prev + 1)
    } else {
      onEat()
    }
  }

  return (
    <motion.div
      className="relative cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Cookie plate */}
      <motion.div
        className="relative w-40 h-40 rounded-full bg-amber-100 shadow-xl flex items-center justify-center"
        animate={{
          boxShadow: isHovered
            ? '0 0 30px rgba(255, 215, 0, 0.5), 0 0 60px rgba(255, 107, 157, 0.3)'
            : '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Cookie with bite marks */}
        <motion.div
          className="relative w-32 h-32 rounded-full bg-gradient-to-br from-amber-300 to-amber-500"
          style={{
            clipPath: biteCount === 0
              ? 'circle(50%)'
              : biteCount === 1
                ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 70%, 20% 50%, 0% 30%)'
                : 'polygon(20% 0%, 100% 0%, 100% 100%, 20% 100%, 0% 70%, 20% 50%, 0% 30%)',
          }}
        >
          {/* "EAT ME" text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-whimsy text-2xl text-amber-800"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}
            >
              {biteCount === 0 ? 'EAT ME' : biteCount === 1 ? 'MORE!' : '...'}
            </span>
          </div>

          {/* Chocolate chips */}
          <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-amber-900" />
          <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-amber-900" />
          <div className="absolute bottom-6 left-10 w-3 h-3 rounded-full bg-amber-900" />
          <div className="absolute bottom-4 right-6 w-2 h-2 rounded-full bg-amber-900" />
        </motion.div>
      </motion.div>

      {/* Sparkles on hover */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Hint text */}
      <motion.p
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-wonderland-muted font-whimsy whitespace-nowrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
      >
        {biteCount === 0 ? 'Click to take a bite~' : biteCount === 1 ? 'One more bite!' : 'Down we go...'}
      </motion.p>
    </motion.div>
  )
}
```

**Step 3: Create components/entry/ShrinkAnimation.tsx**

```tsx
// apps/web/src/components/entry/ShrinkAnimation.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ShrinkAnimationProps {
  onComplete: () => void
}

export function ShrinkAnimation({ onComplete }: ShrinkAnimationProps) {
  const [phase, setPhase] = useState<'shrink' | 'fall' | 'door'>('shrink')

  useEffect(() => {
    const shrinkTimer = setTimeout(() => setPhase('fall'), 1500)
    const fallTimer = setTimeout(() => setPhase('door'), 3000)
    const completeTimer = setTimeout(() => onComplete(), 4500)

    return () => {
      clearTimeout(shrinkTimer)
      clearTimeout(fallTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-wonderland-bg">
      <AnimatePresence mode="wait">
        {phase === 'shrink' && (
          <motion.div
            key="shrink"
            className="absolute inset-0 flex items-center justify-center"
            exit={{ scale: 0.1, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          >
            {/* The viewer is Alice shrinking */}
            <motion.div
              className="text-center"
              animate={{ scale: [1, 0.5, 0.1] }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            >
              <motion.p
                className="text-4xl font-whimsy text-wonderland-text"
                animate={{ opacity: [1, 0.5, 0] }}
              >
                Oh my! I'm shrinking!
              </motion.p>
            </motion.div>

            {/* Room getting bigger around us */}
            <motion.div
              className="absolute inset-0 border-8 border-cheshire-purple/30 rounded-3xl"
              animate={{ scale: [1, 3, 10] }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </motion.div>
        )}

        {phase === 'fall' && (
          <motion.div
            key="fall"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Falling through the rabbit hole */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Swirling tunnel effect */}
              <motion.div
                className="w-[200vmax] h-[200vmax] rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, #FF6B9D, #C471ED, #12C2E9, #A8E6CF, #FF6B9D)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
              />

              {/* Floating objects */}
              {['🕰️', '🫖', '🃏', '🎩', '🐇', '🍄', '🔑', '👑'].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="absolute text-4xl"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -100, -200],
                    rotate: [0, 360, 720],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.15,
                    ease: 'easeOut',
                  }}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>

            <motion.p
              className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-2xl font-whimsy text-white z-10"
              animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5 }}
            >
              Down, down, down...
            </motion.p>
          </motion.div>
        )}

        {phase === 'door' && (
          <motion.div
            key="door"
            className="absolute inset-0 flex items-center justify-center bg-wonderland-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* The tiny door */}
            <motion.div
              className="relative"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Door frame */}
              <div className="w-32 h-48 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-full relative overflow-hidden">
                {/* Door handle */}
                <div className="absolute right-4 top-1/2 w-4 h-4 rounded-full bg-yellow-500 shadow-lg" />

                {/* Keyhole */}
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  animate={{ scale: [1, 50] }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeIn' }}
                >
                  <div className="w-4 h-6 bg-wonderland-bg rounded-full relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-4 bg-wonderland-bg" />
                  </div>
                </motion.div>
              </div>

              <motion.p
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xl font-whimsy text-cheshire-pink whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1 }}
              >
                Through the keyhole...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 4: Create components/entry/RabbitHole.tsx**

```tsx
// apps/web/src/components/entry/RabbitHole.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEntryStore } from '@/hooks/useEntryAnimation'
import { EatMeCookie } from './EatMeCookie'
import { ShrinkAnimation } from './ShrinkAnimation'
import { useRouter } from 'next/navigation'

export function RabbitHole() {
  const { entryStep, setEntryStep, completeEntry, hasEnteredWonderland } = useEntryStore()
  const router = useRouter()

  const handleCookieEaten = () => {
    setEntryStep('shrinking')
  }

  const handleAnimationComplete = () => {
    completeEntry()
    router.push('/wonderland')
  }

  // Skip button for returning visitors
  const handleSkip = () => {
    completeEntry()
    router.push('/wonderland')
  }

  if (hasEnteredWonderland) {
    router.push('/wonderland')
    return null
  }

  return (
    <div className="min-h-screen bg-wonderland-bg relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial from-cheshire-purple/20 via-transparent to-transparent" />
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url(/assets/textures/stars.png)',
            backgroundSize: 'cover',
          }}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <AnimatePresence mode="wait">
        {entryStep === 'landing' && (
          <motion.div
            key="landing"
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Title */}
            <motion.h1
              className="text-5xl md:text-7xl font-display text-center mb-4 text-gradient"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Through the Looking Glass
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl font-whimsy text-wonderland-muted mb-12 text-center"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Groomery & Pet Spa
            </motion.p>

            {/* The tiny door - Alice is too big */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
            >
              <div className="w-20 h-32 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-full shadow-2xl">
                <div className="absolute right-3 top-1/2 w-2 h-2 rounded-full bg-yellow-500" />
              </div>
              <p className="text-sm text-wonderland-muted mt-2 font-whimsy text-center">
                Oh dear, I'm much too big...
              </p>
            </motion.div>

            {/* Eat Me cookie */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8"
            >
              <EatMeCookie onEat={handleCookieEaten} />
            </motion.div>

            {/* Skip button */}
            <motion.button
              className="absolute bottom-8 right-8 text-sm text-wonderland-muted/50 hover:text-wonderland-muted transition-colors"
              onClick={handleSkip}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              Skip intro →
            </motion.button>
          </motion.div>
        )}

        {(entryStep === 'shrinking' || entryStep === 'falling') && (
          <ShrinkAnimation onComplete={handleAnimationComplete} />
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 5: Create app/page.tsx**

```tsx
// apps/web/src/app/page.tsx
import { RabbitHole } from '@/components/entry/RabbitHole'

export default function EntryPage() {
  return <RabbitHole />
}
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat(web): add immersive rabbit hole entry experience"
```

---

## Task 5.3: Build Wonderland Layout & Homepage

**Files:**
- Create: `apps/web/src/app/wonderland/layout.tsx`
- Create: `apps/web/src/app/wonderland/page.tsx`
- Create: `apps/web/src/components/layout/WonderlandNav.tsx`
- Create: `apps/web/src/components/effects/TimeAmbiance.tsx`
- Create: `apps/web/src/components/effects/BreathingBackground.tsx`

**Step 1: Create components/effects/TimeAmbiance.tsx**

```tsx
// apps/web/src/components/effects/TimeAmbiance.tsx
'use client'

import { useEffect, useState } from 'react'

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

const AMBIANCE_COLORS: Record<TimeOfDay, { primary: string; secondary: string; accent: string }> = {
  morning: {
    primary: 'from-amber-100/10 via-pink-100/5',
    secondary: 'rgba(255, 223, 186, 0.1)',
    accent: '#FFD700',
  },
  afternoon: {
    primary: 'from-blue-100/10 via-cyan-100/5',
    secondary: 'rgba(135, 206, 235, 0.1)',
    accent: '#87CEEB',
  },
  evening: {
    primary: 'from-orange-200/10 via-pink-200/5',
    secondary: 'rgba(255, 127, 80, 0.1)',
    accent: '#FF7F50',
  },
  night: {
    primary: 'from-purple-900/20 via-indigo-900/10',
    secondary: 'rgba(75, 0, 130, 0.15)',
    accent: '#9B59B6',
  },
}

export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('afternoon')

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) setTimeOfDay('morning')
      else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon')
      else if (hour >= 17 && hour < 21) setTimeOfDay('evening')
      else setTimeOfDay('night')
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return timeOfDay
}

export function TimeAmbiance() {
  const timeOfDay = useTimeOfDay()
  const colors = AMBIANCE_COLORS[timeOfDay]

  return (
    <>
      {/* Gradient overlay */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 bg-gradient-to-b ${colors.primary} to-transparent transition-colors duration-[5000ms]`}
      />

      {/* Accent glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[100px] pointer-events-none z-0 transition-colors duration-[5000ms]"
        style={{ backgroundColor: colors.secondary }}
      />

      {/* Time indicator (subtle) */}
      <div className="fixed bottom-4 left-4 text-xs text-wonderland-muted/30 pointer-events-none z-50 font-whimsy">
        {timeOfDay === 'morning' && '🌅 Tea time approaches...'}
        {timeOfDay === 'afternoon' && '☀️ The garden is lovely today'}
        {timeOfDay === 'evening' && '🌆 The Cheshire Cat awakens...'}
        {timeOfDay === 'night' && '🌙 Curiouser and curiouser...'}
      </div>
    </>
  )
}
```

**Step 2: Create components/effects/BreathingBackground.tsx**

```tsx
// apps/web/src/components/effects/BreathingBackground.tsx
'use client'

import { motion } from 'framer-motion'

export function BreathingBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Primary breathing blob */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-psyche-purple/10 blur-[100px]"
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 20, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary breathing blob */}
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-psyche-pink/10 blur-[100px]"
        animate={{
          scale: [1, 1.15, 1],
          x: [0, -30, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* Tertiary blob */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-psyche-blue/5 blur-[80px]"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'url(/assets/textures/noise.png)',
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  )
}
```

**Step 3: Create components/layout/WonderlandNav.tsx**

```tsx
// apps/web/src/components/layout/WonderlandNav.tsx
'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/wonderland', label: 'Home', icon: '🏰' },
  { href: '/wonderland/services', label: "Queen's Spa", icon: '👑' },
  { href: '/wonderland/looking-glass', label: 'Looking Glass', icon: '🪞' },
  { href: '/wonderland/why-kimmie', label: 'Why Kimmie', icon: '✨' },
  { href: '/wonderland/passport', label: 'Pet Passport', icon: '📖' },
  { href: '/wonderland/shelter-angels', label: 'Shelter Angels', icon: '😇' },
  { href: '/wonderland/education', label: 'Learn', icon: '📚' },
]

export function WonderlandNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Glass background */}
      <div className="absolute inset-0 glass" />

      <div className="relative max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/wonderland" className="flex items-center gap-3">
          <motion.span
            className="text-2xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🐱
          </motion.span>
          <span className="font-display text-xl text-gradient">
            Through the Looking Glass
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative group px-3 py-2 transition-colors ${
                pathname === item.href
                  ? 'text-cheshire-pink'
                  : 'text-wonderland-text hover:text-cheshire-pink'
              }`}
            >
              <span className="font-body text-sm">{item.label}</span>
              {pathname === item.href && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-psyche-pink to-psyche-purple"
                  layoutId="nav-indicator"
                />
              )}
            </Link>
          ))}

          {/* Book Now CTA */}
          <Link
            href="/wonderland/looking-glass"
            className="liquid-btn px-6 py-2 rounded-full bg-gradient-to-r from-psyche-pink to-psyche-purple text-white font-body text-sm hover:shadow-lg hover:shadow-psyche-purple/25 transition-shadow"
          >
            Book Now ✨
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden text-2xl"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="lg:hidden absolute top-full left-0 right-0 glass"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="px-4 py-6 space-y-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl transition-colors ${
                    pathname === item.href
                      ? 'bg-cheshire-purple/20 text-cheshire-pink'
                      : 'text-wonderland-text hover:bg-white/5'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
```

**Step 4: Create app/wonderland/layout.tsx**

```tsx
// apps/web/src/app/wonderland/layout.tsx
import { WonderlandNav } from '@/components/layout/WonderlandNav'
import { TimeAmbiance } from '@/components/effects/TimeAmbiance'
import { BreathingBackground } from '@/components/effects/BreathingBackground'
import { CheshireChat } from '@/components/layout/CheshireChat'

export default function WonderlandLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen relative">
      <BreathingBackground />
      <TimeAmbiance />
      <WonderlandNav />

      <main className="relative z-10 pt-20">
        {children}
      </main>

      <CheshireChat />
    </div>
  )
}
```

**Step 5: Create app/wonderland/page.tsx (Homepage)**

```tsx
// apps/web/src/app/wonderland/page.tsx
import { Suspense } from 'react'
import { PlayingCardGrid } from '@/components/gallery/PlayingCardGrid'
import { HeroSection } from '@/components/home/HeroSection'
import { ServicesPreview } from '@/components/home/ServicesPreview'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'

export default function WonderlandHomePage() {
  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <HeroSection />

      {/* Transformation Gallery */}
      <section className="px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-display text-center mb-4 text-gradient">
            Royal Transformations
          </h2>
          <p className="text-center text-wonderland-muted mb-12 font-whimsy">
            Every pet leaves feeling like royalty~ 👑
          </p>
          <Suspense fallback={<div className="h-96 animate-pulse bg-wonderland-card rounded-3xl" />}>
            <PlayingCardGrid />
          </Suspense>
        </div>
      </section>

      {/* Services Preview */}
      <ServicesPreview />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="px-4">
        <div className="max-w-4xl mx-auto text-center glass rounded-3xl p-12">
          <h2 className="text-3xl font-display mb-4">
            Ready to Fall Down the Rabbit Hole?
          </h2>
          <p className="text-wonderland-muted mb-8 font-whimsy">
            Book your pet's magical transformation today~
          </p>
          <a
            href="/wonderland/looking-glass"
            className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-psyche-pink to-psyche-purple text-white font-body hover:shadow-xl hover:shadow-psyche-purple/25 transition-all hover:scale-105"
          >
            Begin Your Journey ✨
          </a>
        </div>
      </section>
    </div>
  )
}
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat(web): add Wonderland layout with time ambiance and breathing effects"
```

---

## Task 5.4: Build Playing Card Gallery

**Files:**
- Create: `apps/web/src/components/gallery/PlayingCardGrid.tsx`
- Create: `apps/web/src/components/gallery/TransformationCard.tsx`
- Create: `apps/web/src/lib/social/instagram.ts`

**Step 1: Create lib/social/instagram.ts**

```typescript
// apps/web/src/lib/social/instagram.ts

interface InstagramPost {
  id: string
  caption?: string
  mediaUrl: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  permalink: string
  timestamp: string
}

export async function fetchInstagramFeed(limit = 12): Promise<InstagramPost[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

  if (!accessToken) {
    console.warn('Instagram access token not configured')
    return []
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_url,media_type,permalink,timestamp&limit=${limit}&access_token=${accessToken}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data.map((post: any) => ({
      id: post.id,
      caption: post.caption,
      mediaUrl: post.media_url,
      mediaType: post.media_type,
      permalink: post.permalink,
      timestamp: post.timestamp,
    }))
  } catch (error) {
    console.error('Failed to fetch Instagram feed:', error)
    return []
  }
}

// Fallback demo posts for development
export const DEMO_POSTS: InstagramPost[] = [
  {
    id: '1',
    caption: 'Before and after magic! ✨ #DogGrooming #Transformation',
    mediaUrl: '/assets/demo/transform-1.jpg',
    mediaType: 'IMAGE',
    permalink: '#',
    timestamp: new Date().toISOString(),
  },
  // Add more demo posts...
]
```

**Step 2: Create components/gallery/TransformationCard.tsx**

```tsx
// apps/web/src/components/gallery/TransformationCard.tsx
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'

interface TransformationCardProps {
  id: string
  imageUrl: string
  caption?: string
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  index: number
}

const SUIT_COLORS = {
  hearts: 'from-red-500 to-pink-500',
  diamonds: 'from-red-400 to-orange-400',
  clubs: 'from-gray-700 to-gray-900',
  spades: 'from-gray-800 to-black',
}

const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

export function TransformationCard({
  id,
  imageUrl,
  caption,
  suit,
  index,
}: TransformationCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <motion.div
      className="relative aspect-[3/4] cursor-pointer perspective-1000"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => setIsFlipped(!isFlipped)}
      whileHover={{ scale: 1.05, rotateY: 5 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Card Back (Before) - shown initially */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden bg-wonderland-card border-2 border-white/10"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Card design */}
          <div className={`absolute inset-0 bg-gradient-to-br ${SUIT_COLORS[suit]} opacity-10`} />

          {/* Suit symbols */}
          <span className="absolute top-3 left-3 text-2xl opacity-50">
            {SUIT_SYMBOLS[suit]}
          </span>
          <span className="absolute bottom-3 right-3 text-2xl opacity-50 rotate-180">
            {SUIT_SYMBOLS[suit]}
          </span>

          {/* Center suit */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl opacity-20">{SUIT_SYMBOLS[suit]}</span>
          </div>

          {/* "Before" text */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-sm font-whimsy text-white/80">Click to reveal~ ✨</p>
          </div>

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          />
        </div>

        {/* Card Front (After) - shown when flipped */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <Image
            src={imageUrl}
            alt={caption || 'Pet transformation'}
            fill
            className="object-cover"
          />

          {/* Caption overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-sm text-white line-clamp-2">{caption || 'Magical transformation! ✨'}</p>
          </div>

          {/* Corner suits */}
          <span className={`absolute top-3 left-3 text-xl ${suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-white'}`}>
            {SUIT_SYMBOLS[suit]}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
```

**Step 3: Create components/gallery/PlayingCardGrid.tsx**

```tsx
// apps/web/src/components/gallery/PlayingCardGrid.tsx
import { fetchInstagramFeed, DEMO_POSTS } from '@/lib/social/instagram'
import { TransformationCard } from './TransformationCard'

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const

export async function PlayingCardGrid() {
  const posts = await fetchInstagramFeed(12)
  const displayPosts = posts.length > 0 ? posts : DEMO_POSTS

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {displayPosts.map((post, index) => (
        <TransformationCard
          key={post.id}
          id={post.id}
          imageUrl={post.mediaUrl}
          caption={post.caption}
          suit={SUITS[index % 4]}
          index={index}
        />
      ))}
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat(web): add playing card transformation gallery with Instagram integration"
```

---

## Execution Checklist - Phase 5

- [ ] Task 5.1: Initialize Next.js web app
- [ ] Task 5.2: Build entry experience ("Down the Rabbit Hole")
- [ ] Task 5.3: Build Wonderland layout & homepage
- [ ] Task 5.4: Build playing card gallery
- [ ] Task 5.5: Build Cheshire Chat widget (see extended tasks)
- [ ] Task 5.6: Build services page (see extended tasks)
- [ ] Task 5.7: Build Why Kimmie page (see extended tasks)
- [ ] Task 5.8: Build Pet Passport portal (see extended tasks)
