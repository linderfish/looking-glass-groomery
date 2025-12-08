// apps/web/src/app/api/looking-glass/route.ts
// Prioritizes Nano Banana Pro (Gemini) for better identity preservation
// Falls back to FLUX Kontext Pro with careful prompting
// Uses LLM prompt rewriter to optimize prompts for FLUX Kontext Pro
// Uses Claude Vision to analyze results and auto-correct issues
// Supports both BFL direct API and fal.ai
import { NextRequest, NextResponse } from 'next/server'
import {
  startSession,
  editImage,
  endSession,
  buildPetEditPrompt,
  buildCorrectionPrompt,
  NanoBananaResult,
} from '@/lib/nano-banana'

// =============================================================================
// TYPES
// =============================================================================
interface VisionAnalysis {
  // Obvious issues (auto-retry triggers)
  obviousIssues: {
    colorOnFace: boolean;
    bodyPartsChanged: boolean;
    poseChanged: boolean;
    backgroundChanged: boolean;
  };
  // Subjective issues (user feedback)
  subjectiveIssues: {
    patternQuality: 'good' | 'flat' | 'unrealistic';
    themeStrength: 'strong' | 'weak' | 'missing';
    colorIntensity: 'good' | 'too_strong' | 'too_weak';
  };
  // For corrections
  suggestedFixes: string[];
  // Overall
  passesQuality: boolean;
  shouldAutoRetry: boolean;
  userFeedbackNeeded: string[];
}

interface GenerationResult {
  success: boolean;
  previewUrl?: string;
  analysis?: {
    passedQuality: boolean;
    autoRetried: number;
    suggestedFixes: string[];
    issuesDetected: string[];
  };
  error?: string;
}

// Get API key - prefer Google AI (Nano Banana Pro), fallback to fal.ai, then BFL
function getApiConfig(): { provider: 'google' | 'fal' | 'bfl'; apiKey: string } | null {
  // Prefer Google AI (Nano Banana Pro) for better identity preservation
  if (process.env.GOOGLE_AI_API_KEY) {
    return { provider: 'google', apiKey: process.env.GOOGLE_AI_API_KEY }
  }
  // Fallback to fal.ai
  const falKey = process.env.FAL_KEY || process.env.FAL_AI_KEY
  if (falKey) {
    return { provider: 'fal', apiKey: falKey }
  }
  // Fallback to BFL direct
  if (process.env.BFL_API_KEY) {
    return { provider: 'bfl', apiKey: process.env.BFL_API_KEY }
  }
  return null
}

