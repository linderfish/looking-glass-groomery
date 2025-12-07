// apps/web/src/app/api/looking-glass/route.ts
import { NextRequest, NextResponse } from 'next/server'

function getFalApiKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_AI_KEY
}

// Style prompts for different grooming styles
const STYLE_PROMPTS: Record<string, string> = {
  teddy: 'fluffy teddy bear grooming style, round face, soft rounded ears, plush fur texture, adorable cute appearance',
  lion: 'majestic lion cut grooming style, full fluffy mane around face and chest, short trimmed body, regal appearance',
  asian: 'trendy Asian fusion Korean Japanese grooming style, perfectly round face, fluffy cheeks, cute stylized appearance',
  creative: 'creative artistic pet grooming with vibrant colors, artistic fur patterns, magical colorful appearance',
  breed: 'professional show quality breed standard grooming, precise clean lines, elegant refined appearance',
  custom: 'professionally groomed pet, clean stylish appearance',
}

// Color modifiers for creative coloring
const COLOR_PROMPTS: Record<string, string> = {
  pink: 'cotton candy pink colored fur accents',
  purple: 'magical purple violet colored fur accents',
  blue: 'ocean blue turquoise colored fur accents',
  rainbow: 'rainbow multicolor vibrant fur with pink purple blue gradient',
  teal: 'wonderland teal aqua colored fur accents',
  gold: 'golden honey blonde highlighted fur accents',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      imageBase64,  // Base64 encoded pet photo
      imageUrl,     // Or URL to pet photo
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

    // Validate we have an image
    if (!imageBase64 && !imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'No image provided',
      }, { status: 400 })
    }

    // Build the transformation prompt
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.custom
    const colorPrompt = color ? COLOR_PROMPTS[color] || '' : ''

    const prompt = `A beautifully groomed pet portrait, ${stylePrompt}${colorPrompt ? ', ' + colorPrompt : ''}, professional pet photography, studio lighting, high quality, detailed fur texture, adorable expression, Alice in Wonderland whimsical magical atmosphere, sparkles and soft glow${customNotes ? ', ' + customNotes : ''}`

    console.log('Looking Glass prompt:', prompt)

    // For image-to-image, we need to use a model that supports it
    // Nano Banana Pro is text-to-image only, so we'll use it to generate
    // an idealized version based on the style description

    // First, let's try using the image as a reference with img2img endpoint
    // fal.ai has several options - let's use their fast SDXL img2img

    let response
    let data

    if (imageBase64 || imageUrl) {
      // Use image-to-image transformation with fal.ai's flux model
      // which supports image input for style transfer
      response = await fetch('https://fal.run/fal-ai/flux/dev/image-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image_url: imageUrl || `data:image/jpeg;base64,${imageBase64}`,
          strength: 0.65, // How much to transform (0.5-0.8 works well)
          num_inference_steps: 28,
          guidance_scale: 3.5,
          image_size: 'square',
          output_format: 'jpeg',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Flux img2img error:', response.status, errorText)

        // Fallback to Nano Banana Pro text-to-image
        console.log('Falling back to Nano Banana Pro text generation...')
        response = await fetch('https://fal.run/fal-ai/nano-banana-pro', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: `Portrait of a cute ${style === 'teddy' ? 'fluffy dog' : 'pet'} with ${stylePrompt}, ${colorPrompt || 'natural fur colors'}, professional pet portrait photography, studio lighting, magical sparkles, whimsical Alice in Wonderland style background with purple and teal, high quality 4k`,
            image_size: 'square',
            num_inference_steps: 6,
            guidance_scale: 3.5,
          }),
        })
      }

      if (!response.ok) {
        const error = await response.text()
        console.error('fal.ai error:', response.status, error)
        throw new Error(`Generation failed: ${response.status}`)
      }

      data = await response.json()
    }

    const generatedUrl = data?.images?.[0]?.url

    if (!generatedUrl) {
      throw new Error('No image generated')
    }

    return NextResponse.json({
      success: true,
      previewUrl: generatedUrl,
      style,
      color,
      prompt: prompt.substring(0, 100) + '...',
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
