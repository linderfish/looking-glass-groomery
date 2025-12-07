# Through the Looking Glass Groomery - Design Document

> **Created:** 2025-12-07
> **Status:** Validated and approved

---

## Executive Summary

A ground-up custom build replacing MoGo for "Through the Looking Glass Groomery" - an Alice in Wonderland themed pet grooming business in Nuevo, CA. This project creates an immersive web experience, AI-powered consultation system, automated booking, 501(c)(3) nonprofit arm, and gamified donation platform.

**Key Innovation:** The "Looking Glass Consultation System" - an AI-powered 3D visual consultation tool that solves the industry-wide problem of miscommunication between pet owners and groomers.

---

## Business Model & Structure

### Two Entities

1. **For-Profit Business** - Through the Looking Glass Groomery
   - Grooming services (dogs, cats, goats, pigs, guinea pigs)
   - Membership subscriptions (future scaling)
   - Consultation deposits
   - Education content

2. **501(c)(3) Nonprofit** - Through the Looking Glass Rescue
   - Shelter pet makeovers
   - Community outreach & education
   - Donation-funded operations

### Revenue Streams

- Per-service grooming
- Membership subscriptions ("Curious", "Curiouser", "Royalty" tiers - future)
- Consultation deposits (non-members)
- 501(c)(3) donations (shelter makeover sponsorships, arcade game)
- Future: Grants, corporate sponsors, merchandise

### Target Market

- Nuevo, CA and surrounding Riverside County
- Home-owning families (suburban-rural mix)
- Pet parents wanting more than basic grooming
- Creative/expressive pet owners
- Owners of anxious, aggressive, or special-needs pets
- Service animal owners needing expeditious service

### Competitive Positioning

- Certified creative artist AND behavioral specialist
- Handles cases others refuse (aggressive, fearful, nursing moms)
- Alice in Wonderland brand = memorable, shareable
- Mission-driven (shelter work) = community goodwill + PR engine

---

## Services & Certifications

### Animals Served

- Dogs (all sizes, all temperaments)
- Cats (creative color, grooming, bath/ears/nails/tail)
- Goats (creative color)
- Pigs (creative color)
- Guinea pigs (creative color)
- NO birds

### Creative Services

- Creative coloring & patterns
- Coat carving
- Extensions & clip-ins
- Feathers
- Glitter (coat and balls)
- Jewels/bedazzling
- Political designs (candidates, red/white/blue)
- Holiday packages

### Certifications (Marketing Differentiators)

| Certification | What It Means |
|---------------|---------------|
| Force-Free & Fear-Free | No intimidation, stress-minimized handling |
| Breed Standard Cuts | Show-quality precision |
| Dangerous/Aggressive Dogs | Handles what others refuse |
| Anxious/Nervous/Fearful | Gentle approach, patience |
| Nursing Moms & Puppies | Delicate, specialized care |
| Service Animals | Fast, expeditious, owner can wait |
| Creative Grooming | Certified color artist |
| Basic Safety | Foundation certification |

**Display Strategy:** Dedicated "Why Kimmie" page + contextual badges in booking flow

---

## Technical Architecture

### Core Stack

