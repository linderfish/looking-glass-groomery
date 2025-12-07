// apps/web/src/app/api/looking-glass/route.ts
import { NextRequest, NextResponse } from 'next/server'

function getFalApiKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_AI_KEY
}

// Edit prompts for Nano Banana Pro - very minimal, specific edits only
const STYLE_EDIT_PROMPTS: Record<string, string> = {
  teddy: 'Make the fur rounder and fluffier like a teddy bear grooming cut. Change nothing else.',
  lion: 'Make the fur around the face and neck fuller like a lion mane, body fur shorter. Change nothing else.',
  asian: 'Make the face fur rounder and cheeks fluffier in Asian grooming style. Change nothing else.',
  creative: '', // Creative uses only custom notes and/or color selection
  breed: 'Make the fur neat and precisely trimmed in show dog style. Change nothing else.',
  custom: 'Make the fur look freshly groomed and neat. Change nothing else.',
}

// Color additions - ONLY applied if user selects a color, and ONLY to specified area
const COLOR_EDIT_ADDITIONS: Record<string, string> = {
  pink: 'Add pink dye',
  purple: 'Add purple dye',
  blue: 'Add blue dye',
  rainbow: 'Add rainbow colored dye',
  teal: 'Add teal dye',
  gold: 'Add golden blonde dye',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      imageUrl,     // Base64 data URL or regular URL
      style = 'teddy',
      color,
      customNotes = '',
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

    // Build the edit prompt for Nano Banana Pro
    let editPrompt = ''

    // For creative style, build prompt from color + custom notes only
    if (style === 'creative') {
      const parts: string[] = []

      // Add color instruction if selected
      if (color && COLOR_EDIT_ADDITIONS[color]) {
        parts.push(COLOR_EDIT_ADDITIONS[color])
      }

      // Add custom notes as the main instruction
      if (customNotes.trim()) {
        parts.push(customNotes.trim())
      }

      // If nothing specified, just do a basic groom
      if (parts.length === 0) {
        editPrompt = 'Make the fur look freshly groomed. Change nothing else.'
      } else {
        editPrompt = parts.join('. ') + '. Change nothing else.'
      }
    } else {
      // For other styles, use the preset prompt
      editPrompt = STYLE_EDIT_PROMPTS[style] || STYLE_EDIT_PROMPTS.custom

      // Only add custom notes if provided (no color additions for non-creative styles)
      if (customNotes.trim()) {
        // Replace the "Change nothing else" with the custom note, then re-add it
        editPrompt = editPrompt.replace('. Change nothing else.', '') + '. ' + customNotes.trim() + '. Change nothing else.'
      }
    }

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
      style,
      color,
      prompt: editPrompt.substring(0, 100) + '...',
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