// =============================================================================
// LLM PROMPT REWRITER - Optimizes user requests for FLUX Kontext Pro
// Uses Claude to transform casual user descriptions into properly structured
// FLUX Kontext Pro prompts with expert-level detail
// =============================================================================
const FLUX_KONTEXT_SYSTEM_PROMPT = `You are an expert prompt engineer for FLUX Kontext Pro, an AI image editing model by Black Forest Labs.

Your job is to transform casual user requests for creative dog grooming into highly detailed, expert-level FLUX Kontext Pro prompts.

## CRITICAL: How FLUX Kontext Pro Works

FLUX Kontext Pro ALREADY SEES the input image. You do NOT need to describe what's already there.
Instead, describe ONLY what should CHANGE and what should STAY THE SAME.

## The Three-Layer Prompt Framework

Every prompt MUST have these three layers:

1. **ACTION LAYER** - What to do, with extreme specificity:
   - BAD: "add hearts"
   - GOOD: "Add red heart-shaped patterns dyed into the dog's fur on the body and sides only"

2. **CONTEXT LAYER** - HOW it should look, describing the realistic appearance:
   - BAD: (nothing)
   - GOOD: "The hearts should look like professional pet-safe temporary dye that has absorbed into the fur texture - soft edges, following the natural fur direction, not flat stickers or stamps"

3. **PRESERVATION LAYER** - What must NOT change (be exhaustive):
   - BAD: "keep the face the same"
   - GOOD: "Keep the dog's face completely natural and unchanged. Do not add or remove any body parts. Maintain the exact same body shape, pose, tail, legs, ears, background, lighting, and composition as the original image."

## Translating Abstract Concepts to Concrete Visuals

Users say abstract things. You must translate to SPECIFIC VISUAL INSTRUCTIONS:

- "christmas vibe" → "Add bright green dyed fur on the ear tips and a green dyed patch on the chest area, combined with red hearts, creating a Christmas red-and-green color scheme"
- "valentine's day" → "Add pink and red heart patterns with soft pink tinted fur sections"
- "halloween" → "Add orange and black colored sections with small bat or pumpkin shapes"
- "rainbow" → "Add rainbow gradient dyed fur transitioning from red to orange to yellow to green to blue to purple across the body"
- "galaxy/cosmic" → "Add deep purple and blue dyed sections with small white dot patterns like stars"
- "patriotic" → "Add red, white, and blue dyed fur sections in bold stripes or star patterns"

## Pattern Appearance Rules

When adding patterns (hearts, stars, paw prints, etc.):
- Patterns should look DYED INTO the fur, not painted ON TOP
- Describe: "soft edges, following the natural fur direction"
- Describe: "absorbed into the fur texture"
- Explicitly say: "not flat stickers, stamps, or decals"
- Patterns should be scattered naturally, not in a perfect grid

## Absolute Preservation Rules

ALWAYS include ALL of these in the preservation layer:
- "Keep the dog's face completely natural and unchanged"
- "Do not add or remove any body parts"
- "Maintain the exact same body shape, pose, background, lighting, and composition"
- "The result should look like a real photograph"

## Example Transformations

USER INPUT: "red hearts, christmas vibe"
YOUR OUTPUT: Add red heart-shaped patterns dyed into the dog's fur on the body and sides only. The hearts should look like professional pet-safe temporary dye that has absorbed into the fur texture - soft edges, following the natural fur direction, not flat stickers. Add bright green dyed fur on the ear tips and a green dyed stripe on the chest area for a Christmas red-and-green color scheme. Keep the dog's face completely natural and unchanged. Do not add or remove any body parts - maintain the exact same body shape, pose, tail, legs, ears, background, lighting, and composition as the original image. The result should look like a real photograph of a professionally groomed dog with creative color work.

USER INPUT: "pink and purple"
YOUR OUTPUT: Add soft pink and purple dyed fur to the dog's body, blending the colors naturally across different sections of the coat. The dye should look like professional pet-safe color that has absorbed into the fur texture, following the natural fur direction with soft gradients between colors. Keep the dog's face completely natural with no color. Do not add or remove any body parts - maintain the exact same body shape, pose, background, lighting, and composition as the original image. The result should look like a real photograph.

USER INPUT: "rainbow ears"
YOUR OUTPUT: Add rainbow gradient dyed fur to the dog's ears only, transitioning smoothly from red to orange to yellow to green to blue to purple. The color should look like professional pet-safe dye absorbed into the fur texture with soft blended edges. Keep the rest of the dog's body and face completely natural and unchanged. Do not add or remove any body parts - maintain the exact same body shape, pose, background, lighting, and composition as the original image.

## Output Format

Return ONLY the optimized prompt. No explanations, no quotes, no markdown, just the prompt text ready to send to FLUX Kontext Pro.`

