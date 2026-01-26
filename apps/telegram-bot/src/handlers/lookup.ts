import { Composer, InlineKeyboard } from 'grammy';
import type { BotContext } from '../bot';
import {
  searchClientByPhone,
  searchClientsByName,
} from '../services/search';
import { formatClientProfile, formatClientList, formatPetProfile, formatVisitHistory } from '../services/formatting';
import { prisma } from '@looking-glass/db';

export const lookupHandler = new Composer<BotContext>();

// /lookup command - Search for clients by name or phone
lookupHandler.command('lookup', async (ctx) => {
  const query = ctx.match?.trim();

  // No query provided - show usage
  if (!query) {
    await ctx.reply(
      '<b>Client Lookup</b>\n\n' +
        'Search for clients by name or phone number.\n\n' +
        '<b>Usage:</b>\n' +
        '/lookup Sarah\n' +
        '/lookup (555) 123-4567\n' +
        '/lookup 5551234567',
      { parse_mode: 'HTML' }
    );
    return;
  }

  await ctx.reply('🔍 Searching...', { parse_mode: 'HTML' });

  // Check if query looks like a phone number (contains digits)
  const isPhone = /\d{3,}/.test(query);

  if (isPhone) {
    // Phone search
    const client = await searchClientByPhone(query);

    if (!client) {
      await ctx.reply(
        `No client found with phone number: <code>${query}</code>`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    // Show single client profile
    await showClientProfile(ctx, client);
  } else {
    // Name search
    const clients = await searchClientsByName(query);

    if (clients.length === 0) {
      await ctx.reply(
        `No clients found matching: <b>${query}</b>`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    if (clients.length === 1) {
      // Show single client profile
      await showClientProfile(ctx, clients[0]);
    } else {
      // Show list of clients to select from
      await showClientList(ctx, clients);
    }
  }
});

// Callback handler for client selection from list
lookupHandler.callbackQuery(/^client:(.+)$/, async (ctx) => {
  const clientId = ctx.match[1];

  // Load client with pets
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { pets: true },
  });

  if (!client) {
    await ctx.answerCallbackQuery({
      text: 'Client not found',
      show_alert: true,
    });
    return;
  }

  // Show client profile
  const profile = formatClientProfile(client);
  const keyboard = createClientProfileKeyboard(client);

  await ctx.editMessageText(profile, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });

  await ctx.answerCallbackQuery();
});

// Callback handler for pet profile display
lookupHandler.callbackQuery(/^pet:(.+)$/, async (ctx) => {
  const petId = ctx.match[1];

  // CRITICAL: Answer callback immediately (10 second limit)
  await ctx.answerCallbackQuery();

  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    include: {
      client: true,
      passport: true,
    },
  });

  if (!pet) {
    await ctx.reply('Pet not found');
    return;
  }

  const message = formatPetProfile(pet);

  // Build buttons: back to client, visit history
  const buttons = [
    [{ text: '◀ Back to Client', callback_data: `client:${pet.clientId}` }],
    [{ text: '📋 Visit History', callback_data: `pethistory:${pet.id}` }],
  ];

  // Remove old message reply_markup to prevent button confusion
  await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => {});

  // If pet has photo, send as photo message; otherwise text
  if (pet.photoUrl) {
    try {
      await ctx.replyWithPhoto(pet.photoUrl, {
        caption: message,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons },
      });
    } catch {
      // Photo URL might be broken - fall back to text
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons },
      });
    }
  } else {
    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    });
  }
});

// Callback handler for client visit history
lookupHandler.callbackQuery(/^history:(.+)$/, async (ctx) => {
  const clientId = ctx.match[1];
  await ctx.answerCallbackQuery();

  const appointments = await prisma.appointment.findMany({
    where: {
      clientId,
      status: 'COMPLETED',
    },
    include: {
      pet: true,
      services: true,
    },
    orderBy: { completedAt: 'desc' },
    take: 5,
  });

  const message = formatVisitHistory(appointments);

  await ctx.reply(message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '◀ Back to Client', callback_data: `client:${clientId}` }],
      ],
    },
  });
});

