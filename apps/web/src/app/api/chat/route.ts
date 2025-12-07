// apps/web/src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

const CHESHIRE_API_URL = process.env.CHESHIRE_API_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId, clientId } = body

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
    return NextResponse.json(
      {
        response: "Curiouser and curiouser... something went wrong! 🙀",
        error: true,
      },
      { status: 500 }
    )
  }
}
