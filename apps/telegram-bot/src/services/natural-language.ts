import { searchClientByPhone, searchClientsByName } from './search';
import { prisma } from '@looking-glass/db';
import type { Client, Pet } from '@looking-glass/db';
import { getTodayRevenue, getWeekRevenue, getMonthRevenue, getYearRevenue } from './stripe';
import { formatRevenueResponse } from './revenue';

// Type definition matching search service return types
type ClientWithPets = Client & {
  pets: Pet[];
};

/**
 * Result type for natural language query processing
 */
export type NLQueryResult =
  | {
      type: 'client';
      data: ClientWithPets;
      message: string;
    }
  | {
      type: 'clients';
      data: ClientWithPets[];
      message: string;
    }
  | {
      type: 'revenue';
      data: string;  // Pre-formatted revenue message
      message: string;
    }
  | {
      type: 'not_found';
      data: null;
      message: string;
    };

/**
 * Process natural language query for client/pet lookup
 * @param query - User's natural language query
 * @returns Structured result with type, data, and message
 */
export async function processNaturalLanguageQuery(
  query: string
): Promise<NLQueryResult> {
  const text = query.trim();

  // Phone number detection - digits with optional separators
  const phoneMatch = text.match(/\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/);
  if (phoneMatch) {
    const client = await searchClientByPhone(phoneMatch[1]);
    if (client) {
      return {
        type: 'client',
        data: client,
        message: 'Client found by phone',
      };
    }
    return {
      type: 'not_found',
      data: null,
      message: `No client found with phone ${phoneMatch[1]}`,
    };
  }

  // Natural language search patterns
  const patterns = [
    /who(?:'s|'s|\s+is)\s+(?:the\s+)?(.+?)(?:\s+with\s+(?:the\s+)?(.+))?$/i, // "who's Sarah" or "who's the lady with the corgi"
    /find\s+(.+)/i, // "find Sarah"
    /show\s+(?:me\s+)?(.+)/i, // "show me Sarah"
    /lookup\s+(.+)/i, // "lookup Sarah"
    /(?:do\s+we\s+have|is\s+there)\s+(?:a\s+)?(.+)/i, // "do we have a Sarah"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const searchTerm = match[1].trim();
      const petHint = match[2]?.trim(); // "the corgi" from "who's the lady with the corgi"

      // Search clients
      let clients = await searchClientsByName(searchTerm);

      // If pet hint provided and multiple results, filter by pet species/breed
      if (petHint && clients.length > 1) {
        const petLower = petHint.toLowerCase();
        const filtered = clients.filter((client) =>
          client.pets.some(
            (pet) =>
              pet.name.toLowerCase().includes(petLower) ||
              pet.breed?.toLowerCase().includes(petLower) ||
              pet.species.toLowerCase().includes(petLower)
          )
        );
        if (filtered.length > 0) {
          clients = filtered;
        }
      }

      if (clients.length === 0) {
        // Try searching by pet name/breed directly
        const petResults = await prisma.client.findMany({
          where: {
            pets: {
              some: {
                OR: [
                  { name: { contains: searchTerm, mode: 'insensitive' } },
                  { breed: { contains: searchTerm, mode: 'insensitive' } },
                ],
              },
            },
          },
          include: { pets: true },
          take: 5,
        });

        if (petResults.length > 0) {
          return {
            type: 'clients',
            data: petResults,
            message: 'Found clients by pet search',
          };
        }

        return {
          type: 'not_found',
          data: null,
          message: `No matches found for "${searchTerm}"`,
        };
      }

      if (clients.length === 1) {
        return {
          type: 'client',
          data: clients[0],
          message: 'Found single client',
        };
      }

      return {
        type: 'clients',
        data: clients,
        message: `Found ${clients.length} clients`,
      };
    }
  }

  // Revenue query detection (AFTER client patterns to avoid collisions)
  const revenuePatterns = [
    { regex: /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) today/i, period: 'today' as const },
    { regex: /(?:what's|whats|what is) (?:my|our|the) revenue (?:for )?today/i, period: 'today' as const },
    { regex: /today'?s revenue/i, period: 'today' as const },
    { regex: /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) this week/i, period: 'week' as const },
    { regex: /(?:what's|whats|what is) (?:my|our|the) (?:weekly|week'?s) revenue/i, period: 'week' as const },
    { regex: /this week'?s revenue/i, period: 'week' as const },
    { regex: /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) this month/i, period: 'month' as const },
    { regex: /(?:what's|whats|what is) (?:my|our|the) (?:monthly|month'?s) revenue/i, period: 'month' as const },
    { regex: /this month'?s revenue/i, period: 'month' as const },
    { regex: /(?:year to date|ytd|yearly) revenue/i, period: 'year' as const },
    { regex: /how much (?:did|have) (?:I|we) (?:make|made|earn|earned) (?:this|the) year/i, period: 'year' as const },
  ];

  for (const pattern of revenuePatterns) {
    if (pattern.regex.test(text)) {
      try {
        let revenue: number;
        let goal: number | undefined;

        switch (pattern.period) {
          case 'today':
            revenue = await getTodayRevenue();
            break;
          case 'week':
            revenue = await getWeekRevenue();
            break;
          case 'month':
            revenue = await getMonthRevenue();
            goal = parseFloat(process.env.MONTHLY_REVENUE_GOAL || '9000');
            break;
          case 'year':
            revenue = await getYearRevenue();
            break;
        }

        const message = formatRevenueResponse(pattern.period, revenue, goal);

        return {
          type: 'revenue',
          data: message,
          message: 'Revenue calculated',
        };
      } catch (error) {
        console.error('Revenue calculation error:', error);
        return {
          type: 'not_found',
          data: null,
          message: "Couldn't calculate revenue - check Stripe connection",
        };
      }
    }
  }

  // Not a recognized query pattern
  return {
    type: 'not_found',
    data: null,
    message: 'Query not recognized as a lookup',
  };
}
