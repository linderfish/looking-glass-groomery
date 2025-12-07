// packages/ai/src/looking-glass/preview-generator.ts
import { fal } from '@fal-ai/client'
import { parseStyleDescription, buildImagePrompt, ParsedStyle } from './style-parser'

fal.config({
  credentials: process.env.FAL_AI_KEY,
})

export interface PreviewRequest {
  petPhotoUrl: string
  styleDescription: string
  petInfo: {
    species: string
    breed?: string
    size?: string
  }
}

export interface PreviewResult {
  angles: {
    front: string
    left: string
    right: string
    back: string
    top: string
  }
  parsedStyle: ParsedStyle
  generationTime: number
}

export interface SingleAngleResult {
  angle: string
  imageUrl: string
}

/**
 * Generate all 5 angles of a pet style preview
 */
export async function generateFullPreview(
  request: PreviewRequest
): Promise<PreviewResult> {
  const startTime = Date.now()

  // Parse the style description
  const parsedStyle = await parseStyleDescription(
    request.styleDescription,
    request.petInfo
  )

  // Generate all angles in parallel
  const angles = ['front', 'left', 'right', 'back', 'top'] as const

  const results = await Promise.all(
    angles.map(angle => generateSingleAngle(
      request.petPhotoUrl,
      parsedStyle,
      angle,
      request.petInfo
    ))
  )

  const angleMap = results.reduce((acc, result) => {
    acc[result.angle as keyof PreviewResult['angles']] = result.imageUrl
    return acc
  }, {} as PreviewResult['angles'])

  return {
    angles: angleMap,
    parsedStyle,
    generationTime: Date.now() - startTime,
  }
}

/**
 * Generate a single angle preview
 */
export async function generateSingleAngle(
  petPhotoUrl: string,
  parsedStyle: ParsedStyle,
  angle: 'front' | 'left' | 'right' | 'back' | 'top',
  petInfo: { species: string; breed?: string }
): Promise<SingleAngleResult> {
  const prompt = buildImagePrompt(parsedStyle, angle, petInfo)

  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
      input: {
        prompt,
        image_url: petPhotoUrl,
        num_images: 1,
        image_size: 'square_hd',
        guidance_scale: 7.5,
        num_inference_steps: 28,
        enable_safety_checker: true,
      },
      logs: true,
    })

    const data = result.data as { images: Array<{ url: string }> }
    return {
      angle,
      imageUrl: data.images[0].url,
    }
  } catch (error) {
    console.error(`Failed to generate ${angle} angle:`, error)
    throw error
  }
}

/**
 * Regenerate a single angle with modified description
 */
export async function regenerateAngle(
  petPhotoUrl: string,
  parsedStyle: ParsedStyle,
  angle: 'front' | 'left' | 'right' | 'back' | 'top',
  modification: string,
  petInfo: { species: string; breed?: string }
): Promise<SingleAngleResult> {
  // Merge the modification into the prompt
  const basePrompt = buildImagePrompt(parsedStyle, angle, petInfo)
  const modifiedPrompt = `${basePrompt}\n\nAdditional modification: ${modification}`

  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt: modifiedPrompt,
      image_url: petPhotoUrl,
      num_images: 1,
      image_size: 'square_hd',
      guidance_scale: 7.5,
      num_inference_steps: 28,
    },
  })

  const data = result.data as { images: Array<{ url: string }> }
  return {
    angle,
    imageUrl: data.images[0].url,
  }
}

/**
 * Generate a quick preview (front angle only) for initial feedback
 */
export async function generateQuickPreview(
  request: PreviewRequest
): Promise<{ imageUrl: string; parsedStyle: ParsedStyle }> {
  const parsedStyle = await parseStyleDescription(
    request.styleDescription,
    request.petInfo
  )

  const result = await generateSingleAngle(
    request.petPhotoUrl,
    parsedStyle,
    'front',
    request.petInfo
  )

  return {
    imageUrl: result.imageUrl,
    parsedStyle,
  }
}
