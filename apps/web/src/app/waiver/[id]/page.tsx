// apps/web/src/app/waiver/[id]/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import DOMPurify from 'dompurify'

interface WaiverData {
  waiver: {
    id: string
    name: string
    content: string
    version: number
  }
  client: {
    firstName: string
    lastName: string
    email: string
  }
  alreadySigned: boolean
  signedAt?: string
}

export default function WaiverSigningPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const waiverId = params.id as string
  const clientId = searchParams.get('client')

  const [waiverData, setWaiverData] = useState<WaiverData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const CHESHIRE_API = process.env.NEXT_PUBLIC_CHESHIRE_API_URL || 'http://localhost:3001'

  // Fetch waiver data
  useEffect(() => {
    if (!waiverId || !clientId) {
      setError('Invalid waiver link')
      setLoading(false)
      return
    }

    fetch(`${CHESHIRE_API}/waiver/${waiverId}?client=${clientId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Waiver not found')
        return res.json()
      })
      .then((data) => {
        setWaiverData(data)
        if (data.alreadySigned) {
          setSigned(true)
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load waiver')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [waiverId, clientId, CHESHIRE_API])

  // Canvas drawing setup
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)

    // Style
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Clear with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
  }, [waiverData])

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    setHasSignature(false)
  }

  const submitSignature = async () => {
    if (!canvasRef.current || !hasSignature || !clientId) return

    setSigning(true)
    try {
      const signatureData = canvasRef.current.toDataURL('image/png')

      const response = await fetch(`${CHESHIRE_API}/waiver/${waiverId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          signature: signatureData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to sign waiver')
      }

      setSigned(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit signature')
    } finally {
      setSigning(false)
    }
  }

  // Sanitize waiver HTML content to prevent XSS
  const getSanitizedContent = () => {
    if (!waiverData?.waiver.content) return ''
    return DOMPurify.sanitize(waiverData.waiver.content, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br'],
      ALLOWED_ATTR: [],
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading waiver...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-green-500 text-5xl mb-4">&#x2713;</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Waiver Signed!</h1>
          <p className="text-gray-600 mb-4">
            Thank you, {waiverData?.client.firstName}! Your waiver has been signed and recorded.
          </p>
          <p className="text-sm text-gray-500">
            You can close this page now. We look forward to seeing you and your furry friend!
          </p>
          <div className="mt-6 text-4xl">&#128062;</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">
            Through the Looking Glass Groomery
          </h1>
          <p className="text-gray-600">
            Welcome, {waiverData?.client.firstName}! Please review and sign the waiver below.
          </p>
        </div>

        {/* Waiver Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {waiverData?.waiver.name}
          </h2>
          <div
            className="prose prose-sm max-w-none text-gray-700 waiver-content"
            dangerouslySetInnerHTML={{ __html: getSanitizedContent() }}
          />
        </div>

        {/* Signature Area */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Your Signature
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Please sign below using your finger or mouse to indicate your agreement to the above terms.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 mb-4">
            <canvas
              ref={canvasRef}
              className="w-full h-40 cursor-crosshair touch-none bg-white rounded"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={clearSignature}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={signing}
            >
              Clear
            </button>
            <button
              onClick={submitSignature}
              disabled={!hasSignature || signing}
              className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signing ? 'Signing...' : 'Sign Waiver'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          By signing, you agree to the terms outlined above.
          <br />
          Questions? Contact us at hello@lookingglassgroomery.com
        </p>
      </div>
    </div>
  )
}
