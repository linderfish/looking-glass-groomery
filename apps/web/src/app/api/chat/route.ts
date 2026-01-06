// apps/web/src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

const CHESHIRE_API_URL = process.env.CHESHIRE_API_URL

// Fallback responses when Cheshire service isn't available
const FALLBACK_RESPONSES: Record<string, string> = {
  default: `*slowly materializes* 😼

Ah, you've found me! I'm still setting up my tea party here in Wonderland~

For now, the best way to reach us is:
📱 DM us on Instagram: @looknglass.groomery
📧 Email: kimmieserrati@gmail.com

I'll be fully awake soon to help with bookings and questions! ✨`,

  booking: `Ooh, looking to book? How exciting! 🎉

While I'm still waking up from my catnap, you can book directly:
📱 DM us on Instagram: @looknglass.groomery
📞 Or text Kimmie directly!

I'll be handling bookings myself very soon~ 😸`,

  price: `Great question about pricing! 💰

Our rates vary by pet size and services:
• Full Grooms: $45-85+
• Bath & Tidy: $25-45
• Creative Color: Custom quotes!

DM us on Instagram for an exact quote for your fur baby~ ✨`,
}

function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
    return FALLBACK_RESPONSES.booking
  }
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
    return FALLBACK_RESPONSES.price
  }

  return FALLBACK_RESPONSES.default
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId, clientId } = body

    // If no Cheshire API configured, use fallback responses
    if (!CHESHIRE_API_URL) {
      return NextResponse.json({
        response: getFallbackResponse(message),
        sessionId: sessionId || 'fallback',
        intent: 'FALLBACK',
      })
    }

    // Forward to Cheshire service
    const response = await fetch(`${CHESHIRE_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        clientId,
      }),
    })

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Chat API error:', error)
    // On error, also use fallback
    const body = await request.clone().json().catch(() => ({ message: '' }))
    return NextResponse.json({
      response: getFallbackResponse(body.message || ''),
      sessionId: 'fallback',
      error: false, // Don't show as error to user
    })
  }
}
