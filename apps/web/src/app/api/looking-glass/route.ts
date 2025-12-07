// apps/web/src/app/api/looking-glass/route.ts
import { NextRequest, NextResponse } from 'next/server'

function getFalApiKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_AI_KEY
}

// Edit prompts for Nano Banana Pro - these describe what to CHANGE
const STYLE_EDIT_PROMPTS: Record<string, string> = {
  teddy: 'Transform this pet into a professionally groomed teddy bear cut style with a perfectly round fluffy face, rounded ears, plush soft fur texture all over the body, keeping the same pet but with adorable teddy bear grooming',
  lion: 'Transform this pet into a professional lion cut grooming style with a full majestic fluffy mane around the face neck and chest, with the body fur trimmed short and neat, keeping the same pet but with elegant lion styling',
  asian: 'Transform this pet into a trendy Asian fusion grooming style with a perfectly round face shape, extra fluffy rounded cheeks, cute button nose visible, stylish Korean/Japanese pet salon look, keeping the same pet',
  creative: 'Transform this pet with creative artistic grooming, add vibrant safe pet hair dye colors in a beautiful artistic pattern, magical colorful fur design, keeping the same pet but with creative color artistry',
  breed: 'Transform this pet into a professional show-quality breed standard grooming with precise clean scissor lines, elegant refined coat styling, perfectly balanced proportions, keeping the same pet but show-ready',
  custom: 'Transform this pet with professional grooming, clean well-styled coat, polished refined appearance, keeping the same pet but beautifully groomed',
}

// Color additions for creative style
const COLOR_EDIT_ADDITIONS: Record<string, string> = {
  pink: ', add cotton candy pink color to the ears and tail tips',
  purple: ', add magical purple violet color accents throughout the coat',
  blue: ', add ocean blue turquoise color to the ears paws and tail',
  rainbow: ', add rainbow gradient colors flowing through the fur in pink purple and blue',
  teal: ', add wonderland teal aqua color accents on the ears and chest',
  gold: ', add golden honey blonde highlights throughout the coat',
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
