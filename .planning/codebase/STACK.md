# Technology Stack

**Analysis Date:** 2026-01-25

## Languages

**Primary:**
- TypeScript 5.6.0 - All source code across web, API, and bot
- JavaScript - Configuration files and build tooling
- SQL - Prisma schema definitions for PostgreSQL

**Secondary:**
- HTML/CSS - Next.js components, Tailwind utilities

## Runtime

**Environment:**
- Node.js ≥18.0.0 - Web app and Telegram bot
- Bun - Cheshire API runtime (experimental, chosen for speed)

**Package Manager:**
- npm 10.8.2 - Monorepo and workspace management
- Lockfile: Present (package-lock.json)

## Frameworks

**Core:**
- Next.js 14.2.0 - Customer website (App Router, `apps/web`)
- Hono 4.6.0 - Lightweight API framework for Cheshire AI service (`apps/cheshire`)
- Grammy 1.30.0 - Telegram bot framework (`apps/telegram-bot`)

**Styling & UI:**
- Tailwind CSS 3.4.14 - Utility-first CSS framework (`apps/web`)
- Framer Motion 11.11.0 - React animations
- GSAP 3.12.0 - Advanced animations
- Three.js 0.169.0 - 3D graphics rendering
- @react-three/fiber 8.17.0 - React renderer for Three.js
- @react-three/drei 9.114.0 - Reusable Three.js components

**Testing & Build:**
- Turbo 2.3.0 - Monorepo build orchestration
- Prisma 5.22.0 - ORM and database migrations
- tsx 4.19.0 - TypeScript execution for CLI tools

**State Management:**
- Zustand 5.0.0 - React state management (lightweight alternative to Redux)

## Key Dependencies

**Critical:**
- @prisma/client 5.22.0 - PostgreSQL ORM client for all database access
- Zod 3.23.0 - Runtime schema validation and TypeScript type inference
- date-fns 4.1.0 - Date manipulation utilities (consistent across all apps)
- dotenv 17.2.3 - Environment variable loading

**AI & LLM:**
- @anthropic-ai/sdk 0.32.0 - Claude API client (primary LLM)
- openai 4.72.0 - OpenAI GPT API client (fallback LLM)
- @fal-ai/client 1.2.0 - FAL.ai for image generation (pet style previews)

**API & Validation:**
- @hono/zod-validator 0.4.0 - Hono middleware for Zod request validation
- dompurify 3.3.1 - HTML sanitization for security

**AWS Integration:**
- @aws-sdk/client-s3 3.966.0 - S3 file uploads (Telegram bot)

**Google Integration:**
- @google/generative-ai 0.24.1 - Google Gemini API (web app)

**Utilities:**
- clsx 2.1.0 - Conditional CSS class composition
- tailwind-merge 2.5.0 - Merge Tailwind class conflicts
- @studio-freight/lenis 1.0.42 - Smooth scrolling engine
- node-cron 4.2.1 - Scheduled job execution

## Configuration

**Environment:**
- Configuration via `.env` file (root level, shared across all apps)
- Critical vars: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `FAL_AI_KEY`, `TELEGRAM_BOT_TOKEN`, `FACEBOOK_PAGE_ACCESS_TOKEN`
- See `.env.example` for complete list

**Build Configuration:**
- `packages/db/prisma/schema.prisma` - Database schema
- `apps/web/next.config.js` - Next.js build and image optimization
- `apps/web/tsconfig.json` - TypeScript compiler options with path alias `@/*`
- `apps/web/tailwind.config.ts` - Tailwind CSS customization
- `apps/web/postcss.config.js` - PostCSS plugins
- `apps/cheshire/tsconfig.json` - Cheshire TypeScript config
- `apps/telegram-bot/tsconfig.json` - Telegram bot TypeScript config

## Platform Requirements

**Development:**
- Node.js ≥18.0.0
- PostgreSQL database (local or remote)
- Bun runtime optional (for Cheshire development, can fallback to Node)
- Environment variables: Database URL, API keys for all external services

**Production:**
- Bun runtime for Cheshire API (port 3001)
- Node.js for Next.js web app (port 3002)
- Node.js for Telegram bot service
- PostgreSQL database connection
- Cloudflare tunnel for public domain routing

## Workspace Structure

Monorepo configured with npm workspaces:

```
looking-glass-groomery/
├── apps/
│   ├── web/              # Next.js 14 customer website
│   ├── cheshire/         # Hono + Bun API server
│   └── telegram-bot/     # Grammy Telegram bot
├── packages/
│   ├── ai/               # Shared AI service integrations
│   ├── db/               # Prisma schema & client
│   └── shared/           # Zod schemas & constants
```

All packages use TypeScript with strict mode enabled. Imports use workspace aliases: `@looking-glass/{ai,db,shared}`

---

*Stack analysis: 2026-01-25*
