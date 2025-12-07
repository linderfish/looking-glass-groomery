// apps/web/src/app/wonderland/looking-glass/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

type Step = 'upload' | 'mode' | 'style' | 'generating' | 'preview'
type Mode = 'grooming' | 'creative'

// Grooming style options - these only change fur shape/length
const groomingStyles = [
  { id: 'teddy', name: 'Teddy Bear', icon: '🧸', description: 'Round fluffy face, plush even fur' },
  { id: 'lion', name: 'Lion Cut', icon: '🦁', description: 'Full mane, trimmed body' },
  { id: 'asian', name: 'Asian Fusion', icon: '🌸', description: 'Round face, fluffy cheeks' },
  { id: 'breed', name: 'Breed Standard', icon: '🏆', description: 'Show-quality precision cut' },
  { id: 'puppy', name: 'Puppy Cut', icon: '🐕', description: 'Even length, soft and natural' },
]

export default function LookingGlassPage() {
  const [step, setStep] = useState<Step>('upload')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('grooming')
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [colorDescription, setColorDescription] = useState('')
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null)
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
          colorDescription: colorDescription,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Generation failed')
      }

      setGeneratedPreview(data.previewUrl)
      setStep('preview')
    } catch (err) {
      console.error('Looking Glass error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
      setStep('style')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartOver = () => {
    setStep('upload')
    setUploadedImage(null)
    setMode('grooming')
    setSelectedStyle(null)
    setColorDescription('')
    setGeneratedPreview(null)
    setError(null)
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
              {/* Preview uploaded image */}
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

                <div className="grid md:grid-cols-2 gap-6">
                  <button
                    onClick={() => handleModeSelect('grooming')}
                    className="p-6 rounded-xl border-2 border-alice-purple/30 hover:border-alice-gold transition-all text-left"
                  >
                    <span className="text-5xl block mb-4">✂️</span>
                    <span className="font-display text-xl text-wonderland-text block mb-2">
                      Grooming Style
                    </span>
                    <span className="text-wonderland-muted text-sm">
                      Preview different haircuts like teddy bear, lion cut, or breed standard.
                      Shows how your pet would look with a new style.
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
                      Preview pet-safe colors and designs. Describe exactly where you want
                      color added (ears, tail, patterns, etc).
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
              {/* Preview uploaded image */}
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

              {/* GROOMING MODE: Style Selection */}
              {mode === 'grooming' && (
                <div className="card-wonderland p-8">
                  <h2 className="font-display text-2xl text-center mb-2 text-wonderland-text">
                    Choose a Grooming Style
                  </h2>
                  <p className="text-center text-wonderland-muted text-sm mb-6">
                    This will only change the fur shape - same pet, same colors
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

              {/* CREATIVE MODE: Color Description */}
              {mode === 'creative' && (
                <div className="card-wonderland p-8">
                  <h2 className="font-display text-2xl text-center mb-2 text-wonderland-text">
                    Describe Your Creative Vision
                  </h2>
                  <p className="text-center text-wonderland-muted text-sm mb-6">
                    Be specific about colors AND where you want them
                  </p>

                  <textarea
                    value={colorDescription}
                    onChange={e => setColorDescription(e.target.value)}
                    placeholder="Example: Pink heart shape on the left ribcage&#10;Example: Purple and blue ombre on the ears&#10;Example: Rainbow tail with pink, purple, and blue"
                    className="w-full bg-wonderland-bg border border-alice-purple/30 rounded-xl p-4 text-wonderland-text placeholder-wonderland-muted focus:border-alice-purple focus:outline-none resize-none h-32"
                  />

                  <div className="mt-4 p-4 bg-alice-purple/10 rounded-xl">
                    <p className="text-sm text-wonderland-muted">
                      <strong className="text-alice-gold">Tip:</strong> The more specific you are, the better!
                      Include the color, the location, and any shapes or patterns you want.
                    </p>
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
                    (mode === 'creative' && !colorDescription.trim())
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
                  ? 'Styling your pet with the perfect cut'
                  : 'Adding some magical color to your pet'}
              </p>
              <motion.div className="mt-8 h-2 bg-wonderland-bg rounded-full overflow-hidden max-w-xs mx-auto">
                <motion.div
                  className="h-full bg-gradient-to-r from-alice-purple to-psyche-pink"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 15 }}
                />
              </motion.div>
            </motion.div>
          )}

          {/* Step 5: Preview */}
          {step === 'preview' && generatedPreview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="card-wonderland p-8">
                <h2 className="font-display text-2xl text-center mb-6 text-wonderland-text">
                  Your Pet&apos;s {mode === 'grooming' ? 'New Style' : 'Creative Color'} Preview
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Before */}
                  <div className="text-center">
                    <span className="text-wonderland-muted text-sm block mb-2">Before</span>
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
                    <span className="text-alice-gold text-sm block mb-2">After (Preview)</span>
                    <div className="relative">
                      <Image
                        src={generatedPreview}
                        alt="After preview"
                        width={400}
                        height={400}
                        className="rounded-xl object-cover w-full aspect-square"
                      />
                      <div className="absolute bottom-4 left-4 right-4 text-center">
                        <span className="bg-wonderland-bg/80 px-4 py-2 rounded-full text-sm text-alice-gold">
                          AI Preview - Results may vary
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setStep('style')}
                  className="px-6 py-3 rounded-full font-display border-2 border-white text-white hover:bg-white/10 transition-colors"
                >
                  Try Another {mode === 'grooming' ? 'Style' : 'Design'}
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
