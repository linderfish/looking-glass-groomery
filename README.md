# 🪞 Through the Looking Glass Groomery

> Where every pet becomes a work of art ✨

An Alice in Wonderland themed pet grooming platform for Kimmie in Nuevo, CA. Features AI-powered consultations, a whimsical website, and personalized business management.

## 🏗️ Architecture

```
looking-glass-groomery/
├── apps/
│   ├── web/              # Next.js website (Wonderland)
│   ├── telegram-bot/     # Kimmie's personal assistant
│   └── cheshire/         # AI concierge service (Hono/Bun)
├── packages/
│   ├── ai/               # AI integrations (fal.ai, Claude, OpenAI)
│   ├── db/               # Prisma database schema
│   └── shared/           # Shared types and constants
```

## ✨ Features

### 🌐 Website ("Down the Rabbit Hole")
- "Eat Me" cookie entry animation
- Alice in Wonderland themed design
- Cheshire Cat chat widget
- Social media gallery integration

### 🪞 Looking Glass Consultation
- AI-powered style preview generation
- Multi-angle pet transformation previews (5 views)
- Detailed grooming blueprints for Kimmie
- Pet-safe color recommendations

### 😼 Cheshire Cat AI
- Adaptive personality (playful/efficient/warm)
- Multi-channel support (Website, Instagram DM, Facebook Messenger)
- Intent detection and conversational booking
- Automatic escalation to Kimmie

### 📱 Telegram Bot (Kimmie's Assistant)
- Booking notifications with inline actions
- Before/after photo reminders
- Achievement system and gamification
- Easter eggs (Pokemon, Grey's Anatomy, etc.)

### 😇 Shelter Angels (501c3)
- Donation-powered shelter pet grooming
- Interactive donation game
- Impact tracking and certificates

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL
- Bun (for Cheshire service)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/looking-glass-groomery.git
cd looking-glass-groomery

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# AI Services
FAL_AI_KEY="..."
ANTHROPIC_API_KEY="..."
OPENAI_API_KEY="..."

# Telegram
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_KIMMIE_CHAT_ID="..."

# Social Media
INSTAGRAM_ACCESS_TOKEN="..."
INSTAGRAM_VERIFY_TOKEN="..."
FACEBOOK_PAGE_ACCESS_TOKEN="..."
FACEBOOK_VERIFY_TOKEN="..."
```

## 🎨 Design System

### Colors
- **Alice Palette**: Blue, Gold, Pink, Purple, Teal
- **Psychedelic Accents**: Pink, Purple, Blue, Green, Orange
- **Cheshire Colors**: Pink, Purple, Gold (grin)

### Animations
- Breathing backgrounds
- Floating elements
- Shimmer effects
- Color shifting

## 📦 Deployment

### Vercel (Website)
```bash
vercel --prod
```

### Railway/Fly.io (Cheshire API & Telegram Bot)
Services can be deployed independently to any platform supporting Node.js/Bun.

## 🤝 Contributing

This is a private business project, but feel free to fork for your own grooming business!

## 📄 License

Private - All rights reserved

---

Built with 💜 by Kimmie and her AI assistant

*"We're all mad here~ 😼"*
