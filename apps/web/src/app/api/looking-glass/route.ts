// apps/web/src/app/api/looking-glass/route.ts
// Using FLUX Kontext for context-aware image editing
// Kontext understands what to preserve vs change based on prompt
import { NextRequest, NextResponse } from 'next/server'

function getFalApiKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_AI_KEY
}

// =============================================================================
// PROMPTS - Written for FLUX Kontext's context-aware editing
// Kontext excels at understanding "change X while keeping Y"
// =============================================================================

const GROOMING_STYLE_PROMPTS: Record<string, string> = {
  teddy: 'Change only the dog\'s fur styling to a teddy bear grooming cut with a round fluffy face, rounded ears, and even plush fur. Keep the exact same dog, same pose, same background, same lighting. Only modify the fur shape.',
  lion: 'Change only the dog\'s fur styling to a lion cut with a full fluffy mane around face and neck, and shorter body fur. Keep the exact same dog, same pose, same background, same lighting. Only modify the fur shape.',
  asian: 'Change only the dog\'s fur styling to an Asian fusion grooming style with a perfectly round face shape, extra fluffy rounded cheeks, and clean scissor lines. Keep the exact same dog, same pose, same background, same lighting. Only modify the fur shape.',
  breed: 'Change only the dog\'s fur styling to show-quality breed standard grooming with precise scissor work and clean angles. Keep the exact same dog, same pose, same background, same lighting. Only modify the fur shape.',
  puppy: 'Change only the dog\'s fur styling to a puppy cut with even fur length all over, soft and natural looking. Keep the exact same dog, same pose, same background, same lighting. Only modify the fur shape.',
}

const AI_DESIGNER_PROMPTS: Record<string, string> = {
  whimsical: 'Add soft pastel colored fur dye to the dog in pinks, lavenders, and mint colors. Apply the color naturally to the fur like a professional pet-safe dye job. Keep the exact same dog, same pose, same background, same lighting. Only add color to the existing fur.',
  bold: 'Add vibrant colored fur dye to the dog in hot pink, electric blue, or bright purple. Apply the color naturally to the fur like a professional pet-safe dye job. Keep the exact same dog, same pose, same background, same lighting. Only add color to the existing fur.',
  elegant: 'Add refined colored fur dye to the dog in rose gold, champagne, or silver tones. Apply the color naturally to the fur like a professional pet-safe dye job. Keep the exact same dog, same pose, same background, same lighting. Only add color to the existing fur.',
  rainbow: 'Add rainbow colored fur dye to the dog with multiple colors blending smoothly. Apply the color naturally to the fur like a professional pet-safe dye job. Keep the exact same dog, same pose, same background, same lighting. Only add color to the existing fur.',
  seasonal: 'Add seasonal themed colored fur dye to the dog. Apply the color naturally to the fur like a professional pet-safe dye job. Keep the exact same dog, same pose, same background, same lighting. Only add color to the existing fur.',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      imageUrl,
      mode = 'grooming',
      style = 'teddy',
      colorDescription = '',
      designStyle = 'whimsical',
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

    // Build the prompt based on mode
    let editPrompt = ''

    if (mode === 'creative') {
      if (!colorDescription.trim()) {
        return NextResponse.json({
          success: false,
          error: 'Please describe what colors you want and where',
        }, { status: 400 })
      }
      // Creative color: user describes what they want
      editPrompt = `Add colored fur dye to the dog: ${colorDescription.trim()}. Apply the color naturally to the fur like a professional pet-safe dye job. Keep the exact same dog, same pose, same background, same lighting. Only add color to the existing fur, do not change anything else.`

    } else if (mode === 'ai-designer') {
      // AI designer: let AI pick creative colors based on vibe
      editPrompt = AI_DESIGNER_PROMPTS[designStyle] || AI_DESIGNER_PROMPTS.whimsical

    } else {
      // Grooming style: change fur shape
      editPrompt = GROOMING_STYLE_PROMPTS[style] || GROOMING_STYLE_PROMPTS.teddy
    }

    console.log('=== Looking Glass Generation ===')
    console.log('Mode:', mode)
    console.log('Prompt:', editPrompt)

    // Use FLUX Kontext for context-aware editing
    // Kontext is designed to understand "change X while keeping Y"
    const response = await fetch('https://fal.run/fal-ai/flux-kontext-lora', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: editPrompt,
        image_url: imageUrl,
        strength: 0.85, // High strength works better for Kontext
        num_inference_steps: 30,
        guidance_scale: 3.0, // Moderate guidance to follow prompt but not overdo it
        output_format: 'png',
        num_images: 1,
        resolution_mode: 'match_input', // Keep same resolution as input
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('FLUX Kontext error:', response.status, errorText)
      throw new Error(`Generation failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('FLUX Kontext response:', JSON.stringify(data).substring(0, 300))

    const generatedUrl = data?.images?.[0]?.url
    if (!generatedUrl) {
      throw new Error('No image generated')
    }

    return NextResponse.json({
      success: true,
      previewUrl: generatedUrl,
      mode,
      style: mode === 'grooming' ? style : mode === 'ai-designer' ? designStyle : null,
      prompt: editPrompt.substring(0, 150) + '...',
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
