# Phase 4: Looking Glass Consultation System

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the AI-powered 3D visual consultation system that generates multi-angle style previews on actual pet photos, creates professional grooming blueprints for Kimmie, and stores designs in the Pet Passport system.

**Architecture:** Service that accepts pet photos + style descriptions, uses fal.ai to generate previews from multiple angles, uses LLM to create detailed grooming blueprints, and manages the approval workflow.

**Tech Stack:** fal.ai (Nano Banana Pro / Flux), Anthropic Claude for blueprint generation, Next.js API routes, PostgreSQL

---

## Project Structure

```
packages/ai/src/
├── looking-glass/
│   ├── preview-generator.ts    # Multi-angle preview generation
│   ├── blueprint-generator.ts  # Grooming instruction generation
│   ├── style-parser.ts         # Parse style descriptions
│   └── fallback-outlines.ts    # Breed outline fallbacks

apps/web/src/
├── app/
│   └── looking-glass/
│       ├── page.tsx            # Main consultation page
│       ├── upload/
│       │   └── page.tsx        # Photo upload step
│       ├── design/
│       │   └── page.tsx        # Style description step
│       ├── preview/
│       │   └── page.tsx        # Multi-angle preview
│       └── approve/
│           └── page.tsx        # Final approval
├── components/
│   └── looking-glass/
│       ├── PhotoUploader.tsx
│       ├── StyleChat.tsx
│       ├── PreviewCarousel.tsx
│       ├── BlueprintView.tsx
│       ├── BreedOutline.tsx
│       └── ColoringTool.tsx
```

---

## Task 4.1: Build Preview Generation Service

**Files:**
- Create: `packages/ai/src/looking-glass/preview-generator.ts`
- Create: `packages/ai/src/looking-glass/style-parser.ts`

**Step 1: Create style-parser.ts**

```typescript
// packages/ai/src/looking-glass/style-parser.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export interface ParsedStyle {
  // Overall style
  overallLength: 'short' | 'medium' | 'long' | 'natural'
  overallStyle: string

  // Body parts
  head: {
    style: string
    length?: string
  }
  ears: {
    style: string
    length?: string
  }
  body: {
    style: string
    length?: string
  }
  legs: {
    style: string
    tapered?: boolean
    leftRight?: 'same' | 'different'
  }
  tail: {
    style: string
  }

  // Creative elements
  colors: Array<{
    color: string
    placement: string
    pattern: 'solid' | 'spots' | 'rings' | 'gradient' | 'stripes' | 'custom'
    patternDescription?: string
  }>

  // Extras
  extras: string[] // glitter, jewels, feathers, etc.

  // Raw description for reference
  rawDescription: string
}

/**
 * Parse a natural language style description into structured format
 */
export async function parseStyleDescription(
  description: string,
  petInfo: { species: string; breed?: string; size?: string }
): Promise<ParsedStyle> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are a professional pet groomer parsing style requests.
Convert natural language descriptions into structured grooming specifications.

Important distinctions:
- SPOTS = irregular circular patches
- RINGS = circular bands that wrap around (like on legs or tail)
- STRIPES = linear patterns
- GRADIENT = color that fades from one to another
- SOLID = single color in an area

For asymmetric requests (left side different from right), note this in the legs section.

Return ONLY valid JSON matching this structure:
{
  "overallLength": "short|medium|long|natural",
  "overallStyle": "description",
  "head": { "style": "...", "length": "..." },
  "ears": { "style": "...", "length": "..." },
  "body": { "style": "...", "length": "..." },
  "legs": { "style": "...", "tapered": true/false, "leftRight": "same|different" },
  "tail": { "style": "..." },
  "colors": [{ "color": "...", "placement": "...", "pattern": "...", "patternDescription": "..." }],
  "extras": ["glitter", "jewels", etc],
  "rawDescription": "original description"
}`,
    messages: [{
      role: 'user',
      content: `Pet: ${petInfo.species}, ${petInfo.breed || 'mixed breed'}, ${petInfo.size || 'medium'} size.

Style request: "${description}"

Parse this into the structured format.`,
    }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    const parsed = JSON.parse(content)
    parsed.rawDescription = description
    return parsed as ParsedStyle
  } catch (error) {
    // Return a basic structure if parsing fails
    return {
      overallLength: 'medium',
      overallStyle: description,
      head: { style: 'natural' },
      ears: { style: 'natural' },
      body: { style: 'natural' },
      legs: { style: 'natural', tapered: false, leftRight: 'same' },
      tail: { style: 'natural' },
      colors: [],
      extras: [],
      rawDescription: description,
    }
  }
}

