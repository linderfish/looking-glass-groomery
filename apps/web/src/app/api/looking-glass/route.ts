// apps/web/src/app/api/looking-glass/route.ts
// All modes use FLUX Kontext Pro with careful prompting to preserve original pet
// The key is VERY specific prompts that tell the AI exactly what to change and what to keep
import { NextRequest, NextResponse } from 'next/server'

function getFalApiKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_AI_KEY
}

// =============================================================================
// GROOMING STYLE PROMPTS
// These change the fur shape - must be labeled as "artistic inspiration"
// =============================================================================
const GROOMING_STYLE_PROMPTS: Record<string, string> = {
  teddy: 'Change the dog\'s fur to a teddy bear grooming cut with round fluffy face and rounded ears. Keep the dog\'s exact face, eyes, nose, expression, body pose, and background identical. Only modify the fur shape and length.',
  lion: 'Change the dog\'s fur to a lion cut grooming style with full fluffy mane around face and neck, and shorter body fur. Keep the dog\'s exact face, eyes, nose, expression, body pose, and background identical. Only modify the fur shape.',
  asian: 'Change the dog\'s fur to Asian fusion grooming style with perfectly round face shape and fluffy rounded cheeks. Keep the dog\'s exact face, eyes, nose, expression, body pose, and background identical. Only modify the fur shape.',
  breed: 'Change the dog\'s fur to show-quality breed standard grooming with precise scissor work and clean angles. Keep the dog\'s exact face, eyes, nose, expression, body pose, and background identical. Only modify the fur shape.',
  puppy: 'Change the dog\'s fur to a puppy cut with even fur length all over, soft and natural looking. Keep the dog\'s exact face, eyes, nose, expression, body pose, and background identical. Only modify the fur length.',
}

// =============================================================================
// AI DESIGNER STYLE PROMPTS
// These add creative color/patterns to the fur
// =============================================================================
const AI_DESIGNER_PROMPTS: Record<string, string> = {
  whimsical: 'Add soft pastel pink and lavender colored fur dye to the dog\'s fur in a whimsical fairy-tale style. Keep the dog\'s exact face shape, eyes, nose, expression, body pose, fur texture, and background completely identical. Only add gentle pastel color to the existing fur.',
  bold: 'Add vibrant hot pink and electric blue colored fur dye to the dog\'s fur in bold vivid sections. Keep the dog\'s exact face shape, eyes, nose, expression, body pose, fur texture, and background completely identical. Only add bold color to the existing fur.',
  elegant: 'Add rose gold and champagne colored fur dye to the dog\'s fur in an elegant refined style. Keep the dog\'s exact face shape, eyes, nose, expression, body pose, fur texture, and background completely identical. Only add sophisticated color tints to the existing fur.',
  rainbow: 'Add rainbow colored fur dye to the dog\'s fur with red, orange, yellow, green, blue, and purple sections blending together. Keep the dog\'s exact face shape, eyes, nose, expression, body pose, fur texture, and background completely identical. Only add rainbow colors to the existing fur.',
  seasonal: 'Add festive holiday-themed colored fur dye to the dog\'s fur with red and green Christmas colors, plus small decorative heart patterns stenciled in the fur. Keep the dog\'s exact face shape, eyes, nose, expression, body pose, fur texture, and background completely identical. Only add seasonal colors and small patterns to the existing fur.',
}

// =============================================================================
// Generate with FLUX Kontext Pro - uses very specific prompts to preserve pet
// =============================================================================
async function generateWithKontext(imageUrl: string, prompt: string, apiKey: string): Promise<string> {
  console.log('Generating with FLUX Kontext Pro...')
  console.log('Prompt:', prompt.substring(0, 100) + '...')

  // Use FLUX Kontext Pro for best quality and adherence to prompts
  const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_url: imageUrl,
      aspect_ratio: 'match_input_image', // Preserve original dimensions
      output_format: 'png',
      safety_tolerance: 6, // More permissive for pet colors
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('FLUX Kontext Pro error:', response.status, errorText)
    throw new Error(`Generation failed: ${response.status}`)
  }

  const data = await response.json()
  console.log('FLUX response keys:', Object.keys(data))

  const generatedUrl = data?.images?.[0]?.url

  if (!generatedUrl) {
    console.error('No image in response:', JSON.stringify(data).substring(0, 500))
    throw new Error('No image generated')
  }

  return generatedUrl
}

