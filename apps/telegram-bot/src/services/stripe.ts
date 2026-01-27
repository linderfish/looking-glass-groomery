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

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover', // Current API version
});

/**
 * Get all successful charges within a date range
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns Array of successful charges
 */
export async function getSuccessfulCharges(
  startDate: Date,
  endDate: Date
): Promise<Stripe.Charge[]> {
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
    // Stripe amounts are in cents
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
    startOfWeek(now, { weekStartsOn: 0 }), // Sunday = 0
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