/**
 * Build a prompt for image generation from parsed style
 */
export function buildImagePrompt(
  parsedStyle: ParsedStyle,
  angle: 'front' | 'left' | 'right' | 'back' | 'top',
  petInfo: { species: string; breed?: string }
): string {
  const angleDescriptions = {
    front: 'front view, facing directly at camera, symmetrical',
    left: 'left side profile, showing full left side of body',
    right: 'right side profile, showing full right side of body',
    back: 'back view, facing away from camera, showing rear and tail',
    top: 'top-down bird\'s eye view, looking down from above',
  }

  let colorDescription = ''
  if (parsedStyle.colors.length > 0) {
    colorDescription = parsedStyle.colors
      .map(c => {
        let patternDesc = c.pattern
        if (c.pattern === 'spots') patternDesc = 'irregular circular spots'
        if (c.pattern === 'rings') patternDesc = 'circular bands wrapping around'
        if (c.pattern === 'gradient') patternDesc = 'smooth gradient fade'
        return `${c.color} ${patternDesc} on ${c.placement}`
      })
      .join(', ')
  }

  const extrasDescription = parsedStyle.extras.length > 0
    ? `Decorated with: ${parsedStyle.extras.join(', ')}.`
    : ''

  return `A professionally groomed ${petInfo.breed || ''} ${petInfo.species}, ${angleDescriptions[angle]}.

Grooming style: ${parsedStyle.overallStyle}
Overall coat length: ${parsedStyle.overallLength}
Head: ${parsedStyle.head.style}
Ears: ${parsedStyle.ears.style}
Body: ${parsedStyle.body.style}
Legs: ${parsedStyle.legs.style}${parsedStyle.legs.tapered ? ', tapered' : ''}
Tail: ${parsedStyle.tail.style}

${colorDescription ? `Colors: ${colorDescription}` : ''}
${extrasDescription}

Professional pet photography, studio lighting, high detail fur texture, clean background, Alice in Wonderland whimsical aesthetic, magical and beautiful.`
}
```

**Step 2: Create preview-generator.ts**

```typescript
// packages/ai/src/looking-glass/preview-generator.ts
import { fal } from '@fal-ai/client'
import { parseStyleDescription, buildImagePrompt, ParsedStyle } from './style-parser'

fal.config({
  credentials: process.env.FAL_AI_KEY,
})

export interface PreviewRequest {
  petPhotoUrl: string
  styleDescription: string
  petInfo: {
    species: string
    breed?: string
    size?: string
  }
}

export interface PreviewResult {
  angles: {
    front: string
    left: string
    right: string
    back: string
    top: string
  }
  parsedStyle: ParsedStyle
  generationTime: number
}

export interface SingleAngleResult {
  angle: string
  imageUrl: string
}

/**
 * Generate all 5 angles of a pet style preview
 */
export async function generateFullPreview(
  request: PreviewRequest
): Promise<PreviewResult> {
  const startTime = Date.now()

  // Parse the style description
  const parsedStyle = await parseStyleDescription(
    request.styleDescription,
    request.petInfo
  )

  // Generate all angles in parallel
  const angles = ['front', 'left', 'right', 'back', 'top'] as const

  const results = await Promise.all(
    angles.map(angle => generateSingleAngle(
      request.petPhotoUrl,
      parsedStyle,
      angle,
      request.petInfo
    ))
  )

  const angleMap = results.reduce((acc, result) => {
    acc[result.angle as keyof PreviewResult['angles']] = result.imageUrl
    return acc
  }, {} as PreviewResult['angles'])

  return {
    angles: angleMap,
    parsedStyle,
    generationTime: Date.now() - startTime,
  }
}

/**
 * Generate a single angle preview
 */
