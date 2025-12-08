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

/**
 * Simplifies pattern descriptions to favor realistic, achievable designs
 */
function simplifyPatternForRealism(description: string): string {
  let simplified = description

  // Convert small pattern requests to large ones
  simplified = simplified.replace(
    /\b(small|tiny|little|mini|detailed|intricate)\s+(hearts?|stars?|paws?|shapes?|patterns?)/gi,
    'large, simple $2'
  )

  // Add size guidance for patterns without size specified
  if (/hearts?|stars?|paws?/i.test(simplified) && !/large|big/i.test(simplified)) {
    simplified = simplified.replace(/(hearts?|stars?|paws?)/gi, 'large (3+ inch) $1')
  }

  // Convert sharp edge requests to soft
  simplified = simplified.replace(/\b(sharp|crisp|clean|defined)\s+edges?/gi, 'soft, feathered edges')

  // Convert neon/fluorescent to natural
  simplified = simplified.replace(/\b(neon|fluorescent|electric|bright)\s+/gi, 'saturated but natural ')

  return simplified
}

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
      whimsical: 'soft pastel colors (lavender, mint, baby pink) blending gently with soft feathered edges - no sharp boundaries',
      bold: 'rich colors (hot pink, electric blue) with soft blended transitions between sections - saturated but natural-looking, not neon',
      elegant: 'rose gold and champagne tones with subtle silver accents, colors blending softly into the fur texture',
      rainbow: 'a rainbow gradient with colors blending smoothly into each other through soft, feathered transitions',
      seasonal: 'festive red and green sections with LARGE (3+ inch) simple heart shapes - all edges soft and feathered',
    }
    const themeDesc = themeDescriptions[options.designStyle || 'whimsical'] || themeDescriptions.whimsical

    return `
Edit this dog photo to add ${themeDesc}.

${GROOMING_REALISM_RULES}

Apply the colors/patterns ONLY to the body, legs, and tail.
${preservationClause}

The result should look like what a professional pet groomer could actually achieve with pet-safe dye.
Style: Professional pet photography, sharp focus, studio lighting.
`.trim()
  }

  // Creative mode - user's description
  const userDescription = options.colorDescription || 'colorful patterns'
  const simplifiedDescription = simplifyPatternForRealism(userDescription)

  return `
Edit this dog photo to add: ${simplifiedDescription}

${GROOMING_REALISM_RULES}

Apply any colors or patterns ONLY to the body, legs, ears, and tail - NEVER the face.
${preservationClause}

The result should look like what a professional pet groomer could actually achieve with pet-safe dye.
Style: Professional pet photography, sharp focus, natural lighting.
`.trim()
}

/**
 * Build a correction prompt for iterative refinement
 */
export function buildCorrectionPrompt(issues: string[]): string {
  const corrections = issues.map((issue) => {
    const issueLower = issue.toLowerCase()

    if (issueLower.includes('face')) {
      return 'Remove any color from the face - the face must be completely natural'
    }
    if (issueLower.includes('flat') || issueLower.includes('sticker')) {
      return 'Make the patterns look more naturally dyed into the fur, not like flat stickers'
    }
    if (issueLower.includes('sharp') || issueLower.includes('edge')) {
      return 'Soften all color edges - real dye bleeds into surrounding fur, creating feathered transitions'
    }
    if (issueLower.includes('small') || issueLower.includes('intricate') || issueLower.includes('detailed')) {
      return 'Make patterns LARGER and simpler - small patterns blur in real fur. Minimum 3 inches.'
    }
    if (issueLower.includes('neon') || issueLower.includes('bright') || issueLower.includes('saturated')) {
      return 'Reduce color intensity - pet-safe dyes are semi-transparent and look more natural/muted'
    }
    if (issueLower.includes('theme')) {
      return 'Make the theme elements more visible and prominent'
    }
    if (issueLower.includes('intense') || issueLower.includes('softer')) {
      return 'Make the colors softer and less saturated'
    }
    return issue
  })

  return `
That's good, but please make these adjustments for realism:
${corrections.map((c) => `- ${c}`).join('\n')}

Remember: Pet-safe dye has soft feathered edges, large simple patterns, and natural saturation.
Keep everything else the same.
`.trim()
}
