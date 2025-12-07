// packages/ai/src/looking-glass/index.ts
export {
  parseStyleDescription,
  buildImagePrompt,
  type ParsedStyle,
} from './style-parser'

export {
  generateFullPreview,
  generateSingleAngle,
  regenerateAngle,
  generateQuickPreview,
  type PreviewRequest,
  type PreviewResult,
  type SingleAngleResult,
} from './preview-generator'

export {
  generateGroomingBlueprint,
  generateClientSummary,
  type BlueprintRequest,
  type GroomingBlueprint,
} from './blueprint-generator'
