// packages/ai/src/looking-glass/style-parser.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export interface ParsedStyle {
  // Overall style
  overallLength: 'short' | 'medium' | 'long' | 'natural'
  overallStyle: string

  // Body parts
  head: {
    style: string
    length?: string
  }
  ears: {
    style: string
    length?: string
  }
  body: {
    style: string
    length?: string
  }
  legs: {
    style: string
    tapered?: boolean
    leftRight?: 'same' | 'different'
  }
  tail: {
    style: string
  }

  // Creative elements
  colors: Array<{
    color: string
    placement: string
    pattern: 'solid' | 'spots' | 'rings' | 'gradient' | 'stripes' | 'custom'
    patternDescription?: string
  }>

  // Extras
  extras: string[] // glitter, jewels, feathers, etc.

  // Raw description for reference
  rawDescription: string
}

/**
 * Parse a natural language style description into structured format
 */
export async function parseStyleDescription(
  description: string,
  petInfo: { species: string; breed?: string; size?: string }
): Promise<ParsedStyle> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are a professional pet groomer parsing style requests.
Convert natural language descriptions into structured grooming specifications.

Important distinctions:
- SPOTS = irregular circular patches
- RINGS = circular bands that wrap around (like on legs or tail)
- STRIPES = linear patterns
- GRADIENT = color that fades from one to another
- SOLID = single color in an area

For asymmetric requests (left side different from right), note this in the legs section.

Return ONLY valid JSON matching this structure:
{
  "overallLength": "short|medium|long|natural",
  "overallStyle": "description",
  "head": { "style": "...", "length": "..." },
  "ears": { "style": "...", "length": "..." },
  "body": { "style": "...", "length": "..." },
  "legs": { "style": "...", "tapered": true/false, "leftRight": "same|different" },
  "tail": { "style": "..." },
  "colors": [{ "color": "...", "placement": "...", "pattern": "...", "patternDescription": "..." }],
  "extras": ["glitter", "jewels", etc],
  "rawDescription": "original description"
}`,
    messages: [{
      role: 'user',
      content: `Pet: ${petInfo.species}, ${petInfo.breed || 'mixed breed'}, ${petInfo.size || 'medium'} size.

Style request: "${description}"

Parse this into the structured format.`,
    }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      parsed.rawDescription = description
      return parsed as ParsedStyle
    }
    throw new Error('No JSON found in response')
  } catch {
    // Return a basic structure if parsing fails
    return {
      overallLength: 'medium',
      overallStyle: description,
      head: { style: 'natural' },
      ears: { style: 'natural' },
      body: { style: 'natural' },
      legs: { style: 'natural', tapered: false, leftRight: 'same' },
      tail: { style: 'natural' },
      colors: [],
      extras: [],
      rawDescription: description,
    }
  }
}

/**
 * Build a prompt for image generation from parsed style
 */
export function buildImagePrompt(
  parsedStyle: ParsedStyle,
  angle: 'front' | 'left' | 'right' | 'back' | 'top',
  petInfo: { species: string; breed?: string }
): string {
  const angleDescriptions = {
    front: 'front view, facing directly at camera, symmetrical',
    left: 'left side profile, showing full left side of body',
    right: 'right side profile, showing full right side of body',
    back: 'back view, facing away from camera, showing rear and tail',
    top: "top-down bird's eye view, looking down from above",
  }

  let colorDescription = ''
  if (parsedStyle.colors.length > 0) {
    colorDescription = parsedStyle.colors
      .map(c => {
        let patternDesc = c.pattern
        if (c.pattern === 'spots') patternDesc = 'irregular circular spots'
        if (c.pattern === 'rings') patternDesc = 'circular bands wrapping around'
        if (c.pattern === 'gradient') patternDesc = 'smooth gradient fade'
        return `${c.color} ${patternDesc} on ${c.placement}`
      })
      .join(', ')
  }

  const extrasDescription = parsedStyle.extras.length > 0
    ? `Decorated with: ${parsedStyle.extras.join(', ')}.`
    : ''

  return `A professionally groomed ${petInfo.breed || ''} ${petInfo.species}, ${angleDescriptions[angle]}.

Grooming style: ${parsedStyle.overallStyle}
Overall coat length: ${parsedStyle.overallLength}
Head: ${parsedStyle.head.style}
Ears: ${parsedStyle.ears.style}
Body: ${parsedStyle.body.style}
Legs: ${parsedStyle.legs.style}${parsedStyle.legs.tapered ? ', tapered' : ''}
Tail: ${parsedStyle.tail.style}

${colorDescription ? `Colors: ${colorDescription}` : ''}
${extrasDescription}

Professional pet photography, studio lighting, high detail fur texture, clean background, Alice in Wonderland whimsical aesthetic, magical and beautiful.`
}
