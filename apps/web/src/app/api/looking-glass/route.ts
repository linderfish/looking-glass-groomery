// apps/web/src/app/api/looking-glass/route.ts
import { NextRequest, NextResponse } from 'next/server'

function getFalApiKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_AI_KEY
}

// =============================================================================
// MODE 1: GROOMING STYLE - Only changes fur shape/length, preserves everything else
// =============================================================================
const GROOMING_STYLE_PROMPTS: Record<string, string> = {
  teddy: 'Trim and style the fur into a teddy bear cut: round fluffy face, rounded ears, even plush fur all over body. Keep the same dog, same face, same eye color, same nose, same background, same lighting, same fur color. Only change the fur length and shape. No other changes.',
  lion: 'Trim and style the fur into a lion cut: full fluffy mane around face and neck, body fur trimmed short. Keep the same dog, same face, same eye color, same nose, same background, same lighting, same fur color. Only change the fur length and shape. No other changes.',
  asian: 'Trim and style the fur into Asian fusion style: perfectly round face shape, extra fluffy rounded cheeks, clean lines. Keep the same dog, same face, same eye color, same nose, same background, same lighting, same fur color. Only change the fur length and shape. No other changes.',
  breed: 'Trim and style the fur into show-quality breed standard: precise scissor lines, clean angles, professional grooming. Keep the same dog, same face, same eye color, same nose, same background, same lighting, same fur color. Only change the fur length and shape. No other changes.',
  puppy: 'Trim and style the fur into a puppy cut: even length all over, soft and natural. Keep the same dog, same face, same eye color, same nose, same background, same lighting, same fur color. Only change the fur length and shape. No other changes.',
}

// =============================================================================
// MODE 2: CREATIVE COLOR - Only adds color where specified, preserves everything else
// =============================================================================
// This mode uses the user's custom description directly

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      imageUrl,     // Base64 data URL or regular URL
      mode = 'grooming', // 'grooming' or 'creative'
      style = 'teddy',   // For grooming mode
      colorDescription = '', // For creative mode: user describes exactly what they want
    } = body

    const apiKey = getFalApiKey()

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API not configured',
        message: 'Looking Glass preview is not available - fal.ai not configured',
      }, { status: 503 })
    }

    if (!imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'No image provided',
      }, { status: 400 })
    }

    let editPrompt = ''

    if (mode === 'creative') {
      // =======================================================================
      // CREATIVE COLOR MODE
      // User describes exactly what color/pattern they want and where
      // =======================================================================
      if (!colorDescription.trim()) {
        return NextResponse.json({
          success: false,
          error: 'Please describe what colors you want and where',
        }, { status: 400 })
      }

      // Build a precise prompt that only does what the user asked
      // Include realistic grooming constraints for dye application
      editPrompt = `${colorDescription.trim()}. Apply this as a realistic pet-safe dye job that a professional groomer could actually achieve. Consider realistic limitations: dye bleeds between layers so avoid ultra-thin patterns, ears and face have delicate skin limiting color saturation, short fur areas show color differently than fluffy areas, and patterns must follow the natural fur growth direction. Keep the same dog, same face, same eye color, same nose, same background, same lighting, same fur shape and length. Only add the color described in a realistically achievable way. No other changes.`

    } else {
      // =======================================================================
      // GROOMING STYLE MODE
      // Predefined cuts that only change fur shape, preserve everything else
      // =======================================================================
      editPrompt = GROOMING_STYLE_PROMPTS[style] || GROOMING_STYLE_PROMPTS.teddy
    }

    console.log('Looking Glass mode:', mode)
    console.log('Looking Glass edit prompt:', editPrompt)
    console.log('Image URL type:', imageUrl.substring(0, 50) + '...')

    // Use Nano Banana Pro EDIT endpoint for image-to-image transformation
    // This endpoint preserves the subject while applying edits
    const response = await fetch('https://fal.run/fal-ai/nano-banana-pro/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: editPrompt,
        image_urls: [imageUrl], // Array of image URLs
        num_images: 1,
        aspect_ratio: 'auto',
        output_format: 'png',
        resolution: '2K', // Higher resolution to avoid washed out look
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Nano Banana Pro edit error:', response.status, errorText)
      throw new Error(`Generation failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Nano Banana Pro response:', JSON.stringify(data).substring(0, 300))

    const generatedUrl = data?.images?.[0]?.url

    if (!generatedUrl) {
      throw new Error('No image generated in response')
    }

    return NextResponse.json({
      success: true,
      previewUrl: generatedUrl,
      mode,
      style: mode === 'grooming' ? style : null,
      prompt: editPrompt.substring(0, 150) + '...',
      description: data?.description || null,
    })

  } catch (error) {
    console.error('Looking Glass generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
