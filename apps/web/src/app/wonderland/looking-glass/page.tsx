// apps/web/src/app/wonderland/looking-glass/page.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

type Step = 'upload' | 'mode' | 'style' | 'generating' | 'preview'
type Mode = 'grooming' | 'creative' | 'ai-designer'
type PreviewMethod = 'ai-generated' | 'canvas-overlay'

interface ColorSettings {
  hue: number
  saturation: number
  name: string
}

interface PreviewResult {
  method: PreviewMethod
  // For AI-generated (grooming mode)
  previewUrl?: string
  disclaimer?: string
  // For canvas-overlay (color modes)
  maskUrl?: string
  originalUrl?: string
  colorSettings?: ColorSettings
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
  { id: 'seasonal', name: 'Seasonal', icon: '🍂', description: 'Themed for the current season' },
]

// =============================================================================
// Canvas Color Overlay Component
// Applies color tint to the pet using the segmentation mask
// =============================================================================
function ColorOverlayCanvas({
  originalUrl,
  maskUrl,
  colorSettings,
  onReady,
}: {
  originalUrl: string
  maskUrl: string
  colorSettings: ColorSettings
  onReady: (dataUrl: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const applyColorOverlay = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      // Load original image
      const originalImg = new window.Image()
      originalImg.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        originalImg.onload = () => resolve()
        originalImg.onerror = reject
        originalImg.src = originalUrl
      })

      // Load mask image
      const maskImg = new window.Image()
      maskImg.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        maskImg.onload = () => resolve()
        maskImg.onerror = reject
        maskImg.src = maskUrl
      })

      // Set canvas size to match original
      canvas.width = originalImg.width
      canvas.height = originalImg.height

      // Draw original image
      ctx.drawImage(originalImg, 0, 0)

      // Create a temporary canvas for the color layer
      const colorCanvas = document.createElement('canvas')
      colorCanvas.width = canvas.width
      colorCanvas.height = canvas.height
      const colorCtx = colorCanvas.getContext('2d')
      if (!colorCtx) return

      // Draw the mask to determine where to apply color
      colorCtx.drawImage(maskImg, 0, 0, canvas.width, canvas.height)

      // Get mask data
      const maskData = colorCtx.getImageData(0, 0, canvas.width, canvas.height)

      // Create color overlay
      colorCtx.clearRect(0, 0, canvas.width, canvas.height)

      // Fill with the target color
      const { hue, saturation } = colorSettings

      if (hue === -1) {
        // Rainbow mode - create gradient
        const gradient = colorCtx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, 'hsl(0, 70%, 60%)')
        gradient.addColorStop(0.17, 'hsl(30, 70%, 60%)')
        gradient.addColorStop(0.33, 'hsl(60, 70%, 60%)')
        gradient.addColorStop(0.5, 'hsl(120, 70%, 60%)')
        gradient.addColorStop(0.67, 'hsl(210, 70%, 60%)')
        gradient.addColorStop(0.83, 'hsl(270, 70%, 60%)')
        gradient.addColorStop(1, 'hsl(330, 70%, 60%)')
        colorCtx.fillStyle = gradient
      } else {
        colorCtx.fillStyle = `hsl(${hue}, ${saturation}%, 60%)`
      }
      colorCtx.fillRect(0, 0, canvas.width, canvas.height)

      // Get color data
      const colorData = colorCtx.getImageData(0, 0, canvas.width, canvas.height)

      // Apply mask - only keep color where mask is white (pet area)
      for (let i = 0; i < maskData.data.length; i += 4) {
        // Check if this pixel is part of the pet (white in mask = high values)
        const maskBrightness = (maskData.data[i] + maskData.data[i + 1] + maskData.data[i + 2]) / 3
        if (maskBrightness < 128) {
          // Not part of pet - make transparent
          colorData.data[i + 3] = 0
        } else {
          // Part of pet - apply semi-transparent color
          colorData.data[i + 3] = Math.floor((saturation / 100) * 180) // More saturation = more visible
        }
      }

      colorCtx.putImageData(colorData, 0, 0)

      // Composite: draw color layer on top of original with 'color' blend mode
      ctx.globalCompositeOperation = 'color'
      ctx.drawImage(colorCanvas, 0, 0)

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over'

      // Return the result as data URL
      const dataUrl = canvas.toDataURL('image/png')
      onReady(dataUrl)

    } catch (error) {
      console.error('Error applying color overlay:', error)
    }
  }, [originalUrl, maskUrl, colorSettings, onReady])

  useEffect(() => {
    applyColorOverlay()
  }, [applyColorOverlay])

  return <canvas ref={canvasRef} className="hidden" />
}

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
  const [canvasPreview, setCanvasPreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setCanvasPreview(null)

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

      // Handle different response types
      if (data.method === 'ai-generated') {
        // Grooming mode - direct preview URL
        setPreviewResult({
          method: 'ai-generated',
          previewUrl: data.previewUrl,
          disclaimer: data.disclaimer,
        })
        setStep('preview')
      } else if (data.method === 'canvas-overlay') {
        // Color modes - need to apply overlay in browser
        setPreviewResult({
          method: 'canvas-overlay',
          maskUrl: data.maskUrl,
          originalUrl: uploadedImage,
          colorSettings: data.colorSettings,
        })
        // Step will change to 'preview' once canvas is ready
      }

    } catch (err) {
      console.error('Looking Glass error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
      setStep('style')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCanvasReady = (dataUrl: string) => {
    setCanvasPreview(dataUrl)
    setStep('preview')
  }

  const handleStartOver = () => {
    setStep('upload')
    setUploadedImage(null)
    setMode('grooming')
    setSelectedStyle(null)
    setDesignStyle(null)
    setColorDescription('')
    setPreviewResult(null)
    setCanvasPreview(null)
    setError(null)
  }

  // Get the preview image URL based on method
  const getPreviewUrl = () => {
    if (previewResult?.method === 'ai-generated') {
      return previewResult.previewUrl
    }
    return canvasPreview
  }

  const stepLabels = ['Upload', 'Mode', 'Details', 'Preview']
  const stepKeys: Step[] = ['upload', 'mode', 'style', 'preview']
  const currentStepIndex = stepKeys.indexOf(step === 'generating' ? 'style' : step)

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Canvas for color overlay (hidden, renders in background) */}
        {previewResult?.method === 'canvas-overlay' && previewResult.maskUrl && previewResult.colorSettings && uploadedImage && (
          <ColorOverlayCanvas
            originalUrl={uploadedImage}
            maskUrl={previewResult.maskUrl}
            colorSettings={previewResult.colorSettings}
            onReady={handleCanvasReady}
          />
        )}

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
                    className="p-6 rounded-xl border-2 border-alice-purple/30 hover:border-alice-gold transition-all text-left relative"
                  >
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      ACCURATE
                    </div>
                    <span className="text-5xl block mb-4">🎨</span>
                    <span className="font-display text-xl text-wonderland-text block mb-2">
                      Creative Color
                    </span>
                    <span className="text-wonderland-muted text-sm">
                      Preview colors on YOUR actual pet photo.
                    </span>
                    <span className="text-xs text-green-400 block mt-2">
                      Your photo preserved
                    </span>
                  </button>

                  <button
                    onClick={() => handleModeSelect('ai-designer')}
                    className="p-6 rounded-xl border-2 border-alice-purple/30 hover:border-alice-gold transition-all text-left relative"
                  >
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      ACCURATE
                    </div>
                    <span className="text-5xl block mb-4">🤖</span>
                    <span className="font-display text-xl text-wonderland-text block mb-2">
                      AI Designer
                    </span>
                    <span className="text-wonderland-muted text-sm">
                      Pick a vibe, see colors on YOUR pet.
                    </span>
                    <span className="text-xs text-green-400 block mt-2">
                      Your photo preserved
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
                    What Colors Do You Want?
                  </h2>
                  <p className="text-center text-green-400 text-sm mb-6">
                    Color will be applied to YOUR actual photo
                  </p>

                  <textarea
                    value={colorDescription}
                    onChange={e => setColorDescription(e.target.value)}
                    placeholder="Examples:&#10;• Pink ears and tail&#10;• Purple all over&#10;• Blue and green rainbow&#10;• Rose gold highlights"
                    className="w-full bg-wonderland-bg border border-alice-purple/30 rounded-xl p-4 text-wonderland-text placeholder-wonderland-muted focus:border-alice-purple focus:outline-none resize-none h-32"
                  />

                  <div className="mt-4 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                    <p className="text-sm text-green-300">
                      <strong>How it works:</strong> We detect your pet in the photo and apply the color tint directly.
                      Your original photo stays intact - we just add color on top!
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
                  <p className="text-center text-green-400 text-sm mb-6">
                    Color will be applied to YOUR actual photo
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
          {step === 'preview' && getPreviewUrl() && (
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
                {previewResult?.method === 'ai-generated' && (
                  <p className="text-center text-alice-purple text-sm mb-6">
                    {previewResult.disclaimer}
                  </p>
                )}
                {previewResult?.method === 'canvas-overlay' && (
                  <p className="text-center text-green-400 text-sm mb-6">
                    This is YOUR photo with color applied - exactly how it would look!
                  </p>
                )}

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
                    <span className="text-alice-gold text-sm block mb-2">
                      {previewResult?.method === 'ai-generated' ? 'Inspiration' : 'Preview'}
                    </span>
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getPreviewUrl()!}
                        alt="Preview"
                        className="rounded-xl object-cover w-full aspect-square"
                      />
                      <div className="absolute bottom-4 left-4 right-4 text-center">
                        <span className={`px-4 py-2 rounded-full text-sm ${
                          previewResult?.method === 'ai-generated'
                            ? 'bg-alice-purple/80 text-white'
                            : 'bg-green-500/80 text-white'
                        }`}>
                          {previewResult?.method === 'ai-generated'
                            ? 'AI Inspiration - Style reference only'
                            : 'Accurate Preview - Your actual photo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setPreviewResult(null)
                    setCanvasPreview(null)
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
