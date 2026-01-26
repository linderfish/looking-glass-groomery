---
phase: 02-client-pet-lookup
plan: 02
subsystem: ui
tags: [telegram, grammy, formatting, bot-interaction]

# Dependency graph
requires:
  - phase: 02-01
    provides: Client search infrastructure and /lookup command with pet buttons
provides:
  - Complete pet profile display with photo, demographics, and spicy meter
  - Age calculation from birthDate (years or months)
  - Temperament-to-pepper mapping (1-3 peppers for dangerous pets)
  - Passport data display (allergies, preferences)
affects: [02-03-visit-history, future-pet-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Spicy meter visualization (1-3 peppers for ANXIOUS/FEARFUL/AGGRESSIVE)
    - Pet profile formatting with passport integration
    - Photo fallback handling (broken URLs → text display)

key-files:
  created: []
  modified:
    - apps/telegram-bot/src/services/formatting.ts
    - apps/telegram-bot/src/handlers/lookup.ts

key-decisions:
  - "Spicy meter uses Kimmie's existing mental model: 0-3 peppers based on danger level"
  - "Age calculation shows months for pets under 1 year, years for older pets"
  - "Photo fallback: broken URLs gracefully degrade to text-only display"

patterns-established:
  - "Pet profile format: icon + name, owner, demographics, spicy meter, passport data"
  - "Callback pattern: pet:${petId} → load with passport → format → display"
  - "Navigation: Back to Client button for easy traversal"

# Metrics
duration: 2min
completed: 2026-01-26
---

# Phase 2 Plan 2: Pet Profile Display Summary

**Pet profiles with spicy meter (1-3 peppers), photo display, age calculation, and passport data (allergies/preferences)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-26T21:38:46Z
- **Completed:** 2026-01-26T21:41:05Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Complete pet profile formatting with demographics (species, breed, age, sex, fixed status)
- Spicy meter visualization using 1-3 peppers for ANXIOUS/FEARFUL/AGGRESSIVE temperaments
- Age calculation showing months for puppies (<1 year) or years for older pets
- Passport data display (allergies, preferences) integrated into profile
- Pet photo display with graceful fallback for broken URLs
- Navigation between client and pet profiles via callback buttons

## Task Commits

Each task was committed atomically:

1. **Task 1: Add pet profile formatting with spicy meter and age calculation** - `0b0ce58` (feat)
2. **Task 2: Add pet profile callback handler to lookup.ts** - `af93243` (feat)

## Files Created/Modified
- `apps/telegram-bot/src/services/formatting.ts` - Added calculateAge(), formatSpicyMeter(), formatPetProfile() functions
- `apps/telegram-bot/src/handlers/lookup.ts` - Added pet:(.+) callback handler with passport loading

## Decisions Made

**1. Spicy meter uses Kimmie's existing mental model**
- 0 peppers: NORMAL, PUPPY, SENIOR, SERVICE_ANIMAL (chill pets)
- 🌶 1/3: ANXIOUS (might nip)
- 🌶🌶 2/3: FEARFUL (will try to bite)
- 🌶🌶🌶 3/3: AGGRESSIVE (actively dangerous)
- Rationale: Matches Kimmie's intuitive understanding of pet danger levels

**2. Age calculation prioritizes readability**
- Shows "X months" for pets under 1 year (puppies need age precision)
- Shows "X years" for older pets (precision less critical)
- Handles null birthDate gracefully ("Unknown")

**3. Photo fallback ensures reliability**
- Try to send photo with caption
- If photo URL broken/404, catch error and send text-only
- Prevents bot crashes from bad URLs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for plan 02-03 (Visit History):
- Pet profile callback established with `pethistory:${petId}` button ready
- All pet data accessible via formatted profile
- Navigation pattern established for traversal

Considerations:
- Visit history will need appointment query with service details
- May want to show before/after photos if available

---
*Phase: 02-client-pet-lookup*
*Completed: 2026-01-26*