async function rewritePromptWithLLM(userDescription: string, mode: 'creative' | 'grooming' | 'ai-designer', style?: string): Promise<string | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  // If no Anthropic key, fall back to basic prompt building
  if (!anthropicKey) {
    console.log('No ANTHROPIC_API_KEY - using basic prompt builder')
    return null
  }

  let userMessage: string

  if (mode === 'creative') {
    userMessage = `Transform this user request into an optimized FLUX Kontext Pro prompt:

"${userDescription}"

Apply all the rules from your training. Output ONLY the prompt.`
  } else if (mode === 'grooming') {
    const styleDescriptions: Record<string, string> = {
      teddy: 'teddy bear cut - round fluffy face, even plush fur all over',
      lion: 'lion cut - full mane around face/neck, shorter body fur',
      asian: 'Asian fusion - perfectly round face, fluffy rounded cheeks',
      breed: 'breed standard show cut - precise angles, competition quality',
      puppy: 'puppy cut - even length all over, soft natural look',
    }
    userMessage = `Transform this grooming style request into an optimized FLUX Kontext Pro prompt:

Style requested: ${style} (${styleDescriptions[style || 'teddy'] || 'standard grooming'})

Remember:
- This changes the fur SHAPE, not color
- Keep the dog's face, eyes, nose, expression identical
- Only modify fur length and shape
- Preserve exact pose and background`
  } else {
    // ai-designer mode
    const designDescriptions: Record<string, string> = {
      whimsical: 'soft pastel pink and lavender, fairy-tale magical feeling',
      bold: 'vibrant hot pink and electric blue, vivid saturated colors',
      elegant: 'rose gold and champagne tones, sophisticated and refined',
      rainbow: 'full rainbow gradient - red, orange, yellow, green, blue, purple',
      seasonal: 'Christmas theme - red and green with small heart patterns',
    }
    userMessage = `Transform this AI-designed color theme into an optimized FLUX Kontext Pro prompt:

Theme: ${style} (${designDescriptions[style || 'whimsical'] || 'creative colors'})

Remember:
- Apply color to body fur, keep face natural
- Colors should look like professional pet-safe dye
- Preserve exact pose, background, fur texture
- The dog must be clearly recognizable`
  }

  try {
    console.log('Rewriting prompt with Claude...')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: FLUX_KONTEXT_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userMessage }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)
      return null
    }

    const data = await response.json()
    const rewrittenPrompt = data.content?.[0]?.text?.trim()

    if (!rewrittenPrompt) {
      console.error('No prompt in Claude response')
      return null
    }

    console.log('=== LLM REWRITTEN PROMPT ===')
    console.log(rewrittenPrompt)
    console.log('=== END PROMPT ===')
    return rewrittenPrompt

  } catch (error) {
    console.error('LLM rewrite error:', error)
    return null
  }
}

// =============================================================================
// VISION ANALYSIS - Analyzes generated images for quality issues
// Uses Claude Vision to compare original vs generated and detect problems
// =============================================================================
const VISION_ANALYSIS_PROMPT = `You are analyzing a creative dog grooming AI generation. You will see TWO images:
1. ORIGINAL: The original photo of the dog
2. GENERATED: The AI-edited version with colors/patterns added

Your job is to detect quality issues by comparing these images.

Analyze and respond with ONLY valid JSON (no markdown, no explanation):

{
  "obviousIssues": {
    "colorOnFace": <true if color/dye was applied to the dog's face, muzzle, or head area - this should stay natural>,
    "bodyPartsChanged": <true if body parts were added (like a tail that wasn't there) or removed>,
    "poseChanged": <true if the dog's pose/stance is noticeably different>,
    "backgroundChanged": <true if the background setting/colors changed significantly>
  },
  "subjectiveIssues": {
    "patternQuality": "<'good' if patterns look like dyed fur, 'flat' if they look like stickers/stamps, 'unrealistic' if they look artificial>",
    "themeStrength": "<'strong' if the requested theme is clearly visible, 'weak' if barely there, 'missing' if not present>",
    "colorIntensity": "<'good' if colors look natural for pet dye, 'too_strong' if oversaturated, 'too_weak' if barely visible>"
  },
  "suggestedFixes": [<array of specific fix suggestions like "Keep face completely natural" or "Make hearts look more like dyed fur">],
  "issuesDetected": [<array of plain English descriptions of what went wrong>]
}`

