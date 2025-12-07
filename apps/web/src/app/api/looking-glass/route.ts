// apps/web/src/app/api/looking-glass/route.ts
import { NextRequest, NextResponse } from 'next/server'

function getFalApiKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_AI_KEY
}

// Edit prompts for Nano Banana Pro - ONLY change the fur/grooming, nothing else
const STYLE_EDIT_PROMPTS: Record<string, string> = {
  teddy: 'Only change the fur grooming style to a teddy bear cut with round fluffy face and soft plush fur. Do not change the background, pose, eyes, nose, or any other features. Keep everything else exactly the same.',
  lion: 'Only change the fur grooming style to a lion cut with fluffy mane around face and short trimmed body fur. Do not change the background, pose, eyes, nose, or any other features. Keep everything else exactly the same.',
  asian: 'Only change the fur grooming style to Asian fusion style with perfectly round face shape and fluffy cheeks. Do not change the background, pose, eyes, nose, or any other features. Keep everything else exactly the same.',
  creative: 'Only add colorful pet-safe dye to the fur in an artistic pattern. Do not change the background, pose, eyes, nose, fur shape, or any other features. Keep everything else exactly the same.',
  breed: 'Only change the fur grooming to show-quality breed standard with clean precise lines. Do not change the background, pose, eyes, nose, or any other features. Keep everything else exactly the same.',
  custom: 'Only change the fur to look professionally groomed and well-styled. Do not change the background, pose, eyes, nose, or any other features. Keep everything else exactly the same.',
}

// Color additions for creative style - minimal changes only
const COLOR_EDIT_ADDITIONS: Record<string, string> = {
  pink: ' Add pink color only to the ear tips and tail.',
  purple: ' Add purple color only to the ear tips and tail.',
  blue: ' Add blue color only to the ear tips and tail.',
  rainbow: ' Add rainbow pink purple blue gradient only to the ears and tail.',
  teal: ' Add teal color only to the ear tips and tail.',
  gold: ' Add golden highlights only to the ear tips.',
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
        resolution: '1K',
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
