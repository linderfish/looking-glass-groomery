import { Composer } from 'grammy';
import type { BotContext } from '../bot';
import { getSettings, updateSettings } from '../services/settings';
import { isStripeConfigured, testStripeConnection } from '../services/stripe';

export const stripeConnectHandler = new Composer<BotContext>();

// /connect-stripe command
stripeConnectHandler.command('connect_stripe', async (ctx) => {
  await handleConnectStripe(ctx);
});

// Also handle natural language
stripeConnectHandler.hears(/connect\s*stripe/i, async (ctx) => {
  await handleConnectStripe(ctx);
});

async function handleConnectStripe(ctx: BotContext) {
  const settings = await getSettings();

  if (settings.stripeSecretKey) {
    // Already connected - offer to update
    await ctx.reply(
      `💳 Stripe is already connected!\n\n` +
      `To update your API key, send:\n` +
      `\`stripe: sk_live_yourkey\`\n\n` +
      `To disconnect:\n` +
      `\`disconnect stripe\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await ctx.reply(
    `💳 **Connect Stripe for Revenue Tracking**\n\n` +
    `To see your daily/weekly/monthly revenue, I need your Stripe API key.\n\n` +
    `**How to get it:**\n` +
    `1. Go to stripe.com/dashboard/apikeys\n` +
    `2. Copy your Secret key (starts with sk\\_live\\_)\n` +
    `3. Send it here like this:\n\n` +
    `\`stripe: sk_live_yourkey\`\n\n` +
    `🔒 Your key is stored securely and only used to read revenue data.`,
    { parse_mode: 'Markdown' }
  );
}

// Handle stripe key input
stripeConnectHandler.hears(/^stripe:\s*(sk_(?:live|test)_[a-zA-Z0-9]+)$/i, async (ctx) => {
  const key = ctx.match[1];

  await ctx.replyWithChatAction('typing');

  // Test the key before saving
  const testResult = await testStripeConnection(key);

  if (!testResult.success) {
    await ctx.reply(
      `❌ Couldn't connect to Stripe with that key.\n\n` +
      `Error: ${testResult.error}\n\n` +
      `Make sure you're using your Secret key (not the Publishable key).`
    );
    return;
  }

  // Save the key
  await updateSettings({ stripeSecretKey: key });

  // Delete the message containing the key for security
  try {
    await ctx.deleteMessage();
  } catch {
    // May not have permission to delete
  }

  await ctx.reply(
    `✅ Stripe connected successfully!\n\n` +
    `Account: ${testResult.accountName || 'Connected'}\n\n` +
    `You can now ask me about revenue:\n` +
    `• "How much did I make today?"\n` +
    `• "What's my revenue this month?"\n` +
    `• "Show me my weekly earnings"`
  );
});

// Handle disconnect
stripeConnectHandler.hears(/disconnect\s*stripe/i, async (ctx) => {
  const settings = await getSettings();

  if (!settings.stripeSecretKey) {
    await ctx.reply('Stripe is not connected.');
    return;
  }

  await updateSettings({ stripeSecretKey: null });
  await ctx.reply('💳 Stripe disconnected. Revenue tracking is now disabled.');
});

// Handle invalid key format
stripeConnectHandler.hears(/^stripe:\s*(.+)$/i, async (ctx) => {
  const attempted = ctx.match[1];

  if (attempted.startsWith('pk_')) {
    await ctx.reply(
      `❌ That looks like a Publishable key (pk\\_...).\n\n` +
      `I need the Secret key which starts with \`sk_live_\` or \`sk_test_\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await ctx.reply(
    `❌ Invalid key format.\n\n` +
    `Stripe keys should look like:\n` +
    `\`sk_live_abc123...\` or \`sk_test_abc123...\``,
    { parse_mode: 'Markdown' }
  );
});
