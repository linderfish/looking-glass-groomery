// apps/web/src/app/wonderland/looking-glass/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

type Step = 'upload' | 'mode' | 'style' | 'generating' | 'preview'
type Mode = 'grooming' | 'creative' | 'ai-designer'

interface AnalysisResult {
  passedQuality: boolean
  autoRetried: number
  suggestedFixes: string[]
  issuesDetected: string[]
  subjectiveIssues?: {
    patternQuality: string
    themeStrength: string
    colorIntensity: string
  }
}

interface PreviewResult {
  previewUrl: string
  disclaimer: string
  promptUsed?: string
  analysis?: AnalysisResult
  sessionId?: string // For Nano Banana Pro iterative refinement
}

// Grooming style options
const groomingStyles = [
  { id: 'teddy', name: 'Teddy Bear', icon: '🧸', description: 'Round fluffy face, plush even fur' },
  { id: 'lion', name: 'Lion Cut', icon: '🦁', description: 'Full mane, trimmed body' },
  { id: 'asian', name: 'Asian Fusion', icon: '🌸', description: 'Round face, fluffy cheeks' },
  { id: 'breed', name: 'Breed Standard', icon: '🏆', description: 'Show-quality precision cut' },
  { id: 'puppy', name: 'Puppy Cut', icon: '🐕', description: 'Even length, soft and natural' },
]

