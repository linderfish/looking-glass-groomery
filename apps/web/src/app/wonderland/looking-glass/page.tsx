// apps/web/src/app/wonderland/looking-glass/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

type Step = 'upload' | 'style' | 'generating' | 'preview'

const styleOptions = [
  { id: 'teddy', name: 'Teddy Bear', icon: '🧸', description: 'Round, fluffy, and adorable' },
  { id: 'lion', name: 'Lion Cut', icon: '🦁', description: 'Majestic mane with trimmed body' },
  { id: 'asian', name: 'Asian Fusion', icon: '🌸', description: 'Trendy Japanese/Korean styles' },
  { id: 'creative', name: 'Creative Color', icon: '🎨', description: 'Add some magical color' },
  { id: 'breed', name: 'Breed Standard', icon: '🏆', description: 'Classic show-quality cut' },
  { id: 'custom', name: 'Custom Design', icon: '✨', description: 'Tell us your vision' },
]

const colorOptions = [
  { id: 'pink', name: 'Cotton Candy Pink', color: '#FF69B4' },
  { id: 'purple', name: 'Magical Purple', color: '#9B59B6' },
  { id: 'blue', name: 'Ocean Blue', color: '#12C2E9' },
  { id: 'rainbow', name: 'Rainbow Magic', color: 'linear-gradient(90deg, #FF6B9D, #C471ED, #12C2E9)' },
  { id: 'teal', name: 'Wonderland Teal', color: '#008080' },
  { id: 'gold', name: 'Golden Hour', color: '#D4AF37' },
]

export default function LookingGlassPage() {
  const [step, setStep] = useState<Step>('upload')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [customNotes, setCustomNotes] = useState('')
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
        setStep('style')
      }
      reader.readAsDataURL(file)
    }
  }

  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!uploadedImage || !selectedStyle) return

    setStep('generating')
    setIsGenerating(true)
    setError(null)

    try {
      // Call the Looking Glass API with the pet photo
      const response = await fetch('/api/looking-glass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImage, // Base64 data URL from file upload
          style: selectedStyle,
          color: selectedColor,
          customNotes: customNotes,
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
      setStep('style') // Go back to style selection on error
    } finally {
      setIsGenerating(false)
    }
  }

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
          {['upload', 'style', 'generating', 'preview'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s
                    ? 'bg-alice-purple text-white'
                    : ['upload', 'style', 'generating', 'preview'].indexOf(step) > i
                    ? 'bg-alice-gold text-wonderland-bg'
                    : 'bg-wonderland-card text-wonderland-muted'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div
                  className={`w-8 h-1 mx-1 ${
                    ['upload', 'style', 'generating', 'preview'].indexOf(step) > i
                      ? 'bg-alice-gold'
                      : 'bg-wonderland-card'
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

          {/* Step 2: Style Selection */}
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

              {/* Style selection */}
              <div className="card-wonderland p-8">
                <h2 className="font-display text-2xl text-center mb-6 text-wonderland-text">
                  Choose Your Style
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {styleOptions.map(style => (
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

              {/* Color selection (optional) */}
              {selectedStyle === 'creative' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="card-wonderland p-8"
                >
                  <h2 className="font-display text-xl text-center mb-6 text-wonderland-text">
                    Choose Your Colors
                  </h2>
                  <div className="flex flex-wrap justify-center gap-4">
                    {colorOptions.map(color => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedColor === color.id
                            ? 'border-white scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-full mb-2"
                          style={{ background: color.color }}
                        />
                        <span className="text-xs text-wonderland-text">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Custom notes */}
              <div className="card-wonderland p-8">
                <h2 className="font-display text-xl text-center mb-4 text-wonderland-text">
                  Any Special Requests?
                </h2>
                <textarea
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder="Tell us about any specific details you'd like..."
                  className="w-full bg-wonderland-bg border border-alice-purple/30 rounded-xl p-4 text-wonderland-text placeholder-wonderland-muted focus:border-alice-purple focus:outline-none resize-none h-24"
                />
              </div>

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
              <div className="text-center">
                <button
                  onClick={handleGenerate}
                  disabled={!selectedStyle || isGenerating}
                  className="btn-wonderland text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate Preview 🪞'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generating */}
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
                Our AI is envisioning your pet&apos;s transformation
              </p>
              <motion.div
                className="mt-8 h-2 bg-wonderland-bg rounded-full overflow-hidden max-w-xs mx-auto"
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-alice-purple to-psyche-pink"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3 }}
                />
              </motion.div>
            </motion.div>
          )}

          {/* Step 4: Preview */}
          {step === 'preview' && generatedPreview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="card-wonderland p-8">
                <h2 className="font-display text-2xl text-center mb-6 text-wonderland-text">
                  Your Pet&apos;s Transformation Preview
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
                      <div className="absolute inset-0 bg-gradient-to-br from-alice-purple/20 to-psyche-pink/20 rounded-xl" />
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
                  Try Another Style
                </button>
                <a
                  href="https://instagram.com/throughthelookingglass"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-wonderland text-white text-center"
                >
                  Book This Look! 📱
                </a>
              </div>

              <p className="text-center text-wonderland-muted text-sm">
                Love this preview? DM us on Instagram or text Kimmie to book your appointment!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
