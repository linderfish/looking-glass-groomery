// Stripe API wrapper for revenue calculation
import Stripe from 'stripe';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { getSettings } from './settings';

// Lazy-initialized Stripe client
let _stripe: Stripe | null = null;
let _cachedKey: string | null = null;

/**
 * Get Stripe client, checking settings first then env var
 */
async function getStripeClient(): Promise<Stripe | null> {
  const settings = await getSettings();
  const key = settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

  if (!key) {
    return null;
  }

  // Re-create client if key changed
  if (_stripe && _cachedKey === key) {
    return _stripe;
  }

  _stripe = new Stripe(key, {
    apiVersion: '2025-12-15.clover',
  });
  _cachedKey = key;

  return _stripe;
}

/**
 * Check if Stripe is configured (via settings or env)
 */
export async function isStripeConfigured(): Promise<boolean> {
  const settings = await getSettings();
  return !!(settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY);
}

/**
 * Test a Stripe connection with a given key
 */
export async function testStripeConnection(key: string): Promise<{
  success: boolean;
  accountName?: string;
  error?: string;
}> {
  try {
    const testClient = new Stripe(key, {
      apiVersion: '2025-12-15.clover',
    });

    // Try to fetch account info
    const account = await testClient.accounts.retrieve('self');

    return {
      success: true,
      accountName: account.business_profile?.name || account.email || undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get all successful charges within a date range
 */
export async function getSuccessfulCharges(
  startDate: Date,
  endDate: Date
): Promise<Stripe.Charge[]> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return [];
  }

  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  const allCharges: Stripe.Charge[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  // Handle pagination - Stripe returns max 100 per request
  while (hasMore) {
    const response = await stripe.charges.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 100,
      starting_after: startingAfter,
    });

    // Filter for successful, non-refunded, live-mode charges
    const successfulCharges = response.data.filter(
      (charge) => charge.status === 'succeeded' && !charge.refunded && charge.livemode
    );

    allCharges.push(...successfulCharges);

    hasMore = response.has_more;
    if (hasMore && response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return allCharges;
}

/**
 * Calculate total revenue from charges (converts cents to dollars)
 */
function calculateRevenue(charges: Stripe.Charge[]): number {
  return charges.reduce((total, charge) => {
    return total + charge.amount / 100;
  }, 0);
}

/**
 * Get today's revenue
 */
export async function getTodayRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getSuccessfulCharges(startOfDay(now), endOfDay(now));
  return calculateRevenue(charges);
}

/**
 * Get this week's revenue (Sunday - Saturday)
 */
export async function getWeekRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getSuccessfulCharges(
    startOfWeek(now, { weekStartsOn: 0 }),
    endOfWeek(now, { weekStartsOn: 0 })
  );
  return calculateRevenue(charges);
}

/**
 * Get this month's revenue
 */
export async function getMonthRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getSuccessfulCharges(startOfMonth(now), endOfMonth(now));
  return calculateRevenue(charges);
}

/**
 * Get year-to-date revenue
 */
export async function getYearRevenue(): Promise<number> {
  const now = new Date();
  const charges = await getSuccessfulCharges(startOfYear(now), endOfYear(now));
  return calculateRevenue(charges);
}
