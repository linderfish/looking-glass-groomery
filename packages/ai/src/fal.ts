// packages/ai/src/fal.ts
import { fal } from '@fal-ai/client'

fal.config({
  credentials: process.env.FAL_AI_KEY,
})

export interface PetStylePreviewRequest {
  petPhotoUrl: string
  styleDescription: string
  angle?: 'front' | 'left' | 'right' | 'back' | 'top'
}

export interface PetStylePreviewResult {
  imageUrl: string
  angle: string
}

/**
 * Generate a style preview for a pet using fal.ai Flux Pro
 */
export async function generatePetStylePreview(
  request: PetStylePreviewRequest
): Promise<PetStylePreviewResult> {
  const prompt = buildStylePrompt(request.styleDescription, request.angle)

  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt,
      image_url: request.petPhotoUrl,
      num_images: 1,
      image_size: 'square_hd',
      guidance_scale: 7.5,
      num_inference_steps: 28,
    },
    logs: true,
  })

  const data = result.data as { images: Array<{ url: string }> }

  return {
    imageUrl: data.images[0].url,
    angle: request.angle || 'front',
  }
}

/**
 * Generate all angles for a complete preview
 */
export async function generateFullPreview(
  petPhotoUrl: string,
  styleDescription: string
): Promise<Record<string, string>> {
  const angles = ['front', 'left', 'right', 'back', 'top'] as const

  const results = await Promise.all(
    angles.map(angle =>
      generatePetStylePreview({ petPhotoUrl, styleDescription, angle })
    )
  )

  return results.reduce((acc, result) => {
    acc[result.angle] = result.imageUrl
    return acc
  }, {} as Record<string, string>)
}

/**
 * Generate a "makeover preview" for shelter pets
 */
export async function generateShelterMakeoverPreview(
  originalPhotoUrl: string,
  makeoverStyle: string = 'beautifully groomed, clean, colorful, happy, adoptable'
): Promise<string> {
  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt: `A ${makeoverStyle} pet, professional grooming, vibrant colors, clean and fluffy, ready for adoption, magical transformation, Alice in Wonderland aesthetic, whimsical`,
      image_url: originalPhotoUrl,
      num_images: 1,
      image_size: 'square_hd',
      guidance_scale: 7.5,
    },
  })

  const data = result.data as { images: Array<{ url: string }> }
  return data.images[0].url
}

function buildStylePrompt(description: string, angle?: string): string {
  const angleInstructions: Record<string, string> = {
    front: 'front view, facing camera',
    left: 'left side profile view',
    right: 'right side profile view',
    back: 'back view, facing away',
    top: 'top-down view from above',
  }

  const angleText = angle ? angleInstructions[angle] : ''

  return `A professionally groomed pet with the following style: ${description}. ${angleText}. High quality, detailed fur texture, professional pet photography, studio lighting, Alice in Wonderland whimsical aesthetic.`
}
