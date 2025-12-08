import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

/**
 * Professional grooming physics knowledge for realistic AI generation
 */
const GROOMING_REALISM_RULES = `
CRITICAL REALISM RULES - Pet-safe dyes behave differently from digital graphics:

1. DYE BLEED: All color edges must be SOFT and FEATHERED - dye naturally bleeds into surrounding fur. NO sharp color boundaries ever.

2. PATTERN SIZE: Minimum practical pattern is 3+ inches. Small hearts/stars/paws blur into unrecognizable blobs. Make all patterns LARGE and SIMPLE.

3. SATURATION: Pet-safe dyes are semi-transparent - they TINT fur, not paint it. Colors appear natural and muted, never neon or fluorescent.

4. FUR TEXTURE: Color follows fur grain, creating subtle variation. Never perfectly uniform solid blocks.
`.trim()

export interface NanoBananaResult {
  success: boolean
  imageBase64?: string
  mimeType?: string
  error?: string
  conversationId?: string
}

export interface NanoBananaSession {
  chat: ReturnType<ReturnType<typeof genAI.getGenerativeModel>['startChat']>
  originalImageBase64: string
  originalMimeType: string
}

const sessions = new Map<string, NanoBananaSession>()

/**
 * Start a new Nano Banana Pro editing session
 */
export async function startSession(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<{ sessionId: string }> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro-image-preview',
    generationConfig: {
      // responseModalities enables image generation output
      responseModalities: ['text', 'image'],
    } as any, // Type assertion needed - responseModalities is valid but not in older type definitions
  })

  const chat = model.startChat()
  const sessionId = crypto.randomUUID()

  sessions.set(sessionId, {
    chat,
    originalImageBase64: imageBase64,
    originalMimeType: mimeType,
  })

  return { sessionId }
}

/**
 * Generate or edit an image in an existing session
 */
export async function editImage(
  sessionId: string,
  prompt: string,
  isFirstEdit: boolean = true
): Promise<NanoBananaResult> {
  const session = sessions.get(sessionId)
  if (!session) {
    return { success: false, error: 'Session not found' }
  }

  try {
    let messageParts: any[]

    if (isFirstEdit) {
      // First edit: include the original image
      messageParts = [
        {
          inlineData: {
            mimeType: session.originalMimeType,
            data: session.originalImageBase64,
          },
        },
        { text: prompt },
      ]
    } else {
      // Follow-up edit: just send the text correction
      messageParts = [{ text: prompt }]
    }

    const response = await session.chat.sendMessage(messageParts)
    const result = response.response

    // Extract image from response
    for (const candidate of result.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          return {
            success: true,
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
            conversationId: sessionId,
          }
        }
      }
    }

    // No image in response - might be text explaining why it can't do it
    const textResponse = result.text()
    return {
      success: false,
      error: textResponse || 'No image generated',
      conversationId: sessionId,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message, conversationId: sessionId }
  }
}

/**
 * Clean up a session
 */
export function endSession(sessionId: string): void {
  sessions.delete(sessionId)
}

/**
 * Build the initial edit prompt for pet grooming/coloring
 */
export function buildPetEditPrompt(
  mode: 'grooming' | 'creative' | 'ai-designer',
  options: {
    style?: string
    designStyle?: string
    colorDescription?: string
  }
): string {
  const preservationClause = `
CRITICAL: Preserve the dog's identity completely.
- Keep the face EXACTLY the same - no color, no changes
- Keep the exact body shape, proportions, and pose
- Keep the background unchanged
- The dog must be clearly recognizable as the same dog
`.trim()

  if (mode === 'grooming') {
    const styleDescriptions: Record<string, string> = {
      teddy: 'a teddy bear cut with round fluffy face and even plush fur all over',
      lion: 'a lion cut with full mane around face and neck, trimmed short on body',
      asian: 'an Asian fusion style with round face shape and fluffy rounded cheeks',
      breed: 'a show-quality breed standard cut with precise lines',
      puppy: 'a puppy cut with even length all over and soft natural look',
    }
    const styleDesc = styleDescriptions[options.style || 'teddy'] || styleDescriptions.teddy

    return `
Edit this dog photo to show ${styleDesc}.

${preservationClause}

Style: Professional pet photography, sharp focus, natural lighting.
`.trim()
  }

  if (mode === 'ai-designer') {
    const themeDescriptions: Record<string, string> = {
      whimsical: 'soft pastel colors (lavender, mint, baby pink) dyed into the fur in gentle swirls',
      bold: 'vibrant saturated colors (hot pink, electric blue) dyed into the fur in bold sections',
      elegant: 'rose gold and champagne tones with subtle silver accents dyed into the fur',
      rainbow: 'a rainbow gradient (red to purple) dyed across the body fur',
      seasonal: 'festive red and green sections with small heart patterns dyed into the fur',
    }
    const themeDesc = themeDescriptions[options.designStyle || 'whimsical'] || themeDescriptions.whimsical

    return `
Edit this dog photo to add ${themeDesc}.

Apply the colors/patterns ONLY to the body, legs, and tail.
${preservationClause}

The colors should look like professional pet-safe dye, naturally blended into the fur texture.
Style: Professional pet photography, sharp focus, studio lighting.
`.trim()
  }

  // Creative mode - user's description
  const userDescription = options.colorDescription || 'colorful patterns'

  return `
Edit this dog photo to add: ${userDescription}

Apply any colors or patterns ONLY to the body, legs, ears, and tail - NEVER the face.
${preservationClause}

The colors should look like professional pet-safe dye, naturally blended into the fur texture.
Style: Professional pet photography, sharp focus, natural lighting.
`.trim()
}

/**
 * Build a correction prompt for iterative refinement
 */
export function buildCorrectionPrompt(issues: string[]): string {
  const corrections = issues.map((issue) => {
    if (issue.includes('face') || issue.includes('Face')) {
      return 'Remove any color from the face - the face must be completely natural'
    }
    if (issue.includes('flat') || issue.includes('sticker')) {
      return 'Make the patterns look more naturally dyed into the fur, not like flat stickers'
    }
    if (issue.includes('theme') || issue.includes('Theme')) {
      return 'Make the theme elements more visible and prominent'
    }
    if (issue.includes('intense') || issue.includes('Softer')) {
      return 'Make the colors softer and less saturated'
    }
    return issue
  })

  return `
That's good, but please make these adjustments:
${corrections.map((c) => `- ${c}`).join('\n')}

Keep everything else the same.
`.trim()
}