export async function generateSingleAngle(
  petPhotoUrl: string,
  parsedStyle: ParsedStyle,
  angle: 'front' | 'left' | 'right' | 'back' | 'top',
  petInfo: { species: string; breed?: string }
): Promise<SingleAngleResult> {
  const prompt = buildImagePrompt(parsedStyle, angle, petInfo)

  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
      input: {
        prompt,
        image_url: petPhotoUrl,
        num_images: 1,
        image_size: 'square_hd',
        guidance_scale: 7.5,
        num_inference_steps: 28,
        enable_safety_checker: true,
      },
      logs: true,
    })

    return {
      angle,
      imageUrl: result.data.images[0].url,
    }
  } catch (error) {
    console.error(`Failed to generate ${angle} angle:`, error)
    throw error
  }
}

/**
 * Regenerate a single angle with modified description
 */
export async function regenerateAngle(
  petPhotoUrl: string,
  parsedStyle: ParsedStyle,
  angle: 'front' | 'left' | 'right' | 'back' | 'top',
  modification: string,
  petInfo: { species: string; breed?: string }
): Promise<SingleAngleResult> {
  // Merge the modification into the prompt
  const basePrompt = buildImagePrompt(parsedStyle, angle, petInfo)
  const modifiedPrompt = `${basePrompt}\n\nAdditional modification: ${modification}`

  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt: modifiedPrompt,
      image_url: petPhotoUrl,
      num_images: 1,
      image_size: 'square_hd',
      guidance_scale: 7.5,
      num_inference_steps: 28,
    },
  })

  return {
    angle,
    imageUrl: result.data.images[0].url,
  }
}

/**
 * Generate a quick preview (front angle only) for initial feedback
 */