- **Frontend:** Custom immersive website (React/Next.js or Astro) with WebGL animations
- **Backend:** Database-first booking system (PostgreSQL)
- **Automation:** n8n workflows
- **CRM:** Twenty CRM (extended for pet/client profiles)
- **AI Layer:** LLM + fal.ai (Nano Banana Pro) for Cheshire Cat, Looking Glass, content
- **Comms Hub:** Telegram (Kimmie's command center)
- **Payments:** Stripe (bookings, deposits, donations)
- **Social:** Auto-posting pipeline to Instagram, Facebook, TikTok

### Data Flow

```
[Client Touchpoints]          [Kimmie's Hub]         [Systems]

Website Chat ───┐
Instagram DM ───┼──→ Cheshire Cat AI ──→ Telegram ──→ Booking DB
Facebook Msg ───┤         ↓                              ↓
Quick-Capture ──┘    Draft Booking              Google Calendar
                          ↓                            ↓
                   Kimmie Confirms ──────────→ Client Notified
```

---

## The Looking Glass Consultation System

### The Problem

- Current industry: 2D paper cutouts + gel pens = miscommunication
- "I wanted spots, not rings" / "That's too short"
- Can't show 3D intent (tapered legs, asymmetric designs, patterns)

### The Solution

**For Pet Owners:**
1. Upload photo of pet (or select breed outline as fallback)
2. Chat with Cheshire Cat: describe desired style, colors, patterns
3. AI generates multi-angle preview on their actual pet:
   - Front view, Left side, Right side, Back view, Top-down
4. Interactive iteration: "More purple" / "Shorter on legs" / "Add spots not rings"
5. Realistic verification render
6. Approved design locked in with appointment

**For Kimmie (The Blueprint):**
- Approved preview image (all angles)
- Written breakdown:
  - Clipper guard lengths by body area
  - Dye colors/brands needed
  - Pattern instructions (spots vs rings vs gradient vs taper)
  - Asymmetric notes (left ≠ right if requested)
- Reference photos of similar styles
- Client notes & special requests

### Access Control (Hybrid Model)

- Subscribers ("Curious"+): Unlimited access
- Non-subscribers: Deposit required ($25-50, applied to appointment)
- Prevents tire-kickers, values Kimmie's time

### Passport Integration

- Every approved design saved to pet's profile
- "Repeat last style" one-click
- Full style history with dates + before/after photos

---

## Website Experience ("Down the Rabbit Hole")

### Design Aesthetic

- **Whimsical & immersive** Alice in Wonderland theme
- **Subtle psychedelic** undertones:
  - Breathing animations (elements pulse/expand)
  - Color shifts (gradients morph through spectrum)
  - Parallax depth
  - Soft warping edges
  - Iridescent/holographic accents
  - Sacred geometry in backgrounds
  - Chromatic aberration on hover
  - Bloom/glow effects
  - Liquid transitions
  - Hidden "Drink Me" mode easter egg

### Entry Sequence

1. Landing: Visitor is "Alice" - too big for the tiny door
2. "Eat Me" cookie interaction (click/tap)
3. Shrink animation → fall through keyhole/door mouth
4. Land in Wonderland (the actual site)

### Inside Experience

- Scroll-triggered transformations
- Time-of-day ambiance shifts
- Playing card grid gallery (cards flip for before/after)
- Instagram/Facebook auto-populates

### Key Pages

| Page | Purpose |
|------|---------|
| Homepage | Immersive entry, transformation gallery, quick booking CTA |
| Services ("Queen's Spa") | Full menu with contextual certification badges |
| Looking Glass | Consultation tool (gated) |
| Why Kimmie | Story, certifications, philosophy |
| Pet Passport | Client login → pet profiles, history, designs |
| Shelter Angels (501c3) | Donation game, available pets, impact stories |
| Education | Breed care guides, tips, videos |

### Performance

- Full commitment to experience
- Graceful degradation (no special browsers required)
- Fast initial load → progressive enhancement

---

## Cheshire Cat AI Concierge

### Personality

**Adaptive:**
- Playful/mischievous with engaged users
- Straightforward with "just book me" types
- Reads the room, adjusts tone

### Autonomous Capabilities

| Task | Handles Without Kimmie |
|------|------------------------|
| Answer FAQs | ✅ |
| Book appointments directly | ✅ |
| Run Looking Glass consultation | ✅ |
| Handle rescheduling/cancellations | ✅ |
| Collect new client intake | ✅ |
| Process payments/deposits | ✅ |
| Send appointment reminders | ✅ |
| Post-groom follow-up | ✅ |
| Complex/custom questions | ❌ → Escalates to Kimmie |

### Deployment

- Website chat widget
- Instagram DMs
- Facebook Messenger
- All funnel to Telegram for Kimmie oversight

---

## 501(c)(3) Shelter Angels

### Mission

- Foster shelter pets at risk of euthanasia
- Makeovers to boost adoption "curb appeal"
- Community education & outreach
- Keep pets in homes with resources

### Shelter OSINT Feed

- Auto-scrapes Riverside County shelter listings
- Pulls: photos, names, breed, age, intake date, status
- Populates donation showcase + game
- PSA: "Shelter availability changes quickly!"

### "Paint the Roses Red" Arcade Game

- Pay $1-5 to play
- Real shelter pets appear, scruffy
- Tap/swipe to "paint" them fabulous
- Points = donation allocated
- Leaderboard: "Top Royal Makeover Artists"
- Shareable badges

### Donation Minimums (Full Makeover Sponsorship)

| Size | Minimum |
|------|---------|
| Small | $45 |
| Medium | $55 |
| XL/XXL | $75 |
| 150+ lbs | $100 |

### Deliverables

- Full 501(c)(3) filing documentation
- Bylaws templates
- Donation tracking for tax purposes
- Impact reporting

---

## Kimmie's Telegram Command Center

### What It Is

- Single inbox for EVERYTHING
- Cheshire Cat bot (with extra Kimmie-only personality)
- All bookings, messages, reminders flow here

### Booking Flow

```
Client contacts (any channel)
        ↓
Cheshire Cat handles/parses
        ↓
Draft appears in Telegram: "🐕 New booking request!"
        ↓
Kimmie: tap to confirm/adjust
        ↓
Client notified, calendar synced
```

### Quick-Capture

- Gets a call/text on personal phone
- Tap shortcut → voice memo → AI parses → draft booking
- 5 seconds, hands-free friendly

### Kimmie's Personalized Experience

**Vibe:** Whimsical, feminine, playful, spicy

**Celebrations:** "Yasss queen, 5 bookings today! 👑🔥"

**Nudges:** "Hey hot stuff, before pics = after glory 😽📸"

**Easter Eggs:**
- Hidden commands
- Surprise unlocks
- Achievement badges
- Streak rewards

**Personalized References (Secret Profile):**
- Pokémon ("A wild BOOKING appeared!", Mimikyu appearances)
- Grey's Anatomy quotes
- Secret Lives of Mormon Wives drama references
- Dinosaurs
- Lizard button meme (dopamine hits)

### Reminders System

- Before appointment: "📸 BEFORE photo time!"
- After appointment: "📸 AFTER reveal!"
- Content nudges: "The 'gram is hungry~ 🍽️"
- Random hype: "Just checking in - you're killing it 💅"

---

## Social Media & Content Automation

### Automated Content Pipeline

| Trigger | Action |
|---------|--------|
| Appointment starts | Push: "📸 BEFORE photo!" |
| Appointment ends | Push: "📸 AFTER reveal!" |
| Photos uploaded | AI generates caption + hashtags |
| Kimmie approves | Auto-posts to all platforms |
| No photos 24hrs | Gentle Cheshire nudge |
| Weekly | AI suggests trending content ideas |

### Content Auto-Generation

- **Captions:** AI writes on-brand, whimsical
- **Hashtags:** Optimized for reach + local
- **Reels/TikToks:** Transformation templates
- **Stories:** Auto-generate from recent photos
- **Educational:** Breed care tips, grooming advice

### Platform Coverage

- Instagram (posts, stories, reels)
- Facebook (posts, stories)
- TikTok (videos)
- Website (auto-pulled gallery)

---

## AI Tools & Design Resources

### Image/Design Generation

- fal.ai Nano Banana Pro (primary)
- Stable Diffusion variants
- Flux models

### Video Generation

- Runway Gen-3
- Pika Labs
- CapCut (editing/automation)

### Applications

| Feature | Tool |
|---------|------|
| Looking Glass previews | fal.ai - realistic pet style previews |
| 3D blueprint renders | Multi-angle generation |
| Website animations | AI-generated Wonderland assets |
| Social content | Auto captions, graphics, reels |
| Shelter pet previews | "Before" → AI "after" to entice donors |
| Marketing materials | Holiday graphics, promos |

---

## Summary

This project creates a groundbreaking, immersive digital experience for a pet grooming business that:

1. **Solves real industry problems** (Looking Glass consultation)
2. **Automates operations** (booking, content, reminders)
3. **Creates delightful experiences** (website, Telegram, gamification)
4. **Drives social good** (501(c)(3) shelter work)
5. **Builds a content-first brand** (auto-posting, viral potential)

All while being deeply personalized for Kimmie's personality and workflow.
