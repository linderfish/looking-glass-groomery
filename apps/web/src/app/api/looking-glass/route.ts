// apps/web/src/app/api/looking-glass/route.ts
import { NextRequest, NextResponse } from 'next/server'

function getFalApiKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_AI_KEY
}

// Edit prompts for Nano Banana Pro - very minimal, specific edits only
const STYLE_EDIT_PROMPTS: Record<string, string> = {
  teddy: 'Make the fur rounder and fluffier like a teddy bear grooming cut',
  lion: 'Make the fur around the face and neck fuller like a lion mane, body fur shorter',
  asian: 'Make the face fur rounder and cheeks fluffier in Asian grooming style',
  creative: 'Keep the exact same image',
  breed: 'Make the fur neat and precisely trimmed in show dog style',
  custom: 'Make the fur look freshly groomed and neat',
}

// Color additions - only when creative style selected
const COLOR_EDIT_ADDITIONS: Record<string, string> = {
  pink: ', dye the ear fur pink',
  purple: ', dye the ear fur purple',
  blue: ', dye the ear fur blue',
  rainbow: ', dye the ears with rainbow colors',
  teal: ', dye the ear fur teal',
  gold: ', add golden blonde highlights to the fur',
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
    let editPrompt = STYLE_EDIT_PROMPTS[style] || STYLE_EDIT_PROMPTS.custom

    // Add color if creative style selected
    if (color && COLOR_EDIT_ADDITIONS[color]) {
      editPrompt += COLOR_EDIT_ADDITIONS[color]
    }

    // Add custom notes
    if (customNotes.trim()) {
      editPrompt += `, also ${customNotes.trim()}`
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
