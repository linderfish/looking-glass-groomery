// apps/telegram-bot/src/services/waiver.ts
// Service to interact with Cheshire waiver API

const CHESHIRE_API = process.env.CHESHIRE_API_URL || 'http://localhost:3001'

interface WaiverRequestResponse {
  waiverId: string
  token: string
  waiverUrl: string
}

interface WaiverStatusResponse {
  clientId: string
  signed: boolean
}

/**
 * Create a waiver request for a client
 * Returns the waiver URL to send to the customer
 */
export async function createWaiverRequest(clientId: string): Promise<WaiverRequestResponse | null> {
  try {
    const response = await fetch(`${CHESHIRE_API}/waiver/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })

    if (!response.ok) {
      console.error('Failed to create waiver request:', response.statusText)
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Error creating waiver request:', error)
    return null
  }
}

/**
 * Check if a client has signed their waiver
 */
export async function checkWaiverStatus(clientId: string): Promise<boolean> {
  try {
    const response = await fetch(`${CHESHIRE_API}/waiver/status/${clientId}`)

    if (!response.ok) {
      console.error('Failed to check waiver status:', response.statusText)
      return false
    }

    const data: WaiverStatusResponse = await response.json()
    return data.signed
  } catch (error) {
    console.error('Error checking waiver status:', error)
    return false
  }
}
