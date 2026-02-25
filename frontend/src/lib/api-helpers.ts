import { NextRequest } from 'next/server';

/**
 * Extract auth headers from the incoming request cookies
 * and forward them to the backend API.
 */
export function getAuthHeaders(
  request: NextRequest,
): Record<string, string> {
  // Lambda authorizer validates ID tokens (tokenUse: 'id') to read custom claims
  const idToken = request.cookies.get('idToken')?.value;

  const headers: Record<string, string> = {};

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  return headers;
}

/**
 * Format a date string for display.
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a number as currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Format large numbers with abbreviations.
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