// =============================================================================
// Build creative prompt from user description
// Constructs a very specific prompt that preserves the pet while adding colors
// =============================================================================
function buildCreativePrompt(userDescription: string): string {
  // Clean and parse the description
  const desc = userDescription.toLowerCase().trim()

  // Build specific color instructions based on what user asked for
  let colorInstructions = ''

  // Detect specific patterns/designs
  if (desc.includes('heart')) {
    colorInstructions += 'small heart-shaped patterns stenciled into the fur, '
  }
  if (desc.includes('star')) {
    colorInstructions += 'small star-shaped patterns stenciled into the fur, '
  }
  if (desc.includes('paw') || desc.includes('pawprint')) {
    colorInstructions += 'small paw print patterns stenciled into the fur, '
  }

  // Detect colors
  const colors: string[] = []
  if (desc.includes('red')) colors.push('red')
  if (desc.includes('pink')) colors.push('pink')
  if (desc.includes('purple') || desc.includes('violet')) colors.push('purple')
  if (desc.includes('blue')) colors.push('blue')
  if (desc.includes('green')) colors.push('green')
  if (desc.includes('orange')) colors.push('orange')
  if (desc.includes('yellow')) colors.push('yellow')
  if (desc.includes('rainbow')) colors.push('rainbow-colored')
  if (desc.includes('gold')) colors.push('gold')
  if (desc.includes('silver')) colors.push('silver')

  // Detect themes
  if (desc.includes('christmas') || desc.includes('holiday') || desc.includes('festive')) {
    colorInstructions += 'festive Christmas-themed '
  }
  if (desc.includes('valentine')) {
    colorInstructions += 'Valentine\'s Day themed '
  }
  if (desc.includes('halloween') || desc.includes('spooky')) {
    colorInstructions += 'Halloween-themed '
  }
  if (desc.includes('easter') || desc.includes('spring')) {
    colorInstructions += 'spring/Easter-themed pastel '
  }

  // Build the color part
  if (colors.length > 0) {
    colorInstructions += colors.join(' and ') + ' colored '
  } else if (!colorInstructions) {
    // Default to something if no color specified
    colorInstructions = 'colorful '
  }

  // Construct the full prompt with STRICT preservation instructions
  const prompt = `Add ${colorInstructions}fur dye to the dog's fur. ${userDescription}.

CRITICAL: Keep the dog's exact face shape, exact eyes, exact nose, exact expression, exact body pose, exact fur texture and length, and exact background COMPLETELY IDENTICAL. Do not change ANYTHING about the dog except adding color/patterns to the fur. The dog must look exactly like itself, just with added color.`

  return prompt
}

// =============================================================================
// MAIN API HANDLER
// All modes now use FLUX Kontext Pro with specific prompts
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

    console.log('=== Looking Glass Generation ===')
    console.log('Mode:', mode, '| Style:', style, '| DesignStyle:', designStyle)

    let prompt: string
    let disclaimer: string

    // =======================================================================
    // GROOMING MODE - Changes fur shape (most invasive)
    // =======================================================================
    if (mode === 'grooming') {
      prompt = GROOMING_STYLE_PROMPTS[style] || GROOMING_STYLE_PROMPTS.teddy
      disclaimer = 'AI-generated grooming style preview. Your pet\'s actual results will be tailored by our professional groomer.'
    }
    // =======================================================================
    // AI DESIGNER MODE - Predefined color themes
    // =======================================================================
    else if (mode === 'ai-designer') {
      prompt = AI_DESIGNER_PROMPTS[designStyle] || AI_DESIGNER_PROMPTS.whimsical
      disclaimer = 'AI-generated color preview showing how pet-safe dye colors could look on your pet.'
    }
    // =======================================================================
    // CREATIVE MODE - User describes what they want
    // =======================================================================
    else if (mode === 'creative') {
      if (!colorDescription.trim()) {
        return NextResponse.json({
          success: false,
          error: 'Please describe what colors or patterns you want',
        }, { status: 400 })
      }
      prompt = buildCreativePrompt(colorDescription)
      disclaimer = 'AI-generated creative color preview based on your description. Actual results crafted by our professional groomer.'
    }
    // =======================================================================
    // Unknown mode
    // =======================================================================
    else {
      return NextResponse.json({
        success: false,
        error: 'Invalid mode',
      }, { status: 400 })
    }

    console.log('Built prompt:', prompt.substring(0, 150) + '...')

    // Generate with FLUX Kontext Pro
    const previewUrl = await generateWithKontext(imageUrl, prompt, apiKey)

    return NextResponse.json({
      success: true,
      previewUrl,
      mode,
      style: mode === 'grooming' ? style : (mode === 'ai-designer' ? designStyle : null),
      colorDescription: mode === 'creative' ? colorDescription : null,
      method: 'ai-generated',
      disclaimer,
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
