// apps/web/src/app/api/looking-glass/route.ts
// Using SAM3 segmentation + FLUX inpainting for reliable, precise edits
import { NextRequest, NextResponse } from 'next/server'

function getFalApiKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_AI_KEY
}

// =============================================================================
// PROMPTS - Simplified since we now use mask-based inpainting
// The mask ensures only the dog is modified, so prompts can be more direct
// =============================================================================

const GROOMING_STYLE_PROMPTS: Record<string, string> = {
  teddy: 'A dog with a teddy bear grooming cut: round fluffy face, rounded ears, even plush fur all over. Professional pet grooming photo.',
  lion: 'A dog with a lion cut grooming style: full fluffy mane around face and neck, body fur trimmed short. Professional pet grooming photo.',
  asian: 'A dog with Asian fusion grooming style: perfectly round face shape, extra fluffy rounded cheeks, clean scissor lines. Professional pet grooming photo.',
  breed: 'A dog with show-quality breed standard grooming: precise scissor work, clean angles, professional competition grooming. Professional pet grooming photo.',
  puppy: 'A dog with a puppy cut: even fur length all over, soft and natural looking. Professional pet grooming photo.',
}

const AI_DESIGNER_PROMPTS: Record<string, string> = {
  whimsical: 'A dog with whimsical creative grooming: soft pastel colored fur in pinks, lavenders, and mint. Pet-safe dye professionally applied. Magical and playful look.',
  bold: 'A dog with bold creative grooming: vibrant saturated colors like hot pink, electric blue, or bright purple. Pet-safe dye professionally applied. Eye-catching and striking.',
  elegant: 'A dog with elegant creative grooming: refined colors like rose gold, champagne highlights, or subtle silver tones. Pet-safe dye professionally applied. Sophisticated and beautiful.',
  rainbow: 'A dog with rainbow creative grooming: multiple colors blending smoothly across the fur. Pet-safe dye professionally applied. Colorful gradient effect.',
  seasonal: 'A dog with seasonal creative grooming: colors matching the current season - warm golds and reds for fall, icy blues for winter, soft pinks for spring, bright yellows for summer. Pet-safe dye professionally applied.',
}

// =============================================================================
// STEP 1: Generate mask using SAM3 (Segment Anything Model 3)
// =============================================================================
async function generatePetMask(imageUrl: string, apiKey: string): Promise<string> {
  console.log('Step 1: Generating pet segmentation mask with SAM3...')

  const response = await fetch('https://fal.run/fal-ai/sam-3/image', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      prompt: 'dog, cat, pet, animal', // Segment the pet
      apply_mask: false, // We want the raw mask, not overlay
      output_format: 'png',
      return_multiple_masks: false, // Single combined mask
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('SAM3 segmentation error:', response.status, errorText)
    throw new Error(`Segmentation failed: ${response.status}`)
  }

  const data = await response.json()
  console.log('SAM3 response:', JSON.stringify(data).substring(0, 500))

  // SAM3 returns masks array
  const maskUrl = data?.masks?.[0]?.url
  if (!maskUrl) {
    throw new Error('No segmentation mask generated')
  }

  return maskUrl
}

// =============================================================================
// STEP 2: Apply edits using FLUX inpainting with the mask
// =============================================================================
async function applyInpainting(
  imageUrl: string,
  maskUrl: string,
  prompt: string,
  strength: number,
  apiKey: string
): Promise<string> {
  console.log('Step 2: Applying FLUX inpainting with mask...')
  console.log('Strength:', strength)
  console.log('Prompt:', prompt.substring(0, 100) + '...')

  const response = await fetch('https://fal.run/fal-ai/flux-lora/inpainting', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_url: imageUrl,
      mask_url: maskUrl,
      strength, // Lower = more preservation of original
      num_inference_steps: 28,
      guidance_scale: 3.5,
      output_format: 'png',
      num_images: 1,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('FLUX inpainting error:', response.status, errorText)
    throw new Error(`Inpainting failed: ${response.status}`)
  }

  const data = await response.json()
  console.log('FLUX inpainting response:', JSON.stringify(data).substring(0, 300))

  const generatedUrl = data?.images?.[0]?.url
  if (!generatedUrl) {
    throw new Error('No inpainted image generated')
  }

  return generatedUrl
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================
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
    let inpaintStrength = 0.5 // Default: balanced preservation

    if (mode === 'creative') {
      if (!colorDescription.trim()) {
        return NextResponse.json({
          success: false,
          error: 'Please describe what colors you want and where',
        }, { status: 400 })
      }
      // Creative color: user describes what they want
      editPrompt = `A dog with creative grooming: ${colorDescription.trim()}. Pet-safe dye professionally applied. Realistic grooming result.`
      inpaintStrength = 0.45 // Lower strength for color changes - preserve more structure

    } else if (mode === 'ai-designer') {
      // AI designer: let AI pick creative colors based on vibe
      editPrompt = AI_DESIGNER_PROMPTS[designStyle] || AI_DESIGNER_PROMPTS.whimsical
      inpaintStrength = 0.45 // Lower strength for color changes

    } else {
      // Grooming style: change fur shape
      editPrompt = GROOMING_STYLE_PROMPTS[style] || GROOMING_STYLE_PROMPTS.teddy
      inpaintStrength = 0.55 // Slightly higher for shape changes, but still preserve identity
    }

    console.log('=== Looking Glass Generation ===')
    console.log('Mode:', mode)
    console.log('Prompt:', editPrompt)
    console.log('Inpaint strength:', inpaintStrength)

    // STEP 1: Generate segmentation mask of the pet
    const maskUrl = await generatePetMask(imageUrl, apiKey)
    console.log('Mask generated:', maskUrl)

    // STEP 2: Apply inpainting with the mask
    const generatedUrl = await applyInpainting(
      imageUrl,
      maskUrl,
      editPrompt,
      inpaintStrength,
      apiKey
    )

    return NextResponse.json({
      success: true,
      previewUrl: generatedUrl,
      maskUrl, // Include for debugging/transparency
      mode,
      style: mode === 'grooming' ? style : mode === 'ai-designer' ? designStyle : null,
      prompt: editPrompt.substring(0, 150) + '...',
      strength: inpaintStrength,
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
