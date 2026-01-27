// Revenue formatting and response generation

/**
 * Format a number as currency with proper locale
 * @param amount - Amount in dollars
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string like "$1,234.56"
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a revenue response with emoji, label, and optional goal progress
 * @param period - Time period for the revenue
 * @param revenue - Revenue amount in dollars
 * @param goal - Optional goal amount for progress tracking (only used for 'month' period)
 * @returns Formatted message string ready for Telegram
 */
export function formatRevenueResponse(
  period: 'today' | 'week' | 'month' | 'year',
  revenue: number,
  goal?: number
): string {
  // Emoji mapping per period
  const emoji = {
    today: '📅',
    week: '📊',
    month: '💰',
    year: '🎯',
  }[period];

  // Label mapping per period
  const label = {
    today: "Today's Revenue",
    week: "This Week's Revenue",
    month: "This Month's Revenue",
    year: 'Year-to-Date Revenue',
  }[period];

  // Base message
  let message = `${emoji} ${label}: ${formatCurrency(revenue)}`;

  // Add goal progress for monthly revenue
  if (period === 'month' && goal) {
    const percentage = Math.min((revenue / goal) * 100, 100);
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    const progressBar = '█'.repeat(filled) + '░'.repeat(empty);

    message += `\n\n🎯 Goal: ${formatCurrency(goal)} (${percentage.toFixed(1)}%)`;
    message += `\n${progressBar}`;

    if (revenue >= goal) {
      message += '\n\n🎉 Goal reached! Amazing work! 👑';
    } else {
      const remaining = goal - revenue;
      message += `\n\n💪 ${formatCurrency(remaining)} to go!`;
    }
  }

  return message;
}
