// apps/cheshire/src/services/waivers.ts
import { prisma } from '@looking-glass/db'
import { randomBytes } from 'crypto'

/**
 * Generate a unique waiver token for an appointment
 */
export function generateWaiverToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Get or create the default liability waiver
 */
export async function getOrCreateDefaultWaiver() {
  let waiver = await prisma.waiver.findFirst({
    where: { name: 'Grooming Liability Waiver', isActive: true },
  })

  if (!waiver) {
    waiver = await prisma.waiver.create({
      data: {
        name: 'Grooming Liability Waiver',
        content: DEFAULT_WAIVER_CONTENT,
        version: 1,
        isActive: true,
        isRequired: true,
      },
    })
  }

  return waiver
}

/**
 * Create a waiver request for a client/appointment
 */
export async function createWaiverRequest(clientId: string): Promise<{
  waiverId: string
  token: string
  waiverUrl: string
}> {
  const waiver = await getOrCreateDefaultWaiver()
  const token = generateWaiverToken()

  // Store token in appointment metadata or a separate table
  // For simplicity, we'll encode client+waiver in the token lookup
  // In production, you'd want a WaiverRequest table

  const baseUrl = process.env.WEBSITE_URL || 'https://lookingglassgroomery.com'
  const waiverUrl = `${baseUrl}/waiver/${token}?client=${clientId}&waiver=${waiver.id}`

  return {
    waiverId: waiver.id,
    token,
    waiverUrl,
  }
}

/**
 * Check if a client has signed the required waiver
 */
export async function hasSignedWaiver(clientId: string): Promise<boolean> {
  const waiver = await getOrCreateDefaultWaiver()

  const signed = await prisma.signedWaiver.findUnique({
    where: {
      waiverId_clientId: {
        waiverId: waiver.id,
        clientId,
      },
    },
  })

  return !!signed
}

/**
 * Sign a waiver
 */
export async function signWaiver(params: {
  waiverId: string
  clientId: string
  signatureData: string // Base64 canvas signature
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  const { waiverId, clientId, signatureData, ipAddress, userAgent } = params

  // Check if already signed
  const existing = await prisma.signedWaiver.findUnique({
    where: {
      waiverId_clientId: { waiverId, clientId },
    },
  })

  if (existing) {
    throw new Error('Waiver already signed')
  }

  // Save the signature
  await prisma.signedWaiver.create({
    data: {
      waiverId,
      clientId,
      signatureUrl: signatureData, // In production, upload to S3 and store URL
      ipAddress,
      userAgent,
    },
  })
}

/**
 * Get waiver details for signing
 */
export async function getWaiverForSigning(waiverId: string, clientId: string) {
  const [waiver, client, existing] = await Promise.all([
    prisma.waiver.findUnique({ where: { id: waiverId } }),
    prisma.client.findUnique({
      where: { id: clientId },
      select: { firstName: true, lastName: true, email: true },
    }),
    prisma.signedWaiver.findUnique({
      where: { waiverId_clientId: { waiverId, clientId } },
    }),
  ])

  if (!waiver || !client) {
    return null
  }

  return {
    waiver,
    client,
    alreadySigned: !!existing,
    signedAt: existing?.signedAt,
  }
}

// Default waiver content (placeholder - swap with Kimmie's real waiver later)
const DEFAULT_WAIVER_CONTENT = `
<h2>Through the Looking Glass Groomery - Grooming Liability Waiver</h2>

<p>I, the undersigned, hereby authorize Through the Looking Glass Groomery ("the Groomer") to perform grooming services on my pet(s) as described in the service agreement.</p>

<h3>Release of Liability</h3>
<p>I understand that grooming procedures can be stressful for some pets and may expose inherent risks, including but not limited to:</p>
<ul>
  <li>Cuts, nicks, or abrasions from grooming equipment</li>
  <li>Stress or anxiety during the grooming process</li>
  <li>Allergic reactions to grooming products</li>
  <li>Aggravation of pre-existing conditions</li>
  <li>Exposure of underlying skin conditions after matting removal</li>
</ul>

<h3>Health Disclosure</h3>
<p>I certify that my pet is in good health and has not been exposed to any contagious diseases. I have disclosed any known health issues, behavioral concerns, or special needs to the Groomer.</p>

<h3>Photo/Video Consent</h3>
<p>I grant permission for photos and videos of my pet to be used for promotional purposes on social media and marketing materials.</p>

<h3>Payment & Cancellation</h3>
<p>I agree to pay for all services rendered. I understand that cancellations with less than 24 hours notice may result in a cancellation fee.</p>

<h3>Matting Policy</h3>
<p>I understand that severely matted coats may require shaving for the pet's comfort and health. Additional fees may apply for dematting services.</p>

<h3>Agreement</h3>
<p>By signing below, I acknowledge that I have read, understand, and agree to the terms of this waiver. I release Through the Looking Glass Groomery from any liability arising from the grooming services provided.</p>
`