const CORRECTION_RULES: Record<string, string> = {
  colorOnFace:
    "CRITICAL FIX REQUIRED: The previous attempt added color to the face. You MUST keep the dog's face, muzzle, nose, and head area completely natural with absolutely NO color or dye whatsoever. The face must look exactly like the original photo.",

  bodyPartsChanged:
    "CRITICAL FIX REQUIRED: The previous attempt modified body parts. Do NOT add or remove ANY body parts. The dog must have the EXACT same tail (or no tail if original had none), legs, ears, and body shape as the original photo.",

  poseChanged:
    "CRITICAL FIX REQUIRED: The previous attempt changed the dog's pose. The dog must remain in the EXACT same position, stance, and orientation as the original photo. Do not rotate, shift, or reposition the dog.",

  backgroundChanged:
    "CRITICAL FIX REQUIRED: The previous attempt modified the background. Keep the background COMPLETELY IDENTICAL to the original photo - same colors, same objects, same setting, same lighting.",

  patternsFlat:
    "QUALITY FIX: The patterns looked like flat stickers or stamps. Make sure all patterns are DYED INTO the fur texture with soft, feathered edges that follow the natural direction of the fur. They should look like professional pet-safe dye work, not printed decals.",

  themeMissing:
    "THEME FIX: The requested theme was not visible enough. Make the theme elements more prominent and obvious while still looking realistic.",
}

async function analyzeGeneration(
  originalImageUrl: string,
  generatedImageUrl: string,
  userRequest: string
): Promise<VisionAnalysis | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!anthropicKey) {
    console.log('No ANTHROPIC_API_KEY - skipping vision analysis')
    return null
  }

  try {
    console.log('Analyzing generation with Claude Vision...')

    // Fetch both images and convert to base64
    const [originalResponse, generatedResponse] = await Promise.all([
      fetch(originalImageUrl),
      fetch(generatedImageUrl)
    ])

    if (!originalResponse.ok || !generatedResponse.ok) {
      console.error('Failed to fetch images for analysis')
      return null
    }

    const [originalBuffer, generatedBuffer] = await Promise.all([
      originalResponse.arrayBuffer(),
      generatedResponse.arrayBuffer()
    ])

    const originalBase64 = Buffer.from(originalBuffer).toString('base64')
    const generatedBase64 = Buffer.from(generatedBuffer).toString('base64')

    // Determine media types
    const originalType = originalResponse.headers.get('content-type') || 'image/png'
    const generatedType = generatedResponse.headers.get('content-type') || 'image/png'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `User requested: "${userRequest}"\n\nAnalyze these two images - ORIGINAL first, then GENERATED:`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: originalType,
                  data: originalBase64
                }
              },
              {
                type: 'text',
                text: 'GENERATED image:'
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: generatedType,
                  data: generatedBase64
                }
              },
              {
                type: 'text',
                text: VISION_ANALYSIS_PROMPT
              }
            ]
          }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude Vision API error:', response.status, errorText)
      return null
    }

    const data = await response.json()
    const analysisText = data.content?.[0]?.text?.trim()

    if (!analysisText) {
      console.error('No analysis in Claude response')
      return null
    }

    console.log('=== VISION ANALYSIS RAW ===')
    console.log(analysisText)
    console.log('=== END ANALYSIS ===')

    // Parse JSON response
    const analysis = JSON.parse(analysisText)

    // Determine if we should auto-retry
    const hasObviousIssues =
      analysis.obviousIssues.colorOnFace ||
      analysis.obviousIssues.bodyPartsChanged ||
      analysis.obviousIssues.poseChanged ||
      analysis.obviousIssues.backgroundChanged

    // Build user feedback suggestions
    const userFeedbackNeeded: string[] = []
    if (analysis.subjectiveIssues.patternQuality === 'flat') {
      userFeedbackNeeded.push('Patterns look flat - make them more natural')
    }
    if (analysis.subjectiveIssues.patternQuality === 'unrealistic') {
      userFeedbackNeeded.push('Patterns look unrealistic - improve quality')
    }
    if (analysis.subjectiveIssues.themeStrength === 'weak') {
      userFeedbackNeeded.push('Theme is subtle - make it more visible')
    }
    if (analysis.subjectiveIssues.themeStrength === 'missing') {
      userFeedbackNeeded.push('Theme is missing - add theme elements')
    }
    if (analysis.subjectiveIssues.colorIntensity === 'too_strong') {
      userFeedbackNeeded.push('Colors too intense - make them softer')
    }
    if (analysis.subjectiveIssues.colorIntensity === 'too_weak') {
      userFeedbackNeeded.push('Colors too faint - make them more visible')
    }

    return {
      ...analysis,
      passesQuality: !hasObviousIssues,
      shouldAutoRetry: hasObviousIssues,
      userFeedbackNeeded,
    }

  } catch (error) {
    console.error('Vision analysis error:', error)
    return null
  }
}

