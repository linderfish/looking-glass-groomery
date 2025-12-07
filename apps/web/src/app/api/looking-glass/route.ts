// apps/web/src/app/api/looking-glass/route.ts
// All modes use FLUX Kontext Pro with careful prompting to preserve original pet
// The key is VERY specific prompts that tell the AI exactly what to change and what to keep
// Supports both BFL direct API and fal.ai
import { NextRequest, NextResponse } from 'next/server'

// Get API key - prefer BFL direct, fallback to fal.ai
function getApiConfig(): { type: 'bfl' | 'fal'; key: string } | null {
  const bflKey = process.env.BFL_API_KEY
  if (bflKey) {
    return { type: 'bfl', key: bflKey }
  }
  const falKey = process.env.FAL_KEY || process.env.FAL_AI_KEY
  if (falKey) {
    return { type: 'fal', key: falKey }
  }
  return null
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
// Generate with FLUX Kontext Pro via BFL direct API
// =============================================================================
async function generateWithBFL(imageUrl: string, prompt: string, apiKey: string): Promise<string> {
  console.log('Generating with BFL FLUX Kontext Pro...')
  console.log('Prompt:', prompt.substring(0, 100) + '...')

  // Step 1: Submit the generation request
  const submitResponse = await fetch('https://api.bfl.ai/v1/flux-kontext-pro', {
    method: 'POST',
    headers: {
      'x-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      input_image: imageUrl, // BFL accepts URL or base64
      output_format: 'png',
      safety_tolerance: 6, // 0-6, higher = more permissive
    }),
  })

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text()
    console.error('BFL submit error:', submitResponse.status, errorText)
    throw new Error(`BFL submission failed: ${submitResponse.status}`)
  }

  const submitData = await submitResponse.json()
  const taskId = submitData.id
  console.log('BFL task submitted:', taskId)

  // Step 2: Poll for result
  let attempts = 0
  const maxAttempts = 60 // 60 seconds max

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

    const resultResponse = await fetch(`https://api.bfl.ai/v1/get_result?id=${taskId}`, {
      headers: { 'x-key': apiKey },
    })

    if (!resultResponse.ok) {
      console.error('BFL poll error:', resultResponse.status)
      attempts++
      continue
    }

    const resultData = await resultResponse.json()
    console.log('BFL status:', resultData.status)

    if (resultData.status === 'Ready') {
      const imageUrl = resultData.result?.sample
      if (imageUrl) {
        return imageUrl
      }
      throw new Error('No image in BFL result')
    }

    if (resultData.status === 'Error' || resultData.status === 'Failed') {
      throw new Error(`BFL generation failed: ${resultData.error || 'Unknown error'}`)
    }

    attempts++
  }

  throw new Error('BFL generation timed out')
}

// =============================================================================
// Generate with FLUX Kontext Pro via fal.ai
// =============================================================================
async function generateWithFal(imageUrl: string, prompt: string, apiKey: string): Promise<string> {
  console.log('Generating with fal.ai FLUX Kontext Pro...')
  console.log('Prompt:', prompt.substring(0, 100) + '...')

  const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_url: imageUrl,
      output_format: 'png',
      safety_tolerance: '6',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('fal.ai error:', response.status, errorText)
    throw new Error(`fal.ai generation failed: ${response.status}`)
  }

  const data = await response.json()
  const generatedUrl = data?.images?.[0]?.url

  if (!generatedUrl) {
    console.error('No image in fal.ai response:', JSON.stringify(data).substring(0, 500))
    throw new Error('No image generated')
  }

  return generatedUrl
}

// =============================================================================
// Generate with appropriate API based on config
// =============================================================================
async function generateWithKontext(imageUrl: string, prompt: string, config: { type: 'bfl' | 'fal'; key: string }): Promise<string> {
  if (config.type === 'bfl') {
    return generateWithBFL(imageUrl, prompt, config.key)
  } else {
    return generateWithFal(imageUrl, prompt, config.key)
  }
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

  // Determine if this is a pattern request or all-over color
  const hasPatterns = desc.includes('heart') || desc.includes('star') || desc.includes('paw')

  // Construct the full prompt with STRICT preservation instructions
  let prompt: string

  if (hasPatterns) {
    // Pattern-based: emphasize the patterns, not all-over color
    prompt = `Add ${colorInstructions}designs to the dog's fur as creative grooming art. The patterns should be visible against the dog's natural fur color - do NOT dye all the fur, only add the decorative pattern shapes. ${userDescription}.

CRITICAL REQUIREMENTS:
1. Keep the dog's face completely natural - no color on the face, eyes, nose, or muzzle
2. Keep the dog's exact body pose, fur texture, and background IDENTICAL
3. The patterns should look like professional pet-safe stenciled designs
4. Leave most of the fur the natural color - only the pattern shapes should be colored
5. The dog must be clearly recognizable as the same dog`
  } else {
    // All-over color request
    prompt = `Add ${colorInstructions}fur dye to the dog's body fur. ${userDescription}.

CRITICAL REQUIREMENTS:
1. Keep the dog's face more natural - lighter color or no color on the face/muzzle area
2. Keep the dog's exact body pose, fur texture, and background IDENTICAL
3. The color should look like professional pet-safe fur dye
4. The dog must be clearly recognizable as the same dog`
  }

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

    const apiConfig = getApiConfig()

    if (!apiConfig) {
      return NextResponse.json({
        success: false,
        error: 'API not configured',
        message: 'Looking Glass preview is not available - no API key configured (BFL_API_KEY or FAL_KEY)',
      }, { status: 503 })
    }

    console.log('Using API:', apiConfig.type)

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
    const previewUrl = await generateWithKontext(imageUrl, prompt, apiConfig)

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
