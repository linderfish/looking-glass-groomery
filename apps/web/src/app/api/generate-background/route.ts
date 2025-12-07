// apps/web/src/app/api/generate-background/route.ts
import { NextRequest, NextResponse } from 'next/server'

const FAL_AI_KEY = process.env.FAL_AI_KEY

// Predefined prompts for different scenes in Wonderland
const WONDERLAND_PROMPTS: Record<string, string> = {
  entry: `A dreamy Alice in Wonderland psychedelic rabbit hole entrance, swirling purple and pink vortex,
    floating playing cards and pocket watches, ethereal mist, bioluminescent mushrooms,
    teal and gold accents, surreal dreamscape, high quality digital art, 4k, magical atmosphere`,

  garden: `An enchanted Wonderland garden at twilight, oversized colorful roses and psychedelic flowers,
    Cheshire cat grin floating in the air, checkerboard path, iridescent butterflies,
    purple sky with multiple moons, magical pet grooming salon in the distance, dreamlike, surreal art`,

  teaParty: `A whimsical Mad Hatter tea party setting, floating teacups and saucers,
    psychedelic color shifting tablecloth, melting clocks, purple and pink gradient sky,
    sparkles and magic particles, pet grooming brushes as decorations, surreal fantasy art`,

  cheshire: `Abstract Cheshire cat artwork, glowing pink and purple stripes dissolving into mist,
    iconic wide golden grin floating in darkness, swirling galaxy background with stars,
    dreamy ethereal atmosphere, high quality digital art, psychedelic vibes`,

  lookingGlass: `A magical looking glass mirror portal, swirling iridescent surface reflecting
    alternate reality, floating scissors and grooming tools as Wonderland elements,
    purple and teal color scheme, sparkles and light rays, fantasy digital art`,

  shelter: `A heartwarming magical animal sanctuary in Wonderland style, glowing halos above pets,
    rainbow bridge in background, floating hearts and paw prints, soft golden light,
    ethereal clouds, compassionate dreamy atmosphere, digital fantasy art`,
}

// Cache for generated images (in production, use Redis/database)
const imageCache = new Map<string, { url: string; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scene = 'entry', customPrompt, forceRegenerate = false } = body

    // Check cache first
    const cacheKey = customPrompt || scene
    const cached = imageCache.get(cacheKey)

    if (!forceRegenerate && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        imageUrl: cached.url,
        cached: true,
        scene,
      })
    }

    // If no API key, return a placeholder/fallback
    if (!FAL_AI_KEY) {
      return NextResponse.json({
        imageUrl: null,
        fallback: true,
        scene,
        message: 'Using CSS backgrounds - fal.ai not configured',
      })
    }

    const prompt = customPrompt || WONDERLAND_PROMPTS[scene] || WONDERLAND_PROMPTS.entry

    // Call fal.ai Nano Banana model
    const response = await fetch('https://fal.run/fal-ai/nano-banana', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_AI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        num_images: 1,
        aspect_ratio: '16:9', // Widescreen for backgrounds
        output_format: 'png',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('fal.ai error:', error)
      throw new Error(`fal.ai API error: ${response.status}`)
    }

    const data = await response.json()
    const imageUrl = data.images?.[0]?.url

    if (!imageUrl) {
      throw new Error('No image URL in response')
    }

    // Cache the result
    imageCache.set(cacheKey, {
      url: imageUrl,
      timestamp: Date.now(),
    })

    return NextResponse.json({
      imageUrl,
      cached: false,
      scene,
    })
  } catch (error) {
    console.error('Background generation error:', error)
    return NextResponse.json(
      {
        imageUrl: null,
        fallback: true,
        error: 'Failed to generate background',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve cached backgrounds
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const scene = searchParams.get('scene') || 'entry'

  const cached = imageCache.get(scene)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      imageUrl: cached.url,
      cached: true,
      scene,
    })
  }

  // No cached image, return fallback indicator
  return NextResponse.json({
    imageUrl: null,
    cached: false,
    fallback: true,
    scene,
    availableScenes: Object.keys(WONDERLAND_PROMPTS),
  })
}