// Callback handler for pet visit history
lookupHandler.callbackQuery(/^pethistory:(.+)$/, async (ctx) => {
  const petId = ctx.match[1];
  await ctx.answerCallbackQuery();

  const appointments = await prisma.appointment.findMany({
    where: {
      petId,
      status: 'COMPLETED',
    },
    include: {
      pet: true,
      services: true,
    },
    orderBy: { completedAt: 'desc' },
    take: 5,
  });

  const pet = await prisma.pet.findUnique({ where: { id: petId } });

  const message = formatVisitHistory(appointments);

  await ctx.reply(message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🐾 Back to Pet', callback_data: `pet:${petId}` }],
        [{ text: '◀ Back to Client', callback_data: `client:${pet?.clientId}` }],
      ],
    },
  });
});

// Natural language lookup - must be AFTER command handlers, calls next() for non-matches
lookupHandler.on('message:text', async (ctx, next) => {
  const text = ctx.message.text;

  // Skip commands - let other handlers process them
  if (text.startsWith('/')) {
    return next();
  }

  // Phone number detection - digits with optional separators
  const phoneMatch = text.match(/\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/);
  if (phoneMatch) {
    const client = await searchClientByPhone(phoneMatch[1]);
    if (client) {
      return showClientProfile(ctx, client);
    }
    await ctx.reply(`No client found with phone ${phoneMatch[1]}`);
    return;
  }

  // Natural language search patterns
  const patterns = [
    /who(?:'s|'s|\s+is)\s+(?:the\s+)?(.+?)(?:\s+with\s+(?:the\s+)?(.+))?$/i,  // "who's Sarah" or "who's the lady with the corgi"
    /find\s+(.+)/i,                                    // "find Sarah"
    /show\s+(?:me\s+)?(.+)/i,                         // "show me Sarah"
    /lookup\s+(.+)/i,                                  // "lookup Sarah"
    /(?:do\s+we\s+have|is\s+there)\s+(?:a\s+)?(.+)/i, // "do we have a Sarah"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const searchTerm = match[1].trim();
      const petHint = match[2]?.trim();  // "the corgi" from "who's the lady with the corgi"

      // Search clients
      let clients = await searchClientsByName(searchTerm);

      // If pet hint provided and multiple results, filter by pet species/breed
      if (petHint && clients.length > 1) {
        const petLower = petHint.toLowerCase();
        const filtered = clients.filter(client =>
          client.pets.some(pet =>
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
          return showClientList(ctx, petResults);
        }

        await ctx.reply(`No matches found for "${searchTerm}"`);
        return;
      }

      if (clients.length === 1) {
        return showClientProfile(ctx, clients[0]);
      }

      return showClientList(ctx, clients);
    }
  }

  // Not a lookup query - pass to next handler
  await next();
});

/**
 * Show client profile with pet buttons
 */
async function showClientProfile(ctx: BotContext, client: any) {
  const profile = formatClientProfile(client);
  const keyboard = createClientProfileKeyboard(client);

  await ctx.reply(profile, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
}

/**
 * Show list of clients with selection buttons
 */
async function showClientList(ctx: BotContext, clients: any[]) {
  const list = formatClientList(clients);
  const keyboard = createClientListKeyboard(clients);

  await ctx.reply(list, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
}

/**
 * Create keyboard for client profile with pet buttons
 */
function createClientProfileKeyboard(
  client: { id: string; pets: { id: string; name: string; species: string }[] }
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // Add button for each pet
  client.pets.forEach((pet) => {
    const petIcon = getSpeciesIcon(pet.species);
    keyboard.text(`${petIcon} ${pet.name}`, `pet:${pet.id}`).row();
  });

  // Add visit history button
  keyboard.text('📅 Visit History', `history:${client.id}`);

  return keyboard;
}

/**
 * Create keyboard for client list selection
 */
function createClientListKeyboard(
  clients: { id: string; firstName: string; lastName: string }[]
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  clients.forEach((client, index) => {
    const fullName = `${client.firstName} ${client.lastName}`;
    keyboard.text(`${index + 1}. ${fullName}`, `client:${client.id}`).row();
  });

  return keyboard;
}

/**
 * Get emoji icon for pet species
 */
function getSpeciesIcon(species: string): string {
  const iconMap: Record<string, string> = {
    DOG: '🐕',
    CAT: '🐈',
    GOAT: '🐐',
    PIG: '🐷',
    GUINEA_PIG: '🐹',
  };

  return iconMap[species] || '🐾';
}
