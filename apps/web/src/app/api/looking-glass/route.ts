// apps/web/src/app/api/looking-glass/route.ts
// Hybrid approach:
// - Color modes: Get segmentation mask, apply color in browser (100% preserves original)
// - Grooming modes: Use AI generation (labeled as "artistic inspiration")
import { NextRequest, NextResponse } from 'next/server'

function getFalApiKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_AI_KEY
}

// =============================================================================
// COLOR DEFINITIONS for canvas-based overlay
// These will be applied client-side using the mask
// =============================================================================
const COLOR_PRESETS: Record<string, { hue: number; saturation: number; name: string }> = {
  // Whimsical - soft pastels
  whimsical_pink: { hue: 330, saturation: 40, name: 'Soft Pink' },
  whimsical_lavender: { hue: 270, saturation: 35, name: 'Lavender' },
  whimsical_mint: { hue: 150, saturation: 30, name: 'Mint' },
  // Bold - vibrant colors
  bold_hotpink: { hue: 330, saturation: 90, name: 'Hot Pink' },
  bold_blue: { hue: 210, saturation: 85, name: 'Electric Blue' },
  bold_purple: { hue: 280, saturation: 80, name: 'Vivid Purple' },
  // Elegant - refined tones
  elegant_rosegold: { hue: 15, saturation: 45, name: 'Rose Gold' },
  elegant_champagne: { hue: 45, saturation: 30, name: 'Champagne' },
  elegant_silver: { hue: 220, saturation: 10, name: 'Silver' },
  // Rainbow - multiple colors (client will handle gradient)
  rainbow: { hue: 0, saturation: 70, name: 'Rainbow' },
  // Seasonal
  seasonal_spring: { hue: 330, saturation: 50, name: 'Spring Pink' },
  seasonal_summer: { hue: 45, saturation: 70, name: 'Summer Gold' },
  seasonal_fall: { hue: 25, saturation: 60, name: 'Fall Orange' },
  seasonal_winter: { hue: 200, saturation: 40, name: 'Winter Blue' },
}

// =============================================================================
// GROOMING STYLE PROMPTS (AI-generated, labeled as inspiration)
// =============================================================================
const GROOMING_STYLE_PROMPTS: Record<string, string> = {
  teddy: 'A cute dog with a teddy bear grooming cut: round fluffy face, rounded ears, even plush fur all over. Professional pet grooming photo, studio lighting.',
  lion: 'A dog with a lion cut grooming style: full fluffy mane around face and neck, shorter body fur. Professional pet grooming photo, studio lighting.',
  asian: 'A dog with Asian fusion grooming style: perfectly round face shape, fluffy rounded cheeks, clean scissor lines. Professional pet grooming photo, studio lighting.',
  breed: 'A dog with show-quality breed standard grooming: precise scissor work, clean angles, professional competition grooming. Professional pet grooming photo, studio lighting.',
  puppy: 'A dog with a puppy cut: even fur length all over, soft and natural looking. Professional pet grooming photo, studio lighting.',
}

// =============================================================================
// Get segmentation mask for color overlay (used by creative/ai-designer modes)
// =============================================================================
async function getSegmentationMask(imageUrl: string, apiKey: string): Promise<{ maskUrl: string; isolatedUrl: string }> {
  console.log('Getting segmentation mask with BiRefNet...')

  const response = await fetch('https://fal.run/fal-ai/birefnet', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      model: 'General Use (Heavy)', // Best quality
      operating_resolution: '1024x1024',
      output_mask: true, // We need the mask for color overlay
      refine_foreground: true,
      output_format: 'png',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('BiRefNet error:', response.status, errorText)
    throw new Error(`Segmentation failed: ${response.status}`)
  }

  const data = await response.json()
  console.log('BiRefNet response:', JSON.stringify(data).substring(0, 300))

  const isolatedUrl = data?.image?.url
  const maskUrl = data?.mask_image?.url

  if (!maskUrl) {
    throw new Error('No segmentation mask generated')
  }

  return { maskUrl, isolatedUrl: isolatedUrl || maskUrl }
}