function buildCorrectedPrompt(originalPrompt: string, analysis: VisionAnalysis): string {
  const corrections: string[] = []

  // Add corrections for obvious issues
  if (analysis.obviousIssues.colorOnFace) {
    corrections.push(CORRECTION_RULES.colorOnFace)
  }
  if (analysis.obviousIssues.bodyPartsChanged) {
    corrections.push(CORRECTION_RULES.bodyPartsChanged)
  }
  if (analysis.obviousIssues.poseChanged) {
    corrections.push(CORRECTION_RULES.poseChanged)
  }
  if (analysis.obviousIssues.backgroundChanged) {
    corrections.push(CORRECTION_RULES.backgroundChanged)
  }

  // Add corrections for quality issues (patterns)
  if (analysis.subjectiveIssues.patternQuality === 'flat' ||
      analysis.subjectiveIssues.patternQuality === 'unrealistic') {
    corrections.push(CORRECTION_RULES.patternsFlat)
  }

  if (corrections.length === 0) {
    return originalPrompt
  }

  // Prepend corrections to original prompt
  const correctionBlock = corrections.join('\n\n')

  return `${correctionBlock}\n\n---\n\nORIGINAL REQUEST (apply fixes above):\n${originalPrompt}`
}

function buildUserCorrectedPrompt(originalPrompt: string, userFixes: string[]): string {
  if (userFixes.length === 0) {
    return originalPrompt
  }

  const fixInstructions: string[] = []

  for (const fix of userFixes) {
    if (fix.includes('flat') || fix.includes('natural')) {
      fixInstructions.push(CORRECTION_RULES.patternsFlat)
    }
    if (fix.includes('Theme') || fix.includes('theme')) {
      fixInstructions.push(CORRECTION_RULES.themeMissing)
    }
    if (fix.includes('intense') || fix.includes('softer')) {
      fixInstructions.push('COLOR FIX: Make the colors less intense and more natural-looking, like subtle pet-safe dye.')
    }
    if (fix.includes('faint') || fix.includes('more visible')) {
      fixInstructions.push('COLOR FIX: Make the colors more vibrant and visible while still looking realistic.')
    }
    if (fix.includes('face')) {
      fixInstructions.push(CORRECTION_RULES.colorOnFace)
    }
  }

  if (fixInstructions.length === 0) {
    // Generic fix based on user feedback
    fixInstructions.push(`USER FEEDBACK TO ADDRESS: ${userFixes.join(', ')}`)
  }

  return `${fixInstructions.join('\n\n')}\n\n---\n\nORIGINAL REQUEST (apply fixes above):\n${originalPrompt}`
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
// Generate with appropriate API based on config (FLUX Kontext fallback)
// =============================================================================
async function generateWithKontext(imageUrl: string, prompt: string, config: { provider: 'fal' | 'bfl'; apiKey: string }): Promise<string> {
  if (config.provider === 'bfl') {
    return generateWithBFL(imageUrl, prompt, config.apiKey)
  } else {
    return generateWithFal(imageUrl, prompt, config.apiKey)
  }
}

// =============================================================================
// Generate with Nano Banana Pro (Google Gemini)
// Supports conversational refinement via sessions
// =============================================================================
async function generateWithNanoBanana(
  imageBase64: string,
  mode: 'grooming' | 'creative' | 'ai-designer',
  options: {
    style?: string
    designStyle?: string
    colorDescription?: string
    userFixes?: string[]
    sessionId?: string
  }
): Promise<{ previewUrl: string; sessionId: string; promptUsed: string }> {
  let sessionId = options.sessionId
  let isFirstEdit = true

  // Start new session if needed
  if (!sessionId) {
    // Extract base64 data from data URL if needed
    const base64Data = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64
    const mimeType = imageBase64.includes('image/png') ? 'image/png' : 'image/jpeg'

    const session = await startSession(base64Data, mimeType)
    sessionId = session.sessionId
  } else {
    isFirstEdit = false
  }

  // Build prompt
  let prompt: string
  if (options.userFixes && options.userFixes.length > 0) {
    // Correction prompt for iterative refinement
    prompt = buildCorrectionPrompt(options.userFixes)
  } else {
    // Initial edit prompt
    prompt = buildPetEditPrompt(mode, options)
  }

  // Generate
  const result = await editImage(sessionId, prompt, isFirstEdit)

  if (!result.success || !result.imageBase64) {
    // Clean up session on failure
    endSession(sessionId)
    throw new Error(result.error || 'Failed to generate image')
  }

  // Convert base64 to data URL for frontend display
  const mimeType = result.mimeType || 'image/jpeg'
  const previewUrl = `data:${mimeType};base64,${result.imageBase64}`

  return {
    previewUrl,
    sessionId,
    promptUsed: prompt,
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
// Includes vision analysis and auto-correction retry loop
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
      // For regeneration with user fixes
      userFixes = [],
      previousPrompt = null,
      // For Nano Banana Pro iterative refinement
      sessionId: existingSessionId = null,
    } = body

    const apiConfig = getApiConfig()

    if (!apiConfig) {
      return NextResponse.json({
        success: false,
        error: 'API not configured',
        message: 'Looking Glass preview is not available - no API key configured (GOOGLE_AI_API_KEY, BFL_API_KEY, or FAL_KEY)',
      }, { status: 503 })
    }

    console.log('Using API:', apiConfig.provider)

    if (!imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'No image provided',
      }, { status: 400 })
    }

    console.log('=== Looking Glass Generation ===')
    console.log('Mode:', mode, '| Style:', style, '| DesignStyle:', designStyle)
    if (userFixes.length > 0) {
      console.log('User fixes requested:', userFixes)
    }

    let prompt: string
    let disclaimer: string
    let userRequest: string // For vision analysis context

    // =======================================================================
    // GROOMING MODE - Changes fur shape (most invasive)
    // =======================================================================
    if (mode === 'grooming') {
      userRequest = `grooming style: ${style}`
      // Try LLM rewrite first, fall back to static prompts
      const rewritten = await rewritePromptWithLLM('', 'grooming', style)
      prompt = rewritten || GROOMING_STYLE_PROMPTS[style] || GROOMING_STYLE_PROMPTS.teddy
      disclaimer = 'AI-generated grooming style preview. Your pet\'s actual results will be tailored by our professional groomer.'
    }
    // =======================================================================
    // AI DESIGNER MODE - Predefined color themes
    // =======================================================================
    else if (mode === 'ai-designer') {
      userRequest = `AI designer theme: ${designStyle}`
      // Try LLM rewrite first, fall back to static prompts
      const rewritten = await rewritePromptWithLLM('', 'ai-designer', designStyle)
      prompt = rewritten || AI_DESIGNER_PROMPTS[designStyle] || AI_DESIGNER_PROMPTS.whimsical
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
      userRequest = colorDescription
      // Try LLM rewrite first - this is where it matters most!
      const rewritten = await rewritePromptWithLLM(colorDescription, 'creative')
      prompt = rewritten || buildCreativePrompt(colorDescription)
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

    // If user requested fixes, apply them to the previous prompt
    if (userFixes.length > 0 && previousPrompt) {
      console.log('Applying user fixes to previous prompt...')
      prompt = buildUserCorrectedPrompt(previousPrompt, userFixes)
    }

    console.log('Final prompt:', prompt.substring(0, 150) + '...')

    // =======================================================================
    // GENERATION - Branch based on provider
    // =======================================================================
    let previewUrl: string | null = null
    let finalAnalysis: VisionAnalysis | null = null
    let currentPrompt = prompt
    let sessionId: string | undefined
    const issuesDetected: string[] = []

    if (apiConfig.provider === 'google') {
      // =======================================================================
      // NANO BANANA PRO (Google Gemini) - Built-in identity preservation
      // No auto-retry loop needed - uses conversational refinement instead
      // =======================================================================
      console.log('\n=== Using Nano Banana Pro ===')

      const nanoBananaResult = await generateWithNanoBanana(imageUrl, mode, {
        style,
        designStyle,
        colorDescription,
        userFixes: userFixes.length > 0 ? userFixes : undefined,
        sessionId: existingSessionId || undefined,
      })

      previewUrl = nanoBananaResult.previewUrl
      sessionId = nanoBananaResult.sessionId
      currentPrompt = nanoBananaResult.promptUsed

      console.log('Nano Banana Pro generation complete, sessionId:', sessionId)

    } else {
      // =======================================================================
      // FLUX KONTEXT (fal.ai or BFL) - Uses auto-retry loop with vision analysis
      // =======================================================================
      const MAX_AUTO_RETRIES = 2
      let autoRetryCount = 0

      while (autoRetryCount <= MAX_AUTO_RETRIES) {
        console.log(`\n=== Generation Attempt ${autoRetryCount + 1} (FLUX Kontext) ===`)

        // Generate image
        previewUrl = await generateWithKontext(imageUrl, currentPrompt, apiConfig as { provider: 'fal' | 'bfl'; apiKey: string })

        // Analyze the result (only for creative and ai-designer modes where we're adding color)
        if (mode !== 'grooming') {
          finalAnalysis = await analyzeGeneration(imageUrl, previewUrl, userRequest)

          if (finalAnalysis) {
            console.log('Analysis result:', {
              passesQuality: finalAnalysis.passesQuality,
              shouldAutoRetry: finalAnalysis.shouldAutoRetry,
              obviousIssues: finalAnalysis.obviousIssues,
            })

            // Collect issues for reporting
            if (finalAnalysis.obviousIssues.colorOnFace) {
              issuesDetected.push('Color detected on face')
            }
            if (finalAnalysis.obviousIssues.bodyPartsChanged) {
              issuesDetected.push('Body shape was modified')
            }
            if (finalAnalysis.obviousIssues.poseChanged) {
              issuesDetected.push('Pose was changed')
            }
            if (finalAnalysis.obviousIssues.backgroundChanged) {
              issuesDetected.push('Background was altered')
            }

            // Should we auto-retry?
            if (finalAnalysis.shouldAutoRetry && autoRetryCount < MAX_AUTO_RETRIES) {
              console.log('Auto-retry triggered due to obvious issues')
              currentPrompt = buildCorrectedPrompt(currentPrompt, finalAnalysis)
              autoRetryCount++
              continue
            }
          }
        }

        // Either passed quality check or used all retries
        break
      }
    }

    // Build response with analysis info
    const response: Record<string, unknown> = {
      success: true,
      previewUrl,
      mode,
      style: mode === 'grooming' ? style : (mode === 'ai-designer' ? designStyle : null),
      colorDescription: mode === 'creative' ? colorDescription : null,
      method: apiConfig.provider === 'google' ? 'nano-banana-pro' : 'ai-generated',
      disclaimer,
      // Include the prompt used (for potential user-requested regeneration)
      promptUsed: currentPrompt,
      // For Nano Banana Pro iterative refinement
      sessionId,
    }

    // Add analysis results if available (FLUX Kontext only)
    if (finalAnalysis) {
      response.analysis = {
        passedQuality: finalAnalysis.passesQuality,
        autoRetried: 0,
        suggestedFixes: finalAnalysis.userFeedbackNeeded,
        issuesDetected: issuesDetected,
        subjectiveIssues: finalAnalysis.subjectiveIssues,
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Looking Glass generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
