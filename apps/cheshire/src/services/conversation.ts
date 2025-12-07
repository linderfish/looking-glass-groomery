// apps/cheshire/src/services/conversation.ts
import { prisma, ConversationChannel, MessageRole } from '@looking-glass/db'

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/**
 * Get or create a conversation for a channel/user
 */
export async function getOrCreateConversation(
  channel: ConversationChannel,
  externalId: string,
  clientId?: string
) {
  // Try to find existing active conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      channel,
      externalId,
      status: 'ACTIVE',
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 20, // Last 20 messages for context
      },
      client: true,
    },
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        channel,
        externalId,
        clientId,
        status: 'ACTIVE',
      },
      include: {
        messages: true,
        client: true,
      },
    })
  }

  return conversation
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  metadata?: { intent?: string; confidence?: number }
) {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      intent: metadata?.intent,
      confidence: metadata?.confidence,
    },
  })
}

/**
 * Get conversation history formatted for LLM
 */
export function formatHistoryForLLM(
  messages: Array<{ role: MessageRole; content: string }>
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter(m => m.role !== 'SYSTEM')
    .map(m => ({
      role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }))
}

/**
 * Mark conversation as handed off to Kimmie
 */
export async function escalateConversation(conversationId: string) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: 'HANDED_OFF',
      handedOffAt: new Date(),
    },
  })
}

/**
 * Resolve/archive a conversation
 */
export async function resolveConversation(conversationId: string) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { status: 'RESOLVED' },
  })
}

/**
 * Link a conversation to a client (after identification)
 */
export async function linkConversationToClient(
  conversationId: string,
  clientId: string
) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { clientId },
  })
}