export async function generateQuickPreview(
  request: PreviewRequest
): Promise<{ imageUrl: string; parsedStyle: ParsedStyle }> {
  const parsedStyle = await parseStyleDescription(
    request.styleDescription,
    request.petInfo
  )

  const result = await generateSingleAngle(
    request.petPhotoUrl,
    parsedStyle,
    'front',
    request.petInfo
  )

  return {
    imageUrl: result.imageUrl,
    parsedStyle,
  }
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat(ai): add Looking Glass preview generation with style parsing"
```

---

## Task 4.2: Build Blueprint Generator

**Files:**
- Create: `packages/ai/src/looking-glass/blueprint-generator.ts`

**Step 1: Create blueprint-generator.ts**

```typescript
// packages/ai/src/looking-glass/blueprint-generator.ts
import Anthropic from '@anthropic-ai/sdk'
import { ParsedStyle } from './style-parser'
import { DesignBlueprint, DesignBlueprintSchema } from '@looking-glass/shared'

const anthropic = new Anthropic()

export interface BlueprintRequest {
  parsedStyle: ParsedStyle
  petInfo: {
    species: string
    breed?: string
    size?: string
    coatType?: string
  }
  clientNotes?: string
}

export interface GroomingBlueprint {
  // For Kimmie's reference
  summary: string

  // Detailed instructions by body part
  head: {
    clipperGuard?: string
    scissorLength?: string
    style: string
    technique: string
    notes?: string
  }

  ears: {
    clipperGuard?: string
    style: string
    technique: string
    notes?: string
  }

  body: {
    clipperGuard?: string
    bladeNumber?: string
    style: string
    technique: string
    direction?: string
    notes?: string
  }

  legs: {
    clipperGuard?: string
    style: string
    technique: string
    tapered: boolean
    leftSide?: string
    rightSide?: string
    notes?: string
  }

  tail: {
    style: string
    technique: string
    notes?: string
  }

  // Creative color instructions
  colorInstructions?: Array<{
    color: string
    brand: string
    productName?: string
    placement: string
    pattern: string
    applicationMethod: string
    processingTime?: string
    notes?: string
  }>

  // Extras
  extras?: Array<{
    item: string
    placement: string
    application: string
  }>

  // Estimated time
  estimatedTime: number // minutes

  // Reference images (if similar styles found)
  referenceImages?: string[]

  // Warnings or special considerations
  warnings?: string[]
}

/**
 * Generate a detailed grooming blueprint from parsed style
 */
export async function generateBlueprint(
  request: BlueprintRequest
): Promise<GroomingBlueprint> {
  const { parsedStyle, petInfo, clientNotes } = request

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `You are a master pet groomer creating detailed blueprints for other groomers.
Your blueprints must be specific enough that any certified groomer could execute them perfectly.

Use professional terminology:
- Clipper guards: #3, #4, #5, #7F, #10, #15, #30, #40
- Blade numbers: 4F, 5F, 7F, 10, 15, 30, 40
- Techniques: scissor over comb, clipper work, hand stripping, carding, etc.
- Color brands: OPAWZ, Crazy Liberty, Petway, Top Performance

For creative coloring:
- Specify exact color names/numbers from professional brands
- Include application method (brush-on, sponge, airbrush, stencil)
- Note processing times
- Distinguish between SPOTS (irregular patches) and RINGS (wrapped bands)

Return valid JSON matching the GroomingBlueprint structure.`,
    messages: [{
      role: 'user',
      content: `Create a grooming blueprint for:

**Pet Info:**
- Species: ${petInfo.species}
- Breed: ${petInfo.breed || 'Mixed'}
- Size: ${petInfo.size || 'Medium'}
- Coat Type: ${petInfo.coatType || 'Unknown'}

**Requested Style:**
${JSON.stringify(parsedStyle, null, 2)}

**Client Notes:** ${clientNotes || 'None'}

Generate the complete blueprint with all clipper guards, techniques, and color specifications.`,
    }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    return JSON.parse(content) as GroomingBlueprint
  } catch (error) {
    console.error('Failed to parse blueprint:', error)
    // Return a basic blueprint
    return createFallbackBlueprint(parsedStyle, petInfo)
  }
}

/**
 * Create a simple fallback blueprint if AI generation fails
 */
function createFallbackBlueprint(
  parsedStyle: ParsedStyle,
  petInfo: { species: string; breed?: string }
): GroomingBlueprint {
  return {
    summary: `${parsedStyle.overallLength} ${parsedStyle.overallStyle} for ${petInfo.breed || petInfo.species}`,
    head: {
      style: parsedStyle.head.style,
      technique: 'Scissor to desired length',
    },
    ears: {
      style: parsedStyle.ears.style,
      technique: 'Clean and shape',
    },
    body: {
      style: parsedStyle.body.style,
      technique: 'Clipper with appropriate blade',
    },
    legs: {
      style: parsedStyle.legs.style,
      technique: parsedStyle.legs.tapered ? 'Taper from body to paw' : 'Even length',
      tapered: parsedStyle.legs.tapered || false,
    },
    tail: {
      style: parsedStyle.tail.style,
      technique: 'Shape to match style',
    },
    colorInstructions: parsedStyle.colors.map(c => ({
      color: c.color,
      brand: 'OPAWZ or Crazy Liberty',
      placement: c.placement,
      pattern: c.pattern,
      applicationMethod: 'Brush-on application',
    })),
    extras: parsedStyle.extras.map(e => ({
      item: e,
      placement: 'As requested',
      application: 'Standard application',
    })),
    estimatedTime: 90,
    warnings: ['Verify all details with client before proceeding'],
  }
}

/**
 * Format blueprint for Telegram display (for Kimmie)
 */
export function formatBlueprintForTelegram(blueprint: GroomingBlueprint): string {
  let message = `📋 <b>GROOMING BLUEPRINT</b>\n\n`
  message += `<b>Summary:</b> ${blueprint.summary}\n\n`

  message += `<b>⏱️ Est. Time:</b> ${blueprint.estimatedTime} min\n\n`

  message += `<b>✂️ CUT INSTRUCTIONS:</b>\n`
  message += `• Head: ${blueprint.head.clipperGuard || 'scissors'} - ${blueprint.head.technique}\n`
  message += `• Ears: ${blueprint.ears.style}\n`
  message += `• Body: ${blueprint.body.clipperGuard || blueprint.body.bladeNumber || 'custom'} - ${blueprint.body.technique}\n`
  message += `• Legs: ${blueprint.legs.style}${blueprint.legs.tapered ? ' (TAPERED)' : ''}\n`
  message += `• Tail: ${blueprint.tail.style}\n\n`

  if (blueprint.colorInstructions && blueprint.colorInstructions.length > 0) {
    message += `<b>🎨 COLOR INSTRUCTIONS:</b>\n`
    for (const color of blueprint.colorInstructions) {
      message += `• ${color.color} (${color.brand})\n`
      message += `  Placement: ${color.placement}\n`
      message += `  Pattern: ${color.pattern}\n`
      message += `  Method: ${color.applicationMethod}\n`
      if (color.processingTime) {
        message += `  Time: ${color.processingTime}\n`
      }
    }
    message += '\n'
  }

  if (blueprint.extras && blueprint.extras.length > 0) {
    message += `<b>✨ EXTRAS:</b>\n`
    for (const extra of blueprint.extras) {
      message += `• ${extra.item} - ${extra.placement}\n`
    }
    message += '\n'
  }

  if (blueprint.warnings && blueprint.warnings.length > 0) {
    message += `<b>⚠️ NOTES:</b>\n`
    for (const warning of blueprint.warnings) {
      message += `• ${warning}\n`
    }
  }

  return message
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(ai): add grooming blueprint generator"
```

---

## Task 4.3: Build Fallback Breed Outlines

**Files:**
- Create: `packages/ai/src/looking-glass/fallback-outlines.ts`

**Step 1: Create fallback-outlines.ts**

```typescript
// packages/ai/src/looking-glass/fallback-outlines.ts

export interface BreedOutline {
  id: string
  name: string
  species: 'DOG' | 'CAT' | 'OTHER'
  size: 'small' | 'medium' | 'large' | 'xlarge'
  svgPath: string // SVG path data for the outline
  colorZones: Array<{
    id: string
    name: string
    svgPath: string
  }>
}

// Base dog outlines by size category
export const DOG_OUTLINES: Record<string, BreedOutline> = {
  small_dog: {
    id: 'small_dog',
    name: 'Small Dog',
    species: 'DOG',
    size: 'small',
    svgPath: `M 100 200
      C 100 150, 120 100, 150 80
      C 180 60, 220 60, 250 80
      C 280 100, 300 150, 300 200
      L 300 300
      C 300 350, 250 400, 200 400
      C 150 400, 100 350, 100 300
      Z`,
    colorZones: [
      { id: 'head', name: 'Head', svgPath: 'M 150 80 C 180 60...' },
      { id: 'ears', name: 'Ears', svgPath: 'M 120 70...' },
      { id: 'body', name: 'Body', svgPath: 'M 150 150...' },
      { id: 'legs_front', name: 'Front Legs', svgPath: 'M 130 300...' },
      { id: 'legs_back', name: 'Back Legs', svgPath: 'M 250 300...' },
      { id: 'tail', name: 'Tail', svgPath: 'M 280 250...' },
    ],
  },
  medium_dog: {
    id: 'medium_dog',
    name: 'Medium Dog',
    species: 'DOG',
    size: 'medium',
    svgPath: `...`, // Full SVG path
    colorZones: [],
  },
  large_dog: {
    id: 'large_dog',
    name: 'Large Dog',
    species: 'DOG',
    size: 'large',
    svgPath: `...`,
    colorZones: [],
  },
  xlarge_dog: {
    id: 'xlarge_dog',
    name: 'Extra Large Dog',
    species: 'DOG',
    size: 'xlarge',
    svgPath: `...`,
    colorZones: [],
  },
}

export const CAT_OUTLINES: Record<string, BreedOutline> = {
  cat: {
    id: 'cat',
    name: 'Cat',
    species: 'CAT',
    size: 'medium',
    svgPath: `...`,
    colorZones: [],
  },
}

export const OTHER_OUTLINES: Record<string, BreedOutline> = {
  goat: {
    id: 'goat',
    name: 'Goat',
    species: 'OTHER',
    size: 'medium',
    svgPath: `...`,
    colorZones: [],
  },
  pig: {
    id: 'pig',
    name: 'Pig',
    species: 'OTHER',
    size: 'medium',
    svgPath: `...`,
    colorZones: [],
  },
  guinea_pig: {
    id: 'guinea_pig',
    name: 'Guinea Pig',
    species: 'OTHER',
    size: 'small',
    svgPath: `...`,
    colorZones: [],
  },
}

/**
 * Get appropriate outline based on species and size
 */
export function getOutlineForPet(
  species: string,
  size?: string
): BreedOutline {
  const speciesLower = species.toLowerCase()

  if (speciesLower === 'cat') {
    return CAT_OUTLINES.cat
  }

  if (speciesLower === 'goat') {
    return OTHER_OUTLINES.goat
  }

  if (speciesLower === 'pig') {
    return OTHER_OUTLINES.pig
  }

  if (speciesLower === 'guinea_pig' || speciesLower === 'guinea pig') {
    return OTHER_OUTLINES.guinea_pig
  }

  // Default to dog outlines by size
  const sizeMap: Record<string, string> = {
    small: 'small_dog',
    medium: 'medium_dog',
    large: 'large_dog',
    xlarge: 'xlarge_dog',
    xl: 'xlarge_dog',
    xxl: 'xlarge_dog',
  }

  const outlineKey = sizeMap[size?.toLowerCase() || 'medium'] || 'medium_dog'
  return DOG_OUTLINES[outlineKey]
}

/**
 * Get all available outlines
 */
export function getAllOutlines(): BreedOutline[] {
  return [
    ...Object.values(DOG_OUTLINES),
    ...Object.values(CAT_OUTLINES),
    ...Object.values(OTHER_OUTLINES),
  ]
}

/**
 * Generate colored SVG from outline and color data
 */
export function generateColoredSvg(
  outline: BreedOutline,
  colorData: Record<string, string> // zoneId -> color
): string {
  let svg = `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">\n`

  // Add base outline
  svg += `  <path d="${outline.svgPath}" fill="#f5f5f5" stroke="#333" stroke-width="2"/>\n`

  // Add colored zones
  for (const zone of outline.colorZones) {
    const color = colorData[zone.id] || '#f5f5f5'
    svg += `  <path d="${zone.svgPath}" fill="${color}" stroke="#333" stroke-width="1" opacity="0.8"/>\n`
  }

  svg += `</svg>`
  return svg
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(ai): add fallback breed outlines for Looking Glass"
```

---

## Task 4.4: Create Looking Glass API Routes

**Files:**
- Create: `apps/web/src/app/api/looking-glass/preview/route.ts`
- Create: `apps/web/src/app/api/looking-glass/blueprint/route.ts`
- Create: `apps/web/src/app/api/looking-glass/design/route.ts`

**Step 1: Create preview route**

```typescript
// apps/web/src/app/api/looking-glass/preview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@looking-glass/db'
import { generateFullPreview, generateQuickPreview } from '@looking-glass/ai/looking-glass/preview-generator'
import { z } from 'zod'

const previewRequestSchema = z.object({
  petId: z.string().optional(),
  petPhotoUrl: z.string().url(),
  styleDescription: z.string().min(10),
  petInfo: z.object({
    species: z.string(),
    breed: z.string().optional(),
    size: z.string().optional(),
  }),
  quickPreview: z.boolean().optional(), // Generate only front angle for speed
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = previewRequestSchema.parse(body)

    // Check authorization (require deposit or membership)
    // TODO: Implement auth check

    let result

    if (data.quickPreview) {
      // Fast preview - front angle only
      result = await generateQuickPreview({
        petPhotoUrl: data.petPhotoUrl,
        styleDescription: data.styleDescription,
        petInfo: data.petInfo,
      })

      return NextResponse.json({
        success: true,
        preview: {
          front: result.imageUrl,
        },
        parsedStyle: result.parsedStyle,
      })
    }

    // Full preview - all angles
    result = await generateFullPreview({
      petPhotoUrl: data.petPhotoUrl,
      styleDescription: data.styleDescription,
      petInfo: data.petInfo,
    })

    return NextResponse.json({
      success: true,
      preview: result.angles,
      parsedStyle: result.parsedStyle,
      generationTime: result.generationTime,
    })
  } catch (error) {
    console.error('Preview generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
```

**Step 2: Create blueprint route**

```typescript
// apps/web/src/app/api/looking-glass/blueprint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateBlueprint } from '@looking-glass/ai/looking-glass/blueprint-generator'
import { z } from 'zod'

const blueprintRequestSchema = z.object({
  parsedStyle: z.any(), // ParsedStyle object
  petInfo: z.object({
    species: z.string(),
    breed: z.string().optional(),
    size: z.string().optional(),
    coatType: z.string().optional(),
  }),
  clientNotes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = blueprintRequestSchema.parse(body)

    const blueprint = await generateBlueprint({
      parsedStyle: data.parsedStyle,
      petInfo: data.petInfo,
      clientNotes: data.clientNotes,
    })

    return NextResponse.json({
      success: true,
      blueprint,
    })
  } catch (error) {
    console.error('Blueprint generation error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to generate blueprint' },
      { status: 500 }
    )
  }
}
```

**Step 3: Create design management route**

```typescript
// apps/web/src/app/api/looking-glass/design/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@looking-glass/db'
import { z } from 'zod'

const createDesignSchema = z.object({
  petId: z.string(),
  name: z.string().optional(),
  description: z.string(),
  previewFront: z.string().url(),
  previewLeft: z.string().url().optional(),
  previewRight: z.string().url().optional(),
  previewBack: z.string().url().optional(),
  previewTop: z.string().url().optional(),
  blueprint: z.any(),
})

// Create a new design
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createDesignSchema.parse(body)

    // Get pet's passport (or create one)
    let passport = await prisma.petPassport.findUnique({
      where: { petId: data.petId },
    })

    if (!passport) {
      passport = await prisma.petPassport.create({
        data: { petId: data.petId },
      })
    }

    // Create the design
    const design = await prisma.groomingDesign.create({
      data: {
        petId: data.petId,
        passportId: passport.id,
        name: data.name,
        description: data.description,
        previewFront: data.previewFront,
        previewLeft: data.previewLeft,
        previewRight: data.previewRight,
        previewBack: data.previewBack,
        previewTop: data.previewTop,
        blueprint: data.blueprint,
        status: 'PENDING_APPROVAL',
      },
    })

    return NextResponse.json({
      success: true,
      design,
    })
  } catch (error) {
    console.error('Design creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create design' },
      { status: 500 }
    )
  }
}

// Get designs for a pet
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const petId = searchParams.get('petId')

  if (!petId) {
    return NextResponse.json(
      { success: false, error: 'Pet ID required' },
      { status: 400 }
    )
  }

  const designs = await prisma.groomingDesign.findMany({
    where: { petId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    success: true,
    designs,
  })
}

// Approve a design
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { designId, action } = body

    if (action === 'approve') {
      const design = await prisma.groomingDesign.update({
        where: { id: designId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      })

      // TODO: Notify Kimmie via Telegram with blueprint

      return NextResponse.json({ success: true, design })
    }

    if (action === 'reject') {
      const design = await prisma.groomingDesign.update({
        where: { id: designId },
        data: { status: 'REJECTED' },
      })

      return NextResponse.json({ success: true, design })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Design update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update design' },
      { status: 500 }
    )
  }
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat(web): add Looking Glass API routes"
```

---

## Task 4.5: Update AI Package Exports

**Files:**
- Modify: `packages/ai/src/index.ts`

**Step 1: Update index.ts**

```typescript
// packages/ai/src/index.ts
export * from './fal'
export * from './llm'
export { CHESHIRE_SYSTEM_PROMPT, KIMMIE_TELEGRAM_PERSONA } from './prompts/cheshire'

// Looking Glass exports
export * from './looking-glass/preview-generator'
export * from './looking-glass/blueprint-generator'
export * from './looking-glass/style-parser'
export * from './looking-glass/fallback-outlines'
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(ai): export Looking Glass modules"
```

---

## Execution Checklist - Phase 4

- [ ] Task 4.1: Build preview generation service
- [ ] Task 4.2: Build blueprint generator
- [ ] Task 4.3: Build fallback breed outlines
- [ ] Task 4.4: Create Looking Glass API routes
- [ ] Task 4.5: Update AI package exports
