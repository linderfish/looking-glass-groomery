// packages/ai/src/looking-glass/blueprint-generator.ts
import Anthropic from '@anthropic-ai/sdk'
import { ParsedStyle } from './style-parser'

const anthropic = new Anthropic()

export interface BlueprintRequest {
  parsedStyle: ParsedStyle
  petInfo: {
    species: string
    breed?: string
    size?: string
    coatType?: string
  }
  clientNotes?: string
}

export interface GroomingBlueprint {
  // For Kimmie's reference
  summary: string

  // Detailed instructions by body part
  head: {
    clipperGuard?: string
    scissorLength?: string
    style: string
    technique: string
    notes?: string
  }

  ears: {
    clipperGuard?: string
    style: string
    technique: string
    notes?: string
  }

  body: {
    clipperGuard?: string
    bladeNumber?: string
    style: string
    technique: string
    direction?: string
    notes?: string
  }

  legs: {
    clipperGuard?: string
    style: string
    technique: string
    tapered: boolean
    leftSide?: string
    rightSide?: string
    notes?: string
  }

  tail: {
    style: string
    technique: string
    notes?: string
  }

  // Creative color instructions
  colorInstructions?: Array<{
    color: string
    brand: string
    productName?: string
    placement: string
    pattern: string
    applicationMethod: string
    processingTime?: string
    notes?: string
  }>

  // Extras
  extras?: Array<{
    item: string
    placement: string
    application: string
  }>

  // Estimated time
  estimatedTime: number // minutes

  // Reference images (if similar styles found)
  referenceImages?: string[]

  // Warnings or special considerations
  warnings?: string[]
}

/**
 * Generate a detailed grooming blueprint from parsed style
 */
export async function generateGroomingBlueprint(
  request: BlueprintRequest
): Promise<GroomingBlueprint> {
  const { parsedStyle, petInfo, clientNotes } = request

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `You are an expert pet groomer creating detailed grooming blueprints.
Generate professional grooming instructions based on the style request.

Include specific clipper guards, blade numbers, and techniques for each body part.
For creative coloring, specify exact brands (OPAWZ, Crazy Liberty, etc.), application methods, and processing times.

Common clipper guards: 0 (1/16"), 1 (1/8"), 2 (1/4"), 3 (3/8"), 4 (1/2"), 5 (5/8"), 7 (7/8"), 10 (1-1/4")
Common blades: 3, 4, 5, 7, 10, 15, 30, 40

Return ONLY valid JSON matching this structure:
{
  "summary": "brief 1-2 sentence overview",
  "head": { "clipperGuard": "...", "scissorLength": "...", "style": "...", "technique": "...", "notes": "..." },
  "ears": { "clipperGuard": "...", "style": "...", "technique": "...", "notes": "..." },
  "body": { "clipperGuard": "...", "bladeNumber": "...", "style": "...", "technique": "...", "direction": "...", "notes": "..." },
  "legs": { "clipperGuard": "...", "style": "...", "technique": "...", "tapered": true/false, "leftSide": "...", "rightSide": "...", "notes": "..." },
  "tail": { "style": "...", "technique": "...", "notes": "..." },
  "colorInstructions": [{ "color": "...", "brand": "...", "productName": "...", "placement": "...", "pattern": "...", "applicationMethod": "...", "processingTime": "...", "notes": "..." }],
  "extras": [{ "item": "...", "placement": "...", "application": "..." }],
  "estimatedTime": minutes,
  "warnings": ["..."]
}`,
    messages: [{
      role: 'user',
      content: `Create a grooming blueprint for:

Pet: ${petInfo.species}, ${petInfo.breed || 'mixed breed'}, ${petInfo.size || 'medium'} size
Coat type: ${petInfo.coatType || 'unknown'}

Style Request:
${JSON.stringify(parsedStyle, null, 2)}

${clientNotes ? `Client Notes: ${clientNotes}` : ''}

Generate detailed grooming instructions.`,
    }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as GroomingBlueprint
    }
    throw new Error('No JSON found in response')
  } catch {
    // Return a basic blueprint if parsing fails
    return {
      summary: `${parsedStyle.overallStyle} grooming style`,
      head: {
        style: parsedStyle.head.style,
        technique: 'Scissor to shape',
      },
      ears: {
        style: parsedStyle.ears.style,
        technique: 'Clean edges, blend',
      },
      body: {
        style: parsedStyle.body.style,
        technique: 'Clipper work with the grain',
        clipperGuard: '4',
      },
      legs: {
        style: parsedStyle.legs.style,
        technique: 'Blend from body',
        tapered: parsedStyle.legs.tapered || false,
      },
      tail: {
        style: parsedStyle.tail.style,
        technique: 'Shape to match style',
      },
      estimatedTime: 90,
    }
  }
}

/**
 * Generate a simplified client-facing description of the blueprint
 */
export function generateClientSummary(blueprint: GroomingBlueprint): string {
  const parts = [
    `✂️ **Overall:** ${blueprint.summary}`,
    '',
    '**What we\'ll do:**',
    `• Head: ${blueprint.head.style}`,
    `• Ears: ${blueprint.ears.style}`,
    `• Body: ${blueprint.body.style}`,
    `• Legs: ${blueprint.legs.style}${blueprint.legs.tapered ? ' (tapered)' : ''}`,
    `• Tail: ${blueprint.tail.style}`,
  ]

  if (blueprint.colorInstructions && blueprint.colorInstructions.length > 0) {
    parts.push('')
    parts.push('🎨 **Creative Color:**')
    for (const color of blueprint.colorInstructions) {
      parts.push(`• ${color.color} ${color.pattern} on ${color.placement}`)
    }
  }

  if (blueprint.extras && blueprint.extras.length > 0) {
    parts.push('')
    parts.push('✨ **Extras:**')
    for (const extra of blueprint.extras) {
      parts.push(`• ${extra.item} on ${extra.placement}`)
    }
  }

  parts.push('')
  parts.push(`⏱️ Estimated time: ${blueprint.estimatedTime} minutes`)

  if (blueprint.warnings && blueprint.warnings.length > 0) {
    parts.push('')
    parts.push('⚠️ **Notes:**')
    for (const warning of blueprint.warnings) {
      parts.push(`• ${warning}`)
    }
  }

  return parts.join('\n')
}
