import { parsePhoneNumber } from 'libphonenumber-js';
import { prisma } from '@looking-glass/db';
import type { Client, Pet } from '@looking-glass/db';

/**
 * Normalize phone number to E.164 format for database lookup
 * @param input - Raw phone number string (e.g., "(555) 123-4567", "555-123-4567")
 * @returns E.164 formatted phone (e.g., "+15551234567") or null if invalid
 */
export function normalizePhone(input: string): string | null {
  try {
    // Remove common formatting characters to help parsing
    const cleaned = input.replace(/[\s\-\(\)\.]/g, '');

    // Parse with US as default country
    const phoneNumber = parsePhoneNumber(cleaned, 'US');

    if (!phoneNumber || !phoneNumber.isValid()) {
      return null;
    }

    // Return E.164 format (e.g., +15551234567)
    return phoneNumber.format('E.164');
  } catch (error) {
    // Invalid phone number format
    return null;
  }
}

/**
 * Search for a client by phone number
 * @param phone - Phone number in any format
 * @returns Client with pets or null if not found
 */
export async function searchClientByPhone(
  phone: string
): Promise<(Client & { pets: Pet[] }) | null> {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return null;
  }

  const client = await prisma.client.findFirst({
    where: {
      phone: normalizedPhone,
    },
    include: {
      pets: true,
    },
  });

  return client;
}

/**
 * Search for clients by name (case-insensitive, fuzzy match)
 * @param query - Name query string
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of clients with pets
 */
export async function searchClientsByName(
  query: string,
  limit: number = 10
): Promise<(Client & { pets: Pet[] })[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const clients = await prisma.client.findMany({
    where: {
      OR: [
        {
          firstName: {
            contains: trimmedQuery,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: trimmedQuery,
            mode: 'insensitive',
          },
        },
      ],
    },
    include: {
      pets: true,
    },
    take: limit,
  });

  return clients;
}