// =============================================================================
// Generate AI grooming style (for shape changes only)
// =============================================================================
async function generateGroomingPreview(imageUrl: string, style: string, apiKey: string): Promise<string> {
  console.log('Generating AI grooming preview with FLUX Kontext...')

  const prompt = GROOMING_STYLE_PROMPTS[style] || GROOMING_STYLE_PROMPTS.teddy

  const response = await fetch('https://fal.run/fal-ai/flux-kontext-lora', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_url: imageUrl,
      strength: 0.75, // Balance between reference and style
      num_inference_steps: 28,
      guidance_scale: 3.5,
      output_format: 'png',
      num_images: 1,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('FLUX Kontext error:', response.status, errorText)
    throw new Error(`Generation failed: ${response.status}`)
  }

  const data = await response.json()
  const generatedUrl = data?.images?.[0]?.url

  if (!generatedUrl) {
    throw new Error('No image generated')
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
      colorPreset = '', // For direct color selection
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
    console.log('Mode:', mode)

    // =======================================================================
    // GROOMING MODE - AI generated (labeled as "artistic inspiration")
    // This is the only mode that uses AI to regenerate
    // =======================================================================
    if (mode === 'grooming') {
      const previewUrl = await generateGroomingPreview(imageUrl, style, apiKey)

      return NextResponse.json({
        success: true,
        previewUrl,
        mode: 'grooming',
        style,
        method: 'ai-generated', // Client knows to show "artistic inspiration" label
        disclaimer: 'AI-generated artistic interpretation. Actual results will be tailored to your pet.',
      })
    }

    // =======================================================================
    // CREATIVE & AI-DESIGNER MODES - Canvas-based color overlay
    // Returns mask + color info, client applies the color
    // Original image is 100% preserved
    // =======================================================================

    // Get segmentation mask
    const { maskUrl, isolatedUrl } = await getSegmentationMask(imageUrl, apiKey)

    // Determine color settings
    let colorSettings: { hue: number; saturation: number; name: string } | null = null

    if (mode === 'creative') {
      if (!colorDescription.trim()) {
        return NextResponse.json({
          success: false,
          error: 'Please describe what colors you want',
        }, { status: 400 })
      }

      // Parse user's color description into approximate hue/saturation
      // This is a simple keyword-based approach
      const desc = colorDescription.toLowerCase()
      if (desc.includes('pink')) {
        colorSettings = { hue: 330, saturation: 60, name: 'Pink' }
      } else if (desc.includes('purple') || desc.includes('violet')) {
        colorSettings = { hue: 280, saturation: 65, name: 'Purple' }
      } else if (desc.includes('blue')) {
        colorSettings = { hue: 210, saturation: 70, name: 'Blue' }
      } else if (desc.includes('green') || desc.includes('mint') || desc.includes('teal')) {
        colorSettings = { hue: 160, saturation: 55, name: 'Green/Teal' }
      } else if (desc.includes('orange')) {
        colorSettings = { hue: 30, saturation: 75, name: 'Orange' }
      } else if (desc.includes('red')) {
        colorSettings = { hue: 0, saturation: 70, name: 'Red' }
      } else if (desc.includes('yellow') || desc.includes('gold')) {
        colorSettings = { hue: 50, saturation: 65, name: 'Yellow/Gold' }
      } else if (desc.includes('rainbow')) {
        colorSettings = { hue: -1, saturation: 70, name: 'Rainbow' } // -1 = rainbow mode
      } else {
        // Default to a soft pink if we can't parse
        colorSettings = { hue: 330, saturation: 50, name: 'Custom' }
      }

    } else if (mode === 'ai-designer') {
      // Map design style to color preset
      const styleToPreset: Record<string, string> = {
        whimsical: 'whimsical_pink',
        bold: 'bold_hotpink',
        elegant: 'elegant_rosegold',
        rainbow: 'rainbow',
        seasonal: 'seasonal_spring', // TODO: detect actual season
      }
      const presetKey = styleToPreset[designStyle] || 'whimsical_pink'
      colorSettings = COLOR_PRESETS[presetKey]
    }

    return NextResponse.json({
      success: true,
      // For color modes, we return the mask and color info
      // Client will composite the color using Canvas API
      mode,
      method: 'canvas-overlay', // Client knows to use canvas compositing
      maskUrl,
      isolatedUrl,
      originalUrl: imageUrl,
      colorSettings,
      style: mode === 'ai-designer' ? designStyle : null,
      colorDescription: mode === 'creative' ? colorDescription : null,
      instructions: 'Apply color overlay using Canvas API with the provided mask. Original image is preserved.',
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