// AI Designer style options
const aiDesignStyles = [
  { id: 'whimsical', name: 'Whimsical', icon: '✨', description: 'Soft pastels, playful & magical' },
  { id: 'bold', name: 'Bold & Vibrant', icon: '🔥', description: 'Rich saturated colors that pop' },
  { id: 'elegant', name: 'Elegant', icon: '💎', description: 'Refined rose gold, champagne, silver' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', description: 'Multi-color gradient magic' },
  { id: 'seasonal', name: 'Seasonal', icon: '🎄', description: 'Christmas colors with hearts & patterns' },
]

// =============================================================================
// Main Page Component
// =============================================================================
export default function LookingGlassPage() {
  const [step, setStep] = useState<Step>('upload')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('grooming')
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [designStyle, setDesignStyle] = useState<string | null>(null)
  const [colorDescription, setColorDescription] = useState('')
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFixes, setSelectedFixes] = useState<string[]>([])
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [refinementText, setRefinementText] = useState('')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
        setStep('mode')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleModeSelect = (selectedMode: Mode) => {
    setMode(selectedMode)
    setStep('style')
  }

  const handleGenerate = async () => {
    if (!uploadedImage) return
    if (mode === 'grooming' && !selectedStyle) return
    if (mode === 'creative' && !colorDescription.trim()) return
    if (mode === 'ai-designer' && !designStyle) return

    setStep('generating')
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/looking-glass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          mode,
          style: selectedStyle,
          designStyle: designStyle,
          colorDescription: colorDescription,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Generation failed')
      }

      setPreviewResult({
        previewUrl: data.previewUrl,
        disclaimer: data.disclaimer,
        promptUsed: data.promptUsed,
        analysis: data.analysis,
        sessionId: data.sessionId,
      })
      if (data.sessionId) {
        setSessionId(data.sessionId)
      }
      setSelectedFixes([]) // Reset selected fixes
      setStep('preview')

    } catch (err) {
      console.error('Looking Glass error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
      setStep('style')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateWithFixes = async () => {
    if (!uploadedImage || !previewResult?.promptUsed || selectedFixes.length === 0) return

    setIsRegenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/looking-glass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          mode,
          style: selectedStyle,
          designStyle: designStyle,
          colorDescription: colorDescription,
          // Send fixes for regeneration
          userFixes: selectedFixes,
          previousPrompt: previewResult.promptUsed,
          // Pass session for Nano Banana Pro iterative refinement
          sessionId: sessionId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Regeneration failed')
      }

      setPreviewResult({
        previewUrl: data.previewUrl,
        disclaimer: data.disclaimer,
        promptUsed: data.promptUsed,
        analysis: data.analysis,
      })
      setSelectedFixes([]) // Reset selected fixes after regeneration

    } catch (err) {
      console.error('Regeneration error:', err)
      setError(err instanceof Error ? err.message : 'Failed to regenerate')
    } finally {
      setIsRegenerating(false)
    }
  }

  const toggleFix = (fix: string) => {
    setSelectedFixes(prev =>
      prev.includes(fix)
        ? prev.filter(f => f !== fix)
        : [...prev, fix]
    )
  }

  const handleStartOver = () => {
    setStep('upload')
    setUploadedImage(null)
    setMode('grooming')
    setSelectedStyle(null)
    setDesignStyle(null)
    setColorDescription('')
    setPreviewResult(null)
    setError(null)
    setSelectedFixes([])
    setIsRegenerating(false)
    setSessionId(null)
    setRefinementText('')
  }

  const stepLabels = ['Upload', 'Mode', 'Details', 'Preview']
  const stepKeys: Step[] = ['upload', 'mode', 'style', 'preview']
  const currentStepIndex = stepKeys.indexOf(step === 'generating' ? 'style' : step)

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-6xl mb-4">
            <span className="text-gradient">The Looking</span>{' '}
            <span className="text-psychedelic">Glass</span>
          </h1>
          <p className="text-white text-xl drop-shadow-lg">
            See your pet&apos;s transformation before the groom
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-2 mb-12">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    currentStepIndex === i
                      ? 'bg-alice-purple text-white'
                      : currentStepIndex > i
                      ? 'bg-alice-gold text-wonderland-bg'
                      : 'bg-wonderland-card text-wonderland-muted'
                  }`}
                >
                  {i + 1}
                </div>
                <span className="text-xs text-wonderland-muted mt-1 hidden sm:block">{label}</span>
              </div>
              {i < 3 && (
                <div
                  className={`w-8 h-1 mx-1 ${
                    currentStepIndex > i ? 'bg-alice-gold' : 'bg-wonderland-card'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card-wonderland p-8"
            >
              <h2 className="font-display text-2xl text-center mb-6 text-wonderland-text">
                Upload a Photo of Your Pet
              </h2>
              <p className="text-center text-wonderland-muted mb-8">
                For best results, use a clear, front-facing photo in good lighting
              </p>

              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-alice-purple/50 rounded-2xl p-12 text-center hover:border-alice-purple transition-colors">
                  <span className="text-6xl block mb-4">📸</span>
                  <span className="text-alice-gold font-display text-lg">
                    Click to upload or drag & drop
                  </span>
                  <span className="block text-wonderland-muted text-sm mt-2">
                    JPG, PNG up to 10MB
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </motion.div>
          )}

          {/* Step 2: Mode Selection */}
          {step === 'mode' && (
            <motion.div
              key="mode"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {uploadedImage && (
                <div className="card-wonderland p-4 max-w-xs mx-auto">
                  <Image
                    src={uploadedImage}
                    alt="Your pet"
                    width={300}
                    height={300}
                    className="rounded-xl object-cover w-full aspect-square"
                  />
                </div>
              )}

              <div className="card-wonderland p-8">
                <h2 className="font-display text-2xl text-center mb-6 text-wonderland-text">
                  What would you like to preview?
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                  <button
                    onClick={() => handleModeSelect('grooming')}
                    className="p-6 rounded-xl border-2 border-alice-purple/30 hover:border-alice-gold transition-all text-left"
                  >
                    <span className="text-5xl block mb-4">✂️</span>
                    <span className="font-display text-xl text-wonderland-text block mb-2">
                      Grooming Style
                    </span>
                    <span className="text-wonderland-muted text-sm">
                      See artistic inspiration for haircuts like teddy bear or lion cut.
                    </span>
                    <span className="text-xs text-alice-purple block mt-2">
                      AI-generated inspiration
                    </span>
                  </button>

                  <button
                    onClick={() => handleModeSelect('creative')}
                    className="p-6 rounded-xl border-2 border-alice-purple/30 hover:border-alice-gold transition-all text-left"
                  >
                    <span className="text-5xl block mb-4">🎨</span>
                    <span className="font-display text-xl text-wonderland-text block mb-2">
                      Creative Color
                    </span>
                    <span className="text-wonderland-muted text-sm">
                      Describe any colors, patterns, or themes you want!
                    </span>
                    <span className="text-xs text-alice-purple block mt-2">
                      Hearts, stars, holidays, anything!
                    </span>
                  </button>

                  <button
                    onClick={() => handleModeSelect('ai-designer')}
                    className="p-6 rounded-xl border-2 border-alice-purple/30 hover:border-alice-gold transition-all text-left"
                  >
                    <span className="text-5xl block mb-4">🤖</span>
                    <span className="font-display text-xl text-wonderland-text block mb-2">
                      AI Designer
                    </span>
                    <span className="text-wonderland-muted text-sm">
                      Pick a vibe and let AI design the colors.
                    </span>
                    <span className="text-xs text-alice-purple block mt-2">
                      Curated color palettes
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Style/Color Selection */}
          {step === 'style' && (
            <motion.div
              key="style"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {uploadedImage && (
                <div className="card-wonderland p-4 max-w-xs mx-auto">
                  <Image
                    src={uploadedImage}
                    alt="Your pet"
                    width={300}
                    height={300}
                    className="rounded-xl object-cover w-full aspect-square"
                  />
                </div>
              )}

              {/* GROOMING MODE */}
              {mode === 'grooming' && (
                <div className="card-wonderland p-8">
                  <h2 className="font-display text-2xl text-center mb-2 text-wonderland-text">
                    Choose a Grooming Style
                  </h2>
                  <p className="text-center text-alice-purple text-sm mb-6">
                    AI-generated artistic inspiration (not your exact pet)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {groomingStyles.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedStyle === style.id
                            ? 'border-alice-gold bg-alice-gold/10'
                            : 'border-alice-purple/20 hover:border-alice-purple/50'
                        }`}
                      >
                        <span className="text-3xl block mb-2">{style.icon}</span>
                        <span className="font-display text-wonderland-text block">
                          {style.name}
                        </span>
                        <span className="text-xs text-wonderland-muted">
                          {style.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CREATIVE MODE */}
              {mode === 'creative' && (
                <div className="card-wonderland p-8">
                  <h2 className="font-display text-2xl text-center mb-2 text-wonderland-text">
                    Describe Your Dream Look
                  </h2>
                  <p className="text-center text-alice-purple text-sm mb-6">
                    Tell us about colors, patterns, themes, or anything you can imagine!
                  </p>

                  <textarea
                    value={colorDescription}
                    onChange={e => setColorDescription(e.target.value)}
                    placeholder="Examples:&#10;• Red hearts, Christmas vibe&#10;• Pink and purple rainbow&#10;• Blue stars on the ears&#10;• Halloween orange and black&#10;• Valentine's Day hearts"
                    className="w-full bg-wonderland-bg border border-alice-purple/30 rounded-xl p-4 text-wonderland-text placeholder-wonderland-muted focus:border-alice-purple focus:outline-none resize-none h-32"
                  />

                  <div className="mt-4 p-4 bg-alice-purple/10 rounded-xl border border-alice-purple/30">
                    <p className="text-sm text-wonderland-muted">
                      <strong>Tip:</strong> Be specific! Mention colors, patterns (hearts, stars, paws),
                      and themes (Christmas, Valentine&apos;s, Halloween). The more detail, the better!
                    </p>
                  </div>
                </div>
              )}

              {/* AI DESIGNER MODE */}
              {mode === 'ai-designer' && (
                <div className="card-wonderland p-8">
                  <h2 className="font-display text-2xl text-center mb-2 text-wonderland-text">
                    Choose Your Vibe
                  </h2>
                  <p className="text-center text-alice-purple text-sm mb-6">
                    Pick a style and let AI design the perfect colors
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {aiDesignStyles.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setDesignStyle(style.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          designStyle === style.id
                            ? 'border-alice-gold bg-alice-gold/10'
                            : 'border-alice-purple/20 hover:border-alice-purple/50'
                        }`}
                      >
                        <span className="text-3xl block mb-2">{style.icon}</span>
                        <span className="font-display text-wonderland-text block">
                          {style.name}
                        </span>
                        <span className="text-xs text-wonderland-muted">
                          {style.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card-wonderland p-4 bg-red-500/20 border border-red-500/50 text-center"
                >
                  <p className="text-red-300">{error}</p>
                  <p className="text-wonderland-muted text-sm mt-2">
                    Please try again or contact us to book directly.
                  </p>
                </motion.div>
              )}

              {/* Generate button */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setStep('mode')}
                  className="px-6 py-3 rounded-full font-display border-2 border-white/50 text-white hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={
                    isGenerating ||
                    (mode === 'grooming' && !selectedStyle) ||
                    (mode === 'creative' && !colorDescription.trim()) ||
                    (mode === 'ai-designer' && !designStyle)
                  }
                  className="btn-wonderland text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate Preview 🪞'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Generating */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-wonderland p-12 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="text-8xl mb-6 inline-block"
              >
                🪞
              </motion.div>
              <h2 className="font-display text-2xl text-wonderland-text mb-4">
                Peering Through the Looking Glass...
              </h2>
              <p className="text-wonderland-muted">
                {mode === 'grooming'
                  ? 'Creating artistic inspiration for your style'
                  : 'Applying color to your pet\'s photo'}
              </p>
              <motion.div className="mt-8 h-2 bg-wonderland-bg rounded-full overflow-hidden max-w-xs mx-auto">
                <motion.div
                  className="h-full bg-gradient-to-r from-alice-purple to-psyche-pink"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: mode === 'grooming' ? 15 : 8 }}
                />
              </motion.div>
            </motion.div>
          )}

          {/* Step 5: Preview */}
          {step === 'preview' && previewResult?.previewUrl && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="card-wonderland p-8">
                <h2 className="font-display text-2xl text-center mb-2 text-wonderland-text">
                  Your Pet&apos;s {mode === 'grooming' ? 'Style Inspiration' : 'Color Preview'}
                </h2>
                <p className="text-center text-alice-purple text-sm mb-6">
                  {previewResult.disclaimer}
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Before */}
                  <div className="text-center">
                    <span className="text-wonderland-muted text-sm block mb-2">Original</span>
                    {uploadedImage && (
                      <Image
                        src={uploadedImage}
                        alt="Before"
                        width={400}
                        height={400}
                        className="rounded-xl object-cover w-full aspect-square"
                      />
                    )}
                  </div>

                  {/* After */}
                  <div className="text-center">
                    <span className="text-alice-gold text-sm block mb-2">Preview</span>
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewResult.previewUrl}
                        alt="Preview"
                        className="rounded-xl object-cover w-full aspect-square"
                      />
                      <div className="absolute bottom-4 left-4 right-4 text-center">
                        <span className="px-4 py-2 rounded-full text-sm bg-alice-purple/80 text-white">
                          AI Preview - Professional results may vary
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis Info - Auto-retry notification */}
              {previewResult.analysis && previewResult.analysis.autoRetried > 0 && (
                <div className="mt-4 p-4 bg-alice-purple/20 rounded-xl border border-alice-purple/30">
                  <p className="text-sm text-wonderland-text">
                    <span className="text-alice-gold">✨ AI Auto-Improved:</span> Our AI detected some issues and automatically refined the result ({previewResult.analysis.autoRetried} adjustment{previewResult.analysis.autoRetried > 1 ? 's' : ''} made).
                  </p>
                </div>
              )}

              {/* Feedback Section - Suggested Fixes */}
              {previewResult.analysis && previewResult.analysis.suggestedFixes.length > 0 && (
                <div className="mt-6 p-6 bg-wonderland-card rounded-xl border border-alice-purple/30">
                  <h3 className="font-display text-lg text-wonderland-text mb-3">
                    🎨 Want to tweak it?
                  </h3>
                  <p className="text-sm text-wonderland-muted mb-4">
                    Our AI noticed some things you might want to adjust. Select any fixes and regenerate:
                  </p>

                  <div className="space-y-3">
                    {previewResult.analysis.suggestedFixes.map((fix, index) => (
                      <label
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          selectedFixes.includes(fix)
                            ? 'bg-alice-purple/30 border border-alice-purple'
                            : 'bg-wonderland-bg/50 border border-transparent hover:border-alice-purple/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFixes.includes(fix)}
                          onChange={() => toggleFix(fix)}
                          className="w-5 h-5 rounded border-alice-purple/50 text-alice-purple focus:ring-alice-purple bg-wonderland-bg"
                        />
                        <span className="text-wonderland-text">{fix}</span>
                      </label>
                    ))}
                  </div>

                  {/* Quick fix buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleFix('Keep face natural - remove any color from face')}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        selectedFixes.includes('Keep face natural - remove any color from face')
                          ? 'bg-alice-purple text-white'
                          : 'bg-wonderland-bg border border-alice-purple/30 text-wonderland-muted hover:border-alice-purple'
                      }`}
                    >
                      🐕 Natural Face
                    </button>
                    <button
                      onClick={() => toggleFix('Patterns look flat - make them more natural')}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        selectedFixes.includes('Patterns look flat - make them more natural')
                          ? 'bg-alice-purple text-white'
                          : 'bg-wonderland-bg border border-alice-purple/30 text-wonderland-muted hover:border-alice-purple'
                      }`}
                    >
                      ✨ More Realistic
                    </button>
                    <button
                      onClick={() => toggleFix('Theme is subtle - make it more visible')}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        selectedFixes.includes('Theme is subtle - make it more visible')
                          ? 'bg-alice-purple text-white'
                          : 'bg-wonderland-bg border border-alice-purple/30 text-wonderland-muted hover:border-alice-purple'
                      }`}
                    >
                      🎄 Stronger Theme
                    </button>
                    <button
                      onClick={() => toggleFix('Colors too intense - make them softer')}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        selectedFixes.includes('Colors too intense - make them softer')
                          ? 'bg-alice-purple text-white'
                          : 'bg-wonderland-bg border border-alice-purple/30 text-wonderland-muted hover:border-alice-purple'
                      }`}
                    >
                      🎨 Softer Colors
                    </button>
                  </div>

                  {selectedFixes.length > 0 && (
                    <button
                      onClick={handleRegenerateWithFixes}
                      disabled={isRegenerating}
                      className="mt-4 w-full btn-wonderland text-white disabled:opacity-50"
                    >
                      {isRegenerating ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            🔄
                          </motion.span>
                          Regenerating...
                        </span>
                      ) : (
                        `Regenerate with ${selectedFixes.length} fix${selectedFixes.length > 1 ? 'es' : ''}`
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Error during regeneration */}
              {error && (
                <div className="mt-4 p-4 bg-red-500/20 rounded-xl border border-red-500/50">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setPreviewResult(null)
                    setSelectedFixes([])
                    setStep('style')
                  }}
                  className="px-6 py-3 rounded-full font-display border-2 border-white text-white hover:bg-white/10 transition-colors"
                >
                  Try Another {mode === 'grooming' ? 'Style' : 'Color'}
                </button>
                <button
                  onClick={handleStartOver}
                  className="px-6 py-3 rounded-full font-display border-2 border-white/50 text-white/70 hover:bg-white/10 transition-colors"
                >
                  Start Over
                </button>
                <a
                  href="/wonderland/contact"
                  className="btn-wonderland text-white text-center"
                >
                  Book This Look!
                </a>
              </div>

              <p className="text-center text-wonderland-muted text-sm">
                Love this preview? Contact us to book your appointment!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
