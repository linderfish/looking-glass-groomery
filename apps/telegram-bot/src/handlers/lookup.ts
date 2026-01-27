import { Composer, InlineKeyboard } from 'grammy';
import type { BotContext } from '../bot';
import {
  searchClientByPhone,
  searchClientsByName,
} from '../services/search';
import { formatClientProfile, formatClientList, formatPetProfile, formatVisitHistory } from '../services/formatting';
import { prisma } from '@looking-glass/db';
import { processNaturalLanguageQuery } from '../services/natural-language';

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

  // Process through natural language service
  const result = await processNaturalLanguageQuery(text);

  switch (result.type) {
    case 'client':
      return showClientProfile(ctx, result.data);

    case 'clients':
      return showClientList(ctx, result.data);

    case 'revenue':
      // Revenue message is pre-formatted with emojis and progress bar
      await ctx.reply(result.data);
      return;

    case 'not_found':
      // If no match found, check if it was a recognized query pattern
      // by checking if message contains typical not-found phrases
      if (result.message.includes('No matches') || result.message.includes('No client found')) {
        await ctx.reply(result.message);
        return;
      }
      // Otherwise, it's not a lookup query - pass to next handler
      await next();
      break;
  }
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
